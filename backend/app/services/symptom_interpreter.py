"""Dedicated natural language symptom interpreter service for REVORA using Google Gemini API.

Converts athlete free-text descriptions into validated, structured biomechanical
telemetry (canonical body areas, laterality, symptom sensations, movement triggers)
with strict clinical safety boundaries, request deduplication caching, and deterministic fallback.
"""

import json
import logging
import re
import time
from typing import Dict, List, Optional, Tuple

from app.core.config import settings
from app.schemas.symptoms import (
    GeminiInterpretationOutput,
    InterpretedSymptomItem,
    SymptomInterpretationRequest,
    SymptomInterpretationResponse,
)
from app.services.exercise_catalog import normalize_body_area, ANATOMY_MAPPING
from app.services.doctor_guidance import (
    EMERGENCY_RED_FLAGS,
    PROMPT_ASSESSMENT_INDICATORS,
)

logger = logging.getLogger(__name__)

# Request deduplication in-memory cache: (cleaned_text, sport, context) -> (timestamp, response)
_INTERPRETATION_CACHE: Dict[Tuple[str, Optional[str], Optional[str]], Tuple[float, SymptomInterpretationResponse]] = {}
CACHE_TTL_SECONDS = 3600  # 1 hour
MAX_CACHE_SIZE = 500

# Canonical zones recognized by REVORA recovery and exercise catalog
CANONICAL_ZONES = {
    "knee",
    "shoulder",
    "lower_back",
    "hamstring",
    "ankle",
    "hip",
    "neck",
    "general",
}

# Mapping between canonical zones + side to 3D Anatomy viewer manifest IDs
ZONE_SIDE_TO_MANIFEST_ID: Dict[Tuple[str, str], str] = {
    ("shoulder", "left"): "left-shoulder",
    ("shoulder", "right"): "right-shoulder",
    ("shoulder", "bilateral"): "shoulders",
    ("knee", "left"): "left-knee",
    ("knee", "right"): "right-knee",
    ("knee", "bilateral"): "knees",
    ("lower_back", "left"): "Left_Latissimus_Dorsi",
    ("lower_back", "right"): "Right_Latissimus_Dorsi",
    ("lower_back", "center"): "spine",
    ("lower_back", "unspecified"): "lower-back",
    ("hamstring", "left"): "left-hamstring",
    ("hamstring", "right"): "right-hamstring",
    ("hamstring", "bilateral"): "hamstrings",
    ("ankle", "left"): "left-ankle",
    ("ankle", "right"): "right-ankle",
    ("ankle", "bilateral"): "ankles",
    ("hip", "left"): "left-hip",
    ("hip", "right"): "right-hip",
    ("hip", "bilateral"): "hips",
    ("neck", "left"): "Left_Ascending_Part_of_Trapezius",
    ("neck", "right"): "Right_Ascending_Part_of_Trapezius",
    ("neck", "center"): "cervical-spine",
    ("neck", "unspecified"): "neck",
}


SYSTEMIC_EMERGENCY_FLAGS = [
    ("chest pain", "Possible acute cardiovascular compromise"),
    ("shortness of breath", "Cardiopulmonary distress / acute respiratory limitation"),
    ("loss of consciousness", "Syncope / head trauma warning sign"),
    ("dizziness with chest", "Cardiovascular compromise"),
]


def _check_red_flags_independently(text: str) -> Optional[str]:
    """Scan raw user text against emergency and clinical red flag indicators."""
    lower_text = text.lower()
    for kw, desc in SYSTEMIC_EMERGENCY_FLAGS:
        if kw in lower_text:
            return (
                f"Emergency Indicator Detected: '{kw}' ({desc}). "
                "Immediate medical evaluation is strongly advised before engaging in any physical exercise."
            )
    for item in EMERGENCY_RED_FLAGS:
        if item["keyword"] in lower_text:
            return (
                f"Emergency Indicator Detected: '{item['keyword']}' ({item['description']}). "
                "Immediate medical evaluation is strongly advised before engaging in any physical exercise."
            )
    for item in PROMPT_ASSESSMENT_INDICATORS:
        if item["keyword"] in lower_text:
            return (
                f"Clinical Prompt Assessment Indicator: '{item['keyword']}' ({item['description']}). "
                "In-person clinical evaluation by a physician or physical therapist is advised."
            )
    return None


def _clean_cache_if_needed():
    """Prune expired cache entries and limit cache size."""
    now = time.time()
    if len(_INTERPRETATION_CACHE) > MAX_CACHE_SIZE:
        expired_keys = [
            k for k, (ts, _) in _INTERPRETATION_CACHE.items()
            if now - ts > CACHE_TTL_SECONDS
        ]
        for k in expired_keys:
            _INTERPRETATION_CACHE.pop(k, None)
        if len(_INTERPRETATION_CACHE) > MAX_CACHE_SIZE:
            # Drop oldest 20%
            sorted_keys = sorted(_INTERPRETATION_CACHE.keys(), key=lambda k: _INTERPRETATION_CACHE[k][0])
            for k in sorted_keys[: len(sorted_keys) // 5]:
                _INTERPRETATION_CACHE.pop(k, None)


def _detect_deterministic_side(text: str) -> str:
    """Identify laterality from text."""
    lower = text.lower()
    if re.search(r"\b(both|bilateral|two|both sides|each)\b", lower):
        return "bilateral"
    if re.search(r"\b(left|left-side|left-sided|lt)\b", lower):
        return "left"
    if re.search(r"\b(right|right-side|right-sided|rt)\b", lower):
        return "right"
    if re.search(r"\b(midline|middle|center|central|spine)\b", lower):
        return "center"
    return "unspecified"


def _detect_deterministic_symptom_type(text: str) -> str:
    """Identify primary sensation from text."""
    lower = text.lower()
    if any(k in lower for k in ["stiff", "tight", "tightness", "inflexib"]):
        return "stiffness"
    if any(k in lower for k in ["swell", "swollen", "puff", "inflam", "edema"]):
        return "swelling"
    if any(k in lower for k in ["weak", "giving way", "instab", "collaps"]):
        return "weakness"
    if any(k in lower for k in ["numb", "tingl", "pins and needles", "burning", "paresthesia"]):
        return "numbness_tingling"
    if any(k in lower for k in ["tender", "touch", "sore to touch", "palpat"]):
        return "tenderness"
    if any(k in lower for k in ["cannot bend", "cannot straighten", "limited motion", "locked", "reduced move"]):
        return "reduced_movement"
    if any(k in lower for k in ["pain", "hurt", "ache", "aching", "sharp", "dull", "pinch", "throbb"]):
        return "pain"
    return "other"


def _detect_deterministic_trigger(text: str) -> Optional[str]:
    """Extract motion or exercise triggers from text."""
    lower = text.lower()
    triggers = [
        ("raising arm overhead", ["overhead", "raise arm", "lift arm", "above head", "pressing"]),
        ("deep knee flexion / squats", ["squat", "bending knee", "deep knee", "stairs", "lunges"]),
        ("spinal flexion / bending forward", ["bending forward", "bending over", "tying shoes", "deadlift"]),
        ("impact loading / running", ["running", "jogging", "landing", "jumping", "sprinting"]),
        ("eccentric deceleration", ["slowing down", "decelerating", "cutting", "changing direction"]),
    ]
    for label, keywords in triggers:
        if any(k in lower for k in keywords):
            return label
    return None


def interpret_symptom_deterministic(
    raw_text: str,
    sport: Optional[str] = None,
    activity_context: Optional[str] = None,
) -> SymptomInterpretationResponse:
    """
    Robust rule-based fallback when Gemini API is unavailable, unconfigured, or failing.
    Uses REVORA's established anatomical dictionary and keyword stem matching.
    """
    cleaned = raw_text.strip()
    red_flag = _check_red_flags_independently(cleaned)
    lower = cleaned.lower()

    # 1. Normalize area with plural, multi-word, and synonym awareness
    canonical = "general"
    if any(k in lower for k in ["knee", "knees", "patell", "patellar", "runner's knee"]):
        canonical = "knee"
    elif any(k in lower for k in ["shoulder", "shoulders", "rotator", "deltoid", "scapula"]):
        canonical = "shoulder"
    elif any(k in lower for k in ["lower back", "lower_back", "lumbar", "spine", "back", "latiss", "lats"]):
        canonical = "lower_back"
    elif any(k in lower for k in ["hamstring", "hamstrings", "biceps femoris"]):
        canonical = "hamstring"
    elif any(k in lower for k in ["ankle", "ankles", "achilles", "calf", "calves", "shin", "shins", "heel", "foot", "feet"]):
        canonical = "ankle"
    elif any(k in lower for k in ["hip", "hips", "glute", "glutes", "groin", "pelvis"]):
        canonical = "hip"
    elif any(k in lower for k in ["neck", "cervical", "upper back", "upper_back", "trapezius"]):
        canonical = "neck"
    else:
        norm = normalize_body_area(cleaned)
        if norm in CANONICAL_ZONES and norm != "general":
            canonical = norm
        else:
            tokens = re.findall(r"[a-zA-Z_]+", lower)
            for t in tokens:
                norm_t = normalize_body_area(t)
                if norm_t in CANONICAL_ZONES and norm_t != "general":
                    canonical = norm_t
                    break

    side = _detect_deterministic_side(cleaned)
    symptom_type = _detect_deterministic_symptom_type(cleaned)
    trigger = _detect_deterministic_trigger(cleaned)

    # Specific anatomical structure identification from text keywords
    structure = "unknown"
    lower = cleaned.lower()
    if "rotator cuff" in lower or "supraspinatus" in lower or "infraspinatus" in lower:
        structure = "rotator cuff"
    elif "achilles" in lower:
        structure = "calcaneal (Achilles) tendon"
    elif "patellar" in lower:
        structure = "patellar tendon"
    elif "acl" in lower or "cruciate" in lower:
        structure = "anterior cruciate ligament (ACL)"
    elif "latissimus" in lower or "lat" in lower.split():
        structure = "latissimus dorsi"
    elif "hamstring" in lower or "biceps femoris" in lower:
        structure = "hamstring complex"

    manifest_id = ZONE_SIDE_TO_MANIFEST_ID.get((canonical, side)) or ZONE_SIDE_TO_MANIFEST_ID.get((canonical, "unspecified"))

    # Determine if clarification is needed
    needs_clarification = (canonical == "general" and len(cleaned.split()) < 4)
    clarifying_question = None
    if needs_clarification:
        clarifying_question = (
            "Could you specify which joint or muscle is affected (e.g., knee, shoulder, lower back), "
            "and whether it is on your left or right side?"
        )

    item = InterpretedSymptomItem(
        body_area=canonical if canonical != "general" else (cleaned[:40] if cleaned else "general"),
        canonical_body_area=canonical,
        side=side,  # type: ignore
        symptom_type=symptom_type,
        trigger=trigger,
        anatomical_structure=structure,
        duration=None,
        confidence=0.75 if canonical != "general" else 0.40,
        matched_manifest_id=manifest_id,
    )

    canonical_list = [canonical] if canonical != "general" else []
    manifest_list = [manifest_id] if manifest_id else []

    status_str = "clarification_needed" if needs_clarification else "fallback"

    return SymptomInterpretationResponse(
        raw_text=raw_text,
        status=status_str,
        items=[item],
        primary_body_area=canonical,
        canonical_body_areas=canonical_list,
        manifest_part_ids=manifest_list,
        needs_clarification=needs_clarification,
        clarifying_question=clarifying_question,
        model_used="deterministic_fallback",
        is_fallback=True,
        red_flag_warning=red_flag,
    )


def _get_gemini_client():
    """Safely initialize Google GenAI SDK client."""
    api_key = settings.GEMINI_API_KEY.strip()
    if not api_key:
        return None
    try:
        from google import genai
        from google.genai import types

        return genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=10000),  # 10s timeout
        )
    except Exception as e:
        logger.warning("Could not initialize Google GenAI Client: %s", e)
        return None


def interpret_symptom(request: SymptomInterpretationRequest) -> SymptomInterpretationResponse:
    """
    Main entrypoint: Converts athlete free-text into structured anatomical telemetry using Gemini API.
    Gracefully falls back to deterministic parsing on any API or parsing error.
    """
    raw_text = request.text.strip()
    if not raw_text:
        return interpret_symptom_deterministic("", request.sport, request.activity_context)

    # 1. Independent safety scan for acute emergency red flags
    red_flag = _check_red_flags_independently(raw_text)

    # 2. Check in-memory deduplication cache
    cache_key = (raw_text.lower(), request.sport, request.activity_context)
    if cache_key in _INTERPRETATION_CACHE:
        ts, cached_resp = _INTERPRETATION_CACHE[cache_key]
        if time.time() - ts < CACHE_TTL_SECONDS:
            # Return cached response with updated red_flag if present
            cached_resp.red_flag_warning = red_flag or cached_resp.red_flag_warning
            return cached_resp

    # 3. Check for API key
    client = _get_gemini_client()
    if client is None:
        logger.info("[SymptomInterpreter] Gemini API key not configured or client failed; using deterministic fallback.")
        fallback_resp = interpret_symptom_deterministic(raw_text, request.sport, request.activity_context)
        fallback_resp.red_flag_warning = red_flag or fallback_resp.red_flag_warning
        _INTERPRETATION_CACHE[cache_key] = (time.time(), fallback_resp)
        _clean_cache_if_needed()
        return fallback_resp

    # 4. Formulate Prompt
    model_name = settings.GEMINI_MODEL.strip() or "gemini-flash-latest"

    system_instruction = (
        "You are REVORA's natural-language symptom and body-part interpretation engine for athletes.\n"
        "Your task is to convert free-text descriptions into validated structured JSON data.\n\n"
        "STRICT GUIDELINES:\n"
        "1. DO NOT DIAGNOSE medical conditions or invent injuries (never diagnose 'SLAP tear', 'herniated disc', etc.).\n"
        "2. Canonical body area MUST be one of: 'knee', 'shoulder', 'lower_back', 'hamstring', 'ankle', 'hip', 'neck', or 'general'.\n"
        "3. Laterality ('side') MUST be: 'left', 'right', 'bilateral', 'center', or 'unspecified'.\n"
        "4. Symptom sensation ('symptom_type') MUST be: 'pain', 'stiffness', 'swelling', 'weakness', 'tenderness', 'numbness_tingling', 'reduced_movement', or 'other'.\n"
        "5. Mechanical trigger: extract the movement/load (e.g. 'raising arm above head', 'deep squats', 'overhead press') or null.\n"
        "6. Anatomical structure: ONLY specify if explicitly supported by description (e.g. 'rotator cuff', 'Achilles tendon', 'ACL'); otherwise 'unknown'.\n"
        "7. Duration: only extract if explicitly stated (e.g. '3 days', '2 weeks'); otherwise null.\n"
        "8. Multiple body areas: if the user describes multiple affected parts (e.g. 'left shoulder and right knee'), include an item for EACH affected area.\n"
        "9. Ambiguity: if the input is too vague to identify a body area or action (e.g. 'it hurts', 'feeling sore all over'), set needs_clarification=true and provide a polite, concise clarifying_question.\n"
        "10. Output pure JSON matching the requested schema with no markdown formatting.\n"
    )

    prompt = (
        f"{system_instruction}\n\n"
        f"Athlete description: \"{raw_text}\"\n"
        f"Sport/modality: {request.sport or 'Not specified'}\n"
        f"Activity context: {request.activity_context or 'Not specified'}\n\n"
        "Return JSON with format:\n"
        "{\n"
        '  "items": [\n'
        '    {\n'
        '      "body_area": "plain English body area",\n'
        '      "canonical_body_area": "knee|shoulder|lower_back|hamstring|ankle|hip|neck|general",\n'
        '      "side": "left|right|bilateral|center|unspecified",\n'
        '      "symptom_type": "pain|stiffness|swelling|weakness|tenderness|numbness_tingling|reduced_movement|other",\n'
        '      "trigger": "string or null",\n'
        '      "anatomical_structure": "string or unknown",\n'
        '      "duration": "string or null",\n'
        '      "confidence": 0.95,\n'
        '      "matched_manifest_id": "string or null"\n'
        "    }\n"
        "  ],\n"
        '  "primary_body_area": "canonical primary area",\n'
        '  "needs_clarification": false,\n'
        '  "clarifying_question": null,\n'
        '  "reasoning": "brief explanation"\n'
        "}"
    )

    try:
        from google.genai import types

        config = types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        )

        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=config,
        )

        raw_output = response.text or ""

        # Strip any markdown backticks if returned
        cleaned_json = raw_output.strip()
        if cleaned_json.startswith("```"):
            cleaned_json = re.sub(r"^```(?:json)?\s*", "", cleaned_json)
            cleaned_json = re.sub(r"\s*```$", "", cleaned_json)

        parsed_dict = json.loads(cleaned_json)
        validated_output = GeminiInterpretationOutput.model_validate(parsed_dict)

        # Post-process items: enforce canonical keys and map 3D manifest IDs
        processed_items: List[InterpretedSymptomItem] = []
        canonical_set = set()
        manifest_ids = []

        for item in validated_output.items:
            # Ensure canonical body area maps cleanly
            norm_canonical = normalize_body_area(item.canonical_body_area)
            if norm_canonical not in CANONICAL_ZONES:
                norm_canonical = normalize_body_area(item.body_area)
            if norm_canonical not in CANONICAL_ZONES:
                norm_canonical = "general"

            # Derive 3D manifest ID
            manifest_id = item.matched_manifest_id
            if not manifest_id or manifest_id == "unknown":
                manifest_id = (
                    ZONE_SIDE_TO_MANIFEST_ID.get((norm_canonical, item.side))
                    or ZONE_SIDE_TO_MANIFEST_ID.get((norm_canonical, "unspecified"))
                )

            item.canonical_body_area = norm_canonical
            item.matched_manifest_id = manifest_id
            processed_items.append(item)

            if norm_canonical != "general":
                canonical_set.add(norm_canonical)
            if manifest_id:
                manifest_ids.append(manifest_id)

        # Primary body area
        primary_area = validated_output.primary_body_area
        if primary_area not in CANONICAL_ZONES:
            primary_area = normalize_body_area(primary_area)
        if primary_area not in CANONICAL_ZONES:
            primary_area = processed_items[0].canonical_body_area if processed_items else "general"

        status_str = "clarification_needed" if validated_output.needs_clarification else "success"

        result = SymptomInterpretationResponse(
            raw_text=raw_text,
            status=status_str,
            items=processed_items,
            primary_body_area=primary_area,
            canonical_body_areas=list(canonical_set) if canonical_set else [primary_area],
            manifest_part_ids=list(dict.fromkeys(manifest_ids)),
            needs_clarification=validated_output.needs_clarification,
            clarifying_question=validated_output.clarifying_question,
            model_used=model_name,
            is_fallback=False,
            red_flag_warning=red_flag,
        )

        _INTERPRETATION_CACHE[cache_key] = (time.time(), result)
        _clean_cache_if_needed()
        return result

    except Exception as e:
        logger.warning(
            "[SymptomInterpreter] Gemini API call or parsing failed (%s: %s). Falling back to deterministic rules.",
            type(e).__name__,
            e,
        )
        fallback_resp = interpret_symptom_deterministic(raw_text, request.sport, request.activity_context)
        fallback_resp.red_flag_warning = red_flag or fallback_resp.red_flag_warning
        _INTERPRETATION_CACHE[cache_key] = (time.time(), fallback_resp)
        _clean_cache_if_needed()
        return fallback_resp
