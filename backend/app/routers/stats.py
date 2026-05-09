from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta
from app.database import get_db
from app.models import Paper, VisitorLog
from app import schemas


def _get_visitor_stats(db: Session):
    """Return total and today visitor counts from visitor_log."""
    total = db.query(func.count(VisitorLog.id)).scalar() or 0
    today = db.query(func.count(VisitorLog.id)).filter(
        func.date(VisitorLog.visit_time) == date.today()
    ).scalar() or 0
    return total, today

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=schemas.StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Paper.id)).scalar() or 0

    today = date.today()
    today_count = (
        db.query(func.count(Paper.id))
        .filter(func.date(Paper.publication_date) == today)
        .scalar()
        or 0
    )

    # This month count
    month_start = today.replace(day=1)
    this_month_count = (
        db.query(func.count(Paper.id))
        .filter(func.date(Paper.publication_date) >= month_start)
        .filter(func.date(Paper.publication_date) <= today)
        .scalar()
        or 0
    )

    # Top journal ratio
    top_count = db.query(func.count(Paper.id)).filter(Paper.is_top == True).scalar() or 0
    top_ratio = round(top_count / total, 4) if total > 0 else 0.0

    # CNS journal ratio
    cns_count = db.query(func.count(Paper.id)).filter(Paper.is_cns == True).scalar() or 0
    cns_ratio = round(cns_count / total, 4) if total > 0 else 0.0

    # Subject category distribution
    subject_rows = (
        db.query(Paper.subject_category, func.count(Paper.id))
        .filter(Paper.subject_category.isnot(None))
        .group_by(Paper.subject_category)
        .all()
    )
    subjects_distribution = { (s or "其他"): c for s, c in subject_rows }

    total_visitors, today_visitors = _get_visitor_stats(db)

    return schemas.StatsResponse(
        total_count=total,
        today_new_count=today_count,
        this_month=this_month_count,
        top_ratio=top_ratio,
        subjects_distribution=subjects_distribution,
        cns_ratio=cns_ratio,
        total_visitors=total_visitors,
        today_visitors=today_visitors,
    )


@router.get("/trend", response_model=schemas.TrendResponse)
def get_trend(days: int = 30, db: Session = Depends(get_db)):
    """Return daily paper counts aggregated by publication_date."""
    today = date.today()
    start_date = today - timedelta(days=days - 1)

    # Single query: group by publication_date using SQLite DATE() function
    rows = (
        db.query(func.date(Paper.publication_date), func.count(Paper.id))
        .filter(Paper.publication_date.isnot(None))
        .filter(func.date(Paper.publication_date) >= start_date.isoformat())
        .filter(func.date(Paper.publication_date) <= today.isoformat())
        .group_by(func.date(Paper.publication_date))
        .order_by(func.date(Paper.publication_date))
        .all()
    )

    count_map = {str(d): int(c) for d, c in rows if d}

    dates = []
    counts = []
    for i in range(days - 1, -1, -1):
        d = today - timedelta(days=i)
        d_str = d.strftime("%Y-%m-%d")
        dates.append(d_str)
        counts.append(count_map.get(d_str, 0))

    return schemas.TrendResponse(dates=dates, counts=counts)


@router.get("/yearly", response_model=schemas.YearlyStatsResponse)
def get_yearly(db: Session = Depends(get_db)):
    rows = (
        db.query(func.strftime("%Y", Paper.publication_date), func.count(Paper.id))
        .filter(Paper.publication_date.isnot(None))
        .group_by(func.strftime("%Y", Paper.publication_date))
        .order_by(func.strftime("%Y", Paper.publication_date))
        .all()
    )
    years = [int(y) for y, _ in rows if y]
    counts = [int(c) for _, c in rows]
    return schemas.YearlyStatsResponse(years=years, counts=counts)


@router.get("/monthly", response_model=schemas.MonthlyResponse)
def get_monthly(db: Session = Depends(get_db)):
    """Return monthly paper counts for the last 12 months."""
    today = date.today()

    rows = (
        db.query(func.strftime("%Y-%m", Paper.publication_date), func.count(Paper.id))
        .filter(Paper.publication_date.isnot(None))
        .group_by(func.strftime("%Y-%m", Paper.publication_date))
        .order_by(func.strftime("%Y-%m", Paper.publication_date))
        .all()
    )

    count_map = {str(m): int(c) for m, c in rows if m}

    months = []
    counts = []
    for i in range(11, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        m_str = f"{year:04d}-{month:02d}"
        months.append(m_str)
        counts.append(count_map.get(m_str, 0))

    return schemas.MonthlyResponse(months=months, counts=counts)
