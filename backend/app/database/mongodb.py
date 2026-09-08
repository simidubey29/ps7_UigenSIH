import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load variables from backend/.env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set in backend/.env")

client = MongoClient(MONGO_URI)

db = client["ps7_database"]

sections_collection = db["sections"]
elements_collection = db["elements"]


def test_connection():
    try:
        client.admin.command("ping")
        print("MongoDB connected successfully")
        return True

    except Exception as e:
        print("MongoDB connection failed:", e)
        return False