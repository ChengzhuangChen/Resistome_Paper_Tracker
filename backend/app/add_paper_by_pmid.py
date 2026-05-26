#!/usr/bin/env python3
"""Add papers to the database by PMID or DOI.

Usage:
    # Single paper
    python -m app.add_paper_by_pmid 12345678

    # Multiple papers
    python -m app.add_paper_by_pmid 12345678 12345679 10.1234/example.doi

    # From file (one identifier per line)
    python -m app.add_paper_by_pmid --file ids.txt
"""
import argparse
import sys
from Bio import Entrez
from app.database import SessionLocal
from app.models import Paper
from app.config import settings
from app.services.pubmed_fetcher import pubmed_fetcher

Entrez.email = settings.ncbi_email
if settings.ncbi_api_key:
    Entrez.api_key = settings.ncbi_api_key


def resolve_doi_to_pmid(doi: str) -> str | None:
    """Resolve a DOI to a PubMed PMID via NCBI esearch."""
    try:
        handle = Entrez.esearch(db="pubmed", term=f'"{doi}"[aid]', retmax=1)
        record = Entrez.read(handle)
        handle.close()
        ids = record.get("IdList", [])
        return ids[0] if ids else None
    except Exception as e:
        print(f"[Error] Failed to resolve DOI {doi}: {e}")
        return None


def add_papers_by_identifiers(identifiers: list[str]) -> dict:
    """Fetch details for given PMIDs/DOIs and insert missing ones into DB.

    Returns dict with keys: added, skipped, unresolved.
    """
    db = SessionLocal()
    try:
        pmids = []
        unresolved = []

        for raw in identifiers:
            ident = raw.strip()
            if not ident:
                continue
            if ident.isdigit():
                pmids.append(ident)
            else:
                pmid = resolve_doi_to_pmid(ident)
                if pmid:
                    print(f"[Resolved] DOI {ident} -> PMID {pmid}")
                    pmids.append(pmid)
                else:
                    unresolved.append(ident)

        if not pmids:
            return {"added": 0, "skipped": 0, "unresolved": unresolved}

        # Deduplicate against existing PMIDs in DB
        existing_rows = db.query(Paper.pmid).filter(Paper.pmid.in_(pmids)).all()
        existing = {row[0] for row in existing_rows}
        to_fetch = [pmid for pmid in pmids if pmid not in existing]
        skipped = len(pmids) - len(to_fetch)

        added = 0
        if to_fetch:
            print(f"[Fetch] Fetching {len(to_fetch)} paper(s) from PubMed...")
            papers = pubmed_fetcher.fetch_details(to_fetch)
            print(f"[Fetch] Retrieved {len(papers)} detail record(s)")

            for p in papers:
                paper = Paper(
                    pmid=p.get("pmid"),
                    doi=p.get("doi"),
                    title=p.get("title", ""),
                    abstract_en=p.get("abstract", ""),
                    journal=p.get("journal", ""),
                    publication_date=p.get("publication_date"),
                    article_type=p.get("article_type", ""),
                    jcr_quartile=p.get("jcr_quartile"),
                    xinrui_quartile=p.get("xinrui_quartile"),
                    if_=p.get("if"),
                    is_top=p.get("is_top", False),
                    is_cns=p.get("is_cns", False),
                    corresponding_author=p.get("corresponding_author"),
                    first_affiliation=p.get("first_affiliation"),
                )
                db.add(paper)
                added += 1
                print(f"[Added] PMID {p.get('pmid')} - {p.get('title', '')[:60]}...")

            db.commit()

        return {"added": added, "skipped": skipped, "unresolved": unresolved}
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(
        description="Add papers to the ARG Tracker database by PMID or DOI."
    )
    parser.add_argument(
        "identifiers",
        nargs="*",
        help="One or more PMIDs (numeric) or DOIs",
    )
    parser.add_argument(
        "--file",
        "-f",
        metavar="PATH",
        help="File containing PMIDs/DOIs (one per line)",
    )
    args = parser.parse_args()

    ids = []
    if args.file:
        try:
            with open(args.file, "r", encoding="utf-8") as fh:
                ids = [line.strip() for line in fh if line.strip()]
        except FileNotFoundError:
            print(f"[Error] File not found: {args.file}")
            sys.exit(1)

    ids.extend(args.identifiers)

    if not ids:
        parser.print_help()
        sys.exit(1)

    result = add_papers_by_identifiers(ids)

    print(f"\n=== Summary ===")
    print(f"Added:   {result['added']}")
    print(f"Skipped: {result['skipped']}")
    if result["unresolved"]:
        print(f"Unresolved DOIs: {', '.join(result['unresolved'])}")


if __name__ == "__main__":
    main()
