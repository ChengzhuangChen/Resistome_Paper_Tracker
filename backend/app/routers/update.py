import asyncio
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Paper, UpdateLog
from app.config import settings
from app.services.pubmed_fetcher import pubmed_fetcher, is_cns_journal
from app.services.llm_processor import llm_processor
from app.services.journal_matcher import journal_matcher

router = APIRouter(prefix="/api/update", tags=["update"])
enrich_router = APIRouter(prefix="/api/enrich", tags=["enrich"])


async def run_update(db: Session, enrich: bool = True) -> dict:
    """Core update logic reused by both manual trigger and scheduler."""
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
    if enrich:
        semaphore = asyncio.Semaphore(settings.llm_max_concurrent)

        async def _enrich_one(paper_id):
            async with semaphore:
                db2 = SessionLocal()
                try:
                    paper = db2.query(Paper).filter(Paper.id == paper_id).first()
                    if not paper:
                        return {"ok": False, "id": paper_id, "pmid": None}
                    skip_fields = set()
                    if paper.corresponding_author:
                        skip_fields.add("corresponding_author")
                    if paper.first_affiliation:
                        skip_fields.add("first_affiliation")
                    result = await llm_processor.analyze_paper(
                        paper.title, paper.abstract_en or "", skip_fields=skip_fields or None
                    )
                    paper.abstract_cn = result.get("abstract_cn", "")
                    paper.methods = result.get("methods", "")
                    paper.research_subject = result.get("research_subject", "")
                    paper.highlights = result.get("highlights", "")
                    paper.conclusion = result.get("conclusion", "")
                    paper.sample_source = result.get("sample_source", "")
                    paper.subject_category = result.get("subject_category", "")
                    if not paper.corresponding_author:
                        paper.corresponding_author = result.get("corresponding_author", "") or None
                    if not paper.first_affiliation:
                        paper.first_affiliation = result.get("first_affiliation", "") or None
                    db2.commit()
                    return {"ok": True, "id": paper.id}
                except Exception:
                    db2.rollback()
                    return {"ok": False, "id": paper_id, "pmid": paper.pmid}
                finally:
                    db2.close()

        new_ids = [p.id for p, _ in new_papers]
        results = await asyncio.gather(*[_enrich_one(pid) for pid in new_ids])
        for r in results:
            if r["ok"]:
                enriched_today.append(r["id"])
            else:
                failed_ids.append(r.get("pmid") or f"#{r['id']}")

    return {
        "searched": len(paper_ids),
        "fetched": len(raw_papers),
        "new": len(new_papers),
        "enriched_count": len(enriched_today),
        "enriched_ids": enriched_today,
        "failed": failed_ids,
    }


def _reclassify_paper(paper, db: Session):
    """Re-run journal matching & CNS check for an existing paper."""
    matched = journal_matcher.match(paper.journal, None)
    if matched:
        paper.jcr_quartile = matched["jcr_quartile"]
        paper.xinrui_quartile = matched["xinrui_quartile"]
        paper.if_ = matched["if"]
        paper.is_top = matched["is_top"]
    paper.is_cns = is_cns_journal(paper.journal)
    db.commit()


@router.post("")
async def trigger_update(
    authorization: str = Header(..., alias="Authorization"),
    enrich: bool = True,
    db: Session = Depends(get_db),
):
    expected = f"Bearer {settings.app_secret_token}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid token")

    # 1. 抓取并入库（含并发翻译新文献）
    result = await run_update(db, enrich=True)

    # 2. 如果 enrich=True，并发补译历史遗漏文献
    enriched_today = list(result["enriched_ids"])
    failed_ids = list(result["failed"])
    if enrich:
        missing_papers = db.query(Paper).filter(
            (Paper.abstract_cn.is_(None)) | (Paper.abstract_cn == "")
        ).all()

        semaphore = asyncio.Semaphore(settings.llm_max_concurrent)

        async def _enrich_one(paper):
            async with semaphore:
                db2 = SessionLocal()
                try:
                    paper_obj = db2.query(Paper).filter(Paper.id == paper.id).first()
                    if not paper_obj:
                        return {"ok": False, "id": paper.id, "pmid": paper.pmid}
                    skip_fields = set()
                    if paper_obj.corresponding_author:
                        skip_fields.add("corresponding_author")
                    if paper_obj.first_affiliation:
                        skip_fields.add("first_affiliation")
                    analysis = await llm_processor.analyze_paper(
                        paper_obj.title, paper_obj.abstract_en or "", skip_fields=skip_fields or None
                    )
                    paper_obj.abstract_cn = analysis.get("abstract_cn", "")
                    paper_obj.methods = analysis.get("methods", "")
                    paper_obj.research_subject = analysis.get("research_subject", "")
                    paper_obj.highlights = analysis.get("highlights", "")
                    paper_obj.conclusion = analysis.get("conclusion", "")
                    paper_obj.sample_source = analysis.get("sample_source", "")
                    paper_obj.subject_category = analysis.get("subject_category", "")
                    if not paper_obj.corresponding_author:
                        paper_obj.corresponding_author = analysis.get("corresponding_author", "") or None
                    if not paper_obj.first_affiliation:
                        paper_obj.first_affiliation = analysis.get("first_affiliation", "") or None
                    db2.commit()
                    return {"ok": True, "id": paper.id}
                except Exception:
                    db2.rollback()
                    return {"ok": False, "id": paper.id, "pmid": paper.pmid}
                finally:
                    db2.close()

        results = await asyncio.gather(*[_enrich_one(p) for p in missing_papers])
        for r in results:
            if r["ok"]:
                enriched_today.append(r["id"])
            else:
                failed_ids.append(r.get("pmid") or f"#{r['id']}")

    # 3. 记录日志
    log = UpdateLog(
        searched=result["searched"],
        fetched=result["fetched"],
        new_count=result["new"],
        enriched=len(enriched_today),
        failed_count=len(failed_ids),
        status="success" if not failed_ids else ("partial" if enriched_today else "failed"),
        error_msg=",".join(failed_ids) if failed_ids else None,
    )
    db.add(log)
    db.commit()

    return {
        "searched": result["searched"],
        "fetched": result["fetched"],
        "new": result["new"],
        "enriched": len(enriched_today),
        "failed": failed_ids if failed_ids else None,
    }


@enrich_router.post("/all")
async def enrich_all(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
):
    expected = f"Bearer {settings.app_secret_token}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid token")

    papers = db.query(Paper).filter(
        (Paper.abstract_cn.is_(None)) | (Paper.abstract_cn == "")
    ).all()

    if not papers:
        return {"success": 0, "failed": []}

    semaphore = asyncio.Semaphore(5)

    async def _enrich_one(paper_id):
        async with semaphore:
            db2 = SessionLocal()
            try:
                paper = db2.query(Paper).filter(Paper.id == paper_id).first()
                if not paper:
                    return {"ok": False, "pmid": None, "error": "Paper not found"}

                skip_fields = set()
                if paper.corresponding_author:
                    skip_fields.add("corresponding_author")
                if paper.first_affiliation:
                    skip_fields.add("first_affiliation")
                result = await llm_processor.analyze_paper(
                    paper.title,
                    paper.abstract_en or "",
                    skip_fields=skip_fields or None,
                )
                paper.abstract_cn = result.get("abstract_cn", "")
                paper.methods = result.get("methods", "")
                paper.research_subject = result.get("research_subject", "")
                paper.highlights = result.get("highlights", "")
                paper.conclusion = result.get("conclusion", "")
                paper.sample_source = result.get("sample_source", "")
                paper.subject_category = result.get("subject_category", "")
                if not paper.corresponding_author:
                    paper.corresponding_author = result.get("corresponding_author", "") or None
                if not paper.first_affiliation:
                    paper.first_affiliation = result.get("first_affiliation", "") or None

                db2.commit()
                return {"ok": True}
            except Exception as e:
                db2.rollback()
                return {"ok": False, "pmid": paper.pmid if paper else None, "error": str(e)}
            finally:
                db2.close()

    results = await asyncio.gather(*[_enrich_one(p.id) for p in papers])
    success = sum(1 for r in results if r["ok"])
    failed = [r for r in results if not r["ok"]]

    return {"success": success, "failed": failed}


@router.post("/reclassify")
async def reclassify_all(
    authorization: str = Header(..., alias="Authorization"),
    db: Session = Depends(get_db),
):
    """Re-run journal matching & CNS check on all existing papers.
    Use when journal_matcher or is_cns logic has been updated.
    """
    expected = f"Bearer {settings.app_secret_token}"
    if authorization != expected:
        raise HTTPException(status_code=403, detail="Invalid token")

    papers = db.query(Paper).all()
    if not papers:
        return {"total": 0, "matched": 0, "updated_cns": 0}

    matched = 0
    updated_cns = 0
    for paper in papers:
        result = journal_matcher.match(paper.journal, None)
        old_cns = paper.is_cns
        new_cns = is_cns_journal(paper.journal)
        if result:
            paper.jcr_quartile = result["jcr_quartile"]
            paper.xinrui_quartile = result["xinrui_quartile"]
            paper.if_ = result["if"]
            paper.is_top = result["is_top"]
            matched += 1
        if new_cns != old_cns:
            paper.is_cns = new_cns
            updated_cns += 1
        db.commit()

    return {
        "total": len(papers),
        "matched": matched,
        "updated_cns": updated_cns,
    }
