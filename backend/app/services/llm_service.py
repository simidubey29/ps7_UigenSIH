import os
import json

from dotenv import load_dotenv
from google import genai
from google.genai import types

from app.schemas.ir import SectionIR


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY not found. Check your .env file."
    )


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=GEMINI_API_KEY
)


# =========================================================
# MODEL
# =========================================================

MODEL_NAME = "gemini-3.6-flash"


# =========================================================
# HELPER: CLEAN GEMINI JSON
# =========================================================

def clean_json_response(text: str) -> str:

    if not text:
        return ""

    text = text.strip()

    # Remove ```json
    if text.startswith("```json"):
        text = text[len("```json"):].strip()

    # Remove ```
    elif text.startswith("```"):
        text = text[3:].strip()

    # Remove closing ```
    if text.endswith("```"):
        text = text[:-3].strip()

    return text


# =========================================================
# HELPER: PARSE SECTION IR
# =========================================================

def parse_section_ir(text: str) -> SectionIR:

    if not text:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    text = clean_json_response(text)

    try:

        data = json.loads(text)

    except json.JSONDecodeError as e:

        raise RuntimeError(
            "Gemini returned invalid JSON.\n\n"
            f"Response:\n{text}"
        ) from e

    try:

        return SectionIR.model_validate(data)

    except Exception as e:

        raise RuntimeError(
            "Gemini JSON does not match SectionIR schema.\n\n"
            f"Data:\n{data}"
        ) from e


# =========================================================
# SYSTEM INSTRUCTION
# =========================================================

IR_SYSTEM_INSTRUCTION = """
You are an AI CMS Intermediate Representation generator.

Your ONLY job is to convert the user's website requirement
into a structured CMS SectionIR.

IMPORTANT:

- NEVER generate HTML.
- NEVER generate CSS.
- NEVER generate JavaScript.
- NEVER generate React code.
- NEVER generate a complete website.
- NEVER provide explanations.
- NEVER use Markdown.
- NEVER return code fences.
- NEVER return ```json.
- Return ONLY the structured JSON object required by the schema.

The output represents ONE website section.

Allowed content types:

- Text
- Textfield
- Image
- Button
- Cards

Rules:

1. sectionType must describe the section.
2. elementName must be meaningful and unique.
3. contentType must be one of:
   Text, Textfield, Image, Button, Cards.
4. defaultContent contains the visible/default content.
5. Use null when content is not applicable.
6. count should be used for repeated elements.
7. Cards should contain repeated card data.
8. Do not create unnecessary elements.
9. Do not generate an entire webpage.
10. Only describe the requested section.
"""


# =========================================================
# PROMPT → IR
# =========================================================

def generate_ir(prompt: str) -> SectionIR:

    if not prompt or not prompt.strip():

        raise ValueError(
            "Prompt cannot be empty."
        )

    full_prompt = f"""
Create a CMS section based on this user requirement:

{prompt}

Remember:

Return ONLY the CMS SectionIR.
Do not generate HTML.
Do not generate CSS.
Do not generate React.
Do not generate a webpage.
"""

    try:

        response = client.models.generate_content(

            model=MODEL_NAME,

            contents=full_prompt,

            config=types.GenerateContentConfig(

                system_instruction=IR_SYSTEM_INSTRUCTION,

                response_mime_type="application/json",

                response_schema=SectionIR,

                temperature=0.2
            )
        )

    except Exception as e:

        raise RuntimeError(
            f"Gemini API error: {str(e)}"
        ) from e


    if not response.text:

        raise RuntimeError(
            "Gemini returned an empty response."
        )


    return parse_section_ir(
        response.text
    )


# =========================================================
# WIREFRAME IMAGE → IR
# =========================================================

def generate_ir_from_wireframe(
    image_bytes: bytes,
    mime_type: str
) -> SectionIR:

    if not image_bytes:

        raise ValueError(
            "Wireframe image is empty."
        )


    wireframe_prompt = """
Analyze the provided website wireframe or UI screenshot.

Convert ONLY the visible section into a CMS Intermediate
Representation.

Identify visible:

- Section type
- Headings
- Paragraphs
- Images
- Buttons
- Cards
- Repeated elements
- Visible default text

Allowed content types:

- Text
- Textfield
- Image
- Button
- Cards

Rules:

- Text = short headings or labels.
- Textfield = paragraphs/descriptions.
- Image = visible images.
- Button = CTA buttons.
- Cards = repeated cards/statistics/features.
- Use count for repeated elements.
- If card contents are visible, put them in cards.
- Do not invent unnecessary elements.
- Analyze only the visible section.
- Do NOT create HTML.
- Do NOT create CSS.
- Do NOT create React.
- Do NOT create a complete webpage.

Return only the CMS SectionIR.
"""


    try:

        response = client.models.generate_content(

            model=MODEL_NAME,

            contents=[
                wireframe_prompt,

                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type=mime_type
                )
            ],

            config=types.GenerateContentConfig(

                system_instruction=IR_SYSTEM_INSTRUCTION,

                response_mime_type="application/json",

                response_schema=SectionIR,

                temperature=0.2
            )
        )

    except Exception as e:

        raise RuntimeError(
            f"Gemini wireframe API error: {str(e)}"
        ) from e


    if not response.text:

        raise RuntimeError(
            "Gemini returned an empty response for wireframe."
        )


    return parse_section_ir(
        response.text
    )