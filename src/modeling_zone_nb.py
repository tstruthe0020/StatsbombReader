"""
Zone-wise Negative Binomial Modeling

Implements zone-wise Negative Binomial GLMs with playstyle × referee interactions
for modeling disciplinary outcomes across field zones.
"""

import numpy as np
import pandas as pd
import logging
from typing import Dict, List, Optional, Tuple, Any
import pickle
from pathlib import Path
import warnings
from scipy import stats
from collections import defaultdict

# Statistical modeling
import statsmodels.api as sm
import statsmodels.formula.api as smf
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score

logger = logging.getLogger(__name__)

class ZoneNBModeler:
    """Zone-wise Negative Binomial modeling for referee-playstyle interactions."""
    
    def __init__(self, config: Dict = None):
        """
        Initialize zone-wise modeler.
        
        Args:
            config: Configuration dictionary
        """
        self.config = config or {}
        self.modeling_config = self.config.get('modeling', {}).get('zone_nb', {})
        
        # Model parameters
        self.exposure_offset = self.modeling_config.get('exposure_offset', 'log_opp_passes')
        self.alpha = self.modeling_config.get('alpha', 0.05)
        self.standardize_features = self.modeling_config.get('standardize_features', True)
        self.interaction_features = self.modeling_config.get('interaction_features', ['directness', 'ppda'])
        
        # Data requirements
        self.min_referee_matches = self.modeling_config.get('min_referee_matches', 5)
        self.min_zone_events = self.modeling_config.get('min_zone_events', 3)
        
        # Zone configuration (5x3 grid)
        self.x_bins = 5
        self.y_bins = 3
        self.total_zones = self.x_bins * self.y_bins
        
        # Storage for fitted models
        self.fitted_models = {}
        self.model_summaries = {}
        self.feature_importance = {}
        
        logger.info(f"Initialized zone NB modeler: {self.total_zones} zones, "
                   f"interactions: {self.interaction_features}")
    
    def prepare_modeling_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        """
        Prepare data for zone-wise modeling.
        
        Args:
            df: Team-match dataset
            
        Returns:
            Tuple of (prepared_df, preparation_info)
        """
        logger.info(f"Preparing modeling data from {len(df)} team-matches")
        
        # Filter by minimum referee matches
        referee_counts = df['referee_name'].value_counts()
        valid_referees = referee_counts[referee_counts >= self.min_referee_matches].index
        
        df_filtered = df[df['referee_name'].isin(valid_referees)].copy()
        logger.info(f"Filtered to {len(df_filtered)} matches with {len(valid_referees)} referees "
                   f"(min {self.min_referee_matches} matches each)")
        
        # Ensure required columns exist
        required_cols = ['referee_name', self.exposure_offset] + \
                       [f'foul_grid_x{x}_y{y}' for x in range(self.x_bins) for y in range(self.y_bins)]
        
        missing_cols = [col for col in required_cols if col not in df_filtered.columns]
        if missing_cols:
            raise ValueError(f"Missing required columns: {missing_cols}")
        
        # Handle categorical referee variable
        df_filtered['referee_cat'] = df_filtered['referee_name'].astype('category')
        
        # Add home/away indicator
        df_filtered['home_indicator'] = (df_filtered['home_away'] == 'home').astype(int)
        
        # Preparation info
        prep_info = {
            'original_rows': len(df),
            'filtered_rows': len(df_filtered),
            'unique_referees': len(valid_referees),
            'zones_analyzed': self.total_zones,
            'exposure_metric': self.exposure_offset
        }
        
        return df_filtered, prep_info
    
    def fit_zone_nb_models(self, df: pd.DataFrame, feature_list: List[str] = None, 
                          interaction_features: List[str] = None) -> Dict[str, Any]:
        """
        Fit Negative Binomial GLMs for each zone.
        
        Args:
            df: Prepared modeling dataset
            feature_list: List of features to include
            interaction_features: Features to interact with referee
            
        Returns:
            Dictionary of fitted models by zone
        """
        if feature_list is None:
            feature_list = ['z_ppda', 'z_directness', 'z_possession_share', 
                           'z_block_height_x', 'z_wing_share']
        
        if interaction_features is None:
            interaction_features = self.interaction_features
        
        logger.info(f"Fitting NB models for {self.total_zones} zones")
        logger.info(f"Base features: {feature_list}")
        logger.info(f"Interaction features: {interaction_features}")
        
        self.fitted_models = {}
        self.model_summaries = {}
        
        # Prepare formula components
        base_features_str = ' + '.join(feature_list)
        
        # Add home/away control
        controls_str = 'home_indicator'
        
        # Build referee fixed effects
        referee_fe_str = 'C(referee_name)'
        
        # Build interaction terms
        interaction_terms = []
        for feature in interaction_features:
            if f'z_{feature}' in df.columns:
                interaction_terms.append(f'z_{feature}:C(referee_name)')
        
        interaction_str = ' + '.join(interaction_terms) if interaction_terms else ''
        
        # Combine formula parts
        formula_parts = [base_features_str, controls_str, referee_fe_str]
        if interaction_str:
            formula_parts.append(interaction_str)
        
        fixed_part = ' + '.join(formula_parts)
        
        # Fit model for each zone
        for x in range(self.x_bins):
            for y in range(self.y_bins):
                zone_id = f'zone_{x}_{y}'
                response_var = f'foul_grid_x{x}_y{y}'
                
                try:
                    model_result = self._fit_single_zone_model(
                        df, response_var, fixed_part, zone_id
                    )
                    
                    if model_result is not None:
                        self.fitted_models[zone_id] = model_result
                        self.model_summaries[zone_id] = self._extract_model_summary(model_result, zone_id)
                    
                except Exception as e:
                    logger.warning(f"Failed to fit model for {zone_id}: {e}")
                    continue
        
        logger.info(f"Successfully fitted {len(self.fitted_models)} zone models")
        return self.fitted_models
    
    def _fit_single_zone_model(self, df: pd.DataFrame, response_var: str, 
                              fixed_part: str, zone_id: str) -> Optional[Any]:
        """Fit NB GLM for a single zone."""
        
        # Check if zone has sufficient events
        total_events = df[response_var].sum()
        if total_events < self.min_zone_events:
            logger.debug(f"Skipping {zone_id}: only {total_events} events")
            return None
        
        # Build full formula
        formula = f'{response_var} ~ {fixed_part}'
        
        try:
            # Fit Negative Binomial GLM with exposure offset
            with warnings.catch_warnings():
                warnings.filterwarnings('ignore', category=RuntimeWarning)
                
                model = smf.glm(
                    formula=formula,
                    data=df,
                    family=sm.families.NegativeBinomial(),
                    offset=df[self.exposure_offset]
                ).fit()
            
            # Check convergence
            if not model.converged:
                logger.warning(f"Model for {zone_id} did not converge")
                return None
            
            # Basic model validation
            if model.aic is None or np.isnan(model.aic):
                logger.warning(f"Invalid AIC for {zone_id}")
                return None
            
            logger.debug(f"Fitted {zone_id}: AIC={model.aic:.2f}, events={total_events}")
            return model
            
        except Exception as e:
            logger.debug(f"Failed to fit {zone_id}: {e}")
            return None
    
    def _extract_model_summary(self, model: Any, zone_id: str) -> Dict:
        """Extract summary statistics from fitted model."""
        
        summary = {
            'zone_id': zone_id,
            'aic': model.aic,
            'bic': getattr(model, 'bic', None),
            'llf': model.llf,
            'converged': model.converged,
            'nobs': model.nobs,
            'df_model': model.df_model,
            'df_resid': model.df_resid
        }
        
        # Extract coefficient information
        params_df = model.summary2().tables[1]  # Coefficient table
        
        summary['coefficients'] = {
            'names': list(params_df.index),
            'estimates': list(params_df['Coef.']),
            'std_errors': list(params_df['Std.Err.']),
            'pvalues': list(params_df['P>|z|']),
            'conf_int_lower': list(params_df['[0.025']),
            'conf_int_upper': list(params_df['0.975]'])
        }
        
        return summary
    
    def extract_referee_slopes(self, interaction_feature: str) -> pd.DataFrame:
        """
        Extract referee-specific slopes for an interaction feature.
        
        Args:
            interaction_feature: Feature name (e.g., 'directness')
            
        Returns:
            DataFrame with referee slopes by zone
        """
        if not self.fitted_models:
            raise ValueError("No fitted models available. Run fit_zone_nb_models first.")
        
        slopes_data = []
        
        # Get standardized feature name
        z_feature = f'z_{interaction_feature}'
        
        for zone_id, model in self.fitted_models.items():
            try:
                params = model.params
                std_errors = model.bse
                pvalues = model.pvalues
                
                # Find interaction terms for this feature
                for param_name in params.index:
                    if f'{z_feature}:C(referee_name)' in param_name:
                        # Extract referee name from parameter
                        referee_part = param_name.split(f'{z_feature}:C(referee_name)[T.')[-1]
                        referee_name = referee_part.rstrip(']')
                        
                        slope_data = {
                            'zone': zone_id,
                            'referee_name': referee_name,
                            'feature': interaction_feature,
                            'slope': params[param_name],
                            'se': std_errors[param_name],
                            'pvalue': pvalues[param_name],
                            'significant': pvalues[param_name] < self.alpha
                        }
                        
                        slopes_data.append(slope_data)
                        
            except Exception as e:
                logger.debug(f"Failed to extract slopes for {zone_id}: {e}")
                continue
        
        if not slopes_data:
            logger.warning(f"No interaction slopes found for {interaction_feature}")
            return pd.DataFrame()
        
        slopes_df = pd.DataFrame(slopes_data)
        logger.info(f"Extracted {len(slopes_df)} referee slopes for {interaction_feature}")
        
        return slopes_df
    
    def predict_expected_fouls(self, df_row: pd.Series) -> Dict[str, float]:
        """
        Predict expected fouls per zone for a team-match scenario.
        
        Args:
            df_row: Row with team-match features
            
        Returns:
            Dictionary of expected fouls by zone
        """
        if not self.fitted_models:
            raise ValueError("No fitted models available. Run fit_zone_nb_models first.")
        
        predictions = {}
        
        for zone_id, model in self.fitted_models.items():
            try:
                # Create single-row dataframe for prediction
                pred_df = pd.DataFrame([df_row])
                
                # Predict expected count
                expected_count = model.predict(pred_df)[0]
                predictions[zone_id] = expected_count
                
            except Exception as e:
                logger.debug(f"Failed to predict for {zone_id}: {e}")
                predictions[zone_id] = 0.0
        
        return predictions
    
    def calculate_referee_effects(self, baseline_referee: str = None) -> pd.DataFrame:
        """
        Calculate referee effects relative to baseline.
        
        Args:
            baseline_referee: Reference referee (if None, uses model's reference category)
            
        Returns:
            DataFrame with referee effects by zone
        """
        if not self.fitted_models:
            raise ValueError("No fitted models available")
        
        effects_data = []
        
        for zone_id, model in self.fitted_models.items():
            try:
                params = model.params
                std_errors = model.bse
                pvalues = model.pvalues
                
                # Find referee fixed effects
                for param_name in params.index:
                    if 'C(referee_name)[T.' in param_name and ']:' not in param_name:
                        # Extract referee name
                        referee_name = param_name.split('C(referee_name)[T.')[-1].rstrip(']')
                        
                        effect_data = {
                            'zone': zone_id,
                            'referee_name': referee_name,
                            'effect': params[param_name],
                            'se': std_errors[param_name],
                            'pvalue': pvalues[param_name],
                            'significant': pvalues[param_name] < self.alpha
                        }
                        
                        effects_data.append(effect_data)
                        
            except Exception as e:
                logger.debug(f"Failed to extract effects for {zone_id}: {e}")
                continue
        
        if not effects_data:
            return pd.DataFrame()
        
        effects_df = pd.DataFrame(effects_data)
        return effects_df
    
    def save_models(self, output_dir: Path):
        """Save fitted models and summaries."""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save individual models
        models_saved = 0
        for zone_id, model in self.fitted_models.items():
            try:
                model_file = output_dir / f'{zone_id}.pkl'
                with open(model_file, 'wb') as f:
                    pickle.dump(model, f)
                models_saved += 1
            except Exception as e:
                logger.error(f"Failed to save model for {zone_id}: {e}")
        
        # Save model summaries
        if self.model_summaries:
            summary_df = pd.DataFrame.from_dict(self.model_summaries, orient='index')
            summary_file = output_dir / 'model_summaries.csv'
            summary_df.to_csv(summary_file)
        
        # Save referee slopes for each interaction feature
        for feature in self.interaction_features:
            try:
                slopes_df = self.extract_referee_slopes(feature)
                if not slopes_df.empty:
                    slopes_file = output_dir / f'referee_slopes_{feature}.csv'
                    slopes_df.to_csv(slopes_file, index=False)
            except Exception as e:
                logger.error(f"Failed to save slopes for {feature}: {e}")
        
        logger.info(f"Saved {models_saved} models and summaries to {output_dir}")
    
    def load_models(self, input_dir: Path):
        """Load previously fitted models."""
        input_dir = Path(input_dir)
        
        if not input_dir.exists():
            raise FileNotFoundError(f"Model directory not found: {input_dir}")
        
        self.fitted_models = {}
        models_loaded = 0
        
        # Load individual zone models
        for x in range(self.x_bins):
            for y in range(self.y_bins):
                zone_id = f'zone_{x}_{y}'
                model_file = input_dir / f'{zone_id}.pkl'
                
                if model_file.exists():
                    try:
                        with open(model_file, 'rb') as f:
                            self.fitted_models[zone_id] = pickle.load(f)
                        models_loaded += 1
                    except Exception as e:
                        logger.error(f"Failed to load model for {zone_id}: {e}")
        
        # Load model summaries if available
        summary_file = input_dir / 'model_summaries.csv'
        if summary_file.exists():
            summary_df = pd.read_csv(summary_file, index_col=0)
            self.model_summaries = summary_df.to_dict('index')
        
        logger.info(f"Loaded {models_loaded} zone models from {input_dir}")
    
    def get_model_diagnostics(self) -> Dict:
        """Get comprehensive model diagnostics."""
        if not self.fitted_models:
            return {}
        
        diagnostics = {
            'total_models': len(self.fitted_models),
            'convergence_rate': sum(1 for m in self.fitted_models.values() if m.converged) / len(self.fitted_models),
            'average_aic': np.mean([m.aic for m in self.fitted_models.values()]),
            'average_nobs': np.mean([m.nobs for m in self.fitted_models.values()]),
            'zones_analyzed': list(self.fitted_models.keys())
        }
        
        # Feature significance summary
        if self.model_summaries:
            significant_terms = defaultdict(int)
            total_terms = defaultdict(int)
            
            for zone_summary in self.model_summaries.values():
                coeffs = zone_summary.get('coefficients', {})
                names = coeffs.get('names', [])
                pvalues = coeffs.get('pvalues', [])
                
                for name, pval in zip(names, pvalues):
                    total_terms[name] += 1
                    if pval < self.alpha:
                        significant_terms[name] += 1
            
            diagnostics['feature_significance'] = {
                name: significant_terms[name] / total_terms[name] 
                for name in total_terms.keys()
            }
        
        return diagnostics