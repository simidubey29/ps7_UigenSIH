from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.elements import router as elements_router
from app.api.generate import router as generate_router
from app.api.section import router as sections_router
from app.api.ai_test import router as ai_test_router
from app.database.mongodb import test_connection


app = FastAPI(
    title="PS7 AI-Assisted UI Generator",
    version="1.0.0"
)


# -------------------------
# CORS
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------
# API Routers
# -------------------------
app.include_router(
    generate_router,
    prefix="/api"
)

app.include_router(
    sections_router,
    prefix="/api"
)

app.include_router(
    ai_test_router,
    prefix="/api"
)

app.include_router(
    elements_router,
    prefix="/api"
)


# -------------------------
# Startup
# -------------------------
@app.on_event("startup")
def startup_event():
    test_connection()


# -------------------------
# Health Check
# -------------------------
@app.get("/api/health")
def health():
    return {
        "ok": True,
        "message": "PS7 backend is running"
    }