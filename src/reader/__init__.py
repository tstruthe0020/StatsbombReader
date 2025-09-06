"""
Reader module for tactical categorization and archetype generation.
"""

from .categorizer import load_config, attach_style_tags
from .archetypes import derive_archetype

__all__ = [
    "load_config",
    "attach_style_tags", 
    "derive_archetype"
]