from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import UpdateLog
from app import schemas

router = APIRouter(prefix="/api/logs", tags=["logs"])
update_logs_router = APIRouter(prefix="/api/update-logs", tags=["update-logs"])


@router.get("", response_model=schemas.UpdateLogListResponse)
def list_logs(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(UpdateLog).order_by(desc(UpdateLog.triggered_at))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return schemas.UpdateLogListResponse(total=total, items=items)


@update_logs_router.get("", response_model=list[schemas.UpdateLogResponse])
def list_update_logs(limit: int = 7, db: Session = Depends(get_db)):
    return db.query(UpdateLog).order_by(desc(UpdateLog.triggered_at)).limit(limit).all()
