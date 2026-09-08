from typing import Optional, Dict, Any, List

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from bson import ObjectId

from app.database.mongodb import elements_collection


router = APIRouter()


# =========================================================
# REQUEST MODEL
# =========================================================

class ElementUpdate(BaseModel):

    content: Optional[str] = None

    css: Optional[Dict[str, Any]] = None

    loop: Optional[List[Dict[str, Any]]] = None


# =========================================================
# UPDATE ELEMENT
# =========================================================

@router.put("/elements/{field_id}")
async def update_element(
    field_id: str,
    data: ElementUpdate
):

    element = elements_collection.find_one(
        {
            "fieldId": field_id
        }
    )


    if not element:

        raise HTTPException(
            status_code=404,
            detail=f"Element {field_id} not found"
        )


    update_data = {}


    if data.content is not None:

        update_data["content"] = data.content


    if data.css is not None:

        update_data["css"] = data.css


    if data.loop is not None:

        update_data["loop"] = data.loop


    if not update_data:

        raise HTTPException(
            status_code=400,
            detail="Nothing to update"
        )


    elements_collection.update_one(

        {
            "fieldId": field_id
        },

        {
            "$set": update_data
        }

    )


    updated = elements_collection.find_one(
        {
            "fieldId": field_id
        }
    )


    updated.pop(
        "_id",
        None
    )


    return {
        "ok": True,
        "message": "Element updated successfully",
        "element": updated
    }