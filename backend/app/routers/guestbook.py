from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Guestbook
from app import schemas
from app.config import settings

router = APIRouter(prefix="/api/guestbook", tags=["guestbook"])

RATE_LIMIT_MINUTES = 5


@router.post("", response_model=schemas.GuestbookItem)
def create_message(
    payload: schemas.GuestbookCreate,
    request: Request,
    db: Session = Depends(get_db),
):
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else request.client.host

    # Rate limit: same IP within RATE_LIMIT_MINUTES
    cutoff = datetime.utcnow() - timedelta(minutes=RATE_LIMIT_MINUTES)
    recent = (
        db.query(Guestbook)
        .filter(Guestbook.ip == ip)
        .filter(Guestbook.created_at >= cutoff)
        .first()
    )
    if recent:
        raise HTTPException(status_code=429, detail="操作过于频繁，请稍后再试")

    content = (payload.content or "").strip()
    if not content:
        raise HTTPException(status_code=400, detail="内容不能为空")
    if len(content) > 500:
        raise HTTPException(status_code=400, detail="内容不能超过500字")

    nickname = (payload.nickname or "").strip()
    if not nickname:
        nickname = "匿名访客"

    entry = Guestbook(
        nickname=nickname,
        content=content,
        ip=ip,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.get("", response_model=schemas.GuestbookListResponse)
def list_messages(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(Guestbook).order_by(desc(Guestbook.created_at))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return schemas.GuestbookListResponse(total=total, items=items)


@router.delete("")
def clear_messages(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
):
    expected = f"Bearer {settings.app_secret_token}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid token")
    db.query(Guestbook).delete()
    db.commit()
    return {"deleted": True}
