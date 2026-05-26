import argparse
import asyncio
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Paper
from app.services.pubmed_fetcher import pubmed_fetcher
from app.services.llm_processor import llm_processor


async def main(enrich: bool = True):
    db: Session = SessionLocal()
    try:
        end = date.today()
        print(f"[Backfill] Fetching historical papers 2021-01-01 -> {end}...")
        raw_papers = pubmed_fetcher.fetch_historical(
            start_date=date(2021, 1, 1),
            end_date=end,
        )

        # Deduplicate by PMID against existing DB records
        existing_pmids = {p[0] for p in db.query(Paper.pmid).all() if p[0]}
        new_papers = [p for p in raw_papers if p["pmid"] and p["pmid"] not in existing_pmids]

        total_found = len(raw_papers)
        total_new = len(new_papers)
        print(f"[Backfill] Found {total_found} papers, {total_new} new to insert.")

        if total_new == 0:
            print("Nothing to backfill.")
            return

        # Batch insert
        inserted = []
        for rp in new_papers:
            paper = Paper(
                pmid=rp["pmid"],
                doi=rp.get("doi") or None,
                title=rp["title"],
                abstract_en=rp.get("abstract", ""),
                journal=rp.get("journal"),
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
            inserted.append(paper)

        db.commit()
        print(f"[Backfill] Inserted {len(inserted)} papers.")

        if not enrich:
            print("[Backfill] Skipping LLM enrichment (--no-enrich).")
            print(f"\n[Backfill] Done. Inserted: {len(inserted)}, Enriched: 0, Failed: 0")
            return

        print("[Backfill] Now enriching with LLM...")

        # LLM enrichment (concurrency controlled by llm_processor.semaphore, default 5)
        enriched = 0
        failed = 0
        for idx, paper in enumerate(inserted, 1):
            try:
                result = await llm_processor.analyze_paper(
                    paper.title,
                    paper.abstract_en or "",
                )
                paper.abstract_cn = result.get("abstract_cn", "")
                paper.methods = result.get("methods", "")
                paper.research_subject = result.get("research_subject", "")
                paper.highlights = result.get("highlights", "")
                paper.conclusion = result.get("conclusion", "")
                paper.sample_source = result.get("sample_source", "未提及")
                paper.subject_category = result.get("subject_category", "")
                paper.corresponding_author = result.get(
                    "corresponding_author", paper.corresponding_author
                )
                paper.first_affiliation = result.get(
                    "first_affiliation", paper.first_affiliation
                )

                db.commit()
                enriched += 1
                print(f"  [{idx}/{len(inserted)}] OK PMID {paper.pmid}")
            except Exception as e:
                db.rollback()
                failed += 1
                print(f"  [{idx}/{len(inserted)}] FAIL PMID {paper.pmid}: {e}")

        print(
            f"\n[Backfill] Done. Inserted: {len(inserted)}, Enriched: {enriched}, Failed: {failed}"
        )

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Backfill resistome papers from PubMed.")
    parser.add_argument(
        "--no-enrich",
        dest="enrich",
        action="store_false",
        default=True,
        help="Skip LLM enrichment (fetch-only mode).",
    )
    args = parser.parse_args()
    asyncio.run(main(enrich=args.enrich))
