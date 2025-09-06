"""
StatsBomb Data Loading Utilities

Provides efficient loading and caching of StatsBomb open data including
competitions, matches, events, and lineups.
"""

import os
import json
import logging
import pandas as pd
from typing import Dict, List, Optional, Tuple
from pathlib import Path
import time
from datetime import datetime

logger = logging.getLogger(__name__)

class StatsBombLoader:
    """Efficient StatsBomb data loader with caching capabilities."""
    
    def __init__(self, github_client, cache_dir: str = "data/cache"):
        """
        Initialize StatsBomb data loader.
        
        Args:
            github_client: Initialized GitHub API client
            cache_dir: Directory for caching data
        """
        self.github_client = github_client
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Performance tracking
        self.load_times = {}
        
    def get_competitions(self, use_cache: bool = True) -> pd.DataFrame:
        """
        Load competitions data.
        
        Args:
            use_cache: Whether to use cached data if available
            
        Returns:
            DataFrame with competition information
        """
        cache_file = self.cache_dir / "competitions.parquet"
        
        if use_cache and cache_file.exists():
            logger.info("Loading competitions from cache")
            return pd.read_parquet(cache_file)
        
        logger.info("Fetching competitions from StatsBomb API")
        start_time = time.time()
        
        try:
            competitions_data = self.github_client.get_competitions_data()
            df = pd.DataFrame(competitions_data)
            
            # Save to cache
            df.to_parquet(cache_file)
            
            load_time = time.time() - start_time
            self.load_times['competitions'] = load_time
            logger.info(f"Loaded {len(df)} competitions in {load_time:.2f}s")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to load competitions: {e}")
            raise
    
    def get_matches(self, competition_id: int, season_id: int, use_cache: bool = True) -> pd.DataFrame:
        """
        Load matches for a specific competition and season.
        
        Args:
            competition_id: Competition ID
            season_id: Season ID
            use_cache: Whether to use cached data
            
        Returns:
            DataFrame with match information
        """
        cache_file = self.cache_dir / f"matches_{competition_id}_{season_id}.parquet"
        
        if use_cache and cache_file.exists():
            logger.info(f"Loading matches from cache: {competition_id}/{season_id}")
            return pd.read_parquet(cache_file)
        
        logger.info(f"Fetching matches: {competition_id}/{season_id}")
        start_time = time.time()
        
        try:
            matches_data = self.github_client.get_matches_data(competition_id, season_id)
            df = pd.DataFrame(matches_data)
            
            # Extract and flatten nested referee data
            if 'referee' in df.columns:
                referee_data = df['referee'].apply(lambda x: x if isinstance(x, dict) else {})
                df['referee_id'] = referee_data.apply(lambda x: x.get('id'))
                df['referee_name'] = referee_data.apply(lambda x: x.get('name'))
            
            # Extract team names
            if 'home_team' in df.columns:
                df['home_team_name'] = df['home_team'].apply(lambda x: x.get('home_team_name') if isinstance(x, dict) else None)
                df['home_team_id'] = df['home_team'].apply(lambda x: x.get('home_team_id') if isinstance(x, dict) else None)
            
            if 'away_team' in df.columns:
                df['away_team_name'] = df['away_team'].apply(lambda x: x.get('away_team_name') if isinstance(x, dict) else None)
                df['away_team_id'] = df['away_team'].apply(lambda x: x.get('away_team_id') if isinstance(x, dict) else None)
            
            # Add metadata
            df['competition_id'] = competition_id
            df['season_id'] = season_id
            
            # Save to cache
            df.to_parquet(cache_file)
            
            load_time = time.time() - start_time
            self.load_times[f'matches_{competition_id}_{season_id}'] = load_time
            logger.info(f"Loaded {len(df)} matches in {load_time:.2f}s")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to load matches {competition_id}/{season_id}: {e}")
            raise
    
    def get_events(self, match_id: int, use_cache: bool = True) -> pd.DataFrame:
        """
        Load events for a specific match.
        
        Args:
            match_id: Match ID
            use_cache: Whether to use cached data
            
        Returns:
            DataFrame with event data
        """
        cache_file = self.cache_dir / f"events_{match_id}.parquet"
        
        if use_cache and cache_file.exists():
            return pd.read_parquet(cache_file)
        
        logger.debug(f"Fetching events: {match_id}")
        start_time = time.time()
        
        try:
            events_data = self.github_client.get_events_data(match_id)
            df = pd.DataFrame(events_data)
            
            if df.empty:
                logger.warning(f"No events found for match {match_id}")
                return df
            
            # Flatten nested columns for easier analysis
            df = self._flatten_event_data(df)
            
            # Add match_id for joining
            df['match_id'] = match_id
            
            # Save to cache
            df.to_parquet(cache_file)
            
            load_time = time.time() - start_time
            logger.debug(f"Loaded {len(df)} events for match {match_id} in {load_time:.2f}s")
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to load events for match {match_id}: {e}")
            raise
    
    def _flatten_event_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Flatten nested event data for easier analysis.
        
        Args:
            df: Raw events DataFrame
            
        Returns:
            Flattened DataFrame
        """
        # Extract common nested fields
        if 'type' in df.columns:
            df['event_type_id'] = df['type'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['event_type_name'] = df['type'].apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        if 'team' in df.columns:
            df['team_id'] = df['team'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['team_name'] = df['team'].apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        if 'player' in df.columns:
            df['player_id'] = df['player'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['player_name'] = df['player'].apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        if 'position' in df.columns:
            df['position_id'] = df['position'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['position_name'] = df['position'].apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        if 'possession_team' in df.columns:
            df['possession_team_id'] = df['possession_team'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['possession_team_name'] = df['possession_team'].apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        if 'play_pattern' in df.columns:
            df['play_pattern_id'] = df['play_pattern'].apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['play_pattern_name'] = df['play_pattern'].apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        # Handle pass data
        if 'pass' in df.columns:
            pass_data = df['pass'].apply(lambda x: x if isinstance(x, dict) else {})
            df['pass_end_location'] = pass_data.apply(lambda x: x.get('end_location'))
            df['pass_length'] = pass_data.apply(lambda x: x.get('length'))
            df['pass_angle'] = pass_data.apply(lambda x: x.get('angle'))
            df['pass_cross'] = pass_data.apply(lambda x: x.get('cross', False))
            df['pass_through_ball'] = pass_data.apply(lambda x: x.get('through_ball', False))
            
            # Pass recipient
            recipient = pass_data.apply(lambda x: x.get('recipient', {}))
            df['pass_recipient_id'] = recipient.apply(lambda x: x.get('id') if isinstance(x, dict) else None)
            df['pass_recipient_name'] = recipient.apply(lambda x: x.get('name') if isinstance(x, dict) else None)
        
        # Handle carry data
        if 'carry' in df.columns:
            carry_data = df['carry'].apply(lambda x: x if isinstance(x, dict) else {})
            df['carry_end_location'] = carry_data.apply(lambda x: x.get('end_location'))
        
        # Handle shot data
        if 'shot' in df.columns:
            shot_data = df['shot'].apply(lambda x: x if isinstance(x, dict) else {})
            df['shot_statsbomb_xg'] = shot_data.apply(lambda x: x.get('statsbomb_xg'))
            df['shot_outcome'] = shot_data.apply(lambda x: x.get('outcome', {}).get('name') if isinstance(x.get('outcome'), dict) else None)
        
        # Handle foul data
        if 'foul_committed' in df.columns:
            foul_data = df['foul_committed'].apply(lambda x: x if isinstance(x, dict) else {})
            df['foul_type'] = foul_data.apply(lambda x: x.get('type', {}).get('name') if isinstance(x.get('type'), dict) else None)
            df['foul_card'] = foul_data.apply(lambda x: x.get('card', {}).get('name') if isinstance(x.get('card'), dict) else None)
        
        return df
    
    def get_lineups(self, match_id: int, use_cache: bool = True) -> pd.DataFrame:
        """
        Load lineup data for a specific match.
        
        Args:
            match_id: Match ID
            use_cache: Whether to use cached data
            
        Returns:
            DataFrame with lineup information
        """
        cache_file = self.cache_dir / f"lineups_{match_id}.parquet"
        
        if use_cache and cache_file.exists():
            return pd.read_parquet(cache_file)
        
        # For now, lineups are extracted from Starting XI events
        # This could be extended to load dedicated lineup files
        events_df = self.get_events(match_id, use_cache)
        
        lineup_events = events_df[events_df['event_type_name'] == 'Starting XI'].copy()
        
        if lineup_events.empty:
            logger.warning(f"No lineup data found for match {match_id}")
            return pd.DataFrame()
        
        # Extract tactics formation and lineup
        lineups = []
        for _, event in lineup_events.iterrows():
            if 'tactics' in event and isinstance(event['tactics'], dict):
                tactics = event['tactics']
                formation = tactics.get('formation')
                lineup = tactics.get('lineup', [])
                
                for player in lineup:
                    lineups.append({
                        'match_id': match_id,
                        'team_id': event['team_id'],
                        'team_name': event['team_name'],
                        'player_id': player.get('player', {}).get('id'),
                        'player_name': player.get('player', {}).get('name'),
                        'jersey_number': player.get('jersey_number'),
                        'position_id': player.get('position', {}).get('id'),
                        'position_name': player.get('position', {}).get('name'),
                        'formation': formation
                    })
        
        lineup_df = pd.DataFrame(lineups)
        
        # Save to cache
        if not lineup_df.empty:
            lineup_df.to_parquet(cache_file)
        
        return lineup_df
    
    def get_batch_events(self, match_ids: List[int], use_cache: bool = True) -> pd.DataFrame:
        """
        Load events for multiple matches efficiently.
        
        Args:
            match_ids: List of match IDs
            use_cache: Whether to use cached data
            
        Returns:
            Combined DataFrame with events from all matches
        """
        all_events = []
        failed_matches = []
        
        logger.info(f"Loading events for {len(match_ids)} matches")
        
        for i, match_id in enumerate(match_ids):
            try:
                events_df = self.get_events(match_id, use_cache)
                if not events_df.empty:
                    all_events.append(events_df)
                
                if (i + 1) % 10 == 0:
                    logger.info(f"Processed {i + 1}/{len(match_ids)} matches")
                    
            except Exception as e:
                logger.error(f"Failed to load events for match {match_id}: {e}")
                failed_matches.append(match_id)
        
        if failed_matches:
            logger.warning(f"Failed to load {len(failed_matches)} matches: {failed_matches}")
        
        if not all_events:
            logger.warning("No events loaded successfully")
            return pd.DataFrame()
        
        combined_df = pd.concat(all_events, ignore_index=True)
        logger.info(f"Combined {len(combined_df)} events from {len(all_events)} matches")
        
        return combined_df
    
    def clear_cache(self, pattern: Optional[str] = None):
        """
        Clear cached data files.
        
        Args:
            pattern: Optional pattern to match files (e.g., "matches_*")
        """
        if pattern:
            files_to_remove = list(self.cache_dir.glob(pattern))
        else:
            files_to_remove = list(self.cache_dir.glob("*"))
        
        for file_path in files_to_remove:
            if file_path.is_file():
                file_path.unlink()
                logger.info(f"Removed cache file: {file_path}")
        
        logger.info(f"Cleared {len(files_to_remove)} cache files")
    
    def get_performance_stats(self) -> Dict:
        """Get performance statistics for data loading."""
        return {
            'load_times': self.load_times,
            'total_load_time': sum(self.load_times.values()),
            'average_load_time': sum(self.load_times.values()) / len(self.load_times) if self.load_times else 0
        }