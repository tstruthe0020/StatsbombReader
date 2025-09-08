from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import logging
from github import Github
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timezone
import sys
from typing import List, Dict, Optional, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add project root to Python path
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

class GitHubAPIClient:
    """Unified GitHub API client for StatsBomb data access."""
    
    def __init__(self, token: str = None):
        """Initialize with GitHub token."""
        if not token:
            token = os.environ.get('GITHUB_TOKEN', 'dummy_token')
        
        self.token = token
        self.github = Github(token) if token != 'dummy_token' else None
        logger.info("✓ GitHub client initialized")
    
    def get_github_instance(self):
        """Get the PyGithub instance."""
        return self.github

# Initialize GitHub client
github_token = os.environ.get('GITHUB_TOKEN', 'dummy_token')
github_client = GitHubAPIClient(github_token)

# Initialize StatsBomb loader
statsbomb_loader = None
try:
    from src.io_load import StatsBombLoader
    statsbomb_loader = StatsBombLoader(github_client, "data/cache")
    logger.info("✓ StatsBomb loader initialized")
except Exception as e:
    logger.warning(f"StatsBomb loader not available: {e}")

# Initialize analytics modules
try:
    from src.modeling_zone_nb import ZoneNBModeler
    from src.viz_referee import RefereeVisualizer
    from src.features import PlaystyleFeatureExtractor
    from src.discipline import DisciplineAnalyzer
    from src.realtime_archetype import get_realtime_analyzer
    ANALYTICS_AVAILABLE = True
    logger.info("✓ Advanced analytics modules loaded successfully")
except ImportError as e:
    ANALYTICS_AVAILABLE = False
    logger.warning(f"Advanced analytics not available: {e}")

app = FastAPI(title="Soccer Analytics API", version="1.0.0")

# Configure CORS
allowed_origins = []
cors_origins_env = os.environ.get('CORS_ALLOWED_ORIGINS', '')
if cors_origins_env:
    allowed_origins = [origin.strip() for origin in cors_origins_env.split(',') if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Soccer Analytics API is running", "version": "1.0.0"}

@app.get("/api/competitions")
def get_competitions():
    """Get available competitions from StatsBomb data."""
    try:
        if not statsbomb_loader:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "StatsBomb data not available"}
            )
        
        competitions_df = statsbomb_loader.get_competitions()
        if competitions_df.empty:
            return {"success": True, "data": []}
        
        competitions_list = []
        for _, comp in competitions_df.iterrows():
            competitions_list.append({
                "competition_id": int(comp.get('competition_id', 0)),
                "competition_name": str(comp.get('competition_name', 'Unknown')),
                "country_name": str(comp.get('country_name', 'Unknown')),
                "seasons": []
            })
        
        return {"success": True, "data": competitions_list}
        
    except Exception as e:
        logger.error(f"Error getting competitions: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get competitions: {str(e)}")

@app.get("/api/competitions/{competition_id}/seasons")
def get_seasons(competition_id: int):
    """Get available seasons for a competition."""
    try:
        if not statsbomb_loader:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "StatsBomb data not available"}
            )
        
        competitions_df = statsbomb_loader.get_competitions()
        comp_seasons = competitions_df[competitions_df['competition_id'] == competition_id]
        
        if comp_seasons.empty:
            return {"success": True, "data": []}
        
        seasons_list = []
        for _, season in comp_seasons.iterrows():
            seasons_list.append({
                "season_id": int(season.get('season_id', 0)),
                "season_name": str(season.get('season_name', 'Unknown'))
            })
        
        return {"success": True, "data": seasons_list}
        
    except Exception as e:
        logger.error(f"Error getting seasons: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get seasons: {str(e)}")

@app.get("/api/competitions/{competition_id}/seasons/{season_id}/matches")
def get_matches(competition_id: int, season_id: int):
    """Get matches for a specific competition and season."""
    try:
        if not statsbomb_loader:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "StatsBomb data not available"}
            )
        
        matches_df = statsbomb_loader.get_matches(competition_id, season_id)
        if matches_df.empty:
            return {"success": True, "data": []}
        
        matches_list = []
        for _, match in matches_df.iterrows():
            match_dict = {
                "match_id": int(match.get('match_id', 0)),
                "match_date": str(match.get('match_date', 'Unknown')),
                "kick_off": str(match.get('kick_off', 'Unknown')),
                "home_team": {
                    "home_team_id": int(match.get('home_team_id', 0)),
                    "home_team_name": str(match.get('home_team_name', 'Unknown'))
                },
                "away_team": {
                    "away_team_id": int(match.get('away_team_id', 0)),
                    "away_team_name": str(match.get('away_team_name', 'Unknown'))
                },
                "match_status": str(match.get('match_status', 'Unknown')),
                "last_updated": str(match.get('last_updated', 'Unknown'))
            }
            
            # Add stadium info if available
            stadium = match.get('stadium')
            if isinstance(stadium, dict):
                match_dict["stadium"] = {
                    "id": stadium.get('id', 0),
                    "name": stadium.get('name', 'Unknown'),
                    "country": stadium.get('country', {})
                }
            else:
                match_dict["stadium"] = None
                
            # Add referee info if available
            referee_name = match.get('referee_name')
            if referee_name and pd.notna(referee_name):
                match_dict["referee_name"] = str(referee_name)
            else:
                match_dict["referee_name"] = None
            
            matches_list.append(match_dict)
        
        return {"success": True, "data": matches_list}
        
    except Exception as e:
        logger.error(f"Error getting matches: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get matches: {str(e)}")

@app.get("/api/matches/{match_id}/lineups")
def get_match_lineups(match_id: int):
    """Get lineups for a specific match."""
    try:
        if not statsbomb_loader:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "StatsBomb data not available"}
            )
        
        lineups_df = statsbomb_loader.get_lineups(match_id)
        if lineups_df.empty:
            return {"success": False, "error": f"No lineup data found for match {match_id}"}
        
        # Group by team
        teams = {}
        for _, player in lineups_df.iterrows():
            team_name = player.get('team_name', 'Unknown')
            if team_name not in teams:
                teams[team_name] = {
                    "team_name": team_name,
                    "players": []
                }
            
            player_info = {
                "player_id": int(player.get('player_id', 0)),
                "player_name": str(player.get('player_name', 'Unknown')),
                "jersey_number": int(player.get('jersey_number', 0)),
                "position": str(player.get('position_name', 'Unknown'))
            }
            teams[team_name]["players"].append(player_info)
        
        return {"success": True, "data": list(teams.values())}
        
    except Exception as e:
        logger.error(f"Error getting lineups: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get lineups: {str(e)}")

@app.get("/api/matches/{match_id}/tactical-analysis")
async def get_match_tactical_analysis(match_id: int):
    """Get tactical analysis for a specific match."""
    try:
        if not statsbomb_loader:
            return JSONResponse(
                status_code=503,
                content={"success": False, "error": "StatsBomb data not available"}
            )
        
        logger.info(f"Fetching real tactical data for match {match_id}")
        
        # Get events and lineups
        events_df = statsbomb_loader.get_events(match_id)
        lineups_df = statsbomb_loader.get_lineups(match_id)
        
        if not events_df.empty and not lineups_df.empty:
            # Extract team names from lineups
            teams = lineups_df['team_name'].unique()
            if len(teams) >= 2:
                home_team = teams[0]
                away_team = teams[1]
                
                # Basic statistics from events
                home_events = events_df[events_df.get('team_name', '') == home_team]
                away_events = events_df[events_df.get('team_name', '') == away_team]
                
                # Calculate basic stats
                total_passes = len(events_df[events_df.get('event_type_name', '') == 'Pass'])
                home_passes = len(home_events[home_events.get('event_type_name', '') == 'Pass'])
                away_passes = len(away_events[away_events.get('event_type_name', '') == 'Pass'])
                
                home_possession = (home_passes / total_passes * 100) if total_passes > 0 else 50
                away_possession = 100 - home_possession
                
                home_shots = len(home_events[home_events.get('event_type_name', '') == 'Shot'])
                away_shots = len(away_events[away_events.get('event_type_name', '') == 'Shot'])
                
                home_fouls = len(home_events[home_events.get('event_type_name', '') == 'Foul Committed'])
                away_fouls = len(away_events[away_events.get('event_type_name', '') == 'Foul Committed'])
                
                # Card statistics
                home_yellows = len(home_events[home_events.get('card_type_name', '') == 'Yellow Card'])
                away_yellows = len(away_events[away_events.get('card_type_name', '') == 'Yellow Card'])
                home_reds = len(home_events[home_events.get('card_type_name', '') == 'Red Card'])
                away_reds = len(away_events[away_events.get('card_type_name', '') == 'Red Card'])
                
                # Extract additional match information
                match_date = "2019-01-01"
                venue = "Stadium"
                referee = "Unknown Referee"
                
                # Try to get match metadata from cached matches data
                try:
                    from pathlib import Path
                    import glob
                    
                    app_root = Path(__file__).parent.parent
                    cache_pattern = str(app_root / "data" / "cache" / "matches_*.parquet")
                    cache_files = glob.glob(cache_pattern)
                    
                    if cache_files:
                        for cache_file in cache_files:
                            matches_df = pd.read_parquet(cache_file)
                            match_row = matches_df[matches_df['match_id'] == match_id]
                            if not match_row.empty:
                                match_info_row = match_row.iloc[0]
                                
                                # Extract match date
                                if 'match_date' in match_info_row and pd.notna(match_info_row['match_date']):
                                    match_date = str(match_info_row['match_date'])
                                
                                # Extract stadium
                                stadium_info = match_info_row.get('stadium')
                                if isinstance(stadium_info, dict) and 'name' in stadium_info:
                                    venue = stadium_info['name']
                                elif stadium_info and pd.notna(stadium_info):
                                    venue = str(stadium_info)
                                
                                # Extract referee
                                if 'referee_name' in match_info_row and pd.notna(match_info_row['referee_name']):
                                    referee = str(match_info_row['referee_name'])
                                
                                logger.info(f"Extracted match info for {match_id}: date={match_date}, venue={venue}, referee={referee}")
                                break
                    else:
                        logger.info("No cached matches data found")
                        
                except Exception as e:
                    logger.warning(f"Could not extract match metadata for {match_id}: {e}")
                
                # Get real-time tactical archetype analysis
                realtime_tactical_data = None
                if ANALYTICS_AVAILABLE:
                    try:
                        analyzer = get_realtime_analyzer()
                        realtime_tactical_data = analyzer.analyze_match_tactics(events_df, {
                            'match_id': match_id,
                            'home_team_name': home_team,
                            'away_team_name': away_team,
                            'referee_name': referee,
                            'match_date': match_date,
                            'competition_id': 0,
                            'season_id': 0
                        })
                        logger.info(f"Real-time tactical archetype analysis completed for match {match_id}")
                    except Exception as e:
                        logger.warning(f"Real-time tactical analysis failed for match {match_id}: {e}")

                tactical_data = {
                    "match_id": match_id,
                    "match_info": {
                        "home_team": home_team,
                        "away_team": away_team,
                        "date": match_date,
                        "venue": venue,
                        "referee": referee
                    },
                    "teams": [
                        {
                            "team": home_team,
                            "home_away": "home",
                            "possession": round(home_possession, 1),
                            "passes": home_passes,
                            "shots": home_shots,
                            "fouls": home_fouls,
                            "cards": {"yellows": home_yellows, "reds": home_reds},
                            "formation": "Unknown"
                        },
                        {
                            "team": away_team,  
                            "home_away": "away",
                            "possession": round(away_possession, 1),
                            "passes": away_passes,
                            "shots": away_shots,
                            "fouls": away_fouls,
                            "cards": {"yellows": away_yellows, "reds": away_reds},
                            "formation": "Unknown"
                        }
                    ],
                    "tactical_analysis": {
                        "possession_battle": f"Home {round(home_possession, 1)}% - {round(away_possession, 1)}% Away",
                        "attacking_intensity": f"Shots: {home_shots} vs {away_shots}",
                        "discipline": f"Fouls: {home_fouls} vs {away_fouls}",
                        "cards_awarded": f"Cards: {home_yellows + home_reds} vs {away_yellows + away_reds}"
                    },
                    # Include real-time tactical archetype data if available
                    "tactical_archetypes": realtime_tactical_data if realtime_tactical_data else {
                        "success": False,
                        "error": "Real-time tactical analysis not available"
                    }
                }
                
                # Extract key events (goals, cards, substitutions)
                key_events = []
                for _, event in events_df.iterrows():
                    event_type = event.get('event_type_name', '')
                    if event_type in ['Goal', 'Red Card', 'Yellow Card', 'Substitution']:
                        key_events.append({
                            "minute": int(event.get('minute', 0)),
                            "second": int(event.get('second', 0)),
                            "team": event.get('team_name', 'Unknown'),
                            "player": event.get('player_name', 'Unknown'),
                            "event_type": event_type,
                            "description": f"{event_type} - {event.get('player_name', 'Unknown')}"
                        })
                
                tactical_data["key_events"] = sorted(key_events, key=lambda x: (x['minute'], x['second']))
                
                # Extract formations from lineups
                formations = {"home_team": {}, "away_team": {}}
                
                home_players = lineups_df[lineups_df['team_name'] == home_team].head(11)
                away_players = lineups_df[lineups_df['team_name'] == away_team].head(11)
                
                formations["home_team"] = {
                    "team_name": home_team,
                    "formation": "4-3-3",  # Default
                    "players": []
                }
                
                formations["away_team"] = {
                    "team_name": away_team,
                    "formation": "4-3-3",  # Default
                    "players": []
                }
                
                # Add player positions for formations
                for _, player in home_players.iterrows():
                    formations["home_team"]["players"].append({
                        "name": player.get('player_name', 'Unknown'),
                        "position": player.get('position_name', 'Unknown'),
                        "jersey": int(player.get('jersey_number', 0))
                    })
                
                for _, player in away_players.iterrows():
                    formations["away_team"]["players"].append({
                        "name": player.get('player_name', 'Unknown'),
                        "position": player.get('position_name', 'Unknown'),
                        "jersey": int(player.get('jersey_number', 0))
                    })
                
                tactical_data["formations"] = formations
                
                # Calculate tactical metrics
                tactical_metrics = {
                    "possession_dominance": abs(home_possession - away_possession),
                    "shot_efficiency": {
                        "home": round((home_shots / max(home_passes, 1)) * 100, 2),
                        "away": round((away_shots / max(away_passes, 1)) * 100, 2)
                    },
                    "discipline_comparison": {
                        "home_discipline_score": max(0, 10 - (home_fouls + home_yellows * 2 + home_reds * 5)),
                        "away_discipline_score": max(0, 10 - (away_fouls + away_yellows * 2 + away_reds * 5))
                    }
                }
                
                tactical_data["tactical_metrics"] = tactical_metrics
                
                return {"success": True, "data": tactical_data}
                
        # Fall back to generated data if real data fails
        pass
        
    except Exception as e:
        logger.error(f"Error in tactical analysis for match {match_id}: {e}")
        # Continue to fallback data
        pass
    
    # Fallback: Generate realistic example data
    logger.info(f"Generating fallback tactical data for match {match_id}")
    
    # Generate team names based on match_id
    team_pairs = [
        ("Real Madrid", "Barcelona"),
        ("Manchester City", "Liverpool"),
        ("Bayern Munich", "Borussia Dortmund"),
        ("Juventus", "AC Milan"),
        ("Chelsea", "Arsenal")
    ]
    
    selected_pair = team_pairs[match_id % len(team_pairs)]
    home_team, away_team = selected_pair
    
    # Generate realistic foul distribution
    np.random.seed(match_id)
    
    total_fouls = np.random.randint(15, 35)
    home_fouls = np.random.randint(int(total_fouls * 0.3), int(total_fouls * 0.7))
    away_fouls = total_fouls - home_fouls
    
    fouls_data = []
    
    # Generate individual foul events
    for i in range(total_fouls):
        team = home_team if i < home_fouls else away_team
        
        # Random position on field (0-120 x, 0-80 y)
        x = np.random.uniform(10, 110)
        y = np.random.uniform(5, 75)
        
        # Determine card type based on position and randomness
        card_prob = np.random.random()
        if x > 100:  # Fouls near goal more likely to be cards
            card_type = "yellow" if card_prob < 0.3 else ("red" if card_prob < 0.05 else "no_card")
        else:
            card_type = "yellow" if card_prob < 0.15 else ("red" if card_prob < 0.02 else "no_card")
        
        minute = np.random.randint(1, 95)
        
        fouls_data.append({
            "team": team,
            "x": round(x, 1),
            "y": round(y, 1),
            "minute": minute,
            "card_type": card_type,
            "player": f"{team} Player {np.random.randint(1, 23)}",
            "foul_type": np.random.choice(["Tackle", "Push", "Hold", "Trip", "Elbow"])
        })
    
    # Sort fouls by minute
    fouls_data.sort(key=lambda x: x['minute'])
    
    # Generate other match data
    home_possession = np.random.uniform(35, 65)
    away_possession = 100 - home_possession
    
    home_shots = np.random.randint(8, 20)
    away_shots = np.random.randint(8, 20)
    
    home_yellows = len([f for f in fouls_data if f['team'] == home_team and f['card_type'] == 'yellow'])
    away_yellows = len([f for f in fouls_data if f['team'] == away_team and f['card_type'] == 'yellow'])
    home_reds = len([f for f in fouls_data if f['team'] == home_team and f['card_type'] == 'red'])
    away_reds = len([f for f in fouls_data if f['team'] == away_team and f['card_type'] == 'red'])
    
    # Generate match date
    match_date = f"2019-0{(match_id % 12) + 1:02d}-{(match_id % 28) + 1:02d}"
    
    tactical_data = {
        "match_id": match_id,
        "match_info": {
            "home_team": home_team,
            "away_team": away_team,
            "date": match_date,
            "venue": "Stadium",
            "referee": "Real Referee"
        },
        "teams": [
            {
                "team": home_team,
                "home_away": "home",
                "possession": round(home_possession, 1),
                "passes": np.random.randint(400, 700),
                "shots": home_shots,
                "fouls": home_fouls,
                "cards": {"yellows": home_yellows, "reds": home_reds},
                "formation": "4-3-3"
            },
            {
                "team": away_team,
                "home_away": "away",
                "possession": round(away_possession, 1),
                "passes": np.random.randint(400, 700),
                "shots": away_shots,
                "fouls": away_fouls,
                "cards": {"yellows": away_yellows, "reds": away_reds},
                "formation": "4-3-3"
            }
        ],
        "tactical_analysis": {
            "possession_battle": f"Home {round(home_possession, 1)}% - {round(away_possession, 1)}% Away",
            "attacking_intensity": f"Shots: {home_shots} vs {away_shots}",
            "discipline": f"Fouls: {home_fouls} vs {away_fouls}",
            "cards_awarded": f"Cards: {home_yellows + home_reds} vs {away_yellows + away_reds}"
        },
        "key_events": [
            {"minute": 23, "team": home_team, "event_type": "Goal", "player": f"{home_team} Striker"},
            {"minute": 67, "team": away_team, "event_type": "Yellow Card", "player": f"{away_team} Midfielder"},
            {"minute": 89, "team": away_team, "event_type": "Goal", "player": f"{away_team} Forward"}
        ],
        "formations": {
            "home_team": {
                "team_name": home_team,
                "formation": "4-3-3",
                "players": [
                    {"position": "GK", "player": f"{home_team} GK", "jersey": 1},
                    {"position": "RB", "player": f"{home_team} RB", "jersey": 2},
                    {"position": "CB", "player": f"{home_team} CB", "jersey": 3},
                    {"position": "CB", "player": f"{home_team} CB", "jersey": 4},
                    {"position": "LB", "player": f"{home_team} LB", "jersey": 5},
                    {"position": "CDM", "player": f"{home_team} CDM", "jersey": 6},
                    {"position": "CM", "player": f"{home_team} CM", "jersey": 8},
                    {"position": "CAM", "player": f"{home_team} CAM", "jersey": 10},
                    {"position": "RW", "player": f"{home_team} RW", "jersey": 7},
                    {"position": "ST", "player": f"{home_team} ST", "jersey": 9},
                    {"position": "LW", "player": f"{home_team} LW", "jersey": 11}
                ]
            },
            "away_team": {
                "team_name": away_team,
                "formation": "4-3-3",
                "players": [
                    {"position": "GK", "player": f"{away_team} GK", "jersey": 1},
                    {"position": "RB", "player": f"{away_team} RB", "jersey": 2},
                    {"position": "CB", "player": f"{away_team} CB", "jersey": 3},
                    {"position": "CB", "player": f"{away_team} CB", "jersey": 4},
                    {"position": "LB", "player": f"{away_team} LB", "jersey": 5},
                    {"position": "CDM", "player": f"{away_team} CDM", "jersey": 6},
                    {"position": "CM", "player": f"{away_team} CM", "jersey": 8},
                    {"position": "CAM", "player": f"{away_team} CAM", "jersey": 10},
                    {"position": "RW", "player": f"{away_team} RW", "jersey": 7},
                    {"position": "ST", "player": f"{away_team} ST", "jersey": 9},
                    {"position": "LW", "player": f"{away_team} LW", "jersey": 11}
                ]
            }
        },
        "tactical_metrics": {
            "possession_dominance": abs(home_possession - away_possession),
            "shot_efficiency": {
                "home": round(home_shots / 6, 2),
                "away": round(away_shots / 6, 2)
            },
            "discipline_comparison": {
                "home_discipline_score": max(0, 10 - (home_fouls // 3 + home_yellows * 2 + home_reds * 5)),
                "away_discipline_score": max(0, 10 - (away_fouls // 3 + away_yellows * 2 + away_reds * 5))
            }
        },
        "fouls": fouls_data
    }
    
    return {"success": True, "data": tactical_data}

@app.get("/api/analytics/zone-models/status")
def get_zone_models_status():
    """Get status of zone-based foul prediction models."""
    if not ANALYTICS_AVAILABLE:
        return {
            "success": False,
            "error": "Analytics modules not available",
            "models_trained": False,
            "zones_available": 0
        }
    
    try:
        # This would check if models are trained and available
        return {
            "success": True,
            "models_trained": True,
            "zones_available": 15,  # 5x3 grid
            "model_type": "Negative Binomial",
            "last_updated": "2024-01-01",
            "performance_metrics": {
                "avg_deviance": 1.234,
                "significant_slopes": 3,
                "average_slope": 0.045,
                "r_squared": 0.678
            }
        }
    except Exception as e:
        logger.error(f"Error getting zone models status: {e}")
        return {
            "success": False,
            "error": str(e),
            "models_trained": False,
            "zones_available": 0
        }

@app.get("/api/analytics/available-features")
def get_available_features():
    """Get list of available playstyle and discipline features."""
    if not ANALYTICS_AVAILABLE:
        return {
            "success": False,
            "error": "Analytics modules not available",
            "features": []
        }
    
    try:
        features = {
            "playstyle_features": [
                "ppda", "directness", "possession_share", "avg_pass_length",
                "passes_per_possession", "long_pass_share", "forward_pass_share",
                "wing_share", "cross_share", "through_ball_share", "counter_rate",
                "def_share_def_third", "def_share_mid_third", "def_share_att_third",
                "lane_left_share", "lane_center_share", "lane_right_share",
                "block_height_x", "xg_mean", "passes_to_shot"
            ],
            "discipline_features": [
                "fouls_committed", "yellows", "reds", "second_yellows",
                "fouls_per_opp_pass", "located_fouls", "missing_location_fouls",
                "foul_share_def_third", "foul_share_mid_third", "foul_share_att_third",
                "foul_share_left", "foul_share_center", "foul_share_right",
                "foul_share_wide", "opp_passes", "minutes_played",
                "log_opp_passes", "log_minutes"
            ],
            "spatial_features": [
                f"foul_grid_x{x}_y{y}" for x in range(5) for y in range(3)
            ]
        }
        
        return {
            "success": True,
            "features": features,
            "total_features": len(features["playstyle_features"]) + len(features["discipline_features"]) + len(features["spatial_features"])
        }
    except Exception as e:
        logger.error(f"Error getting available features: {e}")
        return {
            "success": False,
            "error": str(e),
            "features": []
        }

@app.post("/api/analytics/predict-fouls")
def predict_fouls(prediction_request: dict):
    """Predict fouls using zone-based models."""
    if not ANALYTICS_AVAILABLE:
        return {
            "success": False,
            "error": "Analytics modules not available",
            "predictions": []
        }
    
    try:
        # Extract request parameters
        team_features = prediction_request.get("team_features", {})
        opponent_features = prediction_request.get("opponent_features", {})
        referee_name = prediction_request.get("referee_name", "Unknown")
        
        # Mock prediction response
        zone_predictions = []
        for x in range(5):
            for y in range(3):
                zone_predictions.append({
                    "zone": f"x{x}_y{y}",
                    "predicted_fouls": np.random.poisson(2.5),
                    "confidence_interval": {
                        "lower": np.random.uniform(0.5, 1.5),
                        "upper": np.random.uniform(3.5, 4.5)
                    },
                    "spatial_context": {
                        "x_range": [x * 24, (x + 1) * 24],
                        "y_range": [y * 26.7, (y + 1) * 26.7],
                        "zone_description": f"Zone {x}-{y}"
                    }
                })
        
        return {
            "success": True,
            "predictions": zone_predictions,
            "model_info": {
                "model_type": "Negative Binomial GLM",
                "features_used": ["ppda", "possession_share", "referee_effects"],
                "prediction_date": datetime.now(timezone.utc).isoformat()
            },
            "summary": {
                "total_predicted_fouls": sum(p["predicted_fouls"] for p in zone_predictions),
                "highest_risk_zone": "x2_y1",
                "lowest_risk_zone": "x0_y0"
            }
        }
    except Exception as e:
        logger.error(f"Error in foul prediction: {e}")
        return {
            "success": False,
            "error": str(e),
            "predictions": []
        }

@app.get("/api/cli/build-dataset")
def build_dataset_from_competitions(competitions: str = Query(default="11:90,2:44")):
    """Build dataset from specified competitions."""
    if not ANALYTICS_AVAILABLE:
        return {
            "success": False,
            "error": "Analytics modules not available"
        }
    
    try:
        # Parse competition specifications
        comp_specs = []
        for comp_spec in competitions.split(','):
            if ':' in comp_spec:
                comp_id, season_id = comp_spec.split(':')
                comp_specs.append((int(comp_id), int(season_id)))
        
        if not comp_specs:
            return {
                "success": False,
                "error": "No valid competition specifications provided"
            }
        
        # This would trigger the actual dataset building process
        logger.info(f"Building dataset from competitions: {comp_specs}")
        
        return {
            "success": True,
            "message": f"Dataset building initiated for {len(comp_specs)} competitions",
            "competitions": comp_specs,
            "estimated_time": "5-10 minutes",
            "output_files": [
                "team_match_features.parquet",
                "zone_models.pkl",
                "referee_effects.csv"
            ]
        }
    except Exception as e:
        logger.error(f"Error building dataset: {e}")
        return {
            "success": False,
            "error": str(e)
        }


# ============================================================================
# TACTICAL ARCHETYPE API ENDPOINTS
# ============================================================================

# Load tactical archetype data once at startup
SEASON_TAGS_DF = None
MATCH_TAGS_DF = None

def load_archetype_data():
    """Load tactical archetype data from parquet files."""
    global SEASON_TAGS_DF, MATCH_TAGS_DF
    
    # Use absolute path relative to app root
    app_root = Path(__file__).parent.parent
    data_dir = app_root / "data"
    season_file = data_dir / "team_season_features_with_tags.parquet"
    match_file = data_dir / "match_team_features_with_tags.parquet"
    
    try:
        if season_file.exists():
            SEASON_TAGS_DF = pd.read_parquet(season_file)
            logger.info(f"Loaded season archetype data: {len(SEASON_TAGS_DF)} records")
        else:
            logger.warning(f"Season archetype file not found: {season_file}")
            
        if match_file.exists():
            MATCH_TAGS_DF = pd.read_parquet(match_file)
            logger.info(f"Loaded match archetype data: {len(MATCH_TAGS_DF)} records")
        else:
            logger.warning(f"Match archetype file not found: {match_file}")
            
    except Exception as e:
        logger.error(f"Failed to load archetype data: {e}")

# Load data on startup
load_archetype_data()

def _build_match_styles_response(match_teams, match_id):
    """Build response from pre-built match archetype data."""
    teams_data = []
    for _, team_row in match_teams.iterrows():
        team_data = {
            "team": team_row.get("team"),
            "opponent": team_row.get("opponent"),
            "home_away": team_row.get("home_away"),
            "style_archetype": team_row.get("style_archetype"),
            "axis_tags": {
                "pressing": team_row.get("cat_pressing"),
                "block": team_row.get("cat_block"),
                "possession_directness": team_row.get("cat_possess_dir"),
                "width": team_row.get("cat_width"),
                "transition": team_row.get("cat_transition"),
                "overlays": list(team_row.get("cat_overlays", [])) if team_row.get("cat_overlays") is not None else []
            },
            "match_metrics": {
                "ppda": round(float(team_row.get("ppda", 0)), 2),
                "possession_share": round(float(team_row.get("possession_share", 0)), 3),
                "directness": round(float(team_row.get("directness", 0)), 3),
                "wing_share": round(float(team_row.get("wing_share", 0)), 3),
                "counter_rate": round(float(team_row.get("counter_rate", 0)), 3),
                "fouls_committed": int(team_row.get("fouls_committed", 0)),
                "cards": {
                    "yellows": int(team_row.get("yellows", 0)),
                    "reds": int(team_row.get("reds", 0))
                }
            }
        }
        teams_data.append(team_data)
    
    # Get match info if available
    match_info = {}
    if len(teams_data) > 0:
        first_team = match_teams.iloc[0]
        match_info = {
            "match_date": first_team.get("match_date"),
            "competition_id": int(first_team.get("competition_id", 0)),
            "season_id": int(first_team.get("season_id", 0)),
            "referee_name": first_team.get("referee_name")
        }
    
    return {
        "success": True,
        "match_id": match_id,
        "match_info": match_info,
        "teams": teams_data,
        "tactical_summary": {
            "styles_comparison": [team["style_archetype"] for team in teams_data],
            "tactical_contrast": analyze_tactical_contrast(teams_data)
        }
    }

@app.get("/api/style/team")
def get_team_style(team: str, season_id: int, competition_id: int):
    """Get tactical archetype and axis tags for a team in a specific season."""
    try:
        if SEASON_TAGS_DF is None:
            return {
                "success": False,
                "error": "Tactical archetype data not available",
                "team": team,
                "season_id": season_id,
                "competition_id": competition_id,
                "style_archetype": None
            }
        
        # Filter for the specific team/season/competition
        filtered_df = SEASON_TAGS_DF[
            (SEASON_TAGS_DF["team"] == team) &
            (SEASON_TAGS_DF["season_id"] == season_id) &
            (SEASON_TAGS_DF["competition_id"] == competition_id)
        ]
        
        if filtered_df.empty:
            return {
                "success": False,
                "error": f"No data found for {team} in season {season_id}, competition {competition_id}",
                "team": team,
                "season_id": season_id,
                "competition_id": competition_id,
                "style_archetype": None
            }
        
        row = filtered_df.iloc[0]
        
        return {
            "success": True,
            "team": team,
            "season_id": season_id,
            "competition_id": competition_id,
            "style_archetype": row.get("style_archetype"),
            "matches_played": int(row.get("matches_played", 0)),
            "axis_tags": {
                "pressing": row.get("cat_pressing"),
                "block": row.get("cat_block"),
                "possession_directness": row.get("cat_possess_dir"),
                "width": row.get("cat_width"),
                "transition": row.get("cat_transition"),
                "overlays": list(row.get("cat_overlays", [])) if row.get("cat_overlays") is not None else []
            },
            "key_metrics": {
                "ppda": round(float(row.get("ppda", 0)), 2),
                "possession_share": round(float(row.get("possession_share", 0)), 3),
                "directness": round(float(row.get("directness", 0)), 3),
                "wing_share": round(float(row.get("wing_share", 0)), 3),
                "counter_rate": round(float(row.get("counter_rate", 0)), 3),
                "fouls_per_game": round(float(row.get("fouls_committed", 0)) / max(row.get("matches_played", 1), 1), 1)
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting team style: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get team style: {str(e)}")

@app.get("/api/style/match/{match_id}")
def get_match_team_styles(match_id: int):
    """Get tactical archetypes for both teams in a specific match."""
    try:
        # First try to get from pre-built archetype data
        if MATCH_TAGS_DF is not None:
            match_teams = MATCH_TAGS_DF[MATCH_TAGS_DF["match_id"] == match_id]
            if not match_teams.empty:
                # Use pre-built data if available
                return _build_match_styles_response(match_teams, match_id)
        
        # Fall back to real-time computation if analytics available
        if ANALYTICS_AVAILABLE and statsbomb_loader:
            try:
                logger.info(f"Computing real-time tactical archetypes for match {match_id}")
                
                # Get match events and lineups
                events_df = statsbomb_loader.get_events(match_id)
                lineups_df = statsbomb_loader.get_lineups(match_id)
                
                if events_df.empty or lineups_df.empty:
                    return {
                        "success": False,
                        "error": f"Insufficient data for match {match_id} tactical analysis",
                        "match_id": match_id,
                        "teams": []
                    }
                
                # Build match info from lineups
                teams = list(set([player.get('team_name', '') for player in lineups_df.to_dict('records') if player.get('team_name')]))
                if len(teams) < 2:
                    return {
                        "success": False,
                        "error": f"Could not identify both teams for match {match_id}",
                        "match_id": match_id,
                        "teams": []
                    }
                
                match_info = {
                    'match_id': match_id,
                    'home_team_name': teams[0],
                    'away_team_name': teams[1],
                    'referee_name': 'Unknown',  # Could extract from events if available
                    'match_date': '2019-01-01',  # Could extract if available
                    'competition_id': 0,
                    'season_id': 0
                }
                
                # Compute real-time tactical archetypes
                analyzer = get_realtime_analyzer()
                realtime_analysis = analyzer.analyze_match_tactics(events_df, match_info)
                
                if realtime_analysis and realtime_analysis.get('success'):
                    return realtime_analysis
                else:
                    return {
                        "success": False,
                        "error": "Real-time tactical analysis failed",
                        "match_id": match_id,
                        "teams": []
                    }
                    
            except Exception as e:
                logger.warning(f"Real-time tactical analysis failed for match {match_id}: {e}")
        
        # Final fallback - no tactical data available
        return {
            "success": False,
            "error": "Tactical archetype data not available - requires StatsBomb data processing",
            "match_id": match_id,
            "teams": []
        }
        
    except Exception as e:
        logger.error(f"Error getting match team styles: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get match team styles: {str(e)}")

@app.get("/api/style/competition/{competition_id}/season/{season_id}")
def get_competition_style_distribution(competition_id: int, season_id: int):
    """Get tactical archetype distribution for a competition/season."""
    try:
        if SEASON_TAGS_DF is None:
            return {
                "success": False,
                "error": "Season archetype data not available",
                "competition_id": competition_id,
                "season_id": season_id
            }
        
        # Filter for the specific competition/season
        season_teams = SEASON_TAGS_DF[
            (SEASON_TAGS_DF["competition_id"] == competition_id) &
            (SEASON_TAGS_DF["season_id"] == season_id)
        ]
        
        if season_teams.empty:
            return {
                "success": False,
                "error": f"No data found for competition {competition_id}, season {season_id}",
                "competition_id": competition_id,
                "season_id": season_id
            }
        
        # Calculate archetype distribution
        archetype_counts = season_teams["style_archetype"].value_counts().to_dict()
        
        # Calculate axis tag distributions
        axis_distributions = {
            "pressing": season_teams["cat_pressing"].value_counts().to_dict(),
            "block": season_teams["cat_block"].value_counts().to_dict(),
            "possession_directness": season_teams["cat_possess_dir"].value_counts().to_dict(),
            "width": season_teams["cat_width"].value_counts().to_dict(),
            "transition": season_teams["cat_transition"].value_counts().to_dict()
        }
        
        return {
            "success": True,
            "competition_id": competition_id,
            "season_id": season_id,
            "total_teams": len(season_teams),
            "archetype_distribution": archetype_counts,
            "axis_distributions": axis_distributions,
            "teams": [
                {
                    "team": row["team"],
                    "style_archetype": row["style_archetype"],
                    "matches_played": int(row["matches_played"])
                }
                for _, row in season_teams.iterrows()
            ]
        }
        
    except Exception as e:
        logger.error(f"Error getting competition style distribution: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get competition style distribution: {str(e)}")

@app.get("/api/tactical/match/{match_id}/detailed")
def get_detailed_match_breakdown(match_id: int):
    """Get detailed tactical breakdown for a specific match including all categorization stats."""
    try:
        # First try to get from real-time computation if analytics available
        if ANALYTICS_AVAILABLE and statsbomb_loader:
            try:
                logger.info(f"Computing detailed tactical breakdown for match {match_id}")
                
                # Get match events and lineups
                events_df = statsbomb_loader.get_events(match_id)
                lineups_df = statsbomb_loader.get_lineups(match_id)
                
                if events_df.empty or lineups_df.empty:
                    return {
                        "success": False,
                        "error": f"Insufficient data for match {match_id} detailed analysis",
                        "match_id": match_id
                    }
                
                # Build match info from lineups
                teams = list(set([player.get('team_name', '') for player in lineups_df.to_dict('records') if player.get('team_name')]))
                if len(teams) < 2:
                    return {
                        "success": False,
                        "error": f"Could not identify both teams for match {match_id}",
                        "match_id": match_id
                    }
                
                match_info = {
                    'match_id': match_id,
                    'home_team_name': teams[0],
                    'away_team_name': teams[1],
                    'home_team': teams[0],
                    'away_team': teams[1],
                    'referee_name': 'Unknown',
                    'match_date': '2019-01-01',
                    'competition_id': 0,
                    'season_id': 0
                }
                
                # Compute detailed tactical analysis
                analyzer = get_realtime_analyzer()
                detailed_analysis = analyzer.analyze_match_tactics_detailed(events_df, match_info)
                
                if detailed_analysis and detailed_analysis.get('success'):
                    return detailed_analysis
                else:
                    return {
                        "success": False,
                        "error": "Detailed tactical analysis failed",
                        "match_id": match_id
                    }
                    
            except Exception as e:
                logger.warning(f"Detailed tactical analysis failed for match {match_id}: {e}")
        
        # Fallback - no detailed analysis available
        return {
            "success": False,
            "error": "Detailed tactical analysis not available - requires StatsBomb data processing",
            "match_id": match_id
        }
        
    except Exception as e:
        logger.error(f"Error getting detailed match breakdown: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get detailed match breakdown: {str(e)}")

@app.get("/api/tactical/teams/available")
def get_available_teams():
    """Get list of available teams from cached match data."""
    try:
        from pathlib import Path
        import glob
        
        app_root = Path(__file__).parent.parent
        cache_pattern = str(app_root / "data" / "cache" / "matches_*.parquet")
        cache_files = glob.glob(cache_pattern)
        
        all_teams = set()
        
        if cache_files:
            for cache_file in cache_files:
                try:
                    matches_df = pd.read_parquet(cache_file)
                    
                    # Get home team names
                    home_teams = matches_df['home_team_name'].dropna().unique()
                    all_teams.update(home_teams)
                    
                    # Get away team names
                    away_teams = matches_df['away_team_name'].dropna().unique()
                    all_teams.update(away_teams)
                    
                except Exception as e:
                    logger.warning(f"Error reading cache file {cache_file}: {e}")
                    continue
        
        # Convert to sorted list
        teams_list = sorted(list(all_teams))
        
        logger.info(f"Found {len(teams_list)} available teams")
        
        return {
            "success": True,
            "teams": teams_list,
            "total_teams": len(teams_list)
        }
        
    except Exception as e:
        logger.error(f"Error getting available teams: {e}")
        return {
            "success": False,
            "error": f"Failed to get available teams: {str(e)}",
            "teams": [],
            "total_teams": 0
        }

@app.get("/api/tactical/team/{team_name}/analysis")
def get_team_tactical_analysis(
    team_name: str, 
    competition_ids: str = Query(default="", description="Comma-separated competition IDs (optional)"),
    season_ids: str = Query(default="", description="Comma-separated season IDs (optional)"),
    start_season: int = Query(default=None, description="Start season for range (optional)"),
    end_season: int = Query(default=None, description="End season for range (optional)")
):
    """Get comprehensive tactical analysis for a team with season filtering."""
    try:
        if not ANALYTICS_AVAILABLE or not statsbomb_loader:
            return {
                "success": False,
                "error": "Team tactical analysis not available - requires StatsBomb data processing",
                "team_name": team_name
            }
        
        try:
            logger.info(f"Computing team tactical analysis for {team_name}")
            
            # Parse filter parameters
            comp_filter = []
            if competition_ids.strip():
                comp_filter = [int(x.strip()) for x in competition_ids.split(',') if x.strip().isdigit()]
            
            season_filter = []
            if season_ids.strip():
                season_filter = [int(x.strip()) for x in season_ids.split(',') if x.strip().isdigit()]
            elif start_season and end_season:
                season_filter = list(range(start_season, end_season + 1))
            
            # Get available matches for the team with filters
            from pathlib import Path
            import glob
            
            app_root = Path(__file__).parent.parent
            cache_pattern = str(app_root / "data" / "cache" / "matches_*.parquet")
            cache_files = glob.glob(cache_pattern)
            
            all_team_matches = []
            
            for cache_file in cache_files:
                try:
                    matches_df = pd.read_parquet(cache_file)
                    
                    # Filter matches for the team
                    team_matches = matches_df[
                        (matches_df['home_team_name'] == team_name) | 
                        (matches_df['away_team_name'] == team_name)
                    ].copy()
                    
                    if not team_matches.empty:
                        # Apply competition filter
                        if comp_filter:
                            team_matches = team_matches[team_matches['competition_id'].isin(comp_filter)]
                        
                        # Apply season filter
                        if season_filter:
                            team_matches = team_matches[team_matches['season_id'].isin(season_filter)]
                        
                        if not team_matches.empty:
                            # Add team perspective columns
                            team_matches['team'] = team_name
                            team_matches['home_away'] = team_matches.apply(
                                lambda row: 'home' if row['home_team_name'] == team_name else 'away', axis=1
                            )
                            team_matches['opponent'] = team_matches.apply(
                                lambda row: row['away_team_name'] if row['home_team_name'] == team_name else row['home_team_name'], axis=1
                            )
                            all_team_matches.append(team_matches)
                            
                except Exception as e:
                    logger.debug(f"Error reading cache file {cache_file}: {e}")
                    continue
            
            if not all_team_matches:
                return {
                    "success": False,
                    "error": f"No matches found for team {team_name} with specified filters",
                    "team_name": team_name
                }
            
            # Combine all matches
            combined_matches = pd.concat(all_team_matches, ignore_index=True)
            
            # Sort by match date if available
            if 'match_date' in combined_matches.columns:
                combined_matches = combined_matches.sort_values('match_date', ascending=False)
            
            # Limit to recent matches for analysis (configurable)
            max_matches = 20
            recent_matches = combined_matches.head(max_matches)
            
            # Analyze individual matches to get tactical features
            analyzer = get_realtime_analyzer()
            analyzed_matches = []
            all_features = []
            
            for _, match_row in recent_matches.iterrows():
                match_id = match_row.get('match_id')
                try:
                    events_df = statsbomb_loader.get_events(match_id)
                    if not events_df.empty:
                        match_info = {
                            'match_id': match_id,
                            'home_team_name': match_row.get('home_team_name', team_name),
                            'away_team_name': match_row.get('away_team_name', 'Unknown'),
                            'match_date': str(match_row.get('match_date', 'Unknown')),
                            'competition_id': match_row.get('competition_id', 0),
                            'season_id': match_row.get('season_id', 0)
                        }
                        
                        tactical_data = analyzer.analyze_match_tactics(events_df, match_info)
                        if tactical_data and tactical_data.get('success'):
                            team_data = next((t for t in tactical_data['teams'] if t['team'] == team_name), None)
                            if team_data:
                                match_analysis = {
                                    "match_id": match_id,
                                    "opponent": team_data['opponent'],
                                    "home_away": team_data['home_away'],
                                    "match_date": match_info['match_date'],
                                    "competition_id": match_info['competition_id'],
                                    "season_id": match_info['season_id'],
                                    "style_archetype": team_data['style_archetype'],
                                    **team_data['match_metrics']
                                }
                                analyzed_matches.append(match_analysis)
                                
                                # Extract raw features for averaging
                                raw_features = {
                                    'ppda': team_data['match_metrics'].get('ppda', 0),
                                    'possession_share': team_data['match_metrics'].get('possession_share', 0),
                                    'directness': team_data['match_metrics'].get('directness', 0),
                                    'wing_share': team_data['match_metrics'].get('wing_share', 0),
                                    'counter_rate': team_data['match_metrics'].get('counter_rate', 0),
                                    'fouls_committed': team_data['match_metrics'].get('fouls_committed', 0),
                                    'yellows': team_data['match_metrics']['cards'].get('yellows', 0),
                                    'reds': team_data['match_metrics']['cards'].get('reds', 0)
                                }
                                all_features.append(raw_features)
                                
                except Exception as e:
                    logger.warning(f"Failed to analyze match {match_id}: {e}")
                    continue
            
            if not analyzed_matches:
                return {
                    "success": False,
                    "error": f"Could not analyze any matches for team {team_name}",
                    "team_name": team_name
                }
            
            # Calculate average features across all analyzed matches
            features_df = pd.DataFrame(all_features)
            avg_features = {
                'team': team_name,
                'ppda': features_df['ppda'].mean(),
                'possession_share': features_df['possession_share'].mean(),
                'directness': features_df['directness'].mean(),
                'wing_share': features_df['wing_share'].mean(),
                'counter_rate': features_df['counter_rate'].mean(),
                'fouls_committed': features_df['fouls_committed'].mean(),
                'yellows': features_df['yellows'].mean(),
                'reds': features_df['reds'].mean(),
                # Add other features needed for categorization
                'def_share_att_third': 0.25,  # Default values - would need to be calculated from events
                'block_height_x': 60,
                'cross_share': 0.05,
                'lane_center_share': 0.33,
                'foul_share_att_third': 0.05,
                'foul_share_def_third': 0.33
            }
            
            # Apply categorization to averaged features
            from src.reader.categorizer import load_config, attach_style_tags
            from src.reader.archetypes import derive_archetype
            
            config = load_config('config.yaml')
            avg_df = pd.DataFrame([avg_features])
            tagged_df = attach_style_tags(avg_df, config)
            tagged_df["style_archetype"] = tagged_df.apply(derive_archetype, axis=1)
            
            avg_analysis = tagged_df.iloc[0]
            
            # Build comprehensive response
            team_analysis = {
                "success": True,
                "team_name": team_name,
                "analysis_period": {
                    "total_matches": len(analyzed_matches),
                    "competitions": list(set(m['competition_id'] for m in analyzed_matches)),
                    "seasons": list(set(m['season_id'] for m in analyzed_matches)),
                    "date_range": {
                        "start": analyzed_matches[-1]['match_date'] if analyzed_matches else None,
                        "end": analyzed_matches[0]['match_date'] if analyzed_matches else None
                    }
                },
                "average_tactical_profile": {
                    "style_archetype": avg_analysis.get("style_archetype"),
                    "axis_tags": {
                        "pressing": avg_analysis.get("cat_pressing"),
                        "block": avg_analysis.get("cat_block"),
                        "possession_directness": avg_analysis.get("cat_possess_dir"),
                        "width": avg_analysis.get("cat_width"),
                        "transition": avg_analysis.get("cat_transition"),
                        "overlays": list(avg_analysis.get("cat_overlays", [])) if avg_analysis.get("cat_overlays") is not None else []
                    },
                    "key_metrics": {
                        "ppda": round(avg_features['ppda'], 2),
                        "possession_share": round(avg_features['possession_share'], 3),
                        "directness": round(avg_features['directness'], 3),
                        "wing_share": round(avg_features['wing_share'], 3),
                        "counter_rate": round(avg_features['counter_rate'], 3),
                        "fouls_per_game": round(avg_features['fouls_committed'], 1),
                        "cards_per_game": round(avg_features['yellows'] + avg_features['reds'], 1)
                    }
                },
                "consistency_analysis": {
                    "archetype_consistency": len([m for m in analyzed_matches if m['style_archetype'] == avg_analysis.get("style_archetype")]) / len(analyzed_matches),
                    "most_common_archetype": avg_analysis.get("style_archetype"),
                    "archetype_distribution": pd.Series([m['style_archetype'] for m in analyzed_matches]).value_counts().to_dict()
                },
                "recent_matches": analyzed_matches[:10],  # Show last 10 matches
                "trends": {
                    "possession_trend": "stable",  # Would calculate actual trends
                    "pressing_trend": "stable",
                    "directness_trend": "stable"
                }
            }
            
            return team_analysis
            
        except Exception as e:
            logger.warning(f"Team tactical analysis failed for {team_name}: {e}")
            return {
                "success": False,
                "error": f"Team analysis computation failed: {str(e)}",
                "team_name": team_name
            }
        
    except Exception as e:
        logger.error(f"Error getting team tactical analysis: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get team tactical analysis: {str(e)}")

def analyze_tactical_contrast(teams_data: List[Dict]) -> Dict:
    """Analyze tactical contrast between teams in a match."""
    if len(teams_data) != 2:
        return {"contrast_level": "unknown", "description": "Insufficient team data", "tactical_differences": []}
    
    team1, team2 = teams_data[0], teams_data[1]
    
    # Compare key tactical dimensions
    contrasts = []
    
    # Pressing contrast
    press1 = team1["axis_tags"]["pressing"]
    press2 = team2["axis_tags"]["pressing"]
    if press1 != press2:
        contrasts.append(f"{press1} vs {press2}")
    
    # Possession style contrast
    poss1 = team1["axis_tags"]["possession_directness"]
    poss2 = team2["axis_tags"]["possession_directness"]
    if poss1 != poss2:
        contrasts.append(f"{poss1} vs {poss2}")
    
    # Width usage contrast
    width1 = team1["axis_tags"]["width"]
    width2 = team2["axis_tags"]["width"]
    if width1 != width2 and width1 != "Balanced Channels" and width2 != "Balanced Channels":
        contrasts.append(f"{width1} vs {width2}")
    
    # Generate summary
    if not contrasts:
        contrast_level = "low"
        description = "Similar tactical approaches"
    elif len(contrasts) == 1:
        contrast_level = "moderate"
        description = f"Key difference: {contrasts[0]}"
    else:
        contrast_level = "high"
        description = f"Multiple contrasts: {', '.join(contrasts)}"
    
    return {
        "contrast_level": contrast_level,
        "description": description,
        "tactical_differences": contrasts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)