import asyncio
import sqlite3
import os
import sys
import time

sys.path.insert(0, '/app/backend')
from app.services.llm_processor import llm_processor
from app.config import settings

db_path = os.environ.get('DATABASE_URL', 'sqlite:////app/data/args.db').replace('sqlite:///', '')
PROGRESS_FILE = '/app/backfill_progress.txt'

async def main():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute(
        'SELECT id, title, abstract_en, corresponding_author, first_affiliation '
        'FROM papers WHERE abstract_en IS NOT NULL AND (abstract_cn IS NULL OR abstract_cn = "") '
        'ORDER BY id'
    )
    rows = c.fetchall()
    conn.close()

    total = len(rows)
    if total == 0:
        print('[Backfill] No papers need enrichment.')
        return

    # Resume from progress file
    start_idx = 0
    if os.path.exists(PROGRESS_FILE):
        try:
            with open(PROGRESS_FILE, 'r') as f:
                start_idx = int(f.read().strip())
        except Exception:
            start_idx = 0

    print(f'[Backfill] {total} papers need enrichment, starting from index {start_idx}')
    success = 0
    failed = 0

    for idx in range(start_idx, total):
        pid, title, abstract_en, corr, aff = rows[idx]
        skip = set()
        if corr:
            skip.add('corresponding_author')
        if aff:
            skip.add('first_affiliation')
        try:
            result = await llm_processor.analyze_paper(
                title, abstract_en or '', skip_fields=skip or None
            )
            conn = sqlite3.connect(db_path)
            cu = conn.cursor()
            cu.execute(
                '''UPDATE papers SET
                    abstract_cn = ?,
                    methods = ?,
                    research_subject = ?,
                    highlights = ?,
                    conclusion = ?,
                    sample_source = ?,
                    subject_category = ?,
                    corresponding_author = COALESCE(corresponding_author, ?),
                    first_affiliation = COALESCE(first_affiliation, ?)
                WHERE id = ?''',
                (
                    result.get('abstract_cn', ''),
                    result.get('methods', ''),
                    result.get('research_subject', ''),
                    result.get('highlights', ''),
                    result.get('conclusion', ''),
                    result.get('sample_source', ''),
                    result.get('subject_category', ''),
                    result.get('corresponding_author', '') or None,
                    result.get('first_affiliation', '') or None,
                    pid,
                )
            )
            conn.commit()
            conn.close()
            success += 1
            print(f'  [{idx+1}/{total}] OK id={pid} subject={result.get("subject_category","")}')
        except Exception as e:
            failed += 1
            print(f'  [{idx+1}/{total}] FAILED id={pid}: {e}')

        # Save progress
        with open(PROGRESS_FILE, 'w') as f:
            f.write(str(idx + 1))

        # Delay between papers
        if idx < total - 1 and settings.llm_batch_interval > 0:
            await asyncio.sleep(settings.llm_batch_interval)

    print(f'[Backfill] Done. Success={success}, Failed={failed}')
    if os.path.exists(PROGRESS_FILE):
        os.remove(PROGRESS_FILE)

if __name__ == '__main__':
    asyncio.run(main())
