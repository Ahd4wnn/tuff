from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("/")
async def get_goals(user=Depends(get_current_user)):
    return {"message": "Goals endpoint live", "user_id": user["user_id"]}
