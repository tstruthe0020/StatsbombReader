#!/usr/bin/env python3
"""
Dataset Builder for Referee-Playstyle-Discipline Analytics

Builds per team-match feature dataset from StatsBomb open data.
"""

import argparse
import logging
import time
import yaml
from pathlib import Path
import pandas as pd
import numpy as np
from typing import List, Dict, Optional
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.io_load import StatsBombLoader
from src.features import PlaystyleFeatureExtractor
from src.discipline import DisciplineAnalyzer
from src.reader.categorizer import load_config, attach_style_tags
from src.reader.archetypes import derive_archetype
from backend.server import GitHubAPIClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TeamMatchDatasetBuilder:
    """Build comprehensive team-match feature dataset."""
    
    def __init__(self, config_path: str = "config.yaml"):
        """Initialize dataset builder with configuration."""
        self.config_path = config_path
        self.config = self._load_config()
        
        # Initialize components
        self.github_client = None
        self.loader = None
        self.feature_extractor = PlaystyleFeatureExtractor(self.config.get('features', {}).get('playstyle', {}))
        self.discipline_analyzer = DisciplineAnalyzer(self.config.get('features', {}).get('discipline', {}))
        
        # Setup data directories
        self.data_dir = Path(self.config.get('paths', {}).get('data_dir', 'data'))
        self.data_dir.mkdir(parents=True, exist_ok=True)
        
        # Performance tracking
        self.stats = {
            'total_matches': 0,
            'successful_matches': 0,
            'failed_matches': 0,
            'start_time': None,
            'end_time': None
        }
    
    def _load_config(self) -> Dict:
        """Load configuration from YAML file."""
        try:
            with open(self.config_path, 'r') as f:
                config = yaml.safe_load(f)
            logger.info(f"Loaded configuration from {self.config_path}")
            return config
        except FileNotFoundError:
            logger.warning(f"Config file {self.config_path} not found, using defaults")
            return {}
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}
    
    def initialize_clients(self, github_token: str):
        """Initialize GitHub and data loading clients."""
        try:
            self.github_client = GitHubAPIClient(github_token)
            self.loader = StatsBombLoader(
                self.github_client, 
                cache_dir=self.data_dir / "cache"
            )
            logger.info("Initialized StatsBomb data clients")
        except Exception as e:
            logger.error(f"Failed to initialize clients: {e}")
            raise
    
    def get_available_competitions(self) -> pd.DataFrame:
        """Get list of available competitions."""
        competitions_df = self.loader.get_competitions()
        logger.info(f"Found {len(competitions_df)} available competitions")
        return competitions_df
    
    def build_dataset(self, competitions: List[Dict], output_file: str = None) -> pd.DataFrame:
        """
        Build comprehensive team-match dataset.
        
        Args:
            competitions: List of dicts with competition_id and season_id
            output_file: Optional output file path
            
        Returns:
            DataFrame with team-match features
        """
        self.stats['start_time'] = time.time()
        
        all_team_matches = []
        
        logger.info(f"Building dataset for {len(competitions)} competition-seasons")
        
        for comp_data in competitions:
            comp_id = comp_data['competition_id']
            season_id = comp_data['season_id']
            
            logger.info(f"Processing competition {comp_id}, season {season_id}")
            
            try:
                # Get matches for this competition/season
                matches_df = self.loader.get_matches(comp_id, season_id)
                
                if matches_df.empty:
                    logger.warning(f"No matches found for {comp_id}/{season_id}")
                    continue
                
                # Process each match
                for _, match in matches_df.iterrows():
                    match_id = match['match_id']
                    team_matches = self._process_match(match)
                    
                    if team_matches:
                        all_team_matches.extend(team_matches)
                        self.stats['successful_matches'] += 1
                    else:
                        self.stats['failed_matches'] += 1
                    
                    self.stats['total_matches'] += 1
                    
                    # Progress reporting
                    if self.stats['total_matches'] % 10 == 0:
                        logger.info(f"Processed {self.stats['total_matches']} matches "
                                  f"({self.stats['successful_matches']} successful)")
            
            except Exception as e:
                logger.error(f"Failed to process competition {comp_id}/{season_id}: {e}")
                continue
        
        # Create final dataset
        if all_team_matches:
            dataset_df = pd.DataFrame(all_team_matches)
            dataset_df = self._add_derived_features(dataset_df)
            
            # Apply style categorization and archetype computation
            cfg = load_config(self.config_path)
            per_match_tagged = attach_style_tags(dataset_df, cfg)
            per_match_tagged["style_archetype"] = per_match_tagged.apply(derive_archetype, axis=1)
            
            # Save match-level dataset with tags
            if output_file is None:
                match_output_file = self.data_dir / "match_team_features_with_tags.parquet"
            else:
                match_output_file = Path(str(output_file).replace('.parquet', '_with_tags.parquet'))
            
            per_match_tagged.to_parquet(match_output_file, index=False)
            logger.info(f"Saved match-level dataset with {len(per_match_tagged)} team-match rows to {match_output_file}")
            
            # Create season-level aggregations
            season_agg = self._create_season_aggregations(per_match_tagged)
            season_agg_tagged = attach_style_tags(season_agg, cfg)
            season_agg_tagged["style_archetype"] = season_agg_tagged.apply(derive_archetype, axis=1)
            
            # Save season-level dataset
            season_output_file = self.data_dir / "team_season_features_with_tags.parquet"
            season_agg_tagged.to_parquet(season_output_file, index=False)
            logger.info(f"Saved season-level dataset with {len(season_agg_tagged)} team-season rows to {season_output_file}")
            
            # Save slim CSV for categories
            labels_cols = [
                "competition_id","season_id","team",
                "cat_pressing","cat_block","cat_possess_dir","cat_width","cat_transition","cat_overlays",
                "style_archetype",
            ]
            cats_path = self.data_dir / "team_season_style_categories.csv"
            season_agg_tagged[labels_cols].to_csv(cats_path, index=False)
            logger.info(f"Saved style categories CSV to {cats_path}")
            
            # Save summary statistics
            self._save_dataset_summary(per_match_tagged, match_output_file)
            
            # Return match-level data for compatibility
            dataset_df = per_match_tagged
            
        else:
            logger.error("No team-match data was successfully processed")
            dataset_df = pd.DataFrame()
        
        self.stats['end_time'] = time.time()
        self._log_performance_stats()
        
        return dataset_df
    
    def _process_match(self, match_info: pd.Series) -> Optional[List[Dict]]:
        """
        Process a single match to extract team-match features.
        
        Args:
            match_info: Match information series
            
        Returns:
            List of team-match feature dictionaries
        """
        match_id = match_info['match_id']
        
        try:
            # Get match events
            events_df = self.loader.get_events(match_id)
            
            if events_df.empty:
                logger.debug(f"No events for match {match_id}")
                return None
            
            # Get team names
            home_team = match_info.get('home_team_name')
            away_team = match_info.get('away_team_name')
            
            if not home_team or not away_team:
                logger.debug(f"Missing team names for match {match_id}")
                return None
            
            # Extract referee information
            referee_id = match_info.get('referee_id')
            referee_name = match_info.get('referee_name', 'Unknown')
            
            team_matches = []
            
            # Process both teams
            for team_name, opponent_name, home_away in [
                (home_team, away_team, 'home'),
                (away_team, home_team, 'away')
            ]:
                try:
                    team_match = self._extract_team_match_features(
                        events_df, match_info, team_name, opponent_name, home_away
                    )
                    
                    if team_match:
                        team_matches.append(team_match)
                        
                except Exception as e:
                    logger.debug(f"Failed to process team {team_name} in match {match_id}: {e}")
                    continue
            
            return team_matches if team_matches else None
            
        except Exception as e:
            logger.debug(f"Failed to process match {match_id}: {e}")
            return None
    
    def _extract_team_match_features(self, events_df: pd.DataFrame, match_info: pd.Series,
                                   team_name: str, opponent_name: str, home_away: str) -> Optional[Dict]:
        """Extract comprehensive features for a team in a match."""
        
        # Basic match information
        team_match = {
            'match_id': match_info['match_id'],
            'match_date': match_info.get('match_date'),
            'team': team_name,
            'opponent': opponent_name,
            'home_away': home_away,
            'referee_id': match_info.get('referee_id'),
            'referee_name': match_info.get('referee_name', 'Unknown'),
            'competition_id': match_info.get('competition_id'),
            'season_id': match_info.get('season_id')
        }
        
        try:
            # Extract playstyle features
            playstyle_features = self.feature_extractor.extract_team_match_features(
                events_df, team_name, opponent_name
            )
            
            # Validate playstyle features
            if not self.feature_extractor.validate_features(playstyle_features):
                logger.debug(f"Invalid playstyle features for {team_name} in match {match_info['match_id']}")
                return None
            
            team_match.update(playstyle_features)
            
            # Extract discipline features
            discipline_features = self.discipline_analyzer.extract_team_match_discipline(
                events_df, team_name, opponent_name
            )
            
            # Validate discipline features
            if not self.discipline_analyzer.validate_discipline_features(discipline_features):
                logger.debug(f"Invalid discipline features for {team_name} in match {match_info['match_id']}")
                return None
            
            team_match.update(discipline_features)
            
            # Calculate exposure metrics
            exposure_metrics = self._calculate_exposure_metrics(events_df, team_name, opponent_name)
            team_match.update(exposure_metrics)
            
            return team_match
            
        except Exception as e:
            logger.debug(f"Failed to extract features for {team_name} in match {match_info['match_id']}: {e}")
            return None
    
    def _calculate_exposure_metrics(self, events_df: pd.DataFrame, team_name: str, opponent_name: str) -> Dict:
        """Calculate exposure metrics for modeling offsets."""
        
        # Count opponent passes (primary exposure metric)
        opponent_passes = events_df[
            (events_df['team_name'] == opponent_name) & 
            (events_df['event_type_name'] == 'Pass')
        ]
        
        # Estimate minutes played (simplified - would need proper match duration calculation)
        if not events_df.empty:
            max_minute = events_df['minute'].max() if 'minute' in events_df.columns else 90
            minutes_played = min(max_minute, 120)  # Cap at 120 for extra time
        else:
            minutes_played = 90
        
        # Ensure positive values for log offset
        opp_passes = max(len(opponent_passes), 1)
        minutes = max(minutes_played, 1)
        
        return {
            'opp_passes': opp_passes,
            'minutes_played': minutes,
            'log_opp_passes': np.log(opp_passes),
            'log_minutes': np.log(minutes)
        }
    
    def _add_derived_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add standardized and derived features."""
        
        # List of features to standardize for modeling
        features_to_standardize = [
            'ppda', 'directness', 'possession_share', 'block_height_x', 'wing_share',
            'avg_pass_length', 'passes_per_possession', 'counter_rate'
        ]
        
        # Standardize features (z-score)
        for feature in features_to_standardize:
            if feature in df.columns:
                # Handle infinite values in ppda
                if feature == 'ppda':
                    df[feature] = df[feature].replace([np.inf, -np.inf], df[feature][np.isfinite(df[feature])].max())
                
                # Standardize
                mean_val = df[feature].mean()
                std_val = df[feature].std()
                
                if std_val > 0:
                    df[f'z_{feature}'] = (df[feature] - mean_val) / std_val
                else:
                    df[f'z_{feature}'] = 0.0
        
        # Add interaction terms (for selected features)
        interaction_features = self.config.get('modeling', {}).get('zone_nb', {}).get('interaction_features', [])
        
        for feature in interaction_features:
            if f'z_{feature}' in df.columns and 'referee_name' in df.columns:
                # Create interaction terms with each referee
                for referee in df['referee_name'].unique():
                    if pd.notna(referee):
                        interaction_col = f'z_{feature}_ref_{referee.replace(" ", "_")}'
                        df[interaction_col] = df[f'z_{feature}'] * (df['referee_name'] == referee).astype(int)
        
        return df
    
    def _save_dataset_summary(self, df: pd.DataFrame, output_file: Path):
        """Save dataset summary statistics."""
        summary_file = output_file.parent / f"{output_file.stem}_summary.txt"
        
        with open(summary_file, 'w') as f:
            f.write("REFEREE-PLAYSTYLE-DISCIPLINE DATASET SUMMARY\n")
            f.write("=" * 50 + "\n\n")
            
            f.write(f"Dataset shape: {df.shape[0]} rows, {df.shape[1]} columns\n")
            f.write(f"Unique matches: {df['match_id'].nunique()}\n")
            f.write(f"Unique teams: {df['team'].nunique()}\n")
            f.write(f"Unique referees: {df['referee_name'].nunique()}\n")
            f.write(f"Competitions: {df['competition_id'].nunique()}\n")
            f.write(f"Seasons: {df['season_id'].nunique()}\n\n")
            
            # Feature statistics
            f.write("PLAYSTYLE FEATURES:\n")
            playstyle_features = ['ppda', 'directness', 'possession_share', 'block_height_x', 'wing_share']
            for feature in playstyle_features:
                if feature in df.columns:
                    f.write(f"  {feature}: mean={df[feature].mean():.3f}, std={df[feature].std():.3f}\n")
            
            f.write("\nDISCIPLINE FEATURES:\n")
            discipline_features = ['fouls_committed', 'yellows', 'reds', 'fouls_per_opp_pass']
            for feature in discipline_features:
                if feature in df.columns:
                    f.write(f"  {feature}: mean={df[feature].mean():.3f}, std={df[feature].std():.3f}\n")
            
            # Top referees by matches
            f.write("\nTOP REFEREES BY MATCHES:\n")
            referee_counts = df['referee_name'].value_counts().head(10)
            for referee, count in referee_counts.items():
                f.write(f"  {referee}: {count} matches\n")
        
        logger.info(f"Saved dataset summary to {summary_file}")
    
    def _log_performance_stats(self):
        """Log performance statistics."""
        duration = self.stats['end_time'] - self.stats['start_time']
        
        logger.info("=" * 50)
        logger.info("DATASET BUILDING COMPLETED")
        logger.info("=" * 50)
        logger.info(f"Total time: {duration:.2f} seconds")
        logger.info(f"Total matches processed: {self.stats['total_matches']}")
        logger.info(f"Successful matches: {self.stats['successful_matches']}")
        logger.info(f"Failed matches: {self.stats['failed_matches']}")
        logger.info(f"Success rate: {self.stats['successful_matches']/max(self.stats['total_matches'], 1)*100:.1f}%")
        
        if self.stats['total_matches'] > 0:
            logger.info(f"Average time per match: {duration/self.stats['total_matches']:.2f} seconds")

def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(description="Build referee-playstyle-discipline dataset")
    
    parser.add_argument('--config', type=str, default='config.yaml',
                       help='Configuration file path')
    parser.add_argument('--github-token', type=str, required=True,
                       help='GitHub API token')
    parser.add_argument('--competitions', type=str, nargs='+',
                       help='Competition IDs to process (format: comp_id:season_id)')
    parser.add_argument('--output', type=str,
                       help='Output file path')
    parser.add_argument('--verbose', action='store_true',
                       help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    try:
        # Initialize builder
        builder = TeamMatchDatasetBuilder(args.config)
        builder.initialize_clients(args.github_token)
        
        # Determine competitions to process
        if args.competitions:
            competitions = []
            for comp_str in args.competitions:
                try:
                    comp_id, season_id = comp_str.split(':')
                    competitions.append({
                        'competition_id': int(comp_id),
                        'season_id': int(season_id)
                    })
                except ValueError:
                    logger.error(f"Invalid competition format: {comp_str} (use comp_id:season_id)")
                    return 1
        else:
            # Use default competitions from config
            competitions = builder.config.get('default_analysis', {}).get('competitions', [])
            if not competitions:
                logger.error("No competitions specified and no defaults in config")
                return 1
        
        # Build dataset
        dataset_df = builder.build_dataset(competitions, args.output)
        
        if dataset_df.empty:
            logger.error("Failed to build dataset")
            return 1
        
        logger.info("Dataset building completed successfully")
        return 0
        
    except Exception as e:
        logger.error(f"Dataset building failed: {e}")
        return 1

if __name__ == '__main__':
    sys.exit(main())