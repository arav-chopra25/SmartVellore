import json
import time
from typing import Any
from urllib import error, request

from app.config import settings


DEPARTMENTS = [
    "Water Supply Department",
    "Public Works Department",
    "Electricity Department",
    "Solid Waste Management",
    "Traffic Department",
    "Others",
]


def _keyword_triage(title: str, description: str) -> dict[str, Any]:
    text = f"{title} {description}".lower()

    if any(word in text for word in ["water", "leak", "pipeline", "drain", "sewage"]):
        category = "water_leakage"
        department = "Water Supply Department"
    elif any(word in text for word in ["pothole", "road", "street", "sidewalk"]):
        category = "road_damage"
        department = "Public Works Department"
    elif any(word in text for word in ["light", "electric", "power", "transformer"]):
        category = "electrical_issue"
        department = "Electricity Department"
    elif any(word in text for word in ["garbage", "trash", "waste", "dump"]):
        category = "waste_management"
        department = "Solid Waste Management"
    elif any(word in text for word in ["traffic", "signal", "accident", "parking"]):
        category = "traffic_issue"
        department = "Traffic Department"
    else:
        category = "general_civic_issue"
        department = "Others"

    if any(word in text for word in ["fire", "accident", "burst", "flood", "urgent", "danger"]):
        priority = "CRITICAL"
    elif any(word in text for word in ["major", "severe", "blocked"]):
        priority = "HIGH"
    elif any(word in text for word in ["minor", "small"]):
        priority = "LOW"
    else:
        priority = "MEDIUM"

    return {
        "category": category,
        "priority": priority,
        "department_suggestion": department,
        "confidence": 0.62,
        "summary": "Rule-based triage used (Gemini unavailable).",
        "model": "keyword-fallback",
    }


def _call_gemini_json(prompt: str, max_retries: int = 3) -> dict[str, Any] | None:
    """Call Gemini API with retry logic for temporary failures."""
    if not settings.GEMINI_ENABLED:
        print(f"[DEBUG] GEMINI_ENABLED={settings.GEMINI_ENABLED}")
        return None
    if not settings.GEMINI_API_KEY:
        print(f"[DEBUG] GEMINI_API_KEY is empty or None")
        return None

    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{settings.GEMINI_MODEL}:generateContent?key={settings.GEMINI_API_KEY}"
    )

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
        },
    }

    for attempt in range(max_retries):
        try:
            print(f"[DEBUG] Calling Gemini (attempt {attempt + 1}/{max_retries})")
            req = request.Request(
                endpoint,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with request.urlopen(req, timeout=settings.GEMINI_TIMEOUT_SECONDS) as response:
                data = json.loads(response.read().decode("utf-8"))
            raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
            print(f"[DEBUG] Gemini returned: {raw_text[:100]}")
            return json.loads(raw_text)
            
        except error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            
            # Retryable errors: 429 (rate limit), 500 (server), 503 (unavailable)
            retryable_codes = [429, 500, 502, 503, 504]
            
            if e.code in retryable_codes and attempt < max_retries - 1:
                wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                error_name = {429: "rate_limit", 500: "server_error", 502: "bad_gateway", 503: "unavailable", 504: "timeout"}.get(e.code, "error")
                print(f"[DEBUG] Gemini {e.code} ({error_name}), retrying in {wait_time}s...")
                time.sleep(wait_time)
                continue
            else:
                print(f"[ERROR] Gemini HTTP {e.code}: {error_body[:200]}")
                return None
                
        except (error.URLError, KeyError, IndexError, json.JSONDecodeError, TimeoutError) as exc:
            print(f"[ERROR] Gemini failed ({type(exc).__name__}): {str(exc)[:200]}")
            return None
    
    return None


def triage_issue(
    title: str,
    description: str,
    citizen_department: str | None = None,
) -> dict[str, Any]:
    phase = max(1, settings.GEMINI_PHASE)

    prompt = f"""
You are a civic issue triage engine.
Given issue details, return strict JSON only with these keys:
- category: snake_case short category
- priority: one of CRITICAL,HIGH,MEDIUM,LOW
- department_suggestion: one of {DEPARTMENTS}
- confidence: number between 0 and 1
- summary: one-line triage summary for officials
- duplicate_hint: short text hint (only if phase>=2, else empty string)

Issue title: {title}
Issue description: {description}
Citizen selected department: {citizen_department or "not_provided"}
Current phase: {phase}
""".strip()

    gemini_data = _call_gemini_json(prompt)
    fallback = _keyword_triage(title, description)

    if not gemini_data:
        result = fallback
    else:
        result = {
            "category": gemini_data.get("category") or fallback["category"],
            "priority": (gemini_data.get("priority") or fallback["priority"]).upper(),
            "department_suggestion": gemini_data.get("department_suggestion") or fallback["department_suggestion"],
            "confidence": float(gemini_data.get("confidence", fallback["confidence"])),
            "summary": gemini_data.get("summary") or fallback["summary"],
            "duplicate_hint": gemini_data.get("duplicate_hint") or "",
            "model": settings.GEMINI_MODEL,
        }

    if result["department_suggestion"] not in DEPARTMENTS:
        result["department_suggestion"] = "Others"

    result["phase"] = phase
    return result
