from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/journal", tags=["Journal"])

@router.get("/")
async def get_journal(user=Depends(get_current_user)):
    return {"message": "Journal endpoint live", "user_id": user["user_id"]}
