import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.database import SessionLocal

async def scheduled_update():
    db = SessionLocal()
    try:
        from app.config import settings
        # Directly call business logic without HTTP request
        # For simplicity we reuse the router logic inline
        from app.services.pubmed_fetcher import pubmed_fetcher
        from app.services.llm_processor import llm_processor
        from app.services.email_sender import email_sender
        from app.models import Paper
        from datetime import datetime

        paper_ids = pubmed_fetcher.search(days=settings.fetch_days)
        raw_papers = pubmed_fetcher.fetch_details(paper_ids)

        new_papers = []
        for rp in raw_papers:
            pmid = rp.get("pmid")
            doi = rp.get("doi")
            if not pmid and not doi:
                continue
            dup = db.query(Paper).filter((Paper.pmid == pmid) if pmid else False).first()
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
            )
            db.add(paper)
            db.flush()
            new_papers.append((paper, rp))

        db.commit()

        enriched = []
        for paper, rp in new_papers:
            try:
                result = await llm_processor.analyze_paper(paper.title, paper.abstract_en or "")
                paper.abstract_cn = result.get("abstract_cn", "")
                paper.methods = result.get("methods", "")
                paper.research_subject = result.get("research_subject", "")
                paper.highlights = result.get("highlights", "")
                paper.conclusion = result.get("conclusion", "")
                from app.routers.update import estimate_jcr
                paper.jcr_quartile = estimate_jcr(paper.journal)
                db.commit()
                enriched.append(paper)
            except Exception:
                db.rollback()
                continue

        if enriched:
            date_str = datetime.utcnow().strftime("%Y-%m-%d")
            paper_dicts = [
                {
                    "pmid": p.pmid,
                    "title": p.title,
                    "journal": p.journal,
                    "jcr_quartile": p.jcr_quartile,
                    "highlights": p.highlights,
                    "conclusion": p.conclusion,
                }
                for p in enriched
            ]
            await email_sender.send_daily_digest(paper_dicts, date_str)
    finally:
        db.close()

def main():
    scheduler = AsyncIOScheduler()
    scheduler.add_job(scheduled_update, CronTrigger(hour=2, minute=0))
    scheduler.start()
    print("Scheduler started. Daily update at 02:00 UTC.")
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        pass

if __name__ == "__main__":
    main()
