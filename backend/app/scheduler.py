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
        from app.models import UpdateLog

        result = await run_update(db)

        # Record update log
        log = UpdateLog(
            searched=result["searched"],
            fetched=result["fetched"],
            new_count=result["new"],
            enriched=result["enriched_count"],
            failed_count=len(result["failed"]),
            status="success" if not result["failed"] else ("partial" if result["enriched_count"] else "failed"),
            error_msg=",".join(result["failed"]) if result["failed"] else None,
        )
        db.add(log)
        db.commit()

        if result["enriched_papers"]:
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
                for p in result["enriched_papers"]
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
