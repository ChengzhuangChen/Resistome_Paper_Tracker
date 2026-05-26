from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text
from app.database import engine, Base, SessionLocal
from app.routers import papers, stats, update, logs, visitors, guestbook, keywords
from app.models import Visitor, VisitorLog, Guestbook, Paper
from app.services.geoip import get_location_by_ip
from app.services.pubmed_fetcher import pubmed_fetcher
import asyncio


def migrate_db():
    """Add missing columns to existing SQLite tables."""
    inspector = inspect(engine)
    if "papers" not in inspector.get_table_names():
        return
    existing = {c["name"] for c in inspector.get_columns("papers")}
    with engine.connect() as conn:
        adds = []
        if "xinrui_quartile" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN xinrui_quartile VARCHAR(8)')
        if "if" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN "if" REAL')
        if "is_top" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN is_top BOOLEAN DEFAULT 0')
        if "is_cns" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN is_cns BOOLEAN DEFAULT 0')
        if "sample_source" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN sample_source TEXT')
        if "subject_category" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN subject_category VARCHAR(128)')
        if "corresponding_author" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN corresponding_author VARCHAR(256)')
        if "first_affiliation" not in existing:
            adds.append('ALTER TABLE papers ADD COLUMN first_affiliation TEXT')
        for sql in adds:
            conn.execute(text(sql))
        conn.commit()


migrate_db()
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ARG Tracker",
    description="Antibiotic Resistance Gene Literature Tracker",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def track_visitor(request: Request, call_next):
    response = await call_next(request)
    path = request.url.path
    if path.startswith("/api/") and path not in ("/api/health", "/api/visitors"):
        try:
            forwarded = request.headers.get("x-forwarded-for")
            ip = forwarded.split(",")[0].strip() if forwarded else request.client.host
            ua = request.headers.get("user-agent", "")
            loc = await get_location_by_ip(ip)
            db = SessionLocal()
            try:
                v = Visitor(
                    ip=ip,
                    path=path,
                    user_agent=ua,
                    **(loc or {}),
                )
                db.add(v)
                db.commit()
            finally:
                db.close()
        except Exception:
            pass
    return response


@app.on_event("startup")
async def on_startup():
    """Auto-run historical backfill if database is empty."""
    db = SessionLocal()
    try:
        total = db.query(Paper).count()
        if total == 0:
            print("[Startup] Database empty, running historical backfill...")
            from datetime import date
            raw_papers = pubmed_fetcher.fetch_historical(
                start_date=settings.fetch_start_date,
                end_date=date.today(),
            )
            inserted = 0
            skipped = 0
            for rp in raw_papers:
                pmid = rp.get("pmid")
                if not pmid:
                    continue
                exists = db.query(Paper).filter(Paper.pmid == pmid).first()
                if exists:
                    skipped += 1
                    continue
                paper = Paper(
                    pmid=pmid,
                    doi=rp.get("doi"),
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
                inserted += 1
                if inserted % 100 == 0:
                    db.commit()
            db.commit()
            print(f"[Startup] Historical backfill complete: {inserted} inserted, {skipped} skipped.")
    except Exception as e:
        print(f"[Startup] Historical backfill failed: {e}")
    finally:
        db.close()

    # Start daily scheduler (02:00 UTC = 10:00 Beijing)
    from apscheduler.schedulers.asyncio import AsyncIOScheduler
    from apscheduler.triggers.cron import CronTrigger
    from app.scheduler import scheduled_update
    scheduler = AsyncIOScheduler()
    scheduler.add_job(scheduled_update, CronTrigger(hour=2, minute=0))
    scheduler.start()
    print("[Startup] Scheduler started. Daily update at 02:00 UTC (10:00 Beijing).")


app.include_router(papers.router)
app.include_router(stats.router)
app.include_router(update.router)
app.include_router(logs.router)
app.include_router(logs.update_logs_router)
app.include_router(visitors.router)
app.include_router(guestbook.router)
app.include_router(keywords.router)

@app.get("/api/health")
def health():
    return {"status": "ok"}
