import asyncio
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import Paper, UpdateLog
from app.config import settings
from app.services.pubmed_fetcher import pubmed_fetcher
from app.services.llm_processor import llm_processor

router = APIRouter(prefix="/api/update", tags=["update"])

@router.post("")
async def trigger_update(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
):
    expected = f"Bearer {settings.app_secret_token}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid token")

    paper_ids = pubmed_fetcher.search(days=settings.fetch_days)
    raw_papers = pubmed_fetcher.fetch_details(paper_ids)

    new_papers = []
    for rp in raw_papers:
        pmid = rp.get("pmid")
        doi = rp.get("doi")
        if not pmid and not doi:
            continue

        dup = db.query(Paper).filter(
            (Paper.pmid == pmid) if pmid else False
        ).first()
        if not dup and doi:
            dup = db.query(Paper).filter(Paper.doi == doi).first()
        if dup:
            continue

        paper = Paper(
            pmid=pmid,
            doi=doi,
            title=rp.get("title", ""),
            abstract_en=rp.get("abstract", ""),
            journal=rp.get("journal", ""),
            publication_date=rp.get("publication_date"),
            article_type=rp.get("article_type", ""),
            jcr_quartile=rp.get("jcr_quartile"),
            xinrui_quartile=rp.get("xinrui_quartile"),
            if_=rp.get("if"),
            is_top=rp.get("is_top", False),
            is_cns=rp.get("is_cns", False),
            corresponding_author=rp.get("corresponding_author"),
            first_affiliation=rp.get("first_affiliation"),
        )
        db.add(paper)
        db.flush()
        new_papers.append((paper, rp))

    db.commit()

    enriched_today = []
    failed_ids = []
    for idx, (paper, rp) in enumerate(new_papers):
        try:
            skip_fields = set()
            if paper.corresponding_author:
                skip_fields.add("corresponding_author")
            if paper.first_affiliation:
                skip_fields.add("first_affiliation")
            result = await llm_processor.analyze_paper(paper.title, paper.abstract_en or "", skip_fields=skip_fields or None)
            paper.abstract_cn = result.get("abstract_cn", "")
            paper.methods = result.get("methods", "")
            paper.research_subject = result.get("research_subject", "")
            paper.highlights = result.get("highlights", "")
            paper.conclusion = result.get("conclusion", "")
            paper.sample_source = result.get("sample_source", "")
            paper.subject_category = result.get("subject_category", "")
            # corresponding_author / first_affiliation: prefer PubMed extraction, fall back to LLM
            if not paper.corresponding_author:
                paper.corresponding_author = result.get("corresponding_author", "") or None
            if not paper.first_affiliation:
                paper.first_affiliation = result.get("first_affiliation", "") or None

            db.commit()
            enriched_today.append(paper)
        except Exception:
            db.rollback()
            failed_ids.append(paper.pmid or paper.doi or f"#{paper.id}")
            continue
        finally:
            if settings.llm_batch_interval > 0 and idx < len(new_papers) - 1:
                await asyncio.sleep(settings.llm_batch_interval)

    log = UpdateLog(
        searched=len(paper_ids),
        fetched=len(raw_papers),
        new_count=len(new_papers),
        enriched=len(enriched_today),
        failed_count=len(failed_ids),
        status="success" if not failed_ids else ("partial" if enriched_today else "failed"),
        error_msg=",".join(failed_ids) if failed_ids else None,
    )
    db.add(log)
    db.commit()

    return {
        "searched": len(paper_ids),
        "fetched": len(raw_papers),
        "new": len(new_papers),
        "enriched": len(enriched_today),
        "failed": failed_ids if failed_ids else None,
    }
