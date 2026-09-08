from fastapi import APIRouter
from pydantic import BaseModel

from app.services.llm_service import generate_ir


router = APIRouter()


class PromptRequest(BaseModel):
    prompt: str


@router.post("/ai-test")
async def ai_test(request: PromptRequest):

    ir = generate_ir(request.prompt)

    return {
        "ok": True,
        "ir": ir.model_dump()
    }