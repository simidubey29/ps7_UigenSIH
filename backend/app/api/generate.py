from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form
)

from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder

from typing import Optional

from bson import ObjectId

from app.services.section_id_generator import (
    generate_section_id
)

from app.services.element_generator import (
    generate_elements
)

from app.services.llm_service import (
    generate_ir,
    generate_ir_from_wireframe
)

from app.database.mongodb import (
    sections_collection,
    elements_collection
)


router = APIRouter()


# =========================================================
# GENERATE SECTION
# =========================================================

@router.post("/generate")
async def generate(

    mode: str = Form(...),

    prompt: Optional[str] = Form(None),

    code: Optional[str] = Form(None),

    pageName: str = Form("Home"),

    sectionName: str = Form("Custom"),

    wireframe: Optional[UploadFile] = File(None)

):

    # =====================================================
    # 1. VALIDATE MODE
    # =====================================================

    mode = mode.lower().strip()


    allowed_modes = [
        "prompt",
        "code",
        "wireframe"
    ]


    if mode not in allowed_modes:

        return {
            "ok": False,
            "message": (
                "Invalid mode. "
                "Use prompt, code, or wireframe."
            )
        }


    # =====================================================
    # 2. VALIDATE INPUT
    # =====================================================

    if mode == "prompt":

        if not prompt or not prompt.strip():

            return {
                "ok": False,
                "message": "Prompt is required."
            }


    elif mode == "code":

        if not code or not code.strip():

            return {
                "ok": False,
                "message": "Code is required."
            }


    elif mode == "wireframe":

        if wireframe is None:

            return {
                "ok": False,
                "message": "Wireframe image is required."
            }


    # =====================================================
    # 3. GENERATE IR
    # =====================================================

    if mode == "prompt":

        # ---------------------------------------------
        # Prompt → Gemini → IR
        # ---------------------------------------------

        ir = generate_ir(
            prompt.strip()
        )


    elif mode == "code":

        # ---------------------------------------------
        # Code → Gemini → IR
        # ---------------------------------------------

        ai_input = f"""
Analyze the following frontend code and convert it
into a CMS Intermediate Representation (IR).

FRONTEND CODE:

{code}

Identify:

1. Section type
2. Text elements
3. Images
4. Buttons
5. Cards / repeated elements
6. Default content
7. Appropriate content types

Use ONLY these content types:

- Text
- Textfield
- Image
- Button
- Cards

For repeated elements:

- use count
- use cards when the actual card content
  can be identified

Return ONLY valid JSON.

Required structure:

{{
    "sectionType": "string",
    "elements": [
        {{
            "elementName": "string",
            "contentType": "Text | Textfield | Image | Button | Cards",
            "defaultContent": "string or null",
            "count": "number or null",
            "cards": "array or null"
        }}
    ]
}}
"""

        ir = generate_ir(
            ai_input
        )


    elif mode == "wireframe":

        # ---------------------------------------------
        # Wireframe → Gemini Vision → IR
        # ---------------------------------------------

        image_bytes = await wireframe.read()


        if not image_bytes:

            return {
                "ok": False,
                "message": "Uploaded wireframe is empty."
            }


        mime_type = (
            wireframe.content_type
            or "image/png"
        )


        # Make sure it is an image

        if not mime_type.startswith("image/"):

            return {
                "ok": False,
                "message": (
                    "Wireframe must be an image "
                    "(PNG, JPG, JPEG, WEBP, etc.)."
                )
            }


        ir = generate_ir_from_wireframe(
            image_bytes,
            mime_type
        )


    # =====================================================
    # 4. GENERATE UNIQUE SECTION ID
    # =====================================================

    section_id = generate_section_id()


    # =====================================================
    # 5. IR → CMS ELEMENTS
    # =====================================================

    elements = generate_elements(
        ir,
        section_id
    )


    # =====================================================
    # 6. CREATE SECTION DOCUMENT
    # =====================================================

    section_document = {

        "sectionId": section_id,

        "sectionName": sectionName,

        "pageName": pageName,

        "sectionType": ir.sectionType,

        "componentFile": (
            f"{sectionName}Section.jsx"
        ),

        "status": "generated"

    }


    # =====================================================
    # 7. SAVE SECTION TO MONGODB
    # =====================================================

    sections_collection.insert_one(
        section_document
    )


    # =====================================================
    # 8. SAVE ELEMENTS TO MONGODB
    # =====================================================

    if elements:

        elements_collection.insert_many(
            elements
        )


    # =====================================================
    # 9. REMOVE MONGODB OBJECT IDs
    # =====================================================

    for element in elements:

        element.pop(
            "_id",
            None
        )


    # =====================================================
    # 10. RETURN RESPONSE
    # =====================================================

    return JSONResponse(

        content=jsonable_encoder(

            {

                "ok": True,

                "sectionId": section_id,

                "pageName": pageName,

                "sectionName": sectionName,

                "mode": mode,

                "ir": ir.model_dump(),

                "elements": elements

            },

            custom_encoder={

                ObjectId: str

            }

        )

    )