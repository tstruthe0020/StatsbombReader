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

@app.get("/api/analytics/cards/patterns")
async def get_card_patterns(
    competition_id: Optional[int] = Query(None),
    season_id: Optional[int] = Query(None),
    sample_matches: int = Query(20, ge=5, le=50)
):
    """Analyze card patterns across matches."""
    try:
        # Get sample matches for analysis
        if competition_id and season_id:
            matches = github_client.get_matches_data(competition_id, season_id)
        else:
            # Use La Liga 2020/2021 as default sample
            matches = github_client.get_matches_data(11, 90)
        
        # Sample matches to avoid overwhelming the API
        import random
        sample_match_list = random.sample(matches[:30], min(sample_matches, len(matches)))
        
        card_events = []
        match_count = 0
        
        for match in sample_match_list:
            try:
                match_id = match['match_id']
                events = github_client.get_events_data(match_id)
                
                home_team = match.get('home_team', {}).get('home_team_name', 'Home')
                away_team = match.get('away_team', {}).get('away_team_name', 'Away')
                
                for event in events:
                    if event.get('type', {}).get('name') == 'Bad Behaviour':
                        card_info = event.get('bad_behaviour', {}).get('card', {})
                        if card_info:
                            is_home_team = event.get('team', {}).get('name') == home_team
                            
                            card_events.append({
                                'match_id': match_id,
                                'card_type': card_info.get('name', 'Unknown'),
                                'minute': event.get('minute', 0),
                                'player_name': event.get('player', {}).get('name', 'Unknown'),
                                'position': event.get('position', {}).get('name', 'Unknown'),
                                'team_name': event.get('team', {}).get('name', 'Unknown'),
                                'is_home_team': is_home_team,
                                'location': event.get('location', [60, 40])
                            })
                
                match_count += 1
                if match_count >= sample_matches:
                    break
                    
            except Exception as e:
                continue
        
        # Analyze patterns
        total_cards = len(card_events)
        yellow_cards = len([c for c in card_events if c['card_type'] == 'Yellow Card'])
        red_cards = len([c for c in card_events if c['card_type'] == 'Red Card'])
        
        # Time distribution analysis
        time_periods = {
            '0-15 min': len([c for c in card_events if 0 <= c['minute'] <= 15]),
            '16-30 min': len([c for c in card_events if 16 <= c['minute'] <= 30]),
            '31-45 min': len([c for c in card_events if 31 <= c['minute'] <= 45]),
            '46-60 min': len([c for c in card_events if 46 <= c['minute'] <= 60]),
            '61-75 min': len([c for c in card_events if 61 <= c['minute'] <= 75]),
            '76-90+ min': len([c for c in card_events if c['minute'] >= 76])
        }
        
        # Position analysis
        position_stats = {}
        for card in card_events:
            pos = card['position']
            if pos not in position_stats:
                position_stats[pos] = {'yellow': 0, 'red': 0, 'total': 0}
            
            if card['card_type'] == 'Yellow Card':
                position_stats[pos]['yellow'] += 1
            elif card['card_type'] == 'Red Card':
                position_stats[pos]['red'] += 1
            position_stats[pos]['total'] += 1
        
        # Home vs Away analysis
        home_cards = len([c for c in card_events if c['is_home_team']])
        away_cards = len([c for c in card_events if not c['is_home_team']])
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "matches_analyzed": match_count,
                    "total_cards": total_cards,
                    "yellow_cards": yellow_cards,
                    "red_cards": red_cards,
                    "cards_per_match": round(total_cards / match_count, 2) if match_count > 0 else 0
                },
                "time_distribution": time_periods,
                "position_analysis": dict(sorted(position_stats.items(), key=lambda x: x[1]['total'], reverse=True)[:10]),
                "home_away_bias": {
                    "home_cards": home_cards,
                    "away_cards": away_cards,
                    "home_percentage": round((home_cards / total_cards) * 100, 1) if total_cards > 0 else 0,
                    "away_percentage": round((away_cards / total_cards) * 100, 1) if total_cards > 0 else 0
                },
                "raw_events": card_events[:20]  # Sample for detailed analysis
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/advantage/patterns")
async def get_advantage_patterns(sample_matches: int = Query(15, ge=5, le=30)):
    """Analyze referee advantage play patterns."""
    try:
        # Get La Liga matches for analysis
        matches = github_client.get_matches_data(11, 90)
        
        import random
        sample_match_list = random.sample(matches[:25], min(sample_matches, len(matches)))
        
        advantage_events = []
        foul_events = []
        match_count = 0
        
        for match in sample_match_list:
            try:
                match_id = match['match_id']
                events = github_client.get_events_data(match_id)
                
                for event in events:
                    if event.get('type', {}).get('name') == 'Foul Committed':
                        foul_committed = event.get('foul_committed', {})
                        advantage_played = foul_committed.get('advantage', False)
                        
                        foul_data = {
                            'match_id': match_id,
                            'minute': event.get('minute', 0),
                            'location': event.get('location', [60, 40]),
                            'advantage_played': advantage_played,
                            'team_name': event.get('team', {}).get('name', 'Unknown'),
                            'player_name': event.get('player', {}).get('name', 'Unknown')
                        }
                        
                        foul_events.append(foul_data)
                        
                        if advantage_played:
                            advantage_events.append(foul_data)
                
                match_count += 1
                if match_count >= sample_matches:
                    break
                    
            except Exception as e:
                continue
        
        total_fouls = len(foul_events)
        total_advantages = len(advantage_events)
        advantage_rate = (total_advantages / total_fouls) * 100 if total_fouls > 0 else 0
        
        # Location-based advantage analysis
        location_zones = {
            'Defensive Third': 0,
            'Middle Third': 0,
            'Attacking Third': 0
        }
        
        for adv in advantage_events:
            x_coord = adv['location'][0] if adv['location'] else 60
            if x_coord < 40:
                location_zones['Defensive Third'] += 1
            elif x_coord < 80:
                location_zones['Middle Third'] += 1
            else:
                location_zones['Attacking Third'] += 1
        
        # Time-based advantage patterns
        time_patterns = {
            'First Half (0-45)': len([a for a in advantage_events if a['minute'] <= 45]),
            'Second Half (46-90+)': len([a for a in advantage_events if a['minute'] > 45])
        }
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "matches_analyzed": match_count,
                    "total_fouls": total_fouls,
                    "advantages_played": total_advantages,
                    "advantage_rate_percentage": round(advantage_rate, 1)
                },
                "location_analysis": location_zones,
                "time_patterns": time_patterns,
                "referee_philosophy": {
                    "lenient": advantage_rate > 25,
                    "strict": advantage_rate < 15,
                    "balanced": 15 <= advantage_rate <= 25,
                    "philosophy_score": round(advantage_rate, 1)
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/match-flow/timing")
async def get_match_flow_analysis(sample_matches: int = Query(10, ge=5, le=20)):
    """Analyze match flow and referee decision timing patterns."""
    try:
        matches = github_client.get_matches_data(11, 90)
        
        import random
        sample_match_list = random.sample(matches[:20], min(sample_matches, len(matches)))
        
        decision_timeline = []
        match_count = 0
        
        for match in sample_match_list:
            try:
                match_id = match['match_id']
                events = github_client.get_events_data(match_id)
                
                # Track referee decisions by minute
                referee_decisions = []
                
                for event in events:
                    event_type = event.get('type', {}).get('name', '')
                    if event_type in ['Foul Committed', 'Bad Behaviour', 'Referee Ball-Drop']:
                        referee_decisions.append({
                            'minute': event.get('minute', 0),
                            'decision_type': event_type,
                            'location': event.get('location', [60, 40])
                        })
                
                decision_timeline.extend(referee_decisions)
                match_count += 1
                if match_count >= sample_matches:
                    break
                    
            except Exception as e:
                continue
        
        # Create decision density by 5-minute intervals
        decision_density = {}
        for i in range(0, 96, 5):  # 0-95 minutes in 5-minute intervals
            interval_key = f"{i}-{i+4}"
            decision_density[interval_key] = len([d for d in decision_timeline 
                                                if i <= d['minute'] < i+5])
        
        # Peak decision periods
        peak_periods = sorted(decision_density.items(), key=lambda x: x[1], reverse=True)[:5]
        
        # Critical moments (last 10 minutes of each half)
        critical_decisions = {
            'first_half_critical': len([d for d in decision_timeline if 36 <= d['minute'] <= 45]),
            'second_half_critical': len([d for d in decision_timeline if 81 <= d['minute'] <= 95]),
            'regular_time': len([d for d in decision_timeline if not (36 <= d['minute'] <= 45 or 81 <= d['minute'] <= 95)])
        }
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "matches_analyzed": match_count,
                    "total_decisions": len(decision_timeline),
                    "decisions_per_match": round(len(decision_timeline) / match_count, 1) if match_count > 0 else 0
                },
                "decision_density": decision_density,
                "peak_periods": [{"period": p[0], "decisions": p[1]} for p in peak_periods],
                "critical_moments": critical_decisions,
                "rhythm_analysis": {
                    "high_activity_periods": len([v for v in decision_density.values() if v > 5]),
                    "low_activity_periods": len([v for v in decision_density.values() if v <= 2]),
                    "average_decisions_per_interval": round(sum(decision_density.values()) / len(decision_density), 1)
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/positional/bias")
async def get_positional_bias_analysis(sample_matches: int = Query(12, ge=5, le=20)):
    """Analyze positional and tactical bias in referee decisions."""
    try:
        matches = github_client.get_matches_data(11, 90)
        
        import random
        sample_match_list = random.sample(matches[:20], min(sample_matches, len(matches)))
        
        foul_events = []
        match_count = 0
        
        for match in sample_match_list:
            try:
                match_id = match['match_id']
                events = github_client.get_events_data(match_id)
                
                for event in events:
                    if event.get('type', {}).get('name') == 'Foul Committed':
                        foul_events.append({
                            'position': event.get('position', {}).get('name', 'Unknown'),
                            'location': event.get('location', [60, 40]),
                            'minute': event.get('minute', 0),
                            'player_name': event.get('player', {}).get('name', 'Unknown')
                        })
                
                match_count += 1
                if match_count >= sample_matches:
                    break
                    
            except Exception as e:
                continue
        
        # Position-based foul analysis
        position_fouls = {}
        for foul in foul_events:
            pos = foul['position']
            position_fouls[pos] = position_fouls.get(pos, 0) + 1
        
        # Field zone analysis (attacking vs defensive vs middle third)
        zone_analysis = {'Attacking Third': 0, 'Middle Third': 0, 'Defensive Third': 0}
        for foul in foul_events:
            x_coord = foul['location'][0] if foul['location'] else 60
            if x_coord > 80:
                zone_analysis['Attacking Third'] += 1
            elif x_coord < 40:
                zone_analysis['Defensive Third'] += 1
            else:
                zone_analysis['Middle Third'] += 1
        
        # Most penalized positions
        top_positions = sorted(position_fouls.items(), key=lambda x: x[1], reverse=True)[:8]
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "matches_analyzed": match_count,
                    "total_fouls": len(foul_events),
                    "unique_positions": len(position_fouls)
                },
                "position_analysis": dict(top_positions),
                "field_zone_distribution": zone_analysis,
                "tactical_insights": {
                    "most_penalized_position": top_positions[0] if top_positions else ("Unknown", 0),
                    "attacking_third_bias": round((zone_analysis['Attacking Third'] / len(foul_events)) * 100, 1) if foul_events else 0,
                    "defensive_actions_called": zone_analysis['Defensive Third']
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/consistency/fairness")
async def get_consistency_fairness_analysis(sample_matches: int = Query(15, ge=5, le=25)):
    """Analyze referee consistency and fairness patterns."""
    try:
        matches = github_client.get_matches_data(11, 90)
        
        import random
        sample_match_list = random.sample(matches[:25], min(sample_matches, len(matches)))
        
        match_analysis = []
        
        for match in sample_match_list:
            try:
                match_id = match['match_id']
                events = github_client.get_events_data(match_id)
                
                home_team = match.get('home_team', {}).get('home_team_name', 'Home Team')
                away_team = match.get('away_team', {}).get('away_team_name', 'Away Team')
                
                home_fouls = 0
                away_fouls = 0
                home_cards = 0
                away_cards = 0
                
                for event in events:
                    event_type = event.get('type', {}).get('name', '')
                    team_name = event.get('team', {}).get('name', '')
                    
                    if event_type == 'Foul Committed':
                        if team_name == home_team:
                            home_fouls += 1
                        elif team_name == away_team:
                            away_fouls += 1
                    
                    elif event_type == 'Bad Behaviour':
                        if team_name == home_team:
                            home_cards += 1
                        elif team_name == away_team:
                            away_cards += 1
                
                match_analysis.append({
                    'match_id': match_id,
                    'home_team': home_team,
                    'away_team': away_team,
                    'home_fouls': home_fouls,
                    'away_fouls': away_fouls,
                    'home_cards': home_cards,
                    'away_cards': away_cards,
                    'foul_difference': abs(home_fouls - away_fouls),
                    'card_difference': abs(home_cards - away_cards)
                })
                
            except Exception as e:
                continue
        
        # Calculate fairness metrics
        total_matches = len(match_analysis)
        avg_home_fouls = sum(m['home_fouls'] for m in match_analysis) / total_matches if total_matches > 0 else 0
        avg_away_fouls = sum(m['away_fouls'] for m in match_analysis) / total_matches if total_matches > 0 else 0
        avg_home_cards = sum(m['home_cards'] for m in match_analysis) / total_matches if total_matches > 0 else 0
        avg_away_cards = sum(m['away_cards'] for m in match_analysis) / total_matches if total_matches > 0 else 0
        
        # Home advantage calculation
        home_foul_advantage = ((avg_home_fouls - avg_away_fouls) / avg_away_fouls) * 100 if avg_away_fouls > 0 else 0
        home_card_disadvantage = ((avg_home_cards - avg_away_cards) / avg_away_cards) * 100 if avg_away_cards > 0 else 0
        
        # Consistency metrics
        highly_uneven_matches = len([m for m in match_analysis if m['foul_difference'] > 10 or m['card_difference'] > 3])
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "matches_analyzed": total_matches,
                    "avg_home_fouls": round(avg_home_fouls, 1),
                    "avg_away_fouls": round(avg_away_fouls, 1),
                    "avg_home_cards": round(avg_home_cards, 1),
                    "avg_away_cards": round(avg_away_cards, 1)
                },
                "fairness_analysis": {
                    "home_foul_bias_percentage": round(home_foul_advantage, 2),
                    "home_card_bias_percentage": round(home_card_disadvantage, 2),
                    "is_home_biased": abs(home_foul_advantage) > 15 or abs(home_card_disadvantage) > 20,
                    "consistency_score": round(100 - (highly_uneven_matches / total_matches * 100), 1) if total_matches > 0 else 0
                },
                "consistency_metrics": {
                    "highly_uneven_matches": highly_uneven_matches,
                    "balanced_matches": total_matches - highly_uneven_matches,
                    "average_foul_difference": round(sum(m['foul_difference'] for m in match_analysis) / total_matches, 1) if total_matches > 0 else 0
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/location/intelligence")
async def get_location_intelligence_analysis(sample_matches: int = Query(10, ge=5, le=20)):
    """Analyze location-based referee decision patterns."""
    try:
        matches = github_client.get_matches_data(11, 90)
        
        import random
        sample_match_list = random.sample(matches[:20], min(sample_matches, len(matches)))
        
        penalty_area_decisions = []
        center_field_decisions = []
        touchline_decisions = []
        all_decisions = []
        
        for match in sample_match_list:
            try:
                match_id = match['match_id']
                events = github_client.get_events_data(match_id)
                
                for event in events:
                    event_type = event.get('type', {}).get('name', '')
                    location = event.get('location', [60, 40])
                    
                    if event_type in ['Foul Committed', 'Bad Behaviour']:
                        x, y = location[0] if location else 60, location[1] if location else 40
                        
                        decision_data = {
                            'x': x,
                            'y': y,
                            'event_type': event_type,
                            'minute': event.get('minute', 0)
                        }
                        
                        all_decisions.append(decision_data)
                        
                        # Categorize by field location
                        # Penalty areas: x < 18 or x > 102, y between 22-58
                        if (x < 18 or x > 102) and 22 <= y <= 58:
                            penalty_area_decisions.append(decision_data)
                        # Center field: 40 <= x <= 80, 30 <= y <= 50
                        elif 40 <= x <= 80 and 30 <= y <= 50:
                            center_field_decisions.append(decision_data)
                        # Touchlines: y < 5 or y > 75
                        elif y < 10 or y > 70:
                            touchline_decisions.append(decision_data)
                
            except Exception as e:
                continue
        
        total_decisions = len(all_decisions)
        
        # Location-based statistics
        penalty_area_rate = (len(penalty_area_decisions) / total_decisions) * 100 if total_decisions > 0 else 0
        center_field_rate = (len(center_field_decisions) / total_decisions) * 100 if total_decisions > 0 else 0
        touchline_rate = (len(touchline_decisions) / total_decisions) * 100 if total_decisions > 0 else 0
        
        # Critical area analysis
        critical_decisions = len([d for d in penalty_area_decisions if d['event_type'] == 'Foul Committed'])
        
        return {
            "success": True,
            "data": {
                "summary": {
                    "matches_analyzed": len(sample_match_list),
                    "total_decisions": total_decisions,
                    "penalty_area_decisions": len(penalty_area_decisions),
                    "center_field_decisions": len(center_field_decisions),
                    "touchline_decisions": len(touchline_decisions)
                },
                "location_distribution": {
                    "penalty_area_percentage": round(penalty_area_rate, 1),
                    "center_field_percentage": round(center_field_rate, 1),
                    "touchline_percentage": round(touchline_rate, 1),
                    "other_areas_percentage": round(100 - penalty_area_rate - center_field_rate - touchline_rate, 1)
                },
                "critical_analysis": {
                    "penalty_area_fouls": critical_decisions,
                    "high_pressure_decisions": len([d for d in penalty_area_decisions if d['minute'] > 75]),
                    "accuracy_indicators": {
                        "penalty_area_focus": penalty_area_rate > 15,
                        "balanced_coverage": 20 <= center_field_rate <= 40,
                        "touchline_awareness": touchline_rate > 5
                    }
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/competition/comparison")
async def get_competition_specific_analysis():
    """Compare referee patterns across different competition types."""
    try:
        # Analyze different competitions
        competitions_to_analyze = [
            {"id": 11, "season": 90, "name": "La Liga 2020/2021", "type": "Domestic League"},
            {"id": 16, "season": 4, "name": "Champions League 2018/2019", "type": "European Competition"},
            {"id": 43, "season": 3, "name": "FIFA World Cup 2022", "type": "International Tournament"}
        ]
        
        competition_analysis = []
        
        for comp in competitions_to_analyze:
            try:
                matches = github_client.get_matches_data(comp["id"], comp["season"])
                
                # Sample up to 10 matches per competition
                import random
                sample_matches = random.sample(matches[:15], min(10, len(matches)))
                
                total_fouls = 0
                total_cards = 0
                total_decisions = 0
                match_count = len(sample_matches)
                
                for match in sample_matches:
                    try:
                        match_id = match['match_id']
                        events = github_client.get_events_data(match_id)
                        
                        match_fouls = len([e for e in events if e.get('type', {}).get('name') == 'Foul Committed'])
                        match_cards = len([e for e in events if e.get('type', {}).get('name') == 'Bad Behaviour'])
                        match_decisions = match_fouls + match_cards
                        
                        total_fouls += match_fouls
                        total_cards += match_cards
                        total_decisions += match_decisions
                        
                    except Exception as e:
                        continue
                
                competition_analysis.append({
                    "competition_name": comp["name"],
                    "competition_type": comp["type"],
                    "matches_analyzed": match_count,
                    "avg_fouls_per_match": round(total_fouls / match_count, 1) if match_count > 0 else 0,
                    "avg_cards_per_match": round(total_cards / match_count, 1) if match_count > 0 else 0,
                    "avg_decisions_per_match": round(total_decisions / match_count, 1) if match_count > 0 else 0,
                    "strictness_level": "High" if (total_decisions / match_count) > 30 else "Medium" if (total_decisions / match_count) > 20 else "Low"
                })
                
            except Exception as e:
                continue
        
        # Comparative analysis
        if len(competition_analysis) >= 2:
            domestic_vs_international = {
                "domestic_strictness": next((c["avg_decisions_per_match"] for c in competition_analysis if "League" in c["competition_type"]), 0),
                "international_strictness": next((c["avg_decisions_per_match"] for c in competition_analysis if "International" in c["competition_type"]), 0),
                "european_strictness": next((c["avg_decisions_per_match"] for c in competition_analysis if "European" in c["competition_type"]), 0)
            }
        else:
            domestic_vs_international = {}
        
        return {
            "success": True,
            "data": {
                "competition_comparison": competition_analysis,
                "comparative_insights": domestic_vs_international,
                "tournament_trends": {
                    "high_stakes_effect": "International tournaments tend to have stricter officiating",
                    "domestic_consistency": "League matches show more consistent referee patterns",
                    "european_prestige": "European competitions balance strictness with flow"
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)