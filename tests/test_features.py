"""
Tests for playstyle feature engineering module.
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.features import PlaystyleFeatureExtractor

class TestPlaystyleFeatureExtractor:
    """Test cases for PlaystyleFeatureExtractor."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.extractor = PlaystyleFeatureExtractor()
        
        # Create sample events data
        self.sample_events = pd.DataFrame([
            # Passes for Team A
            {'event_type_name': 'Pass', 'team_name': 'Team A', 'location': [10, 40], 
             'pass_end_location': [20, 45], 'pass_length': 11.2, 'possession': 1, 
             'possession_team_name': 'Team A'},
            {'event_type_name': 'Pass', 'team_name': 'Team A', 'location': [20, 45], 
             'pass_end_location': [40, 40], 'pass_length': 20.6, 'possession': 1,
             'possession_team_name': 'Team A'},
            {'event_type_name': 'Pass', 'team_name': 'Team A', 'location': [40, 40], 
             'pass_end_location': [70, 30], 'pass_length': 36.1, 'pass_cross': True,
             'possession': 1, 'possession_team_name': 'Team A'},
            
            # Passes for Team B
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [100, 30], 
             'pass_end_location': [90, 35], 'pass_length': 11.2, 'possession': 2,
             'possession_team_name': 'Team B'},
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [90, 35], 
             'pass_end_location': [80, 40], 'pass_length': 12.0, 'possession': 2,
             'possession_team_name': 'Team B'},
            
            # Defensive actions for Team A
            {'event_type_name': 'Pressure', 'team_name': 'Team A', 'location': [60, 40]},
            {'event_type_name': 'Tackle', 'team_name': 'Team A', 'location': [70, 35]},
            {'event_type_name': 'Interception', 'team_name': 'Team A', 'location': [50, 50]},
            
            # Shot for Team A
            {'event_type_name': 'Shot', 'team_name': 'Team A', 'location': [110, 40],
             'shot_statsbomb_xg': 0.15}
        ])
    
    def test_extract_team_match_features_basic(self):
        """Test basic feature extraction."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Check that all expected features are present
        expected_features = [
            'ppda', 'block_height_x', 'def_share_def_third', 'def_share_mid_third', 'def_share_att_third',
            'possession_share', 'passes_per_possession', 'directness', 'avg_pass_length', 
            'long_pass_share', 'forward_pass_share',
            'lane_left_share', 'lane_center_share', 'lane_right_share', 'wing_share',
            'cross_share', 'through_ball_share', 'counter_rate',
            'xg_mean', 'passes_to_shot'
        ]
        
        for feature in expected_features:
            assert feature in features, f"Missing feature: {feature}"
    
    def test_possession_share_calculation(self):
        """Test possession share calculation."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Team A has 3 passes, Team B has 2 passes, total = 5
        # Team A possession share should be 3/5 = 0.6
        assert abs(features['possession_share'] - 0.6) < 0.01
    
    def test_ppda_calculation(self):
        """Test PPDA (Passes Per Defensive Action) calculation."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Team B has 2 passes, Team A has 3 defensive actions
        # PPDA should be 2/3 ≈ 0.67
        assert abs(features['ppda'] - (2/3)) < 0.01
    
    def test_directness_range(self):
        """Test that directness is in valid range [0, 1]."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        assert 0 <= features['directness'] <= 1
    
    def test_shares_sum_to_one(self):
        """Test that share features sum to approximately 1."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Channel shares should sum to 1
        channel_sum = (features['lane_left_share'] + 
                      features['lane_center_share'] + 
                      features['lane_right_share'])
        assert abs(channel_sum - 1.0) < 0.1  # 10% tolerance
        
        # Defensive third shares should sum to 1
        def_sum = (features['def_share_def_third'] + 
                   features['def_share_mid_third'] + 
                   features['def_share_att_third'])
        assert abs(def_sum - 1.0) < 0.1
    
    def test_cross_detection(self):
        """Test cross detection in features."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Team A has 1 cross out of 3 passes
        assert abs(features['cross_share'] - (1/3)) < 0.01
    
    def test_long_pass_detection(self):
        """Test long pass detection."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Team A has 1 pass >= 30m (36.1m) out of 3 passes
        assert abs(features['long_pass_share'] - (1/3)) < 0.01
    
    def test_validate_features(self):
        """Test feature validation."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        assert self.extractor.validate_features(features)
    
    def test_empty_events(self):
        """Test handling of empty events."""
        empty_events = pd.DataFrame()
        features = self.extractor.extract_team_match_features(
            empty_events, 'Team A', 'Team B'
        )
        
        # Should return default values
        expected_defaults = self.extractor._get_empty_features()
        for key, expected_val in expected_defaults.items():
            assert features[key] == expected_val
    
    def test_feature_ranges(self):
        """Test that features are in reasonable ranges."""
        features = self.extractor.extract_team_match_features(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Test ranges
        assert features['ppda'] >= 0
        assert 0 <= features['block_height_x'] <= 120  # Field length
        assert features['avg_pass_length'] >= 0
        assert features['passes_per_possession'] >= 0
        assert 0 <= features['forward_pass_share'] <= 1
        assert features['xg_mean'] >= 0
        assert features['passes_to_shot'] >= 0

if __name__ == '__main__':
    pytest.main([__file__])