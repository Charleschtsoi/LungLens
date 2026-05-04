"""LungLens FastAPI backend — includes doctor Q&A generation endpoint.

Run locally: `uvicorn main:app --reload --port 8000`
"""

from typing import List

from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="LungLens API")


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


@app.post("/api/v1/generate-questions")
async def generate_questions(req: QuestionRequest):
    suggested_questions = []
    q_index = 1

    for finding in req.high_attention_findings:
        dict_key = finding.replace(" ", "_")
        if dict_key in CLINICAL_DICTIONARY:
            for q_text in CLINICAL_DICTIONARY[dict_key]:
                suggested_questions.append(
                    {
                        "id": f"q{q_index}",
                        "text": q_text,
                        "finding_trigger": finding,
                    }
                )
                q_index += 1

    return {"status": "success", "suggested_questions": suggested_questions}
