from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, case
from typing import Optional, List
from datetime import date
from app.database import get_db
from app.models import Paper
from app import schemas

router = APIRouter(prefix="/api/papers", tags=["papers"])


def _parse_comma_list(val: Optional[str]) -> List[str]:
    if not val:
        return []
    return [v.strip() for v in val.split(",") if v.strip()]


@router.get("", response_model=schemas.PaperListResponse)
def list_papers(
    q: Optional[str] = Query(None, description="Full-text search"),
    page: int = Query(1, ge=1),
    page_size: int = Query(5, ge=1, le=1000),
    sort_by: str = Query("-publication_date", description="Sort field, prefix - for desc"),
    article_type: Optional[str] = Query(None, description="Comma-separated article types"),
    jcr_quartile: Optional[str] = Query(None),
    subject_category: Optional[str] = Query(None, description="Comma-separated subject categories"),
    is_top: Optional[bool] = Query(None),
    is_cns: Optional[bool] = Query(None),
    if_min: Optional[float] = Query(None, ge=0),
    date_from: Optional[date] = Query(None),
    date_to: Optional[date] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Paper)

    if q:
        search = f"%{q}%"
        query = query.filter(
            or_(
                Paper.title.ilike(search),
                Paper.abstract_cn.ilike(search),
                Paper.journal.ilike(search),
                Paper.methods.ilike(search),
                Paper.research_subject.ilike(search),
                Paper.highlights.ilike(search),
                Paper.conclusion.ilike(search),
            )
        )

    article_types = _parse_comma_list(article_type)
    if article_types:
        query = query.filter(Paper.article_type.in_(article_types))

    if jcr_quartile:
        query = query.filter(Paper.jcr_quartile == jcr_quartile)

    subject_categories = _parse_comma_list(subject_category)
    if subject_categories:
        query = query.filter(Paper.subject_category.in_(subject_categories))

    if is_top is not None:
        query = query.filter(Paper.is_top == is_top)
    if is_cns is not None:
        query = query.filter(Paper.is_cns == is_cns)
    if if_min is not None:
        query = query.filter(Paper.if_ >= if_min)

    if date_from:
        query = query.filter(Paper.publication_date >= date_from)
    if date_to:
        query = query.filter(Paper.publication_date <= date_to)

    # Sorting
    sort_field = sort_by.lstrip("-")
    sort_desc = sort_by.startswith("-")

    if sort_field == 'jcr_quartile':
        # Custom order: Q1 > Q2 > Q3 > Q4 > NA > NULL
        priority = case(
            (Paper.jcr_quartile == 'Q1', 1),
            (Paper.jcr_quartile == 'Q2', 2),
            (Paper.jcr_quartile == 'Q3', 3),
            (Paper.jcr_quartile == 'Q4', 4),
            (Paper.jcr_quartile == 'NA', 5),
            else_=6
        )
        query = query.order_by(priority.asc() if sort_desc else priority.desc())
    elif sort_field == 'xinrui_quartile':
        priority = case(
            (Paper.xinrui_quartile == '1', 1),
            (Paper.xinrui_quartile == '2', 2),
            (Paper.xinrui_quartile == '3', 3),
            (Paper.xinrui_quartile == '4', 4),
            else_=5
        )
        query = query.order_by(priority.asc() if sort_desc else priority.desc())
    else:
        col = getattr(Paper, sort_field, Paper.publication_date)
        query = query.order_by(col.desc() if sort_desc else col.asc())

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return schemas.PaperListResponse(total=total, items=items)


@router.get("/{paper_id}", response_model=schemas.PaperResponse)
def get_paper(paper_id: int, db: Session = Depends(get_db)):
    paper = db.query(Paper).filter(Paper.id == paper_id).first()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper
