#!/usr/bin/env python3
"""
Create sample tactical archetype data for demonstration purposes.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import sys
import os

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from src.reader.categorizer import load_config, attach_style_tags
from src.reader.archetypes import derive_archetype

def create_sample_match_data():
    """Create sample match-level tactical archetype data."""
    
    # Sample match data with different tactical styles
    sample_matches = [
        {
            # Barcelona vs Atletico Madrid - High-Press Possession vs Low-Block Counter
            'match_id': 3773386,
            'match_date': '2021-05-08',
            'team': 'Barcelona',
            'opponent': 'Atletico Madrid',
            'home_away': 'home',
            'referee_name': 'Antonio Mateu Lahoz',
            'competition_id': 11,
            'season_id': 90,
            
            # High-Press Possession style
            'ppda': 9.2,
            'def_share_att_third': 0.38,
            'block_height_x': 78.5,
            'possession_share': 0.67,
            'directness': 0.32,
            'wing_share': 0.48,
            'lane_center_share': 0.52,
            'cross_share': 0.08,
            'counter_rate': 0.06,
            'fouls_committed': 14,
            'yellows': 2,
            'reds': 0
        },
        {
            'match_id': 3773386,
            'match_date': '2021-05-08',
            'team': 'Atletico Madrid',
            'opponent': 'Barcelona',
            'home_away': 'away',
            'referee_name': 'Antonio Mateu Lahoz',
            'competition_id': 11,
            'season_id': 90,
            
            # Low-Block Counter style
            'ppda': 24.8,
            'def_share_att_third': 0.12,
            'block_height_x': 32.1,
            'possession_share': 0.33,
            'directness': 0.78,
            'wing_share': 0.82,
            'lane_center_share': 0.18,
            'cross_share': 0.16,
            'counter_rate': 0.31,
            'fouls_committed': 8,
            'yellows': 3,
            'reds': 0
        },
        {
            # Bayern Munich vs Dortmund - High-Press Direct vs Mid-Block Possession
            'match_id': 3773400,
            'match_date': '2021-05-17',
            'team': 'Bayern Munich',
            'opponent': 'Borussia Dortmund',
            'home_away': 'home',
            'referee_name': 'Felix Brych',
            'competition_id': 9,
            'season_id': 44,
            
            # High-Press Direct style
            'ppda': 8.9,
            'def_share_att_third': 0.41,
            'block_height_x': 81.2,
            'possession_share': 0.52,
            'directness': 0.69,
            'wing_share': 0.71,
            'lane_center_share': 0.29,
            'cross_share': 0.11,
            'counter_rate': 0.18,
            'fouls_committed': 12,
            'yellows': 1,
            'reds': 0
        },
        {
            'match_id': 3773400,
            'match_date': '2021-05-17',
            'team': 'Borussia Dortmund',
            'opponent': 'Bayern Munich',
            'home_away': 'away',
            'referee_name': 'Felix Brych',
            'competition_id': 9,
            'season_id': 44,
            
            # Mid-Block Possession style
            'ppda': 14.5,
            'def_share_att_third': 0.28,
            'block_height_x': 58.7,
            'possession_share': 0.48,
            'directness': 0.38,
            'wing_share': 0.45,
            'lane_center_share': 0.55,
            'cross_share': 0.07,
            'counter_rate': 0.11,
            'fouls_committed': 16,
            'yellows': 2,
            'reds': 1
        },
        {
            # Liverpool vs Chelsea - High-Press Possession + Wing Overload Crossers
            'match_id': 3773420,
            'match_date': '2021-05-20',
            'team': 'Liverpool',
            'opponent': 'Chelsea',
            'home_away': 'home',
            'referee_name': 'Michael Oliver',
            'competition_id': 2,
            'season_id': 44,
            
            # High-Press Possession + Wing Overload Crossers
            'ppda': 10.1,
            'def_share_att_third': 0.35,
            'block_height_x': 74.8,
            'possession_share': 0.61,
            'directness': 0.36,
            'wing_share': 0.79,
            'lane_center_share': 0.21,
            'cross_share': 0.15,
            'counter_rate': 0.09,
            'fouls_committed': 11,
            'yellows': 1,
            'reds': 0
        },
        {
            'match_id': 3773420,
            'match_date': '2021-05-20',
            'team': 'Chelsea',
            'opponent': 'Liverpool',
            'home_away': 'away',
            'referee_name': 'Michael Oliver',
            'competition_id': 2,
            'season_id': 44,
            
            # Mid-Block Balanced style
            'ppda': 15.2,
            'def_share_att_third': 0.22,
            'block_height_x': 61.4,
            'possession_share': 0.39,
            'directness': 0.51,
            'wing_share': 0.58,
            'lane_center_share': 0.42,
            'cross_share': 0.09,
            'counter_rate': 0.13,
            'fouls_committed': 13,
            'yellows': 2,
            'reds': 0
        }
    ]
    
    return pd.DataFrame(sample_matches)

def create_sample_season_data():
    """Create sample season-level tactical archetype data."""
    
    sample_seasons = [
        {
            'team': 'Barcelona',
            'competition_id': 11,
            'season_id': 90,
            'matches_played': 38,
            
            # High-Press Possession style (season averages)
            'ppda': 9.8,
            'def_share_att_third': 0.36,
            'block_height_x': 76.2,
            'possession_share': 0.64,
            'directness': 0.34,
            'wing_share': 0.51,
            'lane_center_share': 0.49,
            'cross_share': 0.09,
            'counter_rate': 0.08,
            'fouls_committed': 456,  # Season total
            'yellows': 67,
            'reds': 3,
            'unique_referees': 18,
            'total_referee_encounters': 38
        },
        {
            'team': 'Atletico Madrid',
            'competition_id': 11,
            'season_id': 90,
            'matches_played': 38,
            
            # Low-Block Counter + Set-Piece Focus
            'ppda': 22.4,
            'def_share_att_third': 0.14,
            'block_height_x': 36.8,
            'possession_share': 0.42,
            'directness': 0.72,
            'wing_share': 0.76,
            'lane_center_share': 0.24,
            'cross_share': 0.14,
            'counter_rate': 0.28,
            'fouls_committed': 312,  # Low fouls = disciplined
            'yellows': 89,
            'reds': 4,
            'unique_referees': 17,
            'total_referee_encounters': 38
        },
        {
            'team': 'Bayern Munich',
            'competition_id': 9,
            'season_id': 44,
            'matches_played': 34,
            
            # High-Press Direct
            'ppda': 9.1,
            'def_share_att_third': 0.39,
            'block_height_x': 79.5,
            'possession_share': 0.58,
            'directness': 0.65,
            'wing_share': 0.68,
            'lane_center_share': 0.32,
            'cross_share': 0.12,
            'counter_rate': 0.16,
            'fouls_committed': 378,
            'yellows': 54,
            'reds': 2,
            'unique_referees': 16,
            'total_referee_encounters': 34
        },
        {
            'team': 'Liverpool',
            'competition_id': 2,
            'season_id': 44,
            'matches_played': 38,
            
            # High-Press Possession + Wing Overload Crossers  
            'ppda': 10.5,
            'def_share_att_third': 0.33,
            'block_height_x': 73.1,
            'possession_share': 0.59,
            'directness': 0.38,
            'wing_share': 0.77,
            'lane_center_share': 0.23,
            'cross_share': 0.16,
            'counter_rate': 0.12,
            'fouls_committed': 423,
            'yellows': 62,
            'reds': 1,
            'unique_referees': 19,
            'total_referee_encounters': 38
        },
        {
            'team': 'Chelsea',
            'competition_id': 2,
            'season_id': 44,
            'matches_played': 38,
            
            # Mid-Block Balanced
            'ppda': 14.8,
            'def_share_att_third': 0.24,
            'block_height_x': 62.7,
            'possession_share': 0.53,
            'directness': 0.48,
            'wing_share': 0.61,
            'lane_center_share': 0.39,
            'cross_share': 0.10,
            'counter_rate': 0.14,
            'fouls_committed': 398,
            'yellows': 71,
            'reds': 3,
            'unique_referees': 18,
            'total_referee_encounters': 38
        }
    ]
    
    return pd.DataFrame(sample_seasons)

def main():
    """Create sample tactical archetype data files."""
    
    print("Creating sample tactical archetype data...")
    
    # Create data directory
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    
    # Create sample match data
    match_df = create_sample_match_data()
    print(f"Created {len(match_df)} sample match records")
    
    # Create sample season data
    season_df = create_sample_season_data()
    print(f"Created {len(season_df)} sample season records")
    
    # Load config and apply categorization
    config = load_config('config.yaml')
    
    # Apply tactical categorization to match data
    match_tagged = attach_style_tags(match_df, config)
    match_tagged["style_archetype"] = match_tagged.apply(derive_archetype, axis=1)
    
    # Apply tactical categorization to season data
    season_tagged = attach_style_tags(season_df, config)
    season_tagged["style_archetype"] = season_tagged.apply(derive_archetype, axis=1)
    
    # Save match-level data
    match_output_file = data_dir / "match_team_features_with_tags.parquet"
    match_tagged.to_parquet(match_output_file, index=False)
    print(f"Saved match archetype data to {match_output_file}")
    
    # Save season-level data
    season_output_file = data_dir / "team_season_features_with_tags.parquet"
    season_tagged.to_parquet(season_output_file, index=False)
    print(f"Saved season archetype data to {season_output_file}")
    
    # Save CSV categories
    labels_cols = [
        "competition_id","season_id","team",
        "cat_pressing","cat_block","cat_possess_dir","cat_width","cat_transition","cat_overlays",
        "style_archetype",
    ]
    cats_path = data_dir / "team_season_style_categories.csv"
    season_tagged[labels_cols].to_csv(cats_path, index=False)
    print(f"Saved style categories CSV to {cats_path}")
    
    # Display sample results
    print("\n=== SAMPLE TACTICAL ARCHETYPES ===")
    for _, team in season_tagged.iterrows():
        print(f"{team['team']}: {team['style_archetype']}")
    
    print("\n=== SAMPLE MATCH ARCHETYPES ===")
    for _, match in match_tagged.iterrows():
        print(f"{match['team']} vs {match['opponent']}: {match['style_archetype']}")
    
    print("\n✅ Sample tactical archetype data created successfully!")
    print("You can now refresh the frontend to see tactical profiles in action.")

if __name__ == '__main__':
    main()