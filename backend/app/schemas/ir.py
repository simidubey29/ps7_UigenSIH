from typing import Optional, Literal
from pydantic import BaseModel


class CardIR(BaseModel):
    value: str
    label: str


class ElementIR(BaseModel):

    elementName: str

    contentType: Literal[
        "Image",
        "Text",
        "Textfield",
        "Button",
        "Cards"
    ]

    defaultContent: Optional[str] = None

    count: Optional[int] = None

    cards: Optional[list[CardIR]] = None


class SectionIR(BaseModel):

    sectionType: str

    elements: list[ElementIR]