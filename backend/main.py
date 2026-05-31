"""LungLens FastAPI backend - Gemini health check and educational endpoints.

Run locally: `uvicorn main:app --reload --port 8000`
"""

from __future__ import annotations

import json
import os
import socket
from typing import List
from urllib import error, parse, request

from fastapi import FastAPI, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="LungLens API")

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_TIMEOUT_SECONDS = 25
GEMINI_API_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)
class QuestionRequest(BaseModel):
    high_attention_findings: List[str]


class QuestionItem(BaseModel):
    id: str
    text: str
    finding_trigger: str


CLINICAL_DICTIONARY = {
    "Pneumonia": [
        "The AI flagged a pattern similar to pneumonia. Based on my symptoms, what follow-up tests or visits do you recommend?",
        "Should I be concerned about this pattern, and does it require immediate treatment?",
    ],
    "Lung_Opacity": [
        "The output highlighted lung opacity on my X-ray. What might cause that, and what should I ask you about next steps?",
    ],
    "COVID-19": [
        "The tool flagged patterns sometimes seen with COVID-19 pneumonia. How should I interpret this alongside testing and symptoms?",
    ],
}


class GeminiRequestError(Exception):
    def __init__(self, message: str, error_code: str, status_code: int):
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code


def _json_error(message: str, error_code: str, status_code: int) -> JSONResponse:
    return JSONResponse(
        {"error": message, "error_code": error_code},
        status_code=status_code,
    )


def _gemini_request_payload(prompt: str, response_mime_type: str) -> bytes:
    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.4,
            "responseMimeType": response_mime_type,
        },
    }
    return json.dumps(payload).encode("utf-8")


def _extract_gemini_text(payload: dict) -> str:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        raise GeminiRequestError("Gemini returned no candidates.", "backend_unavailable", 502)
    content = candidates[0].get("content")
    if not isinstance(content, dict):
        raise GeminiRequestError("Gemini returned malformed content.", "backend_unavailable", 502)
    parts = content.get("parts")
    if not isinstance(parts, list):
        raise GeminiRequestError("Gemini returned malformed parts.", "backend_unavailable", 502)
    for part in parts:
        if isinstance(part, dict) and isinstance(part.get("text"), str):
            text = part["text"].strip()
            if text:
                return text
    raise GeminiRequestError("Gemini returned empty text.", "backend_unavailable", 502)


def _call_gemini(api_key: str, prompt: str, response_mime_type: str = "text/plain") -> str:
    url = f"{GEMINI_API_URL}?key={parse.quote(api_key)}"
    req = request.Request(
        url,
        data=_gemini_request_payload(prompt, response_mime_type),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=GEMINI_TIMEOUT_SECONDS) as response:
            body = response.read().decode("utf-8")
    except error.HTTPError as exc:
        try:
            error_body = exc.read().decode("utf-8")
            parsed = json.loads(error_body)
            message = parsed.get("error", {}).get("message") or "Gemini request failed."
        except Exception:
            message = "Gemini request failed."
        if exc.code in (400, 401, 403):
            raise GeminiRequestError(message, "invalid_api_key", exc.code) from exc
        raise GeminiRequestError(message, "backend_unavailable", exc.code) from exc
    except socket.timeout as exc:
        raise GeminiRequestError("Gemini request timed out.", "timeout", 504) from exc
    except Exception as exc:
        raise GeminiRequestError("Network error contacting Gemini.", "network_error", 502) from exc

    try:
        parsed = json.loads(body)
    except json.JSONDecodeError as exc:
        raise GeminiRequestError("Gemini returned invalid JSON.", "backend_unavailable", 502) from exc
    return _extract_gemini_text(parsed)


@app.post("/api/v1/gemini/health-check")
async def gemini_health_check(gemini_api_key: str = Form(default="")):
    api_key = gemini_api_key.strip()
    if not api_key:
        return {"ok": True, "skipped": True}

    try:
        _call_gemini(
            api_key,
            "Reply with OK only.",
            response_mime_type="text/plain",
        )
    except GeminiRequestError as exc:
        return JSONResponse(
            {"ok": False, "error": exc.message, "error_code": exc.error_code},
            status_code=exc.status_code,
        )
    return {"ok": True}


@app.post("/api/v1/generate-questions")
async def generate_questions(req: QuestionRequest):
    suggested_questions = []
    educational_insights = []
    q_index = 1

    for finding in req.high_attention_findings:
        dict_key = finding.replace(" ", "_")
        if dict_key in CLINICAL_DICTIONARY:
            for q_text in CLINICAL_DICTIONARY[dict_key]:
                item = {
                    "id": f"q{q_index}",
                    "text": q_text,
                    "title": f"Question {q_index}",
                    "finding_trigger": finding,
                    "category": "education",
                }
                suggested_questions.append(
                    {
                        "id": item["id"],
                        "text": item["text"],
                        "finding_trigger": item["finding_trigger"],
                    }
                )
                educational_insights.append(item)
                q_index += 1

    return {
        "status": "success",
        "source": "rules",
        "suggested_questions": suggested_questions,
        "educational_insights": educational_insights,
    }
