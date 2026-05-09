import sqlite3
import os
import sys
from datetime import date

sys.path.insert(0, '/app')
from app.services.pubmed_fetcher import PubMedFetcher

db_path = os.environ.get('DATABASE_URL', 'sqlite:////app/data/args.db').replace('sqlite:///', '')
fetcher = PubMedFetcher()


def main():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute(
        'SELECT id, pmid, publication_date FROM papers '
        'WHERE pmid IS NOT NULL AND pmid != "" '
        'ORDER BY id'
    )
    rows = c.fetchall()
    conn.close()

    total = len(rows)
    if total == 0:
        print('[Backfill] No papers to update.')
        return

    print(f'[Backfill] {total} papers need publication_date re-extraction.')
    updated = 0
    unchanged = 0

    # Process in batches matching fetcher batch_size
    batch_size = fetcher.batch_size
    for start in range(0, total, batch_size):
        batch = rows[start:start + batch_size]
        pmids = [r[1] for r in batch]

        try:
            details = fetcher.fetch_details(pmids)
        except Exception as e:
            print(f'  Fetch failed for batch {start+1}-{min(start+batch_size, total)}: {e}')
            continue

        pmid_to_detail = {str(d['pmid']): d for d in details}

        conn = sqlite3.connect(db_path)
        cu = conn.cursor()
        for idx, (pid, pmid, old_date) in enumerate(batch, start=start + 1):
            detail = pmid_to_detail.get(str(pmid))
            if not detail:
                print(f'  [{idx}/{total}] id={pid} pmid={pmid} SKIPPED (not found in PubMed)')
                continue

            new_date = detail.get('publication_date')
            if new_date and isinstance(new_date, date):
                new_date_str = new_date.isoformat()
            else:
                new_date_str = None

            if old_date and isinstance(old_date, date):
                old_date_str = old_date.isoformat()
            elif old_date and isinstance(old_date, str):
                old_date_str = old_date
            else:
                old_date_str = None

            if new_date_str != old_date_str:
                cu.execute(
                    'UPDATE papers SET publication_date = ? WHERE id = ?',
                    (new_date_str, pid)
                )
                updated += 1
                print(f'  [{idx}/{total}] id={pid} pmid={pmid} UPDATED {old_date_str} -> {new_date_str}')
            else:
                unchanged += 1
                print(f'  [{idx}/{total}] id={pid} pmid={pmid} OK {old_date_str}')

        conn.commit()
        conn.close()

    print(f'[Backfill] Done. Updated={updated}, Unchanged={unchanged}')


if __name__ == '__main__':
    main()
