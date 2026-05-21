from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/notes", tags=["Notes"])

@router.get("/")
async def get_notes(user=Depends(get_current_user)):
    return {"message": "Notes endpoint live", "user_id": user["user_id"]}
