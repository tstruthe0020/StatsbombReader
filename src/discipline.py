"""
Discipline Feature Engineering

Extracts disciplinary outcomes (fouls, cards) with spatial zone analysis
from StatsBomb event data.
"""

import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple
import math

logger = logging.getLogger(__name__)

class DisciplineAnalyzer:
    """Analyze disciplinary events and spatial patterns."""
    
    def __init__(self, config: Dict = None):
        """
        Initialize discipline analyzer with configuration.
        
        Args:
            config: Configuration dictionary with parameters
        """
        self.config = config or {}
        
        # Zone configuration
        zones_config = self.config.get('zones', {})
        self.x_bins = zones_config.get('x_bins', 5)  # 5 zones across field length
        self.y_bins = zones_config.get('y_bins', 3)  # 3 zones across field width
        
        # Field dimensions (StatsBomb standard)
        self.field_length = 120.0
        self.field_width = 80.0
        
        # Zone dimensions
        self.zone_length = self.field_length / self.x_bins  # 24m per zone
        self.zone_width = self.field_width / self.y_bins    # 26.67m per zone
        
        # Card treatment
        self.card_treatment = self.config.get('card_treatment', 'separate')
        
        logger.info(f"Initialized discipline analyzer: {self.x_bins}x{self.y_bins} zones, "
                   f"zone size: {self.zone_length:.1f}x{self.zone_width:.1f}m")
    
    def extract_team_match_discipline(self, events_df: pd.DataFrame, team_name: str, 
                                    opponent_name: str) -> Dict:
        """
        Extract discipline features for a team in a specific match.
        
        Args:
            events_df: Events DataFrame for the match
            team_name: Name of the team to analyze  
            opponent_name: Name of the opponent team
            
        Returns:
            Dictionary with discipline features
        """
        # Get foul events committed by this team
        team_fouls = self._extract_foul_events(events_df, team_name)
        
        # Get opponent pass count for rates
        opponent_passes = events_df[
            (events_df['team_name'] == opponent_name) & 
            (events_df['event_type_name'] == 'Pass')
        ]
        
        features = {}
        
        # Basic counts
        features.update(self._extract_basic_counts(team_fouls))
        
        # Rates
        features.update(self._extract_rates(team_fouls, len(opponent_passes)))
        
        # Spatial analysis
        features.update(self._extract_spatial_features(team_fouls))
        
        return features
    
    def _extract_foul_events(self, events_df: pd.DataFrame, team_name: str) -> pd.DataFrame:
        """Extract foul-related events for a team."""
        foul_events = events_df[
            (events_df['team_name'] == team_name) & 
            (events_df['event_type_name'].isin(['Foul Committed', 'Bad Behaviour']))
        ].copy()
        
        return foul_events
    
    def _extract_basic_counts(self, foul_events: pd.DataFrame) -> Dict:
        """Extract basic foul and card counts."""
        features = {}
        
        # Total fouls
        features['fouls_committed'] = len(foul_events)
        
        # Card counts
        yellow_cards = 0
        red_cards = 0
        second_yellows = 0
        
        for _, foul in foul_events.iterrows():
            card_type = None
            
            # Check for cards in foul_committed field
            if 'foul_card' in foul and pd.notna(foul['foul_card']):
                card_type = foul['foul_card']
            # Check for cards in bad_behaviour events
            elif foul['event_type_name'] == 'Bad Behaviour':
                # Extract card from bad_behaviour data if available
                card_type = foul.get('card_type')  # This would need to be extracted in flattening
            
            if card_type:
                if card_type == 'Yellow Card':
                    yellow_cards += 1
                elif card_type == 'Red Card':
                    red_cards += 1
                elif card_type == 'Second Yellow':
                    second_yellows += 1
                    if self.card_treatment == 'separate':
                        # Count as both yellow and red
                        yellow_cards += 1
                        red_cards += 1
                    else:
                        # Count as red only
                        red_cards += 1
        
        features['yellows'] = yellow_cards
        features['reds'] = red_cards
        features['second_yellows'] = second_yellows
        
        return features
    
    def _extract_rates(self, foul_events: pd.DataFrame, opponent_passes: int) -> Dict:
        """Extract foul rates normalized by opponent activity."""
        features = {}
        
        # Fouls per opponent pass (defensive pressure indicator)
        if opponent_passes > 0:
            features['fouls_per_opp_pass'] = len(foul_events) / opponent_passes
        else:
            features['fouls_per_opp_pass'] = 0.0
        
        return features
    
    def _extract_spatial_features(self, foul_events: pd.DataFrame) -> Dict:
        """Extract spatial distribution of fouls across zones."""
        features = {}
        
        # Initialize zone counts
        for x in range(self.x_bins):
            for y in range(self.y_bins):
                features[f'foul_grid_x{x}_y{y}'] = 0
        
        # Initialize third counts
        def_third_fouls = 0
        mid_third_fouls = 0
        att_third_fouls = 0
        
        # Initialize width distribution
        left_fouls = 0
        center_fouls = 0
        right_fouls = 0
        
        located_fouls = 0  # Count fouls with location data
        
        # Process each foul event
        for _, foul in foul_events.iterrows():
            if 'location' in foul and isinstance(foul['location'], list) and len(foul['location']) >= 2:
                x, y = foul['location'][0], foul['location'][1]
                located_fouls += 1
                
                # Assign to grid zone
                x_zone = min(int(x / self.zone_length), self.x_bins - 1)
                y_zone = min(int(y / self.zone_width), self.y_bins - 1)
                
                # Ensure zones are within bounds
                x_zone = max(0, min(x_zone, self.x_bins - 1))
                y_zone = max(0, min(y_zone, self.y_bins - 1))
                
                features[f'foul_grid_x{x_zone}_y{y_zone}'] += 1
                
                # Field thirds (x-direction)
                if x < 40:
                    def_third_fouls += 1
                elif x < 80:
                    mid_third_fouls += 1
                else:
                    att_third_fouls += 1
                
                # Width distribution (y-direction)
                if y < self.field_width / 3:
                    left_fouls += 1
                elif y < 2 * self.field_width / 3:
                    center_fouls += 1
                else:
                    right_fouls += 1
        
        # Calculate shares (proportions)
        if located_fouls > 0:
            features['foul_share_def_third'] = def_third_fouls / located_fouls
            features['foul_share_mid_third'] = mid_third_fouls / located_fouls
            features['foul_share_att_third'] = att_third_fouls / located_fouls
            
            features['foul_share_left'] = left_fouls / located_fouls  
            features['foul_share_center'] = center_fouls / located_fouls
            features['foul_share_right'] = right_fouls / located_fouls
            features['foul_share_wide'] = (left_fouls + right_fouls) / located_fouls
        else:
            # Default distributions when no location data
            features['foul_share_def_third'] = 0.2  # Most fouls in middle/attacking thirds
            features['foul_share_mid_third'] = 0.5
            features['foul_share_att_third'] = 0.3
            
            features['foul_share_left'] = 0.25
            features['foul_share_center'] = 0.5
            features['foul_share_right'] = 0.25
            features['foul_share_wide'] = 0.5
        
        # Add metadata
        features['located_fouls'] = located_fouls
        features['missing_location_fouls'] = len(foul_events) - located_fouls
        
        return features
    
    def get_zone_coordinates(self, x_zone: int, y_zone: int) -> Tuple[float, float]:
        """
        Get center coordinates for a zone.
        
        Args:
            x_zone: X zone index (0 to x_bins-1)
            y_zone: Y zone index (0 to y_bins-1)
            
        Returns:
            Tuple of (x_center, y_center) coordinates
        """
        x_center = (x_zone + 0.5) * self.zone_length
        y_center = (y_zone + 0.5) * self.zone_width
        
        return x_center, y_center
    
    def get_zone_from_location(self, x: float, y: float) -> Tuple[int, int]:
        """
        Get zone indices from field coordinates.
        
        Args:
            x: X coordinate (0-120)
            y: Y coordinate (0-80)
            
        Returns:
            Tuple of (x_zone, y_zone) indices
        """
        x_zone = min(int(x / self.zone_length), self.x_bins - 1)
        y_zone = min(int(y / self.zone_width), self.y_bins - 1)
        
        x_zone = max(0, x_zone)
        y_zone = max(0, y_zone)
        
        return x_zone, y_zone
    
    def calculate_zone_exposure(self, events_df: pd.DataFrame, team_name: str) -> Dict:
        """
        Calculate exposure metrics for each zone (time spent, actions taken).
        
        Args:
            events_df: Events DataFrame for the match
            team_name: Team name to analyze
            
        Returns:
            Dictionary with exposure metrics per zone
        """
        team_events = events_df[events_df['team_name'] == team_name].copy()
        
        zone_exposure = {}
        
        # Initialize zone counters
        for x in range(self.x_bins):
            for y in range(self.y_bins):
                zone_key = f'zone_x{x}_y{y}'
                zone_exposure[zone_key] = {
                    'events': 0,
                    'passes': 0,
                    'actions': 0
                }
        
        # Count events by zone
        for _, event in team_events.iterrows():
            if ('location' in event and isinstance(event['location'], list) and 
                len(event['location']) >= 2):
                
                x, y = event['location'][0], event['location'][1]
                x_zone, y_zone = self.get_zone_from_location(x, y)
                
                zone_key = f'zone_x{x_zone}_y{y_zone}'
                zone_exposure[zone_key]['events'] += 1
                
                if event['event_type_name'] == 'Pass':
                    zone_exposure[zone_key]['passes'] += 1
                
                # Count "actions" (passes, shots, carries, etc.)
                if event['event_type_name'] in ['Pass', 'Shot', 'Carry', 'Dribble', 'Cross']:
                    zone_exposure[zone_key]['actions'] += 1
        
        return zone_exposure
    
    def validate_discipline_features(self, features: Dict) -> bool:
        """
        Validate discipline features for consistency.
        
        Args:
            features: Feature dictionary
            
        Returns:
            True if features are valid
        """
        # Check that zone counts sum to total located fouls
        zone_counts = [v for k, v in features.items() if k.startswith('foul_grid_')]
        total_zone_fouls = sum(zone_counts)
        located_fouls = features.get('located_fouls', 0)
        
        if total_zone_fouls != located_fouls:
            logger.warning(f"Zone foul counts ({total_zone_fouls}) don't match located fouls ({located_fouls})")
            return False
        
        # Check that shares sum to approximately 1
        third_shares = [
            features.get('foul_share_def_third', 0),
            features.get('foul_share_mid_third', 0), 
            features.get('foul_share_att_third', 0)
        ]
        
        width_shares = [
            features.get('foul_share_left', 0),
            features.get('foul_share_center', 0),
            features.get('foul_share_right', 0)
        ]
        
        if abs(sum(third_shares) - 1.0) > 0.1:  # Allow 10% tolerance
            logger.warning(f"Third shares don't sum to 1: {third_shares}")
            return False
            
        if abs(sum(width_shares) - 1.0) > 0.1:
            logger.warning(f"Width shares don't sum to 1: {width_shares}")
            return False
        
        # Check non-negative counts
        count_fields = ['fouls_committed', 'yellows', 'reds', 'located_fouls']
        for field in count_fields:
            if features.get(field, 0) < 0:
                logger.warning(f"Negative count for {field}: {features.get(field)}")
                return False
        
        return True
    
    def get_empty_discipline_features(self) -> Dict:
        """Return empty/default discipline feature values."""
        features = {
            # Basic counts
            'fouls_committed': 0,
            'yellows': 0,
            'reds': 0,
            'second_yellows': 0,
            
            # Rates
            'fouls_per_opp_pass': 0.0,
            
            # Spatial shares
            'foul_share_def_third': 0.2,
            'foul_share_mid_third': 0.5,
            'foul_share_att_third': 0.3,
            'foul_share_left': 0.25,
            'foul_share_center': 0.5,
            'foul_share_right': 0.25,
            'foul_share_wide': 0.5,
            
            # Metadata
            'located_fouls': 0,
            'missing_location_fouls': 0
        }
        
        # Initialize zone counts
        for x in range(self.x_bins):
            for y in range(self.y_bins):
                features[f'foul_grid_x{x}_y{y}'] = 0
        
        return features