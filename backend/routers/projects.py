from fastapi import APIRouter, Depends
from middleware.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("/")
async def get_projects(user=Depends(get_current_user)):
    return {"message": "Projects endpoint live", "user_id": user["user_id"]}
