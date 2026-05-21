from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import FRONTEND_URL

from routers import goals, habits, contacts, projects, notes, journal, profile

app = FastAPI(
    title="Tuff API",
    description="Backend for Tuff — your personal OS",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(goals.router, prefix="/api")
app.include_router(habits.router, prefix="/api")
app.include_router(contacts.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(notes.router, prefix="/api")
app.include_router(journal.router, prefix="/api")
app.include_router(profile.router, prefix="/api")

@app.get("/")
async def root():
    return {"status": "Tuff API is running 🔥"}

@app.get("/health")
async def health():
    return {"status": "ok"}
