import json
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Path to the clinical exercise catalog JSON
CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "exercise_catalog.json"

# In-memory cached catalog
_CATALOG_CACHE: list[dict[str, Any]] | None = None

# Anatomy synonyms and normalization mapping
ANATOMY_MAPPING: dict[str, str] = {
    "knee": "knee",
    "patellar": "knee",
    "patella": "knee",
    "anterior knee": "knee",
    "shoulder": "shoulder",
    "rotator cuff": "shoulder",
    "rotator_cuff": "shoulder",
    "subacromial": "shoulder",
    "scapula": "shoulder",
    "lower back": "lower_back",
    "lower_back": "lower_back",
    "lumbar": "lower_back",
    "spine": "lower_back",
    "hamstring": "hamstring",
    "hamstrings": "hamstring",
    "posterior thigh": "hamstring",
    "ankle": "ankle",
    "achilles": "ankle",
    "shin": "ankle",
    "shins": "ankle",
    "calf": "ankle",
    "calves": "ankle",
    "tibialis": "ankle",
    "neck": "neck",
    "cervical": "neck",
    "upper back": "neck",
    "upper_back": "neck",
    "thoracic": "neck",
    "hip": "hip",
    "glute": "hip",
    "glutes": "hip",
    "groin": "hip",
}


def normalize_body_area(area: str) -> str:
    """Normalize user or assessment input area to standardized catalog key."""
    cleaned = area.strip().lower().replace("-", "_")
    return ANATOMY_MAPPING.get(cleaned, cleaned)


def load_catalog(force_reload: bool = False) -> list[dict[str, Any]]:
    """
    Load exercise catalog from JSON file. Caches in memory for fast performance.
    """
    global _CATALOG_CACHE
    if _CATALOG_CACHE is not None and not force_reload:
        return _CATALOG_CACHE

    if not CATALOG_PATH.exists():
        logger.warning("Catalog file not found at %s. Returning empty catalog.", CATALOG_PATH)
        return []

    try:
        with open(CATALOG_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                _CATALOG_CACHE = data
                return _CATALOG_CACHE
            logger.error("Exercise catalog root is not a list. Found %s", type(data))
            return []
    except Exception as e:
        logger.error("Failed to parse exercise catalog JSON: %s", e)
        return []


def get_all_exercises(approved_only: bool = False) -> list[dict[str, Any]]:
    """Return catalog entries, optionally filtered by approved clinical review status."""
    catalog = load_catalog()
    if approved_only:
        return [item for item in catalog if item.get("review_status") == "approved"]
    return catalog


def get_exercise_by_id(exercise_id: str) -> dict[str, Any] | None:
    """Look up an exercise by unique ID."""
    for item in load_catalog():
        if item.get("id") == exercise_id:
            return item
    return None


def get_exercises_for_body_area(
    body_area: str,
    approved_only: bool = False,
) -> list[dict[str, Any]]:
    """Return all exercises matching a given body area (target or secondary)."""
    norm = normalize_body_area(body_area)
    matches: list[dict[str, Any]] = []

    for item in load_catalog():
        if approved_only and item.get("review_status") != "approved":
            continue

        target = normalize_body_area(item.get("target_body_area", ""))
        secondaries = [
            normalize_body_area(sec)
            for sec in item.get("secondary_areas", [])
        ]
        if target == norm or norm in secondaries:
            matches.append(item)

    return matches


def get_exercises_for_multiple_areas(
    body_areas: list[str],
    approved_only: bool = True,
) -> list[dict[str, Any]]:
    """
    Return exercises for multiple anatomical areas without duplicates.
    By default (approved_only=True), only clinically approved exercises are returned.
    """
    seen_ids: set[str] = set()
    result: list[dict[str, Any]] = []

    for area in body_areas:
        area_exercises = get_exercises_for_body_area(area, approved_only=approved_only)
        for ex in area_exercises:
            ex_id = ex.get("id", "")
            if ex_id and ex_id not in seen_ids:
                seen_ids.add(ex_id)
                result.append(ex)

    return result
