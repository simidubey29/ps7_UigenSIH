from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from bson import ObjectId

from app.database.mongodb import (
    sections_collection,
    elements_collection
)

router = APIRouter()


# =========================================================
# GET ALL SECTIONS
# =========================================================

@router.get("/sections")
async def get_sections():

    sections = list(
        sections_collection.find({})
    )

    return JSONResponse(
        content=jsonable_encoder(
            sections,
            custom_encoder={
                ObjectId: str
            }
        )
    )


# =========================================================
# GET ONE SECTION + ELEMENTS
# =========================================================

@router.get("/sections/{section_id}")
async def get_section(section_id: str):

    section = sections_collection.find_one(
        {
            "sectionId": section_id
        }
    )

    if not section:

        raise HTTPException(
            status_code=404,
            detail="Section not found"
        )


    elements = list(
        elements_collection.find(
            {
                "sectionId": section_id
            }
        )
    )


    return JSONResponse(
        content=jsonable_encoder(
            {
                "section": section,
                "elements": elements
            },
            custom_encoder={
                ObjectId: str
            }
        )
    )


# =========================================================
# DELETE SECTION
# =========================================================

@router.delete("/sections/{section_id}")
async def delete_section(section_id: str):

    section_result = (
        sections_collection.delete_many(
            {
                "sectionId": section_id
            }
        )
    )


    if section_result.deleted_count == 0:

        raise HTTPException(
            status_code=404,
            detail="Section not found"
        )


    elements_result = (
        elements_collection.delete_many(
            {
                "sectionId": section_id
            }
        )
    )


    return {
        "ok": True,
        "message": "Section deleted successfully",
        "sectionId": section_id,
        "deletedSections":
            section_result.deleted_count,
        "deletedElements":
            elements_result.deleted_count
    }