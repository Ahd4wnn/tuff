from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/contacts", tags=["Contacts"])

@router.get("/")
async def get_contacts(user=Depends(get_current_user)):
    return {"message": "Contacts endpoint live", "user_id": user["user_id"]}
