from app.services.id_generator import generate_field_id


DEFAULT_CONTENT = {
    "heroImage": "default/images/hero-placeholder.jpg",
    "brandBadge": "PULSE FIT",
    "headlineMain": "CHALLENGE YOUR LIMITS",
    "headlineSub": "Be a part of the tribe that's limitless.",
    "description": "Join trainer-led workout sessions designed to kickstart your fitness journey.",
    "ctaButton": "FIND A WORKOUT"
}


def generate_elements(ir, section_id):

    elements = []

    for item in ir.elements:

        # Generate field ID
        field_id = generate_field_id()

        # Use AI-generated defaultContent first
        # Otherwise use fallback DEFAULT_CONTENT
        content = (
            item.defaultContent
            if item.defaultContent is not None
            else DEFAULT_CONTENT.get(
                item.elementName,
                ""
            )
        )

        element = {
            "sectionId": section_id,
            "elementName": item.elementName,
            "fieldId": field_id,
            "contentType": item.contentType,
            "content": content,
            "css": None,
            "loop": None,
            "projectName": "sample-brand",
            "pageName": "Home"
        }

        # Handle Cards
        if item.contentType == "Cards":

            element["loop"] = generate_cards(
                item.cards,
                item.count or 3
            )

        elements.append(element)

    return elements


def generate_cards(cards, count):

    result = []

    for i in range(count):

        # Generate IDs for card fields
        value_id = generate_field_id()
        label_id = generate_field_id()

        # Use Gemini-generated card data
        if cards and i < len(cards):

            value = cards[i].value
            label = cards[i].label

        # Fallback if Gemini didn't provide cards
        else:

            value = f"{i + 1}00+"
            label = f"Sample Metric {i + 1}"

        result.append({
            "field1": value,
            "fieldType1": "Text",
            "fieldId1": value_id,

            "field2": label,
            "fieldType2": "Text",
            "fieldId2": label_id
        })

    return result