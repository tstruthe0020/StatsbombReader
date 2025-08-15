from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import os
import logging
import json
import time
from datetime import datetime
from github import Github, GithubException
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Soccer Foul & Referee Analytics",
    description="Advanced analytics for soccer fouls and referee decisions using StatsBomb data",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
github_client = None
db_client = None
db = None

class GitHubAPIClient:
    """GitHub API client for StatsBomb data access."""
    
    def __init__(self, token: str):
        self.github = Github(token)
        self.repo = self.github.get_repo("statsbomb/open-data")
        self.last_request_time = 0
        self.min_request_interval = 0.1
        
    def _ensure_rate_limit(self):
        """Ensure minimum interval between requests."""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        if time_since_last < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last)
        self.last_request_time = time.time()
    
    def get_competitions_data(self):
        """Get all competitions data."""
        try:
            self._ensure_rate_limit()
            content_file = self.repo.get_contents("data/competitions.json")
            content = content_file.decoded_content.decode('utf-8')
            return json.loads(content)
        except Exception as e:
            logger.error(f"Failed to get competitions: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_matches_data(self, competition_id: int, season_id: int):
        """Get matches for specific competition and season."""
        try:
            self._ensure_rate_limit()
            file_path = f"data/matches/{competition_id}/{season_id}.json"
            content_file = self.repo.get_contents(file_path)
            content = content_file.decoded_content.decode('utf-8')
            return json.loads(content)
        except Exception as e:
            logger.error(f"Failed to get matches: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_events_data(self, match_id: int):
        """Get events for specific match."""
        try:
            self._ensure_rate_limit()
            file_path = f"data/events/{match_id}.json"
            
            # Use direct HTTP request instead of PyGithub for better encoding handling
            import requests
            import base64
            
            # Construct raw GitHub URL
            raw_url = f"https://raw.githubusercontent.com/statsbomb/open-data/master/{file_path}"
            
            # First try direct download
            try:
                response = requests.get(raw_url, timeout=30)
                if response.status_code == 200:
                    content = response.text
                    return json.loads(content)
            except Exception as direct_error:
                logger.warning(f"Direct download failed for {match_id}: {direct_error}")
            
            # Fallback to GitHub API
            try:
                content_file = self.repo.get_contents(file_path)
                
                # Handle different content types
                if hasattr(content_file, 'decoded_content') and content_file.decoded_content is not None:
                    content = content_file.decoded_content.decode('utf-8')
                elif hasattr(content_file, 'content'):
                    # Handle base64 encoded content
                    raw_content = base64.b64decode(content_file.content)
                    content = raw_content.decode('utf-8')
                else:
                    raise Exception("No content available")
                
                return json.loads(content)
                
            except Exception as api_error:
                logger.error(f"GitHub API failed for match {match_id}: {api_error}")
                raise HTTPException(status_code=500, detail=f"Could not fetch match data: {api_error}")
                
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error getting events for match {match_id}: {e}")
            raise HTTPException(status_code=500, detail=str(e))

# Pydantic models
class FoulEvent(BaseModel):
    """Model for foul event data."""
    id: str
    minute: int
    second: int
    player_name: str
    team_name: str
    foul_type: str
    card_type: Optional[str] = None
    location: Optional[List[float]] = None
    reason: Optional[str] = None

class RefereeDecision(BaseModel):
    """Model for referee decision data."""
    id: str
    minute: int
    second: int
    decision_type: str
    player_name: Optional[str] = None
    team_name: Optional[str] = None
    location: Optional[List[float]] = None
    reason: Optional[str] = None

class MatchSummary(BaseModel):
    """Model for match summary with foul statistics."""
    match_id: int
    home_team: str
    away_team: str
    total_fouls: int
    total_cards: int
    yellow_cards: int
    red_cards: int
    referee_name: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global github_client, db_client, db
    
    # Initialize GitHub client
    github_token = os.getenv("GITHUB_TOKEN")
    if github_token:
        github_client = GitHubAPIClient(github_token)
        logger.info("GitHub client initialized successfully")
    else:
        logger.error("GitHub token not found")
        raise RuntimeError("GitHub token required")
    
    # Initialize MongoDB client
    mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    db_client = AsyncIOMotorClient(mongo_url)
    db = db_client.soccer_analytics
    logger.info("Database connected successfully")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    if db_client:
        db_client.close()

def extract_fouls_from_events(events: List[Dict]) -> List[Dict]:
    """Extract foul-related events from match events."""
    fouls = []
    
    for event in events:
        event_type = event.get('type', {}).get('name', '')
        
        # Check for foul events
        if event_type == 'Foul Committed':
            foul_data = {
                'id': event.get('id'),
                'minute': event.get('minute', 0),
                'second': event.get('second', 0),
                'player_name': event.get('player', {}).get('name', 'Unknown'),
                'team_name': event.get('team', {}).get('name', 'Unknown'),
                'foul_type': event.get('foul_committed', {}).get('type', {}).get('name', 'Unknown'),
                'card_type': None,
                'location': event.get('location'),
                'reason': event.get('foul_committed', {}).get('advantage', False)
            }
            
            # Check for cards
            if 'foul_committed' in event and 'card' in event['foul_committed']:
                foul_data['card_type'] = event['foul_committed']['card'].get('name')
            
            fouls.append(foul_data)
        
        # Check for bad behaviour events (misconduct)
        elif event_type == 'Bad Behaviour':
            foul_data = {
                'id': event.get('id'),
                'minute': event.get('minute', 0),
                'second': event.get('second', 0),
                'player_name': event.get('player', {}).get('name', 'Unknown'),
                'team_name': event.get('team', {}).get('name', 'Unknown'),
                'foul_type': 'Misconduct',
                'card_type': event.get('bad_behaviour', {}).get('card', {}).get('name'),
                'location': event.get('location'),
                'reason': 'Bad Behaviour'
            }
            fouls.append(foul_data)
    
    return fouls

def extract_referee_decisions(events: List[Dict]) -> List[Dict]:
    """Extract referee decision events."""
    decisions = []
    
    for event in events:
        event_type = event.get('type', {}).get('name', '')
        
        # Referee decisions include fouls, cards, substitutions, etc.
        if event_type in ['Foul Committed', 'Bad Behaviour', 'Referee Ball-Drop']:
            decision_data = {
                'id': event.get('id'),
                'minute': event.get('minute', 0),
                'second': event.get('second', 0),
                'decision_type': event_type,
                'player_name': event.get('player', {}).get('name'),
                'team_name': event.get('team', {}).get('name'),
                'location': event.get('location'),
                'reason': None
            }
            
            if event_type == 'Foul Committed':
                decision_data['reason'] = event.get('foul_committed', {}).get('type', {}).get('name')
            elif event_type == 'Bad Behaviour':
                decision_data['reason'] = 'Misconduct'
            
            decisions.append(decision_data)
    
    return decisions

@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Soccer Foul & Referee Analytics API",
        "version": "1.0.0",
        "description": "Advanced analytics for soccer fouls and referee decisions"
    }

@app.get("/api/competitions")
async def get_competitions():
    """Get all available competitions."""
    try:
        competitions = github_client.get_competitions_data()
        return {"success": True, "data": competitions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/competitions/{competition_id}/seasons/{season_id}/matches")
async def get_matches(competition_id: int, season_id: int):
    """Get matches for specific competition and season."""
    try:
        matches = github_client.get_matches_data(competition_id, season_id)
        return {"success": True, "data": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/matches/{match_id}/fouls")
async def get_match_fouls(match_id: int):
    """Get all fouls from a specific match."""
    try:
        events = github_client.get_events_data(match_id)
        fouls = extract_fouls_from_events(events)
        
        return {
            "success": True,
            "data": {
                "match_id": match_id,
                "total_fouls": len(fouls),
                "fouls": fouls
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/matches/{match_id}/referee-decisions")
async def get_referee_decisions(match_id: int):
    """Get all referee decisions from a specific match."""
    try:
        events = github_client.get_events_data(match_id)
        decisions = extract_referee_decisions(events)
        
        return {
            "success": True,
            "data": {
                "match_id": match_id,
                "total_decisions": len(decisions),
                "decisions": decisions
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/matches/{match_id}/summary")
async def get_match_summary(match_id: int):
    """Get match summary with foul and card statistics."""
    try:
        events = github_client.get_events_data(match_id)
        fouls = extract_fouls_from_events(events)
        
        # Calculate statistics
        total_fouls = len(fouls)
        yellow_cards = len([f for f in fouls if f.get('card_type') == 'Yellow Card'])
        red_cards = len([f for f in fouls if f.get('card_type') == 'Red Card'])
        total_cards = yellow_cards + red_cards
        
        # Get team names from events
        home_team = "Unknown"
        away_team = "Unknown"
        referee_name = None
        
        for event in events:
            if event.get('type', {}).get('name') == 'Starting XI':
                team_name = event.get('team', {}).get('name', '')
                if home_team == "Unknown":
                    home_team = team_name
                elif away_team == "Unknown" and team_name != home_team:
                    away_team = team_name
                    break
        
        summary = {
            "match_id": match_id,
            "home_team": home_team,
            "away_team": away_team,
            "total_fouls": total_fouls,
            "total_cards": total_cards,
            "yellow_cards": yellow_cards,
            "red_cards": red_cards,
            "referee_name": referee_name
        }
        
        return {"success": True, "data": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/foul-types")
async def get_foul_types_analysis(
    competition_id: Optional[int] = Query(None),
    season_id: Optional[int] = Query(None),
    limit: int = Query(10, ge=1, le=100)
):
    """Get analysis of different foul types across competitions."""
    try:
        # This would typically come from cached/processed data
        # For now, return sample data structure
        sample_data = [
            {"foul_type": "Kick", "count": 245, "percentage": 35.2},
            {"foul_type": "Push", "count": 189, "percentage": 27.1},
            {"foul_type": "Hold", "count": 134, "percentage": 19.2},
            {"foul_type": "Trip", "count": 98, "percentage": 14.1},
            {"foul_type": "Elbow", "count": 30, "percentage": 4.3}
        ]
        
        return {
            "success": True,
            "data": {
                "foul_types": sample_data[:limit],
                "total_analyzed": 696,
                "competition_id": competition_id,
                "season_id": season_id
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/card-statistics")
async def get_card_statistics(
    competition_id: Optional[int] = Query(None),
    season_id: Optional[int] = Query(None)
):
    """Get card statistics analysis."""
    try:
        # Sample card statistics
        sample_data = {
            "yellow_cards": 1247,
            "red_cards": 67,
            "cards_per_match": 4.2,
            "most_cards_team": "Team A",
            "least_cards_team": "Team B",
            "average_yellow_per_match": 3.8,
            "average_red_per_match": 0.2
        }
        
        return {
            "success": True,
            "data": sample_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/referees")
async def get_referees_list():
    """Get list of referees available for heatmap analysis."""
    try:
        # Sample referee data - in production this would come from actual match data
        referees = [
            {"id": "ref_001", "name": "Antonio Mateu Lahoz", "matches": 45, "total_fouls": 892},
            {"id": "ref_002", "name": "Björn Kuipers", "matches": 38, "total_fouls": 743},
            {"id": "ref_003", "name": "Daniele Orsato", "matches": 42, "total_fouls": 815},
            {"id": "ref_004", "name": "Clément Turpin", "matches": 39, "total_fouls": 761},
            {"id": "ref_005", "name": "Michael Oliver", "matches": 33, "total_fouls": 642},
            {"id": "ref_006", "name": "Szymon Marciniak", "matches": 29, "total_fouls": 567},
            {"id": "ref_007", "name": "Istvan Kovacs", "matches": 26, "total_fouls": 491},
            {"id": "ref_008", "name": "Jesús Gil Manzano", "matches": 31, "total_fouls": 598}
        ]
        
        return {
            "success": True,
            "data": referees
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/referees/{referee_id}/heatmap")
async def get_referee_foul_heatmap(referee_id: str):
    """Get foul heatmap data for a specific referee."""
    try:
        # Sample heatmap data - in production this would aggregate real foul locations
        # Soccer field is typically 120x80 units in StatsBomb data
        # We'll create a grid-based heatmap with foul density
        
        import random
        import math
        
        # Generate realistic foul distribution data
        heatmap_data = []
        
        # Create grid zones (10x6 grid covering the field)
        grid_width = 12  # 120 / 10 zones
        grid_height = 13.33  # 80 / 6 zones
        
        for i in range(10):  # 10 zones horizontally
            for j in range(6):  # 6 zones vertically
                x_center = (i * grid_width) + (grid_width / 2)
                y_center = (j * grid_height) + (grid_height / 2)
                
                # Generate realistic foul density based on field position
                # More fouls in midfield and penalty areas
                distance_to_center = math.sqrt((x_center - 60)**2 + (y_center - 40)**2)
                distance_to_penalty_area_1 = min(
                    math.sqrt((x_center - 18)**2 + (y_center - 40)**2),
                    math.sqrt((x_center - 102)**2 + (y_center - 40)**2)
                )
                
                # Base density with variations
                base_density = max(5, 30 - distance_to_center * 0.3)
                penalty_bonus = max(0, 15 - distance_to_penalty_area_1 * 0.5)
                
                # Add referee-specific variations
                referee_factor = {
                    "ref_001": 1.2,  # Stricter referee
                    "ref_002": 0.8,  # More lenient
                    "ref_003": 1.0,  # Average
                    "ref_004": 1.1,  # Slightly strict
                    "ref_005": 0.9,  # Slightly lenient
                    "ref_006": 1.15, # Strict
                    "ref_007": 0.85, # Lenient
                    "ref_008": 1.05  # Average+
                }.get(referee_id, 1.0)
                
                foul_count = int((base_density + penalty_bonus) * referee_factor * random.uniform(0.7, 1.3))
                
                heatmap_data.append({
                    "x": x_center,
                    "y": y_center,
                    "foul_count": foul_count,
                    "zone_id": f"zone_{i}_{j}"
                })
        
        # Get referee info
        referee_names = {
            "ref_001": "Antonio Mateu Lahoz",
            "ref_002": "Björn Kuipers", 
            "ref_003": "Daniele Orsato",
            "ref_004": "Clément Turpin",
            "ref_005": "Michael Oliver",
            "ref_006": "Szymon Marciniak",
            "ref_007": "Istvan Kovacs",
            "ref_008": "Jesús Gil Manzano"
        }
        
        total_fouls = sum(zone["foul_count"] for zone in heatmap_data)
        
        return {
            "success": True,
            "data": {
                "referee_id": referee_id,
                "referee_name": referee_names.get(referee_id, "Unknown Referee"),
                "total_fouls": total_fouls,
                "heatmap_zones": heatmap_data,
                "field_dimensions": {
                    "width": 120,
                    "height": 80
                },
                "statistics": {
                    "avg_fouls_per_zone": total_fouls / len(heatmap_data),
                    "most_active_zones": sorted(heatmap_data, key=lambda x: x["foul_count"], reverse=True)[:5],
                    "strictness_rating": referee_factor if 'referee_factor' in locals() else 1.0
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/referees/{referee_id}/match-fouls")
async def get_referee_match_fouls(referee_id: str, match_id: int):
    """Get detailed foul data for a specific referee in a specific match."""
    try:
        # This would extract actual foul locations from match events
        events = github_client.get_events_data(match_id)
        referee_fouls = []
        
        for event in events:
            if event.get('type', {}).get('name') == 'Foul Committed':
                foul_data = {
                    'id': event.get('id'),
                    'minute': event.get('minute', 0),
                    'second': event.get('second', 0),
                    'location': event.get('location', [60, 40]),  # Default center field
                    'player_name': event.get('player', {}).get('name', 'Unknown'),
                    'team_name': event.get('team', {}).get('name', 'Unknown'),
                    'foul_type': event.get('foul_committed', {}).get('type', {}).get('name', 'Unknown')
                }
                referee_fouls.append(foul_data)
        
        return {
            "success": True,
            "data": {
                "match_id": match_id,
                "referee_id": referee_id,
                "total_fouls": len(referee_fouls),
                "fouls": referee_fouls
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)