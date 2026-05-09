from fastapi import APIRouter, Depends, Request, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import date, datetime
from app.database import get_db
from app.models import Paper, Visitor, VisitorLog
from app import schemas
from app.services.geoip import get_location_by_ip
from app.config import settings
import asyncio

router = APIRouter(prefix="/api/visitors", tags=["visitors"])


# ── Helpers ──

def _is_local_ip(ip: str) -> bool:
    """Check if IP is localhost or Docker gateway."""
    if not ip:
        return True
    ip = ip.strip()
    if ip in ("127.0.0.1", "::1", "localhost"):
        return True
    if ip.startswith("172.18.0."):
        return True
    return False


def _is_bot_ua(ua: str | None) -> bool:
    """Check if User-Agent is a bot/script/crawler."""
    if not ua:
        return True
    ua_lower = ua.lower()
    bot_keywords = ["curl", "python", "bot", "spider", "crawler", "scrapy", "wget", "httpclient"]
    for kw in bot_keywords:
        if kw in ua_lower:
            return True
    return False


def _is_browser_ua(ua: str | None) -> bool:
    """Check if User-Agent looks like a real browser."""
    if not ua:
        return False
    return "mozilla/" in ua.lower()


# ── Legacy visitor endpoints (kept for compatibility) ──

@router.post("", response_model=schemas.VisitorResponse)
def record_visitor(payload: schemas.VisitorCreate, db: Session = Depends(get_db)):
    visitor = Visitor(**payload.model_dump())
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor


@router.get("/stats", response_model=schemas.VisitorStatsResponse)
def visitor_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(VisitorLog.id)).scalar() or 0
    today = db.query(func.count(VisitorLog.id)).filter(
        func.date(VisitorLog.visit_time) == date.today()
    ).scalar() or 0

    # Countries distribution
    country_rows = (
        db.query(VisitorLog.country, func.count(VisitorLog.id))
        .group_by(VisitorLog.country)
        .order_by(desc(func.count(VisitorLog.id)))
        .all()
    )
    countries = [
        {"name": c or "Unknown", "code": "UN", "count": cnt}
        for c, cnt in country_rows
    ]

    # Coordinates for map
    coord_rows = (
        db.query(VisitorLog.latitude, VisitorLog.longitude, VisitorLog.country, VisitorLog.city)
        .filter(VisitorLog.latitude.isnot(None), VisitorLog.longitude.isnot(None))
        .order_by(desc(VisitorLog.visit_time))
        .limit(500)
        .all()
    )
    coordinates = [
        {"lat": lat, "lng": lng, "country": c, "city": ci}
        for lat, lng, c, ci in coord_rows
    ]

    return schemas.VisitorStatsResponse(
        total_visitors=total,
        today_visitors=today,
        countries=countries,
        coordinates=coordinates,
    )


@router.get("")
def list_visitors(
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
):
    query = db.query(Visitor).order_by(desc(Visitor.visited_at))
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


# ── New visitor ping & map (uses visitor_log table) ──

@router.get("/ping")
async def visitor_ping(request: Request, db: Session = Depends(get_db)):
    """Record a visitor ping. Filters out bots, scripts and local requests."""
    forwarded = request.headers.get("x-forwarded-for")
    ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
    ua = request.headers.get("user-agent")

    # 1. Ignore bots and scripts
    if _is_bot_ua(ua):
        return {"ok": True, "recorded": False, "reason": "bot"}

    # 2. Must look like a real browser
    if not _is_browser_ua(ua):
        return {"ok": True, "recorded": False, "reason": "not_browser"}

    # 3. Ignore local IPs
    if _is_local_ip(ip):
        return {"ok": True, "recorded": False, "reason": "local_ip"}

    loc = await get_location_by_ip(ip)
    if loc:
        log = VisitorLog(
            ip=ip,
            country=loc.get("country"),
            city=loc.get("city"),
            latitude=loc.get("lat"),
            longitude=loc.get("lng"),
        )
        db.add(log)
        db.commit()

    return {"ok": True, "recorded": True}


@router.get("/map", response_model=schemas.VisitorMapResponse)
def visitor_map(db: Session = Depends(get_db)):
    rows = (
        db.query(
            VisitorLog.country,
            VisitorLog.city,
            VisitorLog.latitude,
            VisitorLog.longitude,
            func.count(VisitorLog.id),
        )
        .filter(VisitorLog.latitude.isnot(None), VisitorLog.longitude.isnot(None))
        .group_by(VisitorLog.country, VisitorLog.city, VisitorLog.latitude, VisitorLog.longitude)
        .all()
    )
    locations = [
        schemas.VisitorMapLocation(
            country=country or "Unknown",
            city=city or "Unknown",
            latitude=lat,
            longitude=lng,
            count=cnt,
        )
        for country, city, lat, lng, cnt in rows
    ]
    return schemas.VisitorMapResponse(locations=locations)


# ── Reset visitor log (admin only) ──

@router.post("/reset")
def reset_visitor_log(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
):
    """Clear visitor_log table. Requires Bearer token."""
    expected = f"Bearer {settings.app_secret_token}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid token")

    db.query(VisitorLog).delete()
    db.commit()
    return {"ok": True, "message": "Visitor log cleared"}
