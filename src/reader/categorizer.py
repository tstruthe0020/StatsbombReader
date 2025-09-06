"""
Style Categorizer - Convert StatsBomb features to tactical axis tags
"""

import pandas as pd
import numpy as np
import yaml
import logging
from typing import Dict, List, Any

logger = logging.getLogger(__name__)

def load_config(config_path: str = "config.yaml") -> Dict:
    """Load configuration from YAML file."""
    try:
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        return config
    except FileNotFoundError:
        logger.warning(f"Config file {config_path} not found, using defaults")
        return get_default_archetype_config()
    except Exception as e:
        logger.error(f"Failed to load config: {e}")
        return get_default_archetype_config()

def get_default_archetype_config() -> Dict:
    """Get default archetype categorization thresholds."""
    return {
        'archetype_thresholds': {
            'pressing': {
                'very_high': {'ppda': [0, 8], 'def_share_att_third': [0.4, 1.0]},
                'high': {'ppda': [8, 12], 'def_share_att_third': [0.25, 1.0]},
                'mid': {'ppda': [12, 18], 'def_share_att_third': [0.15, 0.4]},
                'low': {'ppda': [18, 100], 'def_share_att_third': [0, 0.25]}
            },
            'block': {
                'high': {'block_height_x': [70, 120]},
                'mid': {'block_height_x': [45, 70]},
                'low': {'block_height_x': [0, 45]}
            },
            'possession_directness': {
                'possession_based': {'possession_share': [0.55, 1.0], 'directness': [0, 0.4]},
                'balanced': {'possession_share': [0.45, 0.65], 'directness': [0.3, 0.7]},
                'direct': {'possession_share': [0, 0.55], 'directness': [0.6, 1.0]}
            },
            'width': {
                'wing_overload': {'wing_share': [0.75, 1.0], 'cross_share': [0.08, 1.0]},
                'central_focus': {'wing_share': [0, 0.5], 'lane_center_share': [0.5, 1.0]}, 
                'balanced_channels': {'wing_share': [0.5, 0.75], 'lane_center_share': [0.3, 0.6]}
            },
            'transition': {
                'high': {'counter_rate': [0.15, 1.0]},
                'low': {'counter_rate': [0, 0.15]}
            },
            'overlays': {
                'cross_heavy': {'cross_share': [0.12, 1.0]},
                'set_piece_focus': {'fouls_committed': [0, 8]}  # Low fouls = disciplined set piece team
            }
        }
    }

def attach_style_tags(df: pd.DataFrame, config: Dict) -> pd.DataFrame:
    """
    Attach tactical style category tags to DataFrame.
    
    Args:
        df: DataFrame with playstyle features
        config: Configuration with thresholds
        
    Returns:
        DataFrame with added category columns
    """
    df_tagged = df.copy()
    thresholds = config.get('archetype_thresholds', get_default_archetype_config()['archetype_thresholds'])
    
    # Apply categorization
    df_tagged['cat_pressing'] = df_tagged.apply(lambda row: categorize_pressing(row, thresholds), axis=1)
    df_tagged['cat_block'] = df_tagged.apply(lambda row: categorize_block(row, thresholds), axis=1)
    df_tagged['cat_possess_dir'] = df_tagged.apply(lambda row: categorize_possession_directness(row, thresholds), axis=1)
    df_tagged['cat_width'] = df_tagged.apply(lambda row: categorize_width(row, thresholds), axis=1)
    df_tagged['cat_transition'] = df_tagged.apply(lambda row: categorize_transition(row, thresholds), axis=1)
    df_tagged['cat_overlays'] = df_tagged.apply(lambda row: categorize_overlays(row, thresholds), axis=1)
    
    logger.info(f"Applied style categorization to {len(df_tagged)} team-match records")
    
    return df_tagged

def categorize_pressing(row: pd.Series, thresholds: Dict) -> str:
    """Categorize pressing intensity."""
    pressing_thresholds = thresholds.get('pressing', {})
    
    ppda = row.get('ppda', float('inf'))
    att_third_share = row.get('def_share_att_third', 0)
    
    # Handle infinite PPDA values 
    if np.isinf(ppda):
        ppda = 50  # Very low pressing
    
    # Check each category (order matters)
    for category, criteria in pressing_thresholds.items():
        ppda_range = criteria.get('ppda', [0, 100])
        att_range = criteria.get('def_share_att_third', [0, 1])
        
        if (ppda_range[0] <= ppda < ppda_range[1] and 
            att_range[0] <= att_third_share <= att_range[1]):
            return {
                'very_high': 'Very High Press',
                'high': 'High Press', 
                'mid': 'Mid Press',
                'low': 'Low Press'
            }.get(category, 'Mid Press')
    
    return 'Mid Press'

def categorize_block(row: pd.Series, thresholds: Dict) -> str:
    """Categorize defensive block height."""
    block_thresholds = thresholds.get('block', {})
    
    block_height = row.get('block_height_x', 60)
    
    for category, criteria in block_thresholds.items():
        height_range = criteria.get('block_height_x', [0, 120])
        
        if height_range[0] <= block_height <= height_range[1]:
            return {
                'high': 'High Block',
                'mid': 'Mid Block', 
                'low': 'Low Block'
            }.get(category, 'Mid Block')
    
    return 'Mid Block'

def categorize_possession_directness(row: pd.Series, thresholds: Dict) -> str:
    """Categorize possession style and directness."""
    poss_thresholds = thresholds.get('possession_directness', {})
    
    possession = row.get('possession_share', 0.5)
    directness = row.get('directness', 0.5)
    
    for category, criteria in poss_thresholds.items():
        poss_range = criteria.get('possession_share', [0, 1])
        dir_range = criteria.get('directness', [0, 1])
        
        if (poss_range[0] <= possession <= poss_range[1] and 
            dir_range[0] <= directness <= dir_range[1]):
            return {
                'possession_based': 'Possession-Based',
                'balanced': 'Balanced',
                'direct': 'Direct'
            }.get(category, 'Balanced')
    
    return 'Balanced'

def categorize_width(row: pd.Series, thresholds: Dict) -> str:
    """Categorize width usage and channel preference."""
    width_thresholds = thresholds.get('width', {})
    
    wing_share = row.get('wing_share', 0.67)
    center_share = row.get('lane_center_share', 0.33)
    cross_share = row.get('cross_share', 0.05)
    
    for category, criteria in width_thresholds.items():
        wing_range = criteria.get('wing_share', [0, 1])
        center_range = criteria.get('lane_center_share', [0, 1])
        cross_range = criteria.get('cross_share', [0, 1])
        
        wing_match = wing_range[0] <= wing_share <= wing_range[1]
        center_match = center_range[0] <= center_share <= center_range[1]
        cross_match = cross_range[0] <= cross_share <= cross_range[1]
        
        # For wing overload, require both wing share and cross criteria
        if category == 'wing_overload' and wing_match and cross_match:
            return 'Wing Overload'
        elif category == 'central_focus' and wing_match and center_match:
            return 'Central Focus'
        elif category == 'balanced_channels' and wing_match:
            return 'Balanced Channels'
    
    return 'Balanced Channels'

def categorize_transition(row: pd.Series, thresholds: Dict) -> str:
    """Categorize transition play intensity."""
    trans_thresholds = thresholds.get('transition', {})
    
    counter_rate = row.get('counter_rate', 0)
    
    for category, criteria in trans_thresholds.items():
        counter_range = criteria.get('counter_rate', [0, 1])
        
        if counter_range[0] <= counter_rate <= counter_range[1]:
            return {
                'high': 'High Transition',
                'low': 'Low Transition'
            }.get(category, 'Low Transition')
    
    return 'Low Transition'

def categorize_overlays(row: pd.Series, thresholds: Dict) -> List[str]:
    """Categorize overlay tactical characteristics."""
    overlay_thresholds = thresholds.get('overlays', {})
    overlays = []
    
    cross_share = row.get('cross_share', 0.05)
    fouls_committed = row.get('fouls_committed', 15)
    
    # Cross-Heavy overlay
    cross_criteria = overlay_thresholds.get('cross_heavy', {})
    cross_range = cross_criteria.get('cross_share', [0, 1])
    if cross_range[0] <= cross_share <= cross_range[1]:
        overlays.append('Cross-Heavy')
    
    # Set-Piece Focus overlay (low fouls = disciplined)
    setpiece_criteria = overlay_thresholds.get('set_piece_focus', {})
    foul_range = setpiece_criteria.get('fouls_committed', [0, 100])
    if foul_range[0] <= fouls_committed <= foul_range[1]:
        overlays.append('Set-Piece Focus')
    
    return overlays