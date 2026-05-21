# Session 003 — FastAPI Backend Setup

## What was built
- Full FastAPI project scaffold inside `tuff/backend/`
- JWT auth middleware using Supabase JWT secret
- 7 stubbed routers: goals, habits, contacts, projects, notes, journal, profile
- CORS configured for React frontend at localhost:5173
- Health check endpoint at GET /health

## How to run locally
cd tuff/backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

## API Docs
Visit http://localhost:8000/docs after starting the server

## Environment variables needed
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (from Supabase Dashboard > Settings > API)
- SUPABASE_JWT_SECRET (from Supabase Dashboard > Settings > API > JWT Secret)
- FRONTEND_URL
