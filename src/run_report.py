#!/usr/bin/env python3
"""
Report Generation CLI for Referee-Playstyle-Discipline Analytics

Generates referee heatmaps, forest plots, and team reports.
"""

import argparse
import logging
import yaml
from pathlib import Path
import pandas as pd
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.modeling_zone_nb import ZoneNBModeler
from src.viz_referee import RefereeVisualizer

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="Generate referee analytics reports")
    
    parser.add_argument('--config', type=str, default='config.yaml',
                       help='Configuration file path')
    parser.add_argument('--models-dir', type=str, required=True,
                       help='Directory containing fitted models')
    parser.add_argument('--output-dir', type=str,
                       help='Output directory for figures (default: from config)')
    
    # Report type selection
    report_group = parser.add_mutually_exclusive_group(required=True)
    report_group.add_argument('--heatmap', action='store_true',
                             help='Generate referee heatmap delta')
    report_group.add_argument('--forest-plot', action='store_true',
                             help='Generate forest plot')
    report_group.add_argument('--team-report', action='store_true',
                             help='Generate team scouting report')
    
    # Heatmap options
    parser.add_argument('--referee', type=str,
                       help='Referee name for heatmap/team report')
    parser.add_argument('--feature', type=str, default='directness',
                       help='Feature for analysis (default: directness)')
    parser.add_argument('--delta-sd', type=float, default=1.0,
                       help='Standard deviation change for heatmap (default: 1.0)')
    
    # Forest plot options
    parser.add_argument('--max-referees', type=int, default=15,
                       help='Maximum referees in forest plot')
    
    # Team report options
    parser.add_argument('--team-features', type=str,
                       help='JSON file with team features for report')
    
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
        
        # Setup paths
        models_dir = Path(args.models_dir)
        if not models_dir.exists():
            raise FileNotFoundError(f"Models directory not found: {models_dir}")
        
        if args.output_dir:
            output_dir = Path(args.output_dir)
        else:
            output_dir = Path(config.get('paths', {}).get('figures_dir', 'data/figs'))
        
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize components
        modeler = ZoneNBModeler(config)
        visualizer = RefereeVisualizer(config)
        
        # Load fitted models
        logger.info(f"Loading models from {models_dir}")
        modeler.load_models(models_dir)
        
        if not modeler.fitted_models:
            raise ValueError("No models were loaded successfully")
        
        # Generate reports based on type
        if args.heatmap:
            if not args.referee:
                raise ValueError("--referee is required for heatmap generation")
            
            output_file = output_dir / f'heatmap_{args.referee.replace(" ", "_")}_{args.feature}.png'
            
            fig = visualizer.create_referee_heatmap_delta(
                modeler, args.referee, args.feature, args.delta_sd, output_file
            )
            
            logger.info(f"Generated heatmap for {args.referee}")
            
        elif args.forest_plot:
            output_file = output_dir / f'forest_plot_{args.feature}.png'
            
            fig = visualizer.create_forest_plot(
                modeler, args.feature, max_referees=args.max_referees, 
                output_file=output_file
            )
            
            logger.info(f"Generated forest plot for {args.feature}")
            
        elif args.team_report:
            if not args.referee:
                raise ValueError("--referee is required for team report")
            if not args.team_features:
                raise ValueError("--team-features is required for team report")
            
            # Load team features
            import json
            with open(args.team_features, 'r') as f:
                team_features = json.load(f)
            
            output_file = output_dir / f'team_report_{args.referee.replace(" ", "_")}.png'
            
            fig = visualizer.create_team_report(
                modeler, team_features, args.referee, output_file
            )
            
            logger.info(f"Generated team report for {args.referee}")
        
        logger.info("Report generation completed successfully")
        return 0
        
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())