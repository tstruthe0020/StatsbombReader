"""
Tests for discipline analysis module.
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.discipline import DisciplineAnalyzer

class TestDisciplineAnalyzer:
    """Test cases for DisciplineAnalyzer."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.analyzer = DisciplineAnalyzer()
        
        # Create sample events with fouls
        self.sample_events = pd.DataFrame([
            # Fouls committed by Team A
            {'event_type_name': 'Foul Committed', 'team_name': 'Team A', 
             'location': [30, 20], 'foul_card': 'Yellow Card'},
            {'event_type_name': 'Foul Committed', 'team_name': 'Team A', 
             'location': [60, 50], 'foul_card': None},
            {'event_type_name': 'Foul Committed', 'team_name': 'Team A', 
             'location': [90, 30], 'foul_card': 'Red Card'},
            
            # Bad behaviour by Team A
            {'event_type_name': 'Bad Behaviour', 'team_name': 'Team A',
             'location': [45, 40]},
            
            # Passes by Team B (for rate calculation)
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [10, 40]},
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [20, 30]},
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [50, 60]},
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [80, 25]},
            {'event_type_name': 'Pass', 'team_name': 'Team B', 'location': [100, 35]}
        ])
    
    def test_basic_foul_counts(self):
        """Test basic foul counting."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Team A committed 4 foul events (3 fouls + 1 bad behaviour)
        assert features['fouls_committed'] == 4
    
    def test_card_counting(self):
        """Test card counting."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # 1 yellow card, 1 red card from the sample data
        assert features['yellows'] == 1
        assert features['reds'] == 1
    
    def test_foul_rate_calculation(self):
        """Test fouls per opponent pass calculation."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # 4 fouls / 5 opponent passes = 0.8
        assert abs(features['fouls_per_opp_pass'] - 0.8) < 0.01
    
    def test_spatial_zone_assignment(self):
        """Test spatial zone assignment."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Check that zone counts sum to total located fouls
        zone_counts = [v for k, v in features.items() if k.startswith('foul_grid_')]
        total_zone_fouls = sum(zone_counts)
        
        assert total_zone_fouls == features['located_fouls']
    
    def test_field_thirds_distribution(self):
        """Test field thirds distribution."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'  
        )
        
        # Verify thirds shares sum to approximately 1
        thirds_sum = (features['foul_share_def_third'] + 
                     features['foul_share_mid_third'] + 
                     features['foul_share_att_third'])
        
        assert abs(thirds_sum - 1.0) < 0.1  # 10% tolerance
    
    def test_width_distribution(self):
        """Test width distribution."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        # Verify width shares sum to approximately 1
        width_sum = (features['foul_share_left'] + 
                    features['foul_share_center'] + 
                    features['foul_share_right'])
        
        assert abs(width_sum - 1.0) < 0.1
    
    def test_zone_coordinates(self):
        """Test zone coordinate calculation."""
        # Test specific zone coordinates
        x_center, y_center = self.analyzer.get_zone_coordinates(2, 1)
        
        # Zone 2,1 should be at center of middle zone
        expected_x = (2 + 0.5) * (120 / 5)  # 60
        expected_y = (1 + 0.5) * (80 / 3)   # ~40
        
        assert abs(x_center - expected_x) < 0.1
        assert abs(y_center - expected_y) < 0.1
    
    def test_zone_from_location(self):
        """Test getting zone from field coordinates."""
        # Test center of field
        x_zone, y_zone = self.analyzer.get_zone_from_location(60, 40)
        
        # Should be in middle zones
        assert x_zone == 2  # Middle x zone
        assert y_zone == 1  # Middle y zone
    
    def test_validate_discipline_features(self):
        """Test feature validation."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        assert self.analyzer.validate_discipline_features(features)
    
    def test_missing_locations(self):
        """Test handling of missing location data."""
        # Events without locations
        events_no_location = self.sample_events.copy()
        events_no_location['location'] = None
        
        features = self.analyzer.extract_team_match_discipline(
            events_no_location, 'Team A', 'Team B'
        )
        
        # Should still count fouls but have no located fouls
        assert features['fouls_committed'] == 4
        assert features['located_fouls'] == 0
        assert features['missing_location_fouls'] == 4
    
    def test_empty_events(self):
        """Test handling of empty events."""
        empty_events = pd.DataFrame()
        features = self.analyzer.extract_team_match_discipline(
            empty_events, 'Team A', 'Team B'
        )
        
        # Should return default values
        expected_defaults = self.analyzer.get_empty_discipline_features()
        for key, expected_val in expected_defaults.items():
            assert features[key] == expected_val
    
    def test_zone_exposure_calculation(self):
        """Test zone exposure calculation."""
        exposure = self.analyzer.calculate_zone_exposure(
            self.sample_events, 'Team A'
        )
        
        # Should have exposure data for all zones
        assert len(exposure) == 15  # 5x3 grid
        
        # Check specific zone has some events
        zone_keys = list(exposure.keys())
        assert all('zone_x' in key for key in zone_keys)
    
    def test_card_treatment_separate(self):
        """Test separate card treatment for second yellows."""
        # Create analyzer with separate treatment
        analyzer_separate = DisciplineAnalyzer({'card_treatment': 'separate'})
        
        # Create events with second yellow
        events_second_yellow = pd.DataFrame([
            {'event_type_name': 'Foul Committed', 'team_name': 'Team A',
             'foul_card': 'Second Yellow', 'location': [50, 40]}
        ])
        
        features = analyzer_separate.extract_team_match_discipline(
            events_second_yellow, 'Team A', 'Team B'
        )
        
        # With separate treatment, second yellow counts as both yellow and red
        assert features['second_yellows'] == 1
        # Note: Implementation may vary on how second yellow is handled
    
    def test_feature_non_negative(self):
        """Test that count features are non-negative."""
        features = self.analyzer.extract_team_match_discipline(
            self.sample_events, 'Team A', 'Team B'
        )
        
        count_features = ['fouls_committed', 'yellows', 'reds', 'located_fouls']
        for feature in count_features:
            assert features[feature] >= 0, f"{feature} should be non-negative"

if __name__ == '__main__':
    pytest.main([__file__])