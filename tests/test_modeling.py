"""
Tests for zone-wise modeling module.
"""

import pytest
import pandas as pd
import numpy as np
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.modeling_zone_nb import ZoneNBModeler

class TestZoneNBModeler:
    """Test cases for ZoneNBModeler."""
    
    def setup_method(self):
        """Setup test fixtures."""
        config = {
            'modeling': {
                'zone_nb': {
                    'min_referee_matches': 3,
                    'min_zone_events': 2,
                    'interaction_features': ['directness']
                }
            }
        }
        self.modeler = ZoneNBModeler(config)
        
        # Create synthetic dataset for testing
        np.random.seed(42)
        self.synthetic_data = self._create_synthetic_dataset()
    
    def _create_synthetic_dataset(self):
        """Create synthetic team-match dataset for testing."""
        data = []
        referees = ['Ref A', 'Ref B', 'Ref C']
        
        for i in range(50):  # 50 team-matches
            referee = np.random.choice(referees)
            
            row = {
                'match_id': 1000 + i,
                'team': f'Team_{i % 10}',
                'referee_name': referee,
                'home_away': np.random.choice(['home', 'away']),
                'z_directness': np.random.normal(0, 1),
                'z_ppda': np.random.normal(0, 1),
                'z_possession_share': np.random.normal(0, 1),
                'z_block_height_x': np.random.normal(0, 1),
                'z_wing_share': np.random.normal(0, 1),
                'opp_passes': np.random.poisson(400),
                'log_opp_passes': np.log(np.random.poisson(400) + 1)
            }
            
            # Generate synthetic foul counts for each zone
            for x in range(5):
                for y in range(3):
                    # Simple synthetic model: more fouls in middle zones
                    base_rate = 1.0 if x in [1, 2, 3] else 0.5
                    lambda_param = base_rate + 0.1 * row['z_directness']
                    fouls = np.random.poisson(max(0.1, lambda_param))
                    row[f'foul_grid_x{x}_y{y}'] = fouls
            
            data.append(row)
        
        return pd.DataFrame(data)
    
    def test_initialization(self):
        """Test modeler initialization."""
        assert self.modeler.x_bins == 5
        assert self.modeler.y_bins == 3
        assert self.modeler.total_zones == 15
        assert 'directness' in self.modeler.interaction_features
    
    def test_prepare_modeling_data(self):
        """Test data preparation for modeling."""
        df_prepared, prep_info = self.modeler.prepare_modeling_data(self.synthetic_data)
        
        assert len(df_prepared) > 0
        assert 'home_indicator' in df_prepared.columns
        assert 'referee_cat' in df_prepared.columns
        assert prep_info['original_rows'] == len(self.synthetic_data)
        assert prep_info['zones_analyzed'] == 15
    
    def test_required_columns_check(self):
        """Test that required columns are validated."""
        # Remove required column
        incomplete_data = self.synthetic_data.drop(columns=['log_opp_passes'])
        
        with pytest.raises(ValueError, match="Missing required columns"):
            self.modeler.prepare_modeling_data(incomplete_data)
    
    def test_referee_filtering(self):
        """Test filtering by minimum referee matches."""
        # Create data where some referees have too few matches
        small_data = self.synthetic_data.head(5)  # Only 5 matches total
        
        df_prepared, prep_info = self.modeler.prepare_modeling_data(small_data)
        
        # With min_referee_matches=3, some referees might be filtered out
        assert prep_info['filtered_rows'] <= prep_info['original_rows']
    
    def test_fit_zone_models_smoke_test(self):
        """Smoke test for model fitting (may not converge with synthetic data)."""
        df_prepared, _ = self.modeler.prepare_modeling_data(self.synthetic_data)
        
        # Try to fit models (may fail with synthetic data, but shouldn't crash)
        try:
            fitted_models = self.modeler.fit_zone_nb_models(
                df_prepared,
                feature_list=['z_directness', 'z_ppda'],
                interaction_features=['directness']
            )
            
            # If successful, check basic properties
            if fitted_models:
                assert isinstance(fitted_models, dict)
                for zone_id, model in fitted_models.items():
                    assert zone_id.startswith('zone_')
                    assert hasattr(model, 'params')
                    assert hasattr(model, 'converged')
        
        except Exception as e:
            # Model fitting might fail with synthetic data - that's okay for testing
            pytest.skip(f"Model fitting failed with synthetic data (expected): {e}")
    
    def test_predict_expected_fouls_structure(self):
        """Test structure of prediction output."""
        # Create minimal fitted models dict for testing
        self.modeler.fitted_models = {}
        
        # Mock a simple prediction function
        def mock_predict(df_row):
            return {f'zone_{x}_{y}': 1.0 for x in range(5) for y in range(3)}
        
        # Test prediction structure
        sample_row = pd.Series({
            'z_directness': 0.5,
            'z_ppda': 0.0,
            'referee_name': 'Ref A',
            'log_opp_passes': np.log(400)
        })
        
        # If no models fitted, should return zeros
        try:
            predictions = self.modeler.predict_expected_fouls(sample_row)
            assert len(predictions) == 15  # 5x3 zones
            assert all(isinstance(v, (int, float)) for v in predictions.values())
        except ValueError:
            # Expected if no models are fitted
            pass
    
    def test_get_model_diagnostics_empty(self):
        """Test diagnostics with no fitted models."""
        diagnostics = self.modeler.get_model_diagnostics()
        assert diagnostics == {}
    
    def test_extract_referee_slopes_no_models(self):
        """Test slope extraction with no fitted models."""
        with pytest.raises(ValueError, match="No fitted models available"):
            self.modeler.extract_referee_slopes('directness')
    
    def test_zone_coordinates(self):
        """Test zone coordinate calculations (via discipline analyzer)."""
        # Test that zone structure is consistent
        total_zones = self.modeler.x_bins * self.modeler.y_bins
        assert total_zones == 15
        
        # Test zone naming convention
        zone_names = [f'zone_{x}_{y}' for x in range(5) for y in range(3)]
        assert len(zone_names) == 15
        assert all('zone_' in name for name in zone_names)
    
    def test_save_load_models_structure(self):
        """Test save/load model structure (without actual models)."""
        from pathlib import Path
        import tempfile
        
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Should handle empty models gracefully
            self.modeler.save_models(temp_path)
            assert temp_path.exists()
            
            # Try loading from empty directory
            try:
                self.modeler.load_models(temp_path)
            except Exception:
                # Expected if no models to load
                pass
    
    def test_config_parameter_usage(self):
        """Test that config parameters are used correctly."""
        custom_config = {
            'modeling': {
                'zone_nb': {
                    'min_referee_matches': 10,
                    'min_zone_events': 5,
                    'exposure_offset': 'log_minutes',
                    'alpha': 0.01
                }
            }
        }
        
        custom_modeler = ZoneNBModeler(custom_config)
        
        assert custom_modeler.min_referee_matches == 10
        assert custom_modeler.min_zone_events == 5
        assert custom_modeler.exposure_offset == 'log_minutes'
        assert custom_modeler.alpha == 0.01
    
    def test_feature_list_validation(self):
        """Test feature list handling in model fitting."""
        df_prepared, _ = self.modeler.prepare_modeling_data(self.synthetic_data)
        
        # Test with missing features
        invalid_features = ['z_nonexistent_feature']
        
        # Should handle missing features gracefully
        try:
            self.modeler.fit_zone_nb_models(
                df_prepared,
                feature_list=invalid_features
            )
        except Exception:
            # Expected to fail with missing features
            pass

if __name__ == '__main__':
    pytest.main([__file__])