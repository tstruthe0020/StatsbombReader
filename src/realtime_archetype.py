"""
Real-time tactical archetype computation for individual matches.
"""

import pandas as pd
import numpy as np
import logging
from typing import Dict, Optional, Tuple
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.features import PlaystyleFeatureExtractor
from src.discipline import DisciplineAnalyzer
from src.reader.categorizer import load_config, attach_style_tags
from src.reader.archetypes import derive_archetype

logger = logging.getLogger(__name__)

class RealtimeTacticalAnalyzer:
    """Compute tactical archetypes for individual matches in real-time."""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize the real-time analyzer."""
        self.config = load_config(config_path)
        self.feature_extractor = PlaystyleFeatureExtractor(
            self.config.get('features', {}).get('playstyle', {})
        )
        self.discipline_analyzer = DisciplineAnalyzer(
            self.config.get('features', {}).get('discipline', {})
        )
        
    def analyze_match_tactics(self, events_df: pd.DataFrame, match_info: Dict) -> Optional[Dict]:
        """
        Analyze tactical archetypes for both teams in a match.
        
        Args:
            events_df: Match events DataFrame
            match_info: Match metadata (team names, referee, etc.)
            
        Returns:
            Dict with tactical analysis for both teams
        """
        try:
            # Extract team names
            home_team = match_info.get('home_team_name') or match_info.get('home_team')
            away_team = match_info.get('away_team_name') or match_info.get('away_team')
            
            if not home_team or not away_team:
                logger.warning("Missing team names in match info")
                return None
            
            # Analyze both teams
            teams_data = []
            
            for team_name, opponent_name, home_away in [
                (home_team, away_team, 'home'),
                (away_team, home_team, 'away')
            ]:
                team_data = self._analyze_team_tactics(
                    events_df, team_name, opponent_name, home_away, match_info
                )
                if team_data:
                    teams_data.append(team_data)
            
            if not teams_data:
                return None
                
            # Create match tactical summary
            match_analysis = {
                "success": True,
                "match_id": match_info.get('match_id'),
                "match_info": {
                    "match_date": match_info.get('match_date'),
                    "competition_id": match_info.get('competition_id'),
                    "season_id": match_info.get('season_id'),
                    "referee_name": match_info.get('referee_name')
                },
                "teams": teams_data,
                "tactical_summary": {
                    "styles_comparison": [team["style_archetype"] for team in teams_data],
                    "tactical_contrast": self._analyze_tactical_contrast(teams_data)
                }
            }
            
            return match_analysis
            
        except Exception as e:
            logger.error(f"Failed to analyze match tactics: {e}")
            return None
    
    def _analyze_team_tactics(self, events_df: pd.DataFrame, team_name: str, 
                            opponent_name: str, home_away: str, match_info: Dict) -> Optional[Dict]:
        """Analyze tactical profile for a single team."""
        
        try:
            # Extract playstyle features
            playstyle_features = self.feature_extractor.extract_team_match_features(
                events_df, team_name, opponent_name
            )
            
            # Extract discipline features
            discipline_features = self.discipline_analyzer.extract_team_match_discipline(
                events_df, team_name, opponent_name
            )
            
            # Combine features
            team_features = {
                'team': team_name,
                'opponent': opponent_name,
                'home_away': home_away,
                **playstyle_features,
                **discipline_features
            }
            
            # Convert to DataFrame for categorization
            team_df = pd.DataFrame([team_features])
            
            # Apply tactical categorization
            tagged_df = attach_style_tags(team_df, self.config)
            tagged_df["style_archetype"] = tagged_df.apply(derive_archetype, axis=1)
            
            team_row = tagged_df.iloc[0]
            
            # Build response
            team_data = {
                "team": team_name,
                "opponent": opponent_name,
                "home_away": home_away,
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
                    "ppda": round(float(playstyle_features.get("ppda", 0)), 2),
                    "possession_share": round(float(playstyle_features.get("possession_share", 0)), 3),
                    "directness": round(float(playstyle_features.get("directness", 0)), 3),
                    "wing_share": round(float(playstyle_features.get("wing_share", 0)), 3),
                    "counter_rate": round(float(playstyle_features.get("counter_rate", 0)), 3),
                    "fouls_committed": int(discipline_features.get("fouls_committed", 0)),
                    "cards": {
                        "yellows": int(discipline_features.get("yellows", 0)),
                        "reds": int(discipline_features.get("reds", 0))
                    }
                }
            }
            
            return team_data
            
        except Exception as e:
            logger.error(f"Failed to analyze team {team_name} tactics: {e}")
            return None
    
    def _analyze_tactical_contrast(self, teams_data: list) -> Dict:
        """Analyze tactical contrast between teams."""
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

# Global instance for reuse
_realtime_analyzer = None

def get_realtime_analyzer() -> RealtimeTacticalAnalyzer:
    """Get or create the global realtime analyzer instance."""
    global _realtime_analyzer
    if _realtime_analyzer is None:
        _realtime_analyzer = RealtimeTacticalAnalyzer()
    return _realtime_analyzer