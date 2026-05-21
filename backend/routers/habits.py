from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/habits", tags=["Habits"])

@router.get("/")
async def get_habits(user=Depends(get_current_user)):
    return {"message": "Habits endpoint live", "user_id": user["user_id"]}
