from app.database.mongodb import sections_collection


def generate_section_id():

    last_section = sections_collection.find_one(
        {},
        sort=[("_id", -1)]
    )

    if not last_section:
        return "1000000001"

    last_id = int(last_section["sectionId"])

    return str(last_id + 1)