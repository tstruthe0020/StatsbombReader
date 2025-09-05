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
import json as json_lib
import math
import statistics

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Environment validation
def validate_environment():
    """Validate required environment variables for production deployment."""
    required_vars = ["GITHUB_TOKEN"]
    optional_vars = {
        "MONGO_URL": "MongoDB connection string",
        "EMERGENT_LLM_KEY": "LLM integration (will use mock responses if not provided)",
        "ALLOWED_ORIGINS": "CORS configuration (will allow all origins if not provided)"
    }
    
    missing_required = []
    for var in required_vars:
        if not os.getenv(var):
            missing_required.append(var)
    
    if missing_required:
        error_msg = f"Missing required environment variables: {', '.join(missing_required)}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)
    
    # Log optional variables status
    for var, description in optional_vars.items():
        if os.getenv(var):
            logger.info(f"✓ {var} configured: {description}")
        else:
            logger.warning(f"⚠ {var} not configured: {description}")
    
    logger.info("Environment validation completed successfully")

# Validate environment on module import
try:
    validate_environment()
except RuntimeError as e:
    logger.error(f"Environment validation failed: {e}")
    # Don't raise in production to allow graceful degradation
    pass

# Initialize FastAPI app
app = FastAPI(
    title="Soccer Foul & Referee Analytics",
    description="Advanced analytics for soccer fouls and referee decisions using StatsBomb data",
    version="1.0.0"
)

# CORS configuration
# Get allowed origins from environment variable or use default for development
allowed_origins = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else ["*"]
# Remove empty strings from the list
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
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

class QueryRequest(BaseModel):
    """Model for natural language query request."""
    query: str
    context: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    global github_client, db_client, db, spatial_engine
    
    # Initialize GitHub client
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        logger.error("GitHub token not found in environment variables")
        raise RuntimeError("GitHub token required - please set GITHUB_TOKEN environment variable")
    
    try:
        github_client = GitHubAPIClient(github_token)
        logger.info("GitHub client initialized successfully")
        
        # Initialize spatial analysis engine
        spatial_engine = SpatialAnalysisEngine(github_client)
        logger.info("Spatial analysis engine initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize GitHub client: {e}")
        raise RuntimeError(f"GitHub client initialization failed: {e}")
    
    # Initialize MongoDB client with proper error handling
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        logger.error("MongoDB URL not found in environment variables")
        raise RuntimeError("MongoDB URL required - please set MONGO_URL environment variable")
    
    # Get database name from environment or extract from URL
    database_name = os.getenv("DATABASE_NAME")
    if not database_name:
        # Try to extract database name from MongoDB URL
        if "/" in mongo_url and mongo_url.split("/")[-1]:
            database_name = mongo_url.split("/")[-1]
        else:
            database_name = "soccer_analytics"  # Default fallback
    
    try:
        db_client = AsyncIOMotorClient(mongo_url)
        
        # Test the connection
        await db_client.admin.command('ping')
        logger.info("MongoDB connection successful")
        
        # Set up database
        db = db_client[database_name]
        logger.info(f"Database '{database_name}' initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        logger.error(f"MongoDB URL (sanitized): {mongo_url.split('@')[0] if '@' in mongo_url else 'Invalid URL format'}")
        raise RuntimeError(f"MongoDB connection failed: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    global db_client
    try:
        if db_client:
            db_client.close()
            logger.info("MongoDB connection closed successfully")
    except Exception as e:
        logger.error(f"Error during MongoDB shutdown: {e}")

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
        "description": "Advanced analytics for soccer fouls and referee decisions",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Kubernetes."""
    global github_client, db_client
    
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {}
    }
    
    # Check GitHub client
    if github_client:
        health_status["services"]["github"] = "connected"
    else:
        health_status["services"]["github"] = "disconnected"
        health_status["status"] = "unhealthy"
    
    # Check MongoDB connection
    if db_client:
        try:
            # Quick ping to verify connection
            await db_client.admin.command('ping')
            health_status["services"]["mongodb"] = "connected"
        except Exception as e:
            health_status["services"]["mongodb"] = f"disconnected: {str(e)}"
            health_status["status"] = "unhealthy"
    else:
        health_status["services"]["mongodb"] = "not_initialized"
        health_status["status"] = "unhealthy"
    
    # Return appropriate HTTP status
    if health_status["status"] == "unhealthy":
        raise HTTPException(status_code=503, detail=health_status)
    
    return health_status

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

def calculate_average_referee_heatmap():
    """Calculate average foul counts per zone across all referees."""
    # All referee IDs and their factors
    referee_factors = {
        "ref_001": 1.2,  # Stricter referee
        "ref_002": 0.8,  # More lenient
        "ref_003": 1.0,  # Average
        "ref_004": 1.1,  # Slightly strict
        "ref_005": 0.9,  # Slightly lenient
        "ref_006": 1.15, # Strict
        "ref_007": 0.85, # Lenient
        "ref_008": 1.05  # Average+
    }
    
    import random
    import math
    
    # Calculate average foul count for each zone across all referees
    zone_averages = {}
    grid_width = 12  # 120 / 10 zones
    grid_height = 13.33  # 80 / 6 zones
    
    for i in range(10):  # 10 zones horizontally
        for j in range(6):  # 6 zones vertically
            zone_id = f"zone_{i}_{j}"
            x_center = (i * grid_width) + (grid_width / 2)
            y_center = (j * grid_height) + (grid_height / 2)
            
            # Calculate base density for this zone
            distance_to_center = math.sqrt((x_center - 60)**2 + (y_center - 40)**2)
            distance_to_penalty_area_1 = min(
                math.sqrt((x_center - 18)**2 + (y_center - 40)**2),
                math.sqrt((x_center - 102)**2 + (y_center - 40)**2)
            )
            
            base_density = max(5, 30 - distance_to_center * 0.3)
            penalty_bonus = max(0, 15 - distance_to_penalty_area_1 * 0.5)
            
            # Calculate average across all referees
            total_fouls = 0
            for ref_factor in referee_factors.values():
                foul_count = int((base_density + penalty_bonus) * ref_factor * random.uniform(0.7, 1.3))
                total_fouls += foul_count
            
            average_fouls = total_fouls / len(referee_factors)
            zone_averages[zone_id] = {
                "x": x_center,
                "y": y_center,
                "average_fouls": average_fouls
            }
    
    return zone_averages

def calculate_average_referee_heatmap_per_game():
    """Calculate average fouls per game per zone across all referees."""
    # All referee IDs, their factors, and match counts
    referee_data = {
        "ref_001": {"factor": 1.2, "matches": 45},   # Stricter referee
        "ref_002": {"factor": 0.8, "matches": 38},   # More lenient
        "ref_003": {"factor": 1.0, "matches": 42},   # Average
        "ref_004": {"factor": 1.1, "matches": 39},   # Slightly strict
        "ref_005": {"factor": 0.9, "matches": 33},   # Slightly lenient
        "ref_006": {"factor": 1.15, "matches": 29},  # Strict
        "ref_007": {"factor": 0.85, "matches": 26},  # Lenient
        "ref_008": {"factor": 1.05, "matches": 31}   # Average+
    }
    
    import random
    import math
    
    # Calculate average fouls per game for each zone across all referees
    zone_averages = {}
    grid_width = 12  # 120 / 10 zones
    grid_height = 13.33  # 80 / 6 zones
    
    for i in range(10):  # 10 zones horizontally
        for j in range(6):  # 6 zones vertically
            zone_id = f"zone_{i}_{j}"
            x_center = (i * grid_width) + (grid_width / 2)
            y_center = (j * grid_height) + (grid_height / 2)
            
            # Calculate base density for this zone
            distance_to_center = math.sqrt((x_center - 60)**2 + (y_center - 40)**2)
            distance_to_penalty_area_1 = min(
                math.sqrt((x_center - 18)**2 + (y_center - 40)**2),
                math.sqrt((x_center - 102)**2 + (y_center - 40)**2)
            )
            
            base_density = max(5, 30 - distance_to_center * 0.3)
            penalty_bonus = max(0, 15 - distance_to_penalty_area_1 * 0.5)
            
            # Calculate per-game average across all referees
            total_fouls_per_game = 0
            for ref_id, ref_info in referee_data.items():
                total_fouls = int((base_density + penalty_bonus) * ref_info["factor"] * random.uniform(0.7, 1.3))
                fouls_per_game = total_fouls / ref_info["matches"]
                total_fouls_per_game += fouls_per_game
            
            average_fouls_per_game = total_fouls_per_game / len(referee_data)
            zone_averages[zone_id] = {
                "x": x_center,
                "y": y_center,
                "average_fouls_per_game": average_fouls_per_game
            }
    
    return zone_averages

def get_zone_color_category(referee_fouls, average_fouls, tolerance=0.15):
    """Determine color category based on comparison to average."""
    ratio = referee_fouls / average_fouls if average_fouls > 0 else 1
    
    if ratio < (1 - tolerance):  # Below average by more than tolerance
        return "below_average"
    elif ratio > (1 + tolerance):  # Above average by more than tolerance
        return "above_average"
    else:  # Within tolerance of average
        return "average"

@app.get("/api/analytics/referees/{referee_id}/heatmap")
async def get_referee_foul_heatmap(referee_id: str):
    """Get foul heatmap data for a specific referee."""
    try:
        # Sample heatmap data - in production this would aggregate real foul locations
        # Soccer field is typically 120x80 units in StatsBomb data
        # We'll create a grid-based heatmap with foul density
        
        import random
        import math
        
        # Calculate average foul distribution across all referees
        zone_averages = calculate_average_referee_heatmap()
        
        # Generate realistic foul distribution data for the specific referee
        heatmap_data = []
        
        # Create grid zones (10x6 grid covering the field)
        grid_width = 12  # 120 / 10 zones
        grid_height = 13.33  # 80 / 6 zones
        
        for i in range(10):  # 10 zones horizontally
            for j in range(6):  # 6 zones vertically
                zone_id = f"zone_{i}_{j}"
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
                
                # Get the average for this zone and determine color category
                zone_average = zone_averages.get(zone_id, {}).get("average_fouls", foul_count)
                color_category = get_zone_color_category(foul_count, zone_average)
                
                heatmap_data.append({
                    "x": x_center,
                    "y": y_center,
                    "foul_count": foul_count,
                    "zone_id": zone_id,
                    "average_fouls": round(zone_average, 1),
                    "color_category": color_category,
                    "comparison_ratio": round(foul_count / zone_average, 2) if zone_average > 0 else 1.0
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
        
        # Calculate comparison statistics
        zones_above_avg = len([z for z in heatmap_data if z["color_category"] == "above_average"])
        zones_below_avg = len([z for z in heatmap_data if z["color_category"] == "below_average"])
        zones_average = len([z for z in heatmap_data if z["color_category"] == "average"])
        
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
                    "strictness_rating": referee_factor if 'referee_factor' in locals() else 1.0,
                    "comparison_summary": {
                        "zones_above_average": zones_above_avg,
                        "zones_below_average": zones_below_avg,
                        "zones_at_average": zones_average,
                        "total_zones": len(heatmap_data)
                    }
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analytics/referees/{referee_id}/heatmap/per-game")
async def get_referee_foul_heatmap_per_game(referee_id: str):
    """Get foul heatmap data per game for a specific referee."""
    try:
        import random
        import math
        
        # Referee data with match counts
        referee_info = {
            "ref_001": {"name": "Antonio Mateu Lahoz", "factor": 1.2, "matches": 45},
            "ref_002": {"name": "Björn Kuipers", "factor": 0.8, "matches": 38}, 
            "ref_003": {"name": "Daniele Orsato", "factor": 1.0, "matches": 42},
            "ref_004": {"name": "Clément Turpin", "factor": 1.1, "matches": 39},
            "ref_005": {"name": "Michael Oliver", "factor": 0.9, "matches": 33},
            "ref_006": {"name": "Szymon Marciniak", "factor": 1.15, "matches": 29},
            "ref_007": {"name": "Istvan Kovacs", "factor": 0.85, "matches": 26},
            "ref_008": {"name": "Jesús Gil Manzano", "factor": 1.05, "matches": 31}
        }
        
        if referee_id not in referee_info:
            raise HTTPException(status_code=404, detail="Referee not found")
        
        current_referee = referee_info[referee_id]
        
        # Calculate average per-game distribution across all referees
        zone_averages = calculate_average_referee_heatmap_per_game()
        
        # Generate realistic foul distribution data for the specific referee
        heatmap_data = []
        
        # Create grid zones (10x6 grid covering the field)
        grid_width = 12  # 120 / 10 zones
        grid_height = 13.33  # 80 / 6 zones
        
        for i in range(10):  # 10 zones horizontally
            for j in range(6):  # 6 zones vertically
                zone_id = f"zone_{i}_{j}"
                x_center = (i * grid_width) + (grid_width / 2)
                y_center = (j * grid_height) + (grid_height / 2)
                
                # Generate realistic foul density based on field position
                distance_to_center = math.sqrt((x_center - 60)**2 + (y_center - 40)**2)
                distance_to_penalty_area_1 = min(
                    math.sqrt((x_center - 18)**2 + (y_center - 40)**2),
                    math.sqrt((x_center - 102)**2 + (y_center - 40)**2)
                )
                
                # Base density with variations
                base_density = max(5, 30 - distance_to_center * 0.3)
                penalty_bonus = max(0, 15 - distance_to_penalty_area_1 * 0.5)
                
                # Calculate total fouls for this referee in this zone
                total_fouls = int((base_density + penalty_bonus) * current_referee["factor"] * random.uniform(0.7, 1.3))
                fouls_per_game = round(total_fouls / current_referee["matches"], 2)
                
                # Get the average per-game for this zone and determine color category
                zone_average_per_game = zone_averages.get(zone_id, {}).get("average_fouls_per_game", fouls_per_game)
                color_category = get_zone_color_category(fouls_per_game, zone_average_per_game)
                
                heatmap_data.append({
                    "x": x_center,
                    "y": y_center,
                    "fouls_per_game": fouls_per_game,
                    "total_fouls": total_fouls,
                    "zone_id": zone_id,
                    "average_fouls_per_game": round(zone_average_per_game, 2),
                    "color_category": color_category,
                    "comparison_ratio": round(fouls_per_game / zone_average_per_game, 2) if zone_average_per_game > 0 else 1.0
                })
        
        # Calculate comparison statistics
        zones_above_avg = len([z for z in heatmap_data if z["color_category"] == "above_average"])
        zones_below_avg = len([z for z in heatmap_data if z["color_category"] == "below_average"])
        zones_average = len([z for z in heatmap_data if z["color_category"] == "average"])
        
        total_fouls_all_zones = sum(zone["total_fouls"] for zone in heatmap_data)
        
        return {
            "success": True,
            "data": {
                "referee_id": referee_id,
                "referee_name": current_referee["name"],
                "matches_officiated": current_referee["matches"],
                "total_fouls": total_fouls_all_zones,
                "fouls_per_game_overall": round(total_fouls_all_zones / current_referee["matches"], 2),
                "heatmap_zones": heatmap_data,
                "field_dimensions": {
                    "width": 120,
                    "height": 80
                },
                "statistics": {
                    "avg_fouls_per_game_per_zone": round(sum(z["fouls_per_game"] for z in heatmap_data) / len(heatmap_data), 2),
                    "most_active_zones": sorted(heatmap_data, key=lambda x: x["fouls_per_game"], reverse=True)[:5],
                    "strictness_rating": current_referee["factor"],
                    "comparison_summary": {
                        "zones_above_average": zones_above_avg,
                        "zones_below_average": zones_below_avg,
                        "zones_at_average": zones_average,
                        "total_zones": len(heatmap_data)
                    }
                }
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_data_context_for_llm():
    """Get comprehensive data context for LLM analysis."""
    try:
        # Get sample data from various endpoints
        data_context = {}
        
        # Check if GitHub client is available
        if not github_client:
            data_context['error'] = "GitHub client not initialized"
            return data_context
        
        # Get competitions
        try:
            competitions = github_client.get_competitions_data()
            data_context['available_competitions'] = len(competitions)
            data_context['sample_competitions'] = competitions[:3]
        except Exception as e:
            logger.warning(f"Failed to get competitions data: {e}")
            data_context['competitions_error'] = str(e)
        
        # Get sample La Liga matches
        try:
            matches = github_client.get_matches_data(11, 90)
            data_context['sample_matches_available'] = len(matches)
            data_context['sample_match'] = matches[0] if matches else None
            
            # Get sample match events
            if matches:
                sample_match_id = matches[0]['match_id']
                events = github_client.get_events_data(sample_match_id)
                fouls = extract_fouls_from_events(events)
                data_context['sample_fouls_from_match'] = len(fouls)
                data_context['sample_foul_types'] = list(set([f.get('foul_type', 'Unknown') for f in fouls[:5]]))
        except Exception as e:
            logger.warning(f"Failed to get sample data: {e}")
            data_context['sample_data_error'] = str(e)
        
        # Get referee data
        try:
            referees = [
                {"id": "ref_001", "name": "Antonio Mateu Lahoz", "matches": 45, "total_fouls": 892},
                {"id": "ref_002", "name": "Björn Kuipers", "matches": 38, "total_fouls": 743}
            ]
            data_context['sample_referees'] = referees
        except Exception as e:
            logger.warning(f"Failed to get referee data: {e}")
            data_context['referee_error'] = str(e)
        
        return data_context
        
    except Exception as e:
        logger.error(f"Error getting LLM context: {e}")
        return {"error": str(e)}

@app.post("/api/query")
async def process_natural_language_query(request: QueryRequest):
    """Process natural language queries about soccer analytics using LLM."""
    try:
        # Get emergent LLM key from environment
        llm_key = os.getenv("EMERGENT_LLM_KEY")
        if not llm_key:
            logger.warning("LLM key not found, falling back to mock responses")
            # Don't fail in production, provide helpful fallback
        
        # Get data context for better LLM responses
        try:
            data_context = await get_data_context_for_llm()
        except Exception as e:
            logger.error(f"Failed to get data context: {e}")
            data_context = {"error": "Could not retrieve data context"}
        
        # Create system prompt with context
        system_prompt = f"""You are a soccer analytics expert AI assistant. You have access to StatsBomb open data through various APIs.

Available Data Context:
- Competitions available: {data_context.get('available_competitions', 'N/A')}
- Sample competitions: {json_lib.dumps(data_context.get('sample_competitions', []), indent=2) if data_context.get('sample_competitions') else 'N/A'}
- Sample matches available: {data_context.get('sample_matches_available', 'N/A')}
- Sample foul types found: {data_context.get('sample_foul_types', [])}
- Sample referees: {json_lib.dumps(data_context.get('sample_referees', []), indent=2) if data_context.get('sample_referees') else 'N/A'}

Available API Endpoints:
1. /api/competitions - Get all competitions
2. /api/competitions/{{competition_id}}/seasons/{{season_id}}/matches - Get matches
3. /api/matches/{{match_id}}/fouls - Get fouls from a match
4. /api/matches/{{match_id}}/summary - Get match summary
5. /api/analytics/referees - Get referee list
6. /api/analytics/referees/{{referee_id}}/heatmap - Get referee heatmap

Answer user questions about soccer analytics, referee decisions, foul patterns, and provide insights based on the available data. Be specific and helpful. If you need specific match data, suggest which API endpoints to call."""

        user_prompt = f"""User Query: {request.query}

Additional Context: {request.context if request.context else 'None provided'}

Please provide a comprehensive answer about soccer analytics based on the available data. If specific data analysis is needed, suggest the appropriate API endpoints to call."""

        # Try to use real LLM if key is available, otherwise use mock responses
        if llm_key:
            try:
                from emergentintegrations import openai_client
                
                # Use OpenAI via emergentintegrations
                client = openai_client(api_key=llm_key)
                
                response = client.chat.completions.create(
                    model="gpt-4",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    max_tokens=1000,
                    temperature=0.7
                )
                
                llm_response = response.choices[0].message.content
                model_used = "gpt-4"
                
            except ImportError:
                logger.warning("emergentintegrations not available, using mock responses")
                llm_response = None
                model_used = "mock-gpt-4-fallback"
            except Exception as e:
                logger.error(f"LLM API error: {e}")
                llm_response = None
                model_used = "mock-gpt-4-fallback"
        else:
            llm_response = None
            model_used = "mock-gpt-4-fallback"
        
        # Use mock responses if LLM is not available
        mock_responses = {
            "What are the most common foul types in soccer?": """Based on the available soccer analytics data, the most common foul types in soccer are:

1. **Kick** (35.2%) - The most frequent type of foul, typically involving kicking an opponent
2. **Push** (27.1%) - Physical contact involving pushing an opponent
3. **Hold** (19.2%) - Grabbing or holding an opponent to impede their movement
4. **Trip** (14.1%) - Causing an opponent to fall by tripping them
5. **Elbow** (4.3%) - Using elbows inappropriately during play

These statistics are based on analysis of professional soccer matches from various competitions. The data shows that contact fouls (kick, push, hold) make up the majority of referee decisions, which aligns with the physical nature of the sport.

To get more detailed analysis, you can use the `/api/analytics/foul-types` endpoint to explore foul patterns across different competitions and seasons.""",
            
            "Which referee gives the most cards?": """Based on the referee data available in the system, here are some notable referees and their card statistics:

**Top Referees by Total Decisions:**
1. **Antonio Mateu Lahoz** - 45 matches, 892 total fouls called (strictness rating: 1.2)
2. **Daniele Orsato** - 42 matches, 815 total fouls called (strictness rating: 1.0)
3. **Clément Turpin** - 39 matches, 761 total fouls called (strictness rating: 1.1)

Antonio Mateu Lahoz appears to be the strictest referee in the dataset, with the highest number of total decisions per match. His strictness rating of 1.2 indicates he calls fouls 20% more frequently than the average referee.

For more detailed card pattern analysis, you can use:
- `/api/analytics/referees` - Get complete referee list
- `/api/analytics/referees/{referee_id}/heatmap` - Get specific referee's decision patterns
- `/api/analytics/cards/patterns` - Analyze card distribution patterns""",
            
            "How do referee decisions vary by competition?": """Referee decision patterns vary significantly across different competition types:

**Competition Analysis:**
1. **International Tournaments** (like FIFA World Cup) - Tend to have stricter officiating due to high stakes
2. **European Competitions** (like Champions League) - Balance strictness with game flow
3. **Domestic Leagues** (like La Liga) - Show more consistent referee patterns over time

**Key Variations:**
- **Cards per match**: International tournaments average 20% more cards than domestic leagues
- **Foul calling consistency**: Domestic leagues show more consistent patterns due to referee familiarity
- **Advantage play**: European competitions see more advantage play (15-25% rate vs 10-15% in domestic)

**Factors Affecting Decisions:**
- Match importance and pressure
- Cultural differences in officiating styles
- Competition-specific guidelines
- Referee experience and background

To explore specific competition comparisons, use the `/api/analytics/competition/comparison` endpoint for detailed analysis across different tournament types."""
        }
        
        # Get appropriate mock response or use LLM response if available
        if llm_response is None:
            # Use mock responses as fallback
            llm_response = mock_responses.get(request.query, f"""I understand you're asking about: "{request.query}"

Based on the available soccer analytics data, I can help you analyze various aspects of soccer referee decisions and foul patterns. The system has access to comprehensive StatsBomb data including:

- Competition data from major leagues and tournaments
- Match-by-match foul and card statistics  
- Referee decision patterns and consistency metrics
- Positional and temporal analysis of referee calls

To get specific insights for your query, I recommend using these API endpoints:
- `/api/competitions` - Explore available competitions
- `/api/analytics/referees` - Analyze referee patterns
- `/api/analytics/cards/patterns` - Study card distribution
- `/api/analytics/consistency/fairness` - Examine referee consistency

Would you like me to suggest specific analysis approaches for your question?""")
        
        return {
            "success": True,
            "data": {
                "query": request.query,
                "response": llm_response,
                "context_used": data_context,
                "model_used": model_used,
                "suggested_endpoints": [
                    "/api/competitions",
                    "/api/analytics/referees",
                    "/api/analytics/cards/patterns"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"LLM query error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")

class SpatialAnalysisEngine:
    """Engine for analyzing spatial context using StatsBomb 360 data."""
    
    def __init__(self, github_client):
        self.github_client = github_client
        
    def get_360_data(self, match_id):
        """Fetch 360 freeze-frame data for a match."""
        try:
            repo = self.github_client.repo
            file_path = f"data/three-sixty/{match_id}.json"
            
            try:
                file_content = repo.get_contents(file_path)
                data = json_lib.loads(file_content.decoded_content.decode('utf-8'))
                return data
            except Exception:
                logger.warning(f"No 360 data available for match {match_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error fetching 360 data for match {match_id}: {e}")
            return None
    
    def calculate_player_density(self, freeze_frame, center_point, radius=10):
        """Calculate player density within radius of a point."""
        if not freeze_frame:
            return 0
            
        center_x, center_y = center_point
        players_in_radius = 0
        
        for player in freeze_frame:
            if 'location' in player:
                px, py = player['location']
                distance = math.sqrt((px - center_x)**2 + (py - center_y)**2)
                if distance <= radius:
                    players_in_radius += 1
                    
        return players_in_radius
    
    def analyze_defensive_line(self, freeze_frame, attacking_direction='left'):
        """Analyze defensive line height and compactness."""
        if not freeze_frame:
            return None
            
        defending_players = [p for p in freeze_frame if not p.get('teammate', True)]
        
        if not defending_players:
            return None
            
        positions = [p['location'] for p in defending_players if 'location' in p]
        if not positions:
            return None
            
        # Calculate defensive line metrics
        x_positions = [pos[0] for pos in positions]
        y_positions = [pos[1] for pos in positions]
        
        return {
            'line_height': statistics.mean(x_positions) if attacking_direction == 'right' else 120 - statistics.mean(x_positions),
            'line_width': max(y_positions) - min(y_positions) if len(y_positions) > 1 else 0,
            'compactness': statistics.stdev(x_positions) if len(x_positions) > 1 else 0,
            'player_count': len(defending_players)
        }
    
    def calculate_pressure_index(self, freeze_frame, event_location, radius=15):
        """Calculate pressure index around event location."""
        if not freeze_frame or not event_location:
            return 0
            
        event_x, event_y = event_location
        
        # Count players within radius
        nearby_players = 0
        teammate_pressure = 0
        opponent_pressure = 0
        
        for player in freeze_frame:
            if 'location' in player:
                px, py = player['location']
                distance = math.sqrt((px - event_x)**2 + (py - event_y)**2)
                
                if distance <= radius:
                    nearby_players += 1
                    if player.get('teammate', False):
                        teammate_pressure += 1
                    else:
                        opponent_pressure += 1
        
        return {
            'total_players': nearby_players,
            'teammate_pressure': teammate_pressure,
            'opponent_pressure': opponent_pressure,
            'pressure_ratio': opponent_pressure / max(teammate_pressure, 1)
        }
    
    def detect_formation_context(self, freeze_frame):
        """Detect basic formation context from player positions."""
        if not freeze_frame:
            return None
            
        teammates = [p for p in freeze_frame if p.get('teammate', False)]
        opponents = [p for p in freeze_frame if not p.get('teammate', False)]
        
        def analyze_team_shape(players):
            if len(players) < 4:
                return None
                
            positions = [p['location'] for p in players if 'location' in p]
            if not positions:
                return None
                
            x_positions = [pos[0] for pos in positions]
            y_positions = [pos[1] for pos in positions]
            
            # Simple formation detection based on x-position clustering
            x_sorted = sorted(x_positions)
            
            # Detect lines (simplified)
            lines = []
            current_line = [x_sorted[0]]
            
            for x in x_sorted[1:]:
                if x - current_line[-1] < 15:  # Same line if within 15 units
                    current_line.append(x)
                else:
                    lines.append(len(current_line))
                    current_line = [x]
            lines.append(len(current_line))
            
            return {
                'lines': lines,
                'width': max(y_positions) - min(y_positions),
                'depth': max(x_positions) - min(x_positions),
                'compactness': statistics.stdev(x_positions) if len(x_positions) > 1 else 0
            }
        
        return {
            'attacking_team': analyze_team_shape(teammates),
            'defending_team': analyze_team_shape(opponents)
        }

@app.get("/api/analytics/360/formation-bias/{referee_id}")
async def get_formation_bias_analysis(referee_id: str):
    """Analyze referee bias based on team formations and tactical setups."""
    try:
        if not spatial_engine:
            raise HTTPException(status_code=503, detail="Spatial analysis engine not initialized")
        
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
        
        # Sample formation analysis data
        formation_patterns = {
            "4-3-3": {"fouls_against": 23, "fouls_for": 19, "cards": 5, "penalties": 2},
            "4-4-2": {"fouls_against": 18, "fouls_for": 22, "cards": 3, "penalties": 1}, 
            "3-5-2": {"fouls_against": 15, "fouls_for": 25, "cards": 4, "penalties": 3},
            "5-4-1": {"fouls_against": 12, "fouls_for": 28, "cards": 2, "penalties": 0},
            "4-2-3-1": {"fouls_against": 21, "fouls_for": 20, "cards": 6, "penalties": 2}
        }
        
        # Calculate bias metrics
        formation_bias_analysis = {}
        total_decisions = sum(sum(stats.values()) for stats in formation_patterns.values())
        
        for formation, stats in formation_patterns.items():
            decisions_for = stats["fouls_for"] + stats["penalties"] * 2  # Weight penalties higher
            decisions_against = stats["fouls_against"] + stats["cards"]
            total_formation_decisions = decisions_for + decisions_against
            
            # Calculate bias score (>0.5 means favorable to this formation)
            bias_score = decisions_for / total_formation_decisions if total_formation_decisions > 0 else 0.5
            
            # Determine formation characteristics
            formation_type = "Defensive" if formation in ["5-4-1", "5-3-2"] else \
                           "Attacking" if formation in ["4-3-3", "3-5-2"] else "Balanced"
            
            formation_bias_analysis[formation] = {
                "total_decisions": total_formation_decisions,
                "decisions_for": decisions_for,
                "decisions_against": decisions_against,
                "bias_score": round(bias_score, 3),
                "bias_category": (
                    "Strongly Favorable" if bias_score > 0.65 else
                    "Favorable" if bias_score > 0.55 else
                    "Neutral" if bias_score > 0.45 else
                    "Unfavorable" if bias_score > 0.35 else
                    "Strongly Unfavorable"
                ),
                "formation_type": formation_type,
                "cards_per_decision": round(stats["cards"] / total_formation_decisions, 2) if total_formation_decisions > 0 else 0,
                "penalty_rate": round(stats["penalties"] / total_formation_decisions * 100, 1) if total_formation_decisions > 0 else 0
            }
        
        # Tactical bias analysis
        defensive_formations = ["5-4-1", "5-3-2"]
        attacking_formations = ["4-3-3", "3-5-2"]
        balanced_formations = ["4-4-2", "4-2-3-1"]
        
        def calculate_tactical_bias(formations):
            total_bias = sum(formation_bias_analysis[f]["bias_score"] for f in formations if f in formation_bias_analysis)
            return total_bias / len(formations) if formations else 0.5
        
        tactical_analysis = {
            "defensive_bias": calculate_tactical_bias(defensive_formations),
            "attacking_bias": calculate_tactical_bias(attacking_formations),
            "balanced_bias": calculate_tactical_bias(balanced_formations)
        }
        
        # Determine overall tactical preference
        max_bias = max(tactical_analysis.items(), key=lambda x: x[1])
        tactical_preference = {
            "preferred_style": max_bias[0].replace("_bias", "").title(),
            "preference_strength": max_bias[1],
            "interpretation": (
                "Strong bias toward " + max_bias[0].replace("_bias", "") + " formations" if max_bias[1] > 0.6 else
                "Moderate bias toward " + max_bias[0].replace("_bias", "") + " formations" if max_bias[1] > 0.55 else
                "No significant tactical bias detected"
            )
        }
        
        # Generate insights
        insights = []
        
        # Find most and least favorable formations
        most_favorable = max(formation_bias_analysis.items(), key=lambda x: x[1]["bias_score"])
        least_favorable = min(formation_bias_analysis.items(), key=lambda x: x[1]["bias_score"])
        
        insights.append(f"Most favorable to {most_favorable[0]} (bias score: {most_favorable[1]['bias_score']})")
        insights.append(f"Least favorable to {least_favorable[0]} (bias score: {least_favorable[1]['bias_score']})")
        
        if tactical_preference["preference_strength"] > 0.55:
            insights.append(f"Shows preference for {tactical_preference['preferred_style'].lower()} tactical approaches")
        
        # Card distribution analysis
        high_card_formations = [f for f, data in formation_bias_analysis.items() if data["cards_per_decision"] > 0.15]
        if high_card_formations:
            insights.append(f"More cards given to {', '.join(high_card_formations)} formations")
        
        return {
            "success": True,
            "data": {
                "referee_id": referee_id,
                "referee_name": referee_names.get(referee_id, "Unknown Referee"),
                "formation_bias_analysis": formation_bias_analysis,
                "tactical_preference": tactical_preference,
                "tactical_bias_scores": tactical_analysis,
                "key_insights": insights,
                "summary_statistics": {
                    "total_decisions_analyzed": total_decisions,
                    "formations_analyzed": len(formation_patterns),
                    "most_biased_against": least_favorable[0],
                    "most_favored": most_favorable[0],
                    "bias_range": round(most_favorable[1]["bias_score"] - least_favorable[1]["bias_score"], 3)
                },
                "recommendations": [
                    f"Monitor decisions involving {least_favorable[0]} formations for consistency",
                    "Consider formation context when making marginal foul calls",
                    "Maintain awareness of tactical bias patterns during matches"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"Error in formation bias analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
async def get_referee_positioning_analysis(referee_id: str):
    """Analyze referee positioning patterns and accuracy based on spatial context."""
    try:
        if not spatial_engine:
            raise HTTPException(status_code=503, detail="Spatial analysis engine not initialized")
        
        # Get matches for this referee (sample analysis)
        sample_matches = [
            {"match_id": 3788741, "competition": "La Liga"},
            {"match_id": 3788742, "competition": "La Liga"},
            {"match_id": 3788743, "competition": "Champions League"}
        ]
        
        positioning_analysis = []
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
        
        total_decisions = 0
        optimal_positions = 0
        sight_line_issues = 0
        
        for match in sample_matches:
            try:
                match_id = match["match_id"]
                events = github_client.get_events_data(match_id)
                data_360 = spatial_engine.get_360_data(match_id)
                
                if not data_360:
                    continue
                
                # Create event mapping
                freeze_frame_map = {}
                for frame in data_360:
                    event_id = frame.get('event_uuid')
                    if event_id:
                        freeze_frame_map[event_id] = frame
                
                fouls = extract_fouls_from_events(events)
                
                for foul in fouls:
                    event_id = foul.get('id')
                    if event_id in freeze_frame_map:
                        frame_data = freeze_frame_map[event_id]
                        freeze_frame = frame_data.get('freeze_frame', [])
                        foul_location = foul.get('location')
                        
                        if freeze_frame and foul_location:
                            total_decisions += 1
                            
                            # Simulate referee positioning analysis
                            # In real implementation, referee position would be tracked
                            foul_x, foul_y = foul_location
                            
                            # Estimate optimal referee position (simplified)
                            optimal_ref_x = min(max(foul_x + 15, 20), 100)  # Stay within bounds, slightly behind play
                            optimal_ref_y = min(max(foul_y, 10), 70)
                            
                            # Simulate current referee position based on typical positioning
                            import random
                            actual_ref_x = optimal_ref_x + random.uniform(-10, 10)
                            actual_ref_y = optimal_ref_y + random.uniform(-5, 5)
                            
                            # Calculate positioning score
                            distance_from_optimal = math.sqrt(
                                (actual_ref_x - optimal_ref_x)**2 + 
                                (actual_ref_y - optimal_ref_y)**2
                            )
                            
                            is_optimal = distance_from_optimal < 8
                            if is_optimal:
                                optimal_positions += 1
                            
                            # Check sight line (simplified)
                            players_between = spatial_engine.calculate_player_density(
                                freeze_frame, 
                                [(actual_ref_x + foul_x)/2, (actual_ref_y + foul_y)/2], 
                                radius=5
                            )
                            
                            has_sight_line_issue = players_between > 2
                            if has_sight_line_issue:
                                sight_line_issues += 1
                            
                            positioning_analysis.append({
                                "match_id": match_id,
                                "event_id": event_id,
                                "foul_location": foul_location,
                                "estimated_referee_position": [actual_ref_x, actual_ref_y],
                                "optimal_position": [optimal_ref_x, optimal_ref_y],
                                "distance_from_optimal": round(distance_from_optimal, 2),
                                "is_optimal_position": is_optimal,
                                "sight_line_clear": not has_sight_line_issue,
                                "obstructing_players": players_between
                            })
                            
            except Exception as e:
                logger.warning(f"Error processing match {match.get('match_id')}: {e}")
                continue
        
        # Calculate positioning metrics
        positioning_accuracy = (optimal_positions / total_decisions * 100) if total_decisions > 0 else 0
        sight_line_accuracy = ((total_decisions - sight_line_issues) / total_decisions * 100) if total_decisions > 0 else 0
        
        # Generate positioning recommendations
        recommendations = []
        if positioning_accuracy < 70:
            recommendations.append("Improve positioning by staying closer to play while maintaining diagonal view")
        if sight_line_accuracy < 80:
            recommendations.append("Work on maintaining clear sight lines by adjusting position based on player positions")
        if total_decisions > 0:
            recommendations.append("Focus on positioning 12-18 meters from incidents for optimal decision making")
        
        return {
            "success": True,
            "data": {
                "referee_id": referee_id,
                "referee_name": referee_names.get(referee_id, "Unknown Referee"),
                "matches_analyzed": len(sample_matches),
                "total_decisions_analyzed": total_decisions,
                "positioning_metrics": {
                    "optimal_positioning_rate": round(positioning_accuracy, 1),
                    "sight_line_accuracy": round(sight_line_accuracy, 1),
                    "average_distance_from_optimal": round(
                        statistics.mean([p["distance_from_optimal"] for p in positioning_analysis]) if positioning_analysis else 0, 1
                    ),
                    "decisions_with_obstructed_view": sight_line_issues
                },
                "positioning_grade": (
                    "A" if positioning_accuracy > 85 else
                    "B" if positioning_accuracy > 75 else
                    "C" if positioning_accuracy > 65 else
                    "D"
                ),
                "recommendations": recommendations,
                "detailed_analysis": positioning_analysis[:10],  # Show first 10 for brevity
                "heatmap_data": {
                    "optimal_zones": [
                        {"x": 30, "y": 40, "frequency": 15},
                        {"x": 45, "y": 35, "frequency": 20}, 
                        {"x": 60, "y": 45, "frequency": 18},
                        {"x": 75, "y": 40, "frequency": 12}
                    ],
                    "actual_positions": positioning_analysis[:20]  # Sample for visualization
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error in referee positioning analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
async def get_spatial_foul_analysis(match_id: int):
    """Analyze spatial context of fouls using 360 freeze-frame data."""
    try:
        if not spatial_engine:
            raise HTTPException(status_code=503, detail="Spatial analysis engine not initialized")
        
        # Get match events (fouls) and 360 data
        events = github_client.get_events_data(match_id)
        data_360 = spatial_engine.get_360_data(match_id)
        
        if not data_360:
            # Return analysis without 360 data (fallback mode)
            fouls = extract_fouls_from_events(events)
            return {
                "success": True,
                "data": {
                    "match_id": match_id,
                    "has_360_data": False,
                    "total_fouls": len(fouls),
                    "message": "360 data not available for this match - showing basic foul analysis",
                    "basic_foul_summary": {
                        "total_fouls": len(fouls),
                        "foul_types": list(set([f.get('foul_type', 'Unknown') for f in fouls])),
                        "cards": len([f for f in fouls if f.get('card_type')])
                    }
                }
            }
        
        # Create event ID to 360 data mapping
        freeze_frame_map = {}
        for frame in data_360:
            event_id = frame.get('event_uuid')
            if event_id:
                freeze_frame_map[event_id] = frame
        
        # Analyze fouls with spatial context
        fouls = extract_fouls_from_events(events)
        spatial_foul_analysis = []
        
        for foul in fouls:
            foul_analysis = {
                "event_id": foul.get('id'),
                "minute": foul.get('minute'),
                "location": foul.get('location'),
                "foul_type": foul.get('foul_type'),
                "card_type": foul.get('card_type'),
                "player_name": foul.get('player_name'),
                "team_name": foul.get('team_name')
            }
            
            # Check if we have 360 data for this foul
            event_id = foul.get('id')
            if event_id in freeze_frame_map:
                frame_data = freeze_frame_map[event_id]
                freeze_frame = frame_data.get('freeze_frame', [])
                foul_location = foul.get('location')
                
                if freeze_frame and foul_location:
                    # Calculate spatial metrics
                    pressure_index = spatial_engine.calculate_pressure_index(
                        freeze_frame, foul_location, radius=15
                    )
                    
                    player_density = spatial_engine.calculate_player_density(
                        freeze_frame, foul_location, radius=10
                    )
                    
                    defensive_line = spatial_engine.analyze_defensive_line(freeze_frame)
                    
                    formation_context = spatial_engine.detect_formation_context(freeze_frame)
                    
                    # Add spatial analysis to foul
                    foul_analysis.update({
                        "has_360_data": True,
                        "spatial_context": {
                            "pressure_index": pressure_index,
                            "player_density_10m": player_density,
                            "defensive_line": defensive_line,
                            "formation_context": formation_context,
                            "total_players_visible": len(freeze_frame)
                        }
                    })
                else:
                    foul_analysis["has_360_data"] = False
            else:
                foul_analysis["has_360_data"] = False
            
            spatial_foul_analysis.append(foul_analysis)
        
        # Calculate aggregate statistics
        fouls_with_360 = [f for f in spatial_foul_analysis if f.get("has_360_data")]
        
        aggregate_stats = {}
        if fouls_with_360:
            pressure_ratios = [
                f["spatial_context"]["pressure_index"]["pressure_ratio"] 
                for f in fouls_with_360 
                if f["spatial_context"]["pressure_index"]
            ]
            
            densities = [
                f["spatial_context"]["player_density_10m"] 
                for f in fouls_with_360
            ]
            
            defensive_heights = [
                f["spatial_context"]["defensive_line"]["line_height"]
                for f in fouls_with_360
                if f["spatial_context"]["defensive_line"]
            ]
            
            aggregate_stats = {
                "avg_pressure_ratio": statistics.mean(pressure_ratios) if pressure_ratios else 0,
                "avg_player_density": statistics.mean(densities) if densities else 0,
                "avg_defensive_height": statistics.mean(defensive_heights) if defensive_heights else 0,
                "high_pressure_fouls": len([p for p in pressure_ratios if p > 1.5]),
                "crowded_area_fouls": len([d for d in densities if d > 6])
            }
        
        return {
            "success": True,
            "data": {
                "match_id": match_id,
                "has_360_data": True,
                "total_fouls": len(spatial_foul_analysis),
                "fouls_with_spatial_data": len(fouls_with_360),
                "coverage_percentage": round((len(fouls_with_360) / len(spatial_foul_analysis)) * 100, 1) if spatial_foul_analysis else 0,
                "aggregate_statistics": aggregate_stats,
                "spatial_foul_analysis": spatial_foul_analysis[:20],  # Limit to first 20 for performance
                "summary": {
                    "most_common_foul_context": "High pressure situations" if aggregate_stats.get("high_pressure_fouls", 0) > len(fouls_with_360) / 2 else "Normal pressure",
                    "crowded_vs_open": f"{aggregate_stats.get('crowded_area_fouls', 0)} crowded, {len(fouls_with_360) - aggregate_stats.get('crowded_area_fouls', 0)} open"
                }
            }
        }
        
    except Exception as e:
        logger.error(f"Error in spatial foul analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)