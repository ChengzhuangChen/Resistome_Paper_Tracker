import sqlite3
import os
import sys
from Bio import Entrez
import time

sys.path.insert(0, '/app')
from app.services.pubmed_fetcher import map_article_type

db_path = os.environ.get('DATABASE_URL', 'sqlite:////app/data/args.db').replace('sqlite:///', '')
Entrez.email = os.environ.get('PUBMED_EMAIL', 'argtracker@example.com')
BATCH_SIZE = 100

def main():
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('SELECT id, pmid, title, abstract FROM papers WHERE pmid IS NOT NULL AND pmid != "" ORDER BY id')
    rows = c.fetchall()
    conn.close()

    total = len(rows)
    if total == 0:
        print('[Backfill] No papers to update.')
        return

    print(f'[Backfill] {total} papers need article_type reclassification.')
    updated = 0
    unchanged = 0

    for start in range(0, total, BATCH_SIZE):
        batch = rows[start:start + BATCH_SIZE]
        pmids = [r[1] for r in batch]

        try:
            handle = Entrez.efetch(db='pubmed', id=','.join(pmids), rettype='medline', retmode='xml')
            records = Entrez.read(handle)
            handle.close()
        except Exception as e:
            print(f'  Fetch failed for batch {start+1}-{min(start+BATCH_SIZE, total)}: {e}')
            continue

        pubmed_map = {}
        for article in records.get('PubmedArticle', []):
            medline = article.get('MedlineCitation', {})
            pmid = str(medline.get('PMID', ''))
            article_data = medline.get('Article', {})
            pub_types = article_data.get('PublicationTypeList', [])
            title = str(article_data.get('ArticleTitle', ''))
            abstract_sections = article_data.get('Abstract', {}).get('AbstractText', [])
            if not isinstance(abstract_sections, list):
                abstract_sections = [abstract_sections]
            abstract = ' '.join(str(s) for s in abstract_sections)
            pubmed_map[pmid] = (pub_types, title, abstract)

        conn = sqlite3.connect(db_path)
        cu = conn.cursor()
        for idx, (pid, pmid, title, abstract) in enumerate(batch, start=start + 1):
            new_type = None
            if pmid in pubmed_map:
                pub_types, pm_title, pm_abstract = pubmed_map[pmid]
                new_type = map_article_type(pub_types, pm_title, pm_abstract)
            else:
                # Fallback to local title/abstract if PubMed fetch missed it
                new_type = map_article_type([], title, abstract)

            cu.execute('UPDATE papers SET article_type = ? WHERE id = ?', (new_type, pid))
            updated += 1
            print(f'  [{idx}/{total}] id={pid} pmid={pmid} -> {new_type}')

        conn.commit()
        conn.close()

        if start + BATCH_SIZE < total:
            time.sleep(1)

    print(f'[Backfill] Done. Updated={updated}')

if __name__ == '__main__':
    main()
