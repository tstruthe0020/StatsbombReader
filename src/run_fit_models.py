#!/usr/bin/env python3
"""
Model Fitting CLI for Referee-Playstyle-Discipline Analytics

Fits zone-wise Negative Binomial GLMs and exports model artifacts.
"""

import argparse
import logging
import time
import yaml
from pathlib import Path
import pandas as pd
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.modeling_zone_nb import ZoneNBModeler

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="Fit referee-playstyle zone models")
    
    parser.add_argument('--config', type=str, default='config.yaml',
                       help='Configuration file path')
    parser.add_argument('--dataset', type=str, required=True,
                       help='Input dataset file path')
    parser.add_argument('--output-dir', type=str,
                       help='Output directory for models (default: from config)')
    parser.add_argument('--zones', type=str, default='5x3',
                       help='Zone grid dimensions (e.g., "5x3")')
    parser.add_argument('--features', type=str, 
                       default='ppda,directness,possession_share,block_height_x,wing_share',
                       help='Comma-separated list of base features')
    parser.add_argument('--interactions', type=str,
                       default='directness,ppda',
                       help='Comma-separated list of interaction features')
    parser.add_argument('--min-referee-matches', type=int, default=5,
                       help='Minimum matches per referee')
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Load configuration
        config = {}
        if Path(args.config).exists():
            with open(args.config, 'r') as f:
                config = yaml.safe_load(f)
        
        # Override config with CLI arguments
        if not config.get('modeling'):
            config['modeling'] = {}
        if not config['modeling'].get('zone_nb'):
            config['modeling']['zone_nb'] = {}
        
        config['modeling']['zone_nb']['min_referee_matches'] = args.min_referee_matches
        
        # Setup paths
        if args.output_dir:
            output_dir = Path(args.output_dir)
        else:
            output_dir = Path(config.get('paths', {}).get('models_dir', 'data/models_nb_zone'))
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Load dataset
        logger.info(f"Loading dataset from {args.dataset}")
        dataset_df = pd.read_parquet(args.dataset)
        logger.info(f"Loaded dataset with {len(dataset_df)} team-matches")
        
        # Initialize modeler
        modeler = ZoneNBModeler(config)
        
        # Prepare data
        df_prepared, prep_info = modeler.prepare_modeling_data(dataset_df)
        logger.info(f"Prepared data: {prep_info}")
        
        # Parse features
        base_features = [f'z_{f.strip()}' for f in args.features.split(',')]
        interaction_features = [f.strip() for f in args.interactions.split(',')]
        
        # Fit models
        logger.info("Fitting zone-wise NB models...")
        start_time = time.time()
        
        fitted_models = modeler.fit_zone_nb_models(
            df_prepared,
            feature_list=base_features,
            interaction_features=interaction_features
        )
        
        fit_time = time.time() - start_time
        logger.info(f"Model fitting completed in {fit_time:.2f} seconds")
        
        # Save models and artifacts
        logger.info(f"Saving models to {output_dir}")
        modeler.save_models(output_dir)
        
        # Generate diagnostics
        diagnostics = modeler.get_model_diagnostics()
        
        # Save diagnostics
        diagnostics_file = output_dir / 'model_diagnostics.yaml'
        with open(diagnostics_file, 'w') as f:
            yaml.dump(diagnostics, f, default_flow_style=False)
        
        logger.info("Model fitting completed successfully")
        logger.info(f"Models fitted: {diagnostics['total_models']}")
        logger.info(f"Convergence rate: {diagnostics['convergence_rate']:.2%}")
        logger.info(f"Average AIC: {diagnostics['average_aic']:.2f}")
        
        return 0
        
    except Exception as e:
        logger.error(f"Model fitting failed: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())