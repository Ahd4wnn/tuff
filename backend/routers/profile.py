from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("/")
async def get_profile(user=Depends(get_current_user)):
    return {"message": "Profile endpoint live", "user_id": user["user_id"]}
