from concurrent.futures import ThreadPoolExecutor
import asyncio
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Paper
from app.services.llm_processor import LLMProcessor


def process_one(paper_id: int) -> bool:
    """Process a single paper: run LLM enrichment and update DB."""
    db: Session = SessionLocal()
    try:
        paper = db.query(Paper).filter(Paper.id == paper_id).first()
        if not paper:
            return False

        # Use a fresh processor per thread to avoid shared async-state issues
        processor = LLMProcessor()
        result = asyncio.run(
            processor.analyze_paper(
                title=paper.title,
                abstract=paper.abstract_en or "",
            )
        )

        paper.abstract_cn = result.get("abstract_cn") or paper.abstract_cn
        paper.methods = result.get("methods") or paper.methods
        paper.research_subject = result.get("research_subject") or paper.research_subject
        paper.sample_source = result.get("sample_source") or paper.sample_source
        paper.subject_category = result.get("subject_category") or paper.subject_category
        paper.highlights = result.get("highlights") or paper.highlights
        paper.conclusion = result.get("conclusion") or paper.conclusion
        paper.corresponding_author = result.get("corresponding_author") or paper.corresponding_author
        paper.first_affiliation = result.get("first_affiliation") or paper.first_affiliation

        db.commit()
        print(f"[OK] Paper {paper.id} (PMID: {paper.pmid})")
        return True
    except Exception as exc:
        db.rollback()
        print(f"[FAIL] Paper {paper_id}: {exc}")
        return False
    finally:
        db.close()


def main():
    db: Session = SessionLocal()
    try:
        papers = (
            db.query(Paper.id)
            .filter((Paper.abstract_cn.is_(None)) | (Paper.abstract_cn == ""))
            .all()
        )
        paper_ids = [p.id for p in papers]
        total = len(paper_ids)
        print(f"Found {total} papers missing Chinese enrichment.\n")

        if total == 0:
            print("Nothing to fix.")
            return
    finally:
        db.close()

    with ThreadPoolExecutor(max_workers=5) as executor:
        results = list(executor.map(process_one, paper_ids))

    success = sum(results)
    failed = len(results) - success
    print(f"\n成功处理 {success} 条，失败 {failed} 条")


if __name__ == "__main__":
    main()
