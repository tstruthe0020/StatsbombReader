"""
Playstyle Feature Engineering

Extracts team playstyle features from StatsBomb event data including pressing, 
possession patterns, directness, width usage, and transition play.
"""

import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple
import math
from collections import defaultdict

logger = logging.getLogger(__name__)

class PlaystyleFeatureExtractor:
    """Extract playstyle features from match event data."""
    
    def __init__(self, config: Dict = None):
        """
        Initialize feature extractor with configuration.
        
        Args:
            config: Configuration dictionary with feature parameters
        """
        self.config = config or {}
        
        # Default thresholds
        self.long_pass_threshold = self.config.get('long_pass_threshold', 30.0)
        self.defensive_thirds = self.config.get('defensive_thirds', {
            'defensive': [0, 40],
            'middle': [40, 80], 
            'attacking': [80, 120]
        })
        self.channels = self.config.get('channels', {
            'left': [0, 26.67],
            'center': [26.67, 53.33],
            'right': [53.33, 80]
        })
        self.counter_patterns = self.config.get('counter_patterns', ["From Counter"])
        
    def extract_team_match_features(self, events_df: pd.DataFrame, team_name: str, 
                                  opponent_name: str) -> Dict:
        """
        Extract playstyle features for a team in a specific match.
        
        Args:
            events_df: Events DataFrame for the match
            team_name: Name of the team to analyze
            opponent_name: Name of the opponent team
            
        Returns:
            Dictionary with playstyle features
        """
        # Filter events for this team and opponent
        team_events = events_df[events_df['team_name'] == team_name].copy()
        opponent_events = events_df[events_df['team_name'] == opponent_name].copy()
        
        if team_events.empty:
            logger.warning(f"No events found for team {team_name}")
            return self._get_empty_features()
        
        features = {}
        
        # Extract pressing & block features
        features.update(self._extract_pressing_features(team_events, opponent_events, events_df))
        
        # Extract possession & directness features
        features.update(self._extract_possession_features(team_events, events_df))
        
        # Extract channels & delivery features
        features.update(self._extract_channels_features(team_events))
        
        # Extract transition features
        features.update(self._extract_transition_features(team_events, events_df))
        
        # Extract shot build-up features (optional)
        features.update(self._extract_shot_features(team_events))
        
        return features
    
    def _extract_pressing_features(self, team_events: pd.DataFrame, 
                                 opponent_events: pd.DataFrame, 
                                 all_events: pd.DataFrame) -> Dict:
        """Extract pressing and defensive block features."""
        features = {}
        
        # Get defensive actions (pressures, tackles, interceptions)
        defensive_actions = team_events[
            team_events['event_type_name'].isin(['Pressure', 'Tackle', 'Interception', 'Duel'])
        ].copy()
        
        # Get opponent passes
        opponent_passes = opponent_events[opponent_events['event_type_name'] == 'Pass'].copy()
        
        # Calculate PPDA (Passes Per Defensive Action)
        if len(defensive_actions) > 0:
            features['ppda'] = len(opponent_passes) / len(defensive_actions)
        else:
            features['ppda'] = float('inf')  # No defensive actions
        
        # Calculate defensive block height
        if not defensive_actions.empty and 'location' in defensive_actions.columns:
            valid_locations = defensive_actions['location'].dropna()
            if len(valid_locations) > 0:
                x_positions = [loc[0] for loc in valid_locations if isinstance(loc, list) and len(loc) >= 2]
                if x_positions:
                    features['block_height_x'] = np.mean(x_positions)
                else:
                    features['block_height_x'] = 60.0  # Field center default
            else:
                features['block_height_x'] = 60.0
        else:
            features['block_height_x'] = 60.0
        
        # Calculate defensive third shares
        if not defensive_actions.empty:
            def_third_actions = 0
            mid_third_actions = 0
            att_third_actions = 0
            
            for _, action in defensive_actions.iterrows():
                if 'location' in action and isinstance(action['location'], list) and len(action['location']) >= 2:
                    x = action['location'][0]
                    if self.defensive_thirds['defensive'][0] <= x < self.defensive_thirds['defensive'][1]:
                        def_third_actions += 1
                    elif self.defensive_thirds['middle'][0] <= x < self.defensive_thirds['middle'][1]:
                        mid_third_actions += 1
                    elif self.defensive_thirds['attacking'][0] <= x <= self.defensive_thirds['attacking'][1]:
                        att_third_actions += 1
            
            total_def_actions = def_third_actions + mid_third_actions + att_third_actions
            if total_def_actions > 0:
                features['def_share_def_third'] = def_third_actions / total_def_actions
                features['def_share_mid_third'] = mid_third_actions / total_def_actions
                features['def_share_att_third'] = att_third_actions / total_def_actions
            else:
                features['def_share_def_third'] = 0.33
                features['def_share_mid_third'] = 0.33
                features['def_share_att_third'] = 0.33
        else:
            features['def_share_def_third'] = 0.33
            features['def_share_mid_third'] = 0.33
            features['def_share_att_third'] = 0.33
        
        return features
    
    def _extract_possession_features(self, team_events: pd.DataFrame, 
                                   all_events: pd.DataFrame) -> Dict:
        """Extract possession and directness features."""
        features = {}
        
        # Get pass events
        team_passes = team_events[team_events['event_type_name'] == 'Pass'].copy()
        all_passes = all_events[all_events['event_type_name'] == 'Pass'].copy()
        
        # Calculate possession share
        if len(all_passes) > 0:
            features['possession_share'] = len(team_passes) / len(all_passes)
        else:
            features['possession_share'] = 0.5
        
        # Calculate passes per possession
        if not team_events.empty and 'possession' in team_events.columns:
            team_possessions = team_events[team_events['possession_team_name'] == team_events['team_name'].iloc[0]]
            possession_counts = team_possessions.groupby('possession').size()
            if len(possession_counts) > 0:
                features['passes_per_possession'] = possession_counts.mean()
            else:
                features['passes_per_possession'] = 0.0
        else:
            features['passes_per_possession'] = 0.0
        
        # Calculate directness and pass characteristics
        if not team_passes.empty:
            # Pass length statistics
            pass_lengths = []
            forward_passes = 0
            long_passes = 0
            
            for _, pass_event in team_passes.iterrows():
                if 'pass_length' in pass_event and pd.notna(pass_event['pass_length']):
                    pass_length = pass_event['pass_length']
                    pass_lengths.append(pass_length)
                    
                    if pass_length >= self.long_pass_threshold:
                        long_passes += 1
                
                # Check if pass is forward
                if ('location' in pass_event and 'pass_end_location' in pass_event and 
                    isinstance(pass_event['location'], list) and 
                    isinstance(pass_event['pass_end_location'], list) and
                    len(pass_event['location']) >= 2 and len(pass_event['pass_end_location']) >= 2):
                    
                    start_x = pass_event['location'][0]
                    end_x = pass_event['pass_end_location'][0]
                    if end_x > start_x:  # Forward pass
                        forward_passes += 1
            
            # Pass length features
            if pass_lengths:
                features['avg_pass_length'] = np.mean(pass_lengths)
                features['long_pass_share'] = long_passes / len(team_passes)
            else:
                features['avg_pass_length'] = 15.0  # Default
                features['long_pass_share'] = 0.1
            
            features['forward_pass_share'] = forward_passes / len(team_passes) if len(team_passes) > 0 else 0.5
            
            # Calculate directness per possession
            directness_scores = []
            if 'possession' in team_passes.columns:
                for possession_id in team_passes['possession'].unique():
                    if pd.notna(possession_id):
                        poss_passes = team_passes[team_passes['possession'] == possession_id]
                        directness = self._calculate_possession_directness(poss_passes)
                        if directness is not None:
                            directness_scores.append(directness)
            
            if directness_scores:
                features['directness'] = np.mean(directness_scores)
            else:
                features['directness'] = 0.5  # Default moderate directness
        else:
            features['avg_pass_length'] = 15.0
            features['long_pass_share'] = 0.1
            features['forward_pass_share'] = 0.5
            features['directness'] = 0.5
        
        return features
    
    def _calculate_possession_directness(self, possession_passes: pd.DataFrame) -> Optional[float]:
        """Calculate directness for a single possession sequence."""
        if len(possession_passes) < 2:
            return None
        
        total_forward_gain = 0.0
        total_pass_distance = 0.0
        
        for _, pass_event in possession_passes.iterrows():
            if ('location' in pass_event and 'pass_end_location' in pass_event and
                isinstance(pass_event['location'], list) and 
                isinstance(pass_event['pass_end_location'], list) and
                len(pass_event['location']) >= 2 and len(pass_event['pass_end_location']) >= 2):
                
                start_x, start_y = pass_event['location'][0], pass_event['location'][1]
                end_x, end_y = pass_event['pass_end_location'][0], pass_event['pass_end_location'][1]
                
                # Forward gain (x-direction)
                forward_gain = max(0, end_x - start_x)
                total_forward_gain += forward_gain
                
                # Total distance
                distance = math.sqrt((end_x - start_x)**2 + (end_y - start_y)**2)
                total_pass_distance += distance
        
        if total_pass_distance > 0:
            return total_forward_gain / total_pass_distance
        else:
            return None
    
    def _extract_channels_features(self, team_events: pd.DataFrame) -> Dict:
        """Extract channel usage and delivery features."""
        features = {}
        
        # Get pass events with location data
        passes_with_location = team_events[
            (team_events['event_type_name'] == 'Pass') & 
            team_events['location'].notna()
        ].copy()
        
        if not passes_with_location.empty:
            left_passes = 0
            center_passes = 0
            right_passes = 0
            crosses = 0
            through_balls = 0
            
            for _, pass_event in passes_with_location.iterrows():
                if isinstance(pass_event['location'], list) and len(pass_event['location']) >= 2:
                    y = pass_event['location'][1]  # Y coordinate for width
                    
                    # Determine channel
                    if self.channels['left'][0] <= y < self.channels['left'][1]:
                        left_passes += 1
                    elif self.channels['center'][0] <= y < self.channels['center'][1]:
                        center_passes += 1
                    elif self.channels['right'][0] <= y <= self.channels['right'][1]:
                        right_passes += 1
                
                # Count crosses and through balls
                if 'pass_cross' in pass_event and pass_event['pass_cross']:
                    crosses += 1
                if 'pass_through_ball' in pass_event and pass_event['pass_through_ball']:
                    through_balls += 1
            
            total_channel_passes = left_passes + center_passes + right_passes
            
            if total_channel_passes > 0:
                features['lane_left_share'] = left_passes / total_channel_passes
                features['lane_center_share'] = center_passes / total_channel_passes
                features['lane_right_share'] = right_passes / total_channel_passes
                features['wing_share'] = (left_passes + right_passes) / total_channel_passes
            else:
                features['lane_left_share'] = 0.33
                features['lane_center_share'] = 0.33
                features['lane_right_share'] = 0.33
                features['wing_share'] = 0.67
            
            total_passes = len(passes_with_location)
            features['cross_share'] = crosses / total_passes if total_passes > 0 else 0.0
            features['through_ball_share'] = through_balls / total_passes if total_passes > 0 else 0.0
        else:
            # Defaults when no location data
            features['lane_left_share'] = 0.33
            features['lane_center_share'] = 0.33
            features['lane_right_share'] = 0.33
            features['wing_share'] = 0.67
            features['cross_share'] = 0.05
            features['through_ball_share'] = 0.02
        
        return features
    
    def _extract_transition_features(self, team_events: pd.DataFrame, 
                                   all_events: pd.DataFrame) -> Dict:
        """Extract transition and counter-attack features."""
        features = {}
        
        # Count possessions and counter attacks
        team_possessions = set()
        counter_actions = 0
        
        for _, event in team_events.iterrows():
            if 'possession' in event and pd.notna(event['possession']):
                team_possessions.add(event['possession'])
            
            # Check for counter patterns
            if ('play_pattern_name' in event and 
                event['play_pattern_name'] in self.counter_patterns):
                counter_actions += 1
        
        total_possessions = len(team_possessions)
        
        if total_possessions > 0:
            features['counter_rate'] = counter_actions / total_possessions
        else:
            features['counter_rate'] = 0.0
        
        return features
    
    def _extract_shot_features(self, team_events: pd.DataFrame) -> Dict:
        """Extract shot build-up features (optional)."""
        features = {}
        
        # Get shot events
        shots = team_events[team_events['event_type_name'] == 'Shot'].copy()
        
        if not shots.empty:
            # Calculate xG mean
            xg_values = []
            for _, shot in shots.iterrows():
                if 'shot_statsbomb_xg' in shot and pd.notna(shot['shot_statsbomb_xg']):
                    xg_values.append(shot['shot_statsbomb_xg'])
            
            features['xg_mean'] = np.mean(xg_values) if xg_values else 0.0
            
            # Calculate passes to shot (simplified - would need possession analysis)
            # For now, estimate based on total passes and shots
            team_passes = team_events[team_events['event_type_name'] == 'Pass']
            if len(shots) > 0 and len(team_passes) > 0:
                features['passes_to_shot'] = len(team_passes) / len(shots)
            else:
                features['passes_to_shot'] = 10.0  # Default estimate
        else:
            features['xg_mean'] = 0.0
            features['passes_to_shot'] = 0.0
        
        return features
    
    def _get_empty_features(self) -> Dict:
        """Return default/empty feature values."""
        return {
            # Pressing & Block
            'ppda': float('inf'),
            'block_height_x': 60.0,
            'def_share_def_third': 0.33,
            'def_share_mid_third': 0.33,
            'def_share_att_third': 0.33,
            
            # Possession & Directness
            'possession_share': 0.5,
            'passes_per_possession': 0.0,
            'directness': 0.5,
            'avg_pass_length': 15.0,
            'long_pass_share': 0.1,
            'forward_pass_share': 0.5,
            
            # Channels & Delivery
            'lane_left_share': 0.33,
            'lane_center_share': 0.33,
            'lane_right_share': 0.33,
            'wing_share': 0.67,
            'cross_share': 0.05,
            'through_ball_share': 0.02,
            
            # Transitions
            'counter_rate': 0.0,
            
            # Shot build-up
            'xg_mean': 0.0,
            'passes_to_shot': 0.0
        }
    
    def validate_features(self, features: Dict) -> bool:
        """
        Validate extracted features for reasonable ranges.
        
        Args:
            features: Feature dictionary
            
        Returns:
            True if features are valid
        """
        validations = [
            # Shares should be between 0 and 1
            0 <= features.get('possession_share', 0) <= 1,
            0 <= features.get('def_share_def_third', 0) <= 1,
            0 <= features.get('def_share_mid_third', 0) <= 1,
            0 <= features.get('def_share_att_third', 0) <= 1,
            0 <= features.get('lane_left_share', 0) <= 1,
            0 <= features.get('lane_center_share', 0) <= 1,
            0 <= features.get('lane_right_share', 0) <= 1,
            0 <= features.get('directness', 0) <= 1,
            0 <= features.get('forward_pass_share', 0) <= 1,
            0 <= features.get('long_pass_share', 0) <= 1,
            0 <= features.get('cross_share', 0) <= 1,
            0 <= features.get('through_ball_share', 0) <= 1,
            features.get('counter_rate', 0) >= 0,  # No upper limit for counter rate
            
            # Non-negative values
            features.get('ppda', 0) >= 0,
            features.get('passes_per_possession', 0) >= 0,
            features.get('avg_pass_length', 0) >= 0,
            features.get('xg_mean', 0) >= 0,
            features.get('passes_to_shot', 0) >= 0,
            
            # Reasonable ranges
            0 <= features.get('block_height_x', 60) <= 120,  # Field length
        ]
        
        if not all(validations):
            logger.warning(f"Feature validation failed for features: {features}")
            return False
        
        return True