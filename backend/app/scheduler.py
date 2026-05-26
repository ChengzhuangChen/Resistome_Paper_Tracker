import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.database import SessionLocal


async def scheduled_update():
    db = SessionLocal()
    try:
        from app.routers.update import run_update
        from app.services.email_sender import email_sender
        from app.models import UpdateLog, Paper
        from app.services.llm_processor import llm_processor
        from app.config import settings

        # 1. 抓取并入库新文献（含并发翻译）
        result = await run_update(db, enrich=True)

        # 2. 查询新文献之外的 abstract_cn 为空的历史遗漏文献
        already_enriched = set(result["enriched_ids"])
        missing_papers = db.query(Paper).filter(
            (Paper.abstract_cn.is_(None)) | (Paper.abstract_cn == ""),
            ~Paper.id.in_(already_enriched) if already_enriched else True
        ).all()

        # 3. 并发补译历史遗漏文献
        enriched_today = list(result["enriched_ids"])
        failed_ids = list(result["failed"])

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

        if missing_papers:
            results = await asyncio.gather(*[_enrich_one(p) for p in missing_papers])
            for r in results:
                if r["ok"]:
                    enriched_today.append(r["id"])
                else:
                    failed_ids.append(r.get("pmid") or f"#{r['id']}")

        # 4. 记录更新日志
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

        # 5. 发送邮件（如有新文献且翻译成功）
        if result["new"] > 0 and enriched_today:
            date_str = datetime.utcnow().strftime("%Y-%m-%d")
            enriched_papers = db.query(Paper).filter(Paper.id.in_(enriched_today)).all()
            paper_dicts = [
                {
                    "pmid": p.pmid,
                    "title": p.title,
                    "journal": p.journal,
                    "jcr_quartile": p.jcr_quartile,
                    "highlights": p.highlights,
                    "conclusion": p.conclusion,
                }
                for p in enriched_papers
            ]
            await email_sender.send_daily_digest(paper_dicts, date_str)
    except Exception as e:
        from app.models import UpdateLog
        log = UpdateLog(
            searched=0,
            fetched=0,
            new_count=0,
            enriched=0,
            failed_count=0,
            status="failed",
            error_msg=str(e),
        )
        db.add(log)
        db.commit()
    finally:
        db.close()


def main():
    scheduler = AsyncIOScheduler(timezone='Asia/Shanghai')
    scheduler.add_job(scheduled_update, CronTrigger(hour=2, minute=0))
    scheduler.start()
    print("Scheduler started. Daily update at 02:00 Beijing.")
    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        pass


if __name__ == "__main__":
    main()
