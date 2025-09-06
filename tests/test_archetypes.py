# tests/test_archetypes.py
from src.reader.archetypes import derive_archetype

def test_archetype_basic():
    row = {
        "cat_pressing": "Low Press",
        "cat_block": "Low Block",
        "cat_possess_dir": "Direct",
        "cat_width": "Wing Overload",
        "cat_transition": "High Transition",
        "cat_overlays": ["Cross-Heavy"],
    }
    assert derive_archetype(row).startswith("Low-Block Counter")

def test_archetype_high_press_possession():
    row = {
        "cat_pressing": "High Press",
        "cat_block": "High Block",
        "cat_possess_dir": "Possession-Based",
        "cat_width": "Balanced Channels",
        "cat_transition": "Low Transition",
        "cat_overlays": [],
    }
    assert derive_archetype(row) == "High-Press Possession"

def test_archetype_with_overlays():
    row = {
        "cat_pressing": "Low Press",
        "cat_block": "Low Block", 
        "cat_possess_dir": "Direct",
        "cat_width": "Wing Overload",
        "cat_transition": "High Transition",
        "cat_overlays": ["Cross-Heavy", "Set-Piece Focus"],
    }
    result = derive_archetype(row)
    assert "Low-Block Counter" in result
    assert "Wing Overload Crossers" in result
    assert "Set-Piece Focus" in result

def test_archetype_central_combinational():
    row = {
        "cat_pressing": "Mid Press",
        "cat_block": "Mid Block",
        "cat_possess_dir": "Possession-Based", 
        "cat_width": "Central Focus",
        "cat_transition": "Low Transition",
        "cat_overlays": [],
    }
    result = derive_archetype(row)
    assert "Mid-Block Possession + Central Combinational" == result

def test_archetype_very_high_press_normalization():
    row = {
        "cat_pressing": "Very High Press",
        "cat_block": "High Block",
        "cat_possess_dir": "Possession-Based",
        "cat_width": "Balanced Channels", 
        "cat_transition": "Low Transition",
        "cat_overlays": [],
    }
    assert derive_archetype(row) == "High-Press Possession"

def test_archetype_missing_fields():
    row = {
        "cat_pressing": "",
        "cat_block": None,
        "cat_possess_dir": "Balanced",
    }
    result = derive_archetype(row)
    assert result == "Mid-Block Balanced"  # Default case