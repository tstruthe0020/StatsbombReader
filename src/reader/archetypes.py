# src/reader/archetypes.py
from __future__ import annotations
from typing import Iterable

def _has(tag: str, overlays: Iterable[str]) -> bool:
    try:
        return tag in (overlays or [])
    except Exception:
        return False

def derive_archetype(row) -> str:
    """
    Map axis tags + overlays to a single headline archetype.
    Expected fields on `row`:
      - cat_pressing: 'High Press' | 'Mid Press' | 'Low Press' | 'Very High Press'
      - cat_block: 'High Block' | 'Mid Block' | 'Low Block'
      - cat_possess_dir: 'Possession-Based' | 'Balanced' | 'Direct'
      - cat_width: 'Wing Overload' | 'Central Focus' | 'Balanced Channels'
      - cat_transition: 'High Transition' | 'Low Transition'
      - cat_overlays: list of overlay strings (e.g., 'Cross-Heavy', 'Set-Piece Focus')
    Returns: e.g. 'High-Press Possession', 'Low-Block Counter + Wing Overload Crossers'
    """
    # Normalize / tolerate missing fields
    p = (row.get("cat_pressing") or "").strip()
    b = (row.get("cat_block") or "").strip()
    d = (row.get("cat_possess_dir") or "").strip()
    w = (row.get("cat_width") or "").strip()
    t = (row.get("cat_transition") or "").strip()
    overlays = row.get("cat_overlays") or []

    # Treat 'Very High Press' as 'High Press' for archetype purposes
    if p == "Very High Press":
        p = "High Press"

    # ---------- CORE RULES (first match wins)
    core = None
    if p == "Low Press" and b == "Low Block" and t == "High Transition":
        core = "Low-Block Counter"
    elif p == "Low Press" and b == "Low Block":
        core = "Low-Block Contain"
    elif p == "High Press" and b == "High Block" and d == "Possession-Based":
        core = "High-Press Possession"
    elif p == "High Press" and b == "High Block" and (d == "Direct" or t == "High Transition"):
        core = "High-Press Direct"
    elif p == "Mid Press" and b == "Mid Block" and d == "Possession-Based":
        core = "Mid-Block Possession"
    elif p == "Mid Press" and b == "Mid Block":
        core = "Mid-Block Balanced"
    else:
        core = "Mid-Block Balanced"

    # ---------- OVERLAYS
    suffixes = []
    # Wing Overload Crossers
    if w == "Wing Overload" and (_has("Cross-Heavy", overlays)):
        suffixes.append("Wing Overload Crossers")
    # Central Combinational
    if w == "Central Focus" and d == "Possession-Based":
        suffixes.append("Central Combinational")
    # Set-Piece Focus
    if _has("Set-Piece Focus", overlays):
        suffixes.append("Set-Piece Focus")

    return core if not suffixes else f"{core} + " + " + ".join(suffixes)