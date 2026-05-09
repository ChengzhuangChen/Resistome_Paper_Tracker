import time
import re
from datetime import datetime, timedelta, date
from typing import List, Dict, Optional
from urllib.error import HTTPError
from Bio import Entrez
from app.config import settings
from app.services.journal_matcher import journal_matcher

Entrez.email = settings.ncbi_email

# Only keep papers published in 2026 or later
_MIN_PUB_DATE = date(2026, 1, 1)

# Validate API key on startup; fallback to no key if invalid
if settings.ncbi_api_key:
    Entrez.api_key = settings.ncbi_api_key
    try:
        test = Entrez.esearch(db="pubmed", term="resistome", retmax=1)
        Entrez.read(test)
        test.close()
    except HTTPError:
        Entrez.api_key = None


# ── Article type mapping ──
ARTICLE_TYPE_MAP = {
    "Meta分析": [
        "meta-analysis",
    ],
    "临床实验": [
        "clinical trial", "randomized controlled trial", "controlled clinical trial",
        "pragmatic clinical trial", "clinical study",
    ],
    "综述": [
        "review", "systematic review", "narrative review", "critical review",
        "literature review", "scoping review", "umbrella review",
    ],
    "Benchmark": [
        "benchmark",
    ],
    "研究论文": [
        "journal article", "research article", "research support",
        "research support, n.i.h.", "research support, non-u.s. gov't",
        "research support, u.s. gov't, non-p.h.s.", "research support, u.s. gov't, p.h.s.",
        "comparative study", "evaluation study", "validation study",
        "letter", "editorial", "comment", "case reports", "observational study",
    ],
}


def map_article_type(pub_type_list: List, title: str, abstract: str) -> str:
    """Map PubMed publication types to one of 5 Chinese categories."""
    types = [str(t).strip().lower() for t in pub_type_list if t]
    for category, keywords in ARTICLE_TYPE_MAP.items():
        for pt in types:
            if pt in keywords:
                return category
    # Fallback: detect benchmark from title/abstract if not in PubMed types
    combined_text = (title + " " + abstract).lower()
    if "benchmark" in combined_text:
        return "Benchmark"
    return "研究论文"


# CNS whitelist — exact journal names (normalized lowercase)
# Based on official Nature, Science, Cell families
_CNS_JOURNALS = frozenset({
    # --- Nature 主刊 ---
    "nature",
    # --- Nature 研究型子刊 ---
    "nature biotechnology", "nature cancer", "nature cell biology",
    "nature chemical biology", "nature genetics", "nature immunology",
    "nature medicine", "nature metabolism", "nature microbiology",
    "nature neuroscience", "nature plants", "nature structural & molecular biology",
    "nature aging", "nature cardiovascular research",
    "nature chemistry", "nature electronics", "nature energy",
    "nature geoscience", "nature machine intelligence", "nature materials",
    "nature nanotechnology", "nature photonics", "nature physics",
    "nature synthesis", "nature climate change", "nature ecology & evolution",
    "nature sustainability", "nature water",
    "nature communications", "nature computational science",
    "nature methods", "nature protocols",
    # --- Nature Reviews 综述子刊 ---
    "nature reviews cancer", "nature reviews chemistry",
    "nature reviews clinical oncology", "nature reviews disease primers",
    "nature reviews drug discovery", "nature reviews earth & environment",
    "nature reviews endocrinology",
    "nature reviews gastroenterology & hepatology",
    "nature reviews genetics", "nature reviews immunology",
    "nature reviews materials", "nature reviews methods primers",
    "nature reviews microbiology", "nature reviews molecular cell biology",
    "nature reviews nephrology", "nature reviews neurology",
    "nature reviews neuroscience", "nature reviews physics",
    "nature reviews psychology", "nature reviews rheumatology",
    "nature reviews urology",
    # --- Nature 其他关联刊 ---
    "humanities & social sciences communications",
    "npg asia materials",
    # --- Science 主刊 ---
    "science",
    # --- Science 核心子刊 ---
    "science advances", "science translational medicine",
    "science immunology", "science robotics", "science signaling",
    # --- Science 其他 ---
    "research",
    # --- Science Partner Journals ---
    "cancer communications", "journal of remote sensing",
    "space: science & technology", "health data science",
    "bio design research", "biodesign research",
    # --- Other high-impact ---
    "advanced science",
    "proceedings of the national academy of sciences of the united states of america",
    # --- Cell 主刊 ---
    "cell",
    # --- Cell 核心研究子刊 ---
    "cancer cell", "cell chemical biology", "cell genomics",
    "cell host & microbe", "cell metabolism", "cell stem cell",
    "cell systems", "current biology", "developmental cell",
    "immunity", "molecular cell", "neuron",
    # --- Cell 拓展交叉刊 ---
    "chem", "chem catalysis", "joule", "matter", "med",
    "one earth", "device",
    # --- Cell Reports 系列 ---
    "cell reports", "cell reports medicine", "cell reports methods",
    "cell reports physical science", "cell reports sustainability",
    # --- 其他 Cell Press 刊 ---
    "iscience", "patterns", "structure",
})

# Additional safe prefix patterns (series that are unambiguous)
_CNS_PREFIXES = (
    "nature reviews ",
    "cell reports ",
    "trends in ",
)


def _normalize_journal_name(name: str) -> str:
    if not name:
        return ""
    n = name.lower().strip()
    n = re.sub(r"\s+", " ", n)
    n = re.sub(r"[.,]+$", "", n)
    return n


def is_cns_journal(journal_name: str) -> bool:
    j = _normalize_journal_name(journal_name)
    if not j:
        return False
    if j in _CNS_JOURNALS:
        return True
    for prefix in _CNS_PREFIXES:
        if j.startswith(prefix):
            return True
    return False


def extract_corresponding_author(author_list):
    """Extract corresponding author name and first affiliation from PubMed AuthorList."""
    if not author_list:
        return None, None

    authors = []
    electronic_idx = None

    for idx, author in enumerate(author_list):
        if not isinstance(author, dict):
            continue
        authors.append(author)
        # Check for electronic address hint in affiliation
        aff_infos = author.get("AffiliationInfo", [])
        if not isinstance(aff_infos, list):
            aff_infos = [aff_infos]
        for aff_info in aff_infos:
            if isinstance(aff_info, dict):
                aff_text = str(aff_info.get("Affiliation", ""))
                if "electronic address:" in aff_text.lower():
                    electronic_idx = idx
                    break
        if electronic_idx is not None:
            break

    if not authors:
        return None, None

    # Priority: ① ValidYN="Y" (all authors usually have it, so skip as primary cue)
    # ② Electronic address hint
    # ③ Last author
    target = None
    if electronic_idx is not None:
        target = authors[electronic_idx]
    else:
        target = authors[-1]

    # Build name
    last_name = target.get("LastName", "")
    fore_name = target.get("ForeName", "")
    collective = target.get("CollectiveName", "")
    name = f"{fore_name} {last_name}".strip() if fore_name or last_name else collective

    # Build affiliation
    aff_infos = target.get("AffiliationInfo", [])
    if not isinstance(aff_infos, list):
        aff_infos = [aff_infos]
    affiliation = ""
    for aff_info in aff_infos:
        if isinstance(aff_info, dict):
            affiliation = str(aff_info.get("Affiliation", ""))
            break

    # First semicolon-separated segment, remove email
    if affiliation:
        segment = affiliation.split(";")[0].strip()
        # Remove email patterns
        segment = re.sub(r"\S+@\S+", "", segment)
        segment = re.sub(r"Electronic address:\s*", "", segment, flags=re.IGNORECASE)
        segment = re.sub(r"\s+", " ", segment).strip(",; ")
        affiliation = segment

    return clean_text(name) if name else None, clean_text(affiliation) if affiliation else None


def clean_text(text: str) -> str:
    """Strip HTML tags, trim whitespace, and remove a trailing period."""
    if not text:
        return ""
    text = re.sub(r'<[^>]+>', '', text)
    text = text.strip()
    text = re.sub(r'\.\s*$', '', text)
    return text


def extract_issn(journal_info):
    """Extract ISSN from Journal info dict."""
    if not isinstance(journal_info, dict):
        return ""
    issn = journal_info.get("ISSN", "")
    if issn:
        return str(issn).strip()
    # Some records have ISSN under ISSNLinking in MedlineCitation
    return ""


class PubMedFetcher:
    def __init__(self):
        self.query = 'resistome[Title/Abstract] OR resistomes[Title/Abstract] OR "antibiotics resistance gene"[Title/Abstract] OR "antibiotics resistance genes"[Title/Abstract]'
        self.batch_size = 200
        self.delay = 0.34 if Entrez.api_key else 1.0  # NCBI rate limit

    def search(self, days: int = 7, retmax: int = 200) -> List[str]:
        end_date = datetime.utcnow().date()
        start_date = max(end_date - timedelta(days=days), datetime(2026, 5, 1).date())
        date_range = f'{start_date.strftime("%Y/%m/%d")}:{end_date.strftime("%Y/%m/%d")}[Date - Publication]'
        full_query = f"({self.query}) AND {date_range}"

        handle = Entrez.esearch(db="pubmed", term=full_query, retmax=retmax, sort="date")
        record = Entrez.read(handle)
        handle.close()
        id_list = record.get("IdList", [])
        return id_list

    def fetch_details(self, id_list: List[str]) -> List[Dict]:
        if not id_list:
            return []

        papers = []
        for start in range(0, len(id_list), self.batch_size):
            batch = id_list[start:start + self.batch_size]
            handle = Entrez.efetch(db="pubmed", id=",".join(batch), rettype="medline", retmode="xml")
            records = Entrez.read(handle)
            handle.close()

            for article in records.get("PubmedArticle", []):
                medline = article.get("MedlineCitation", {})
                article_data = medline.get("Article", {})

                pmid = str(medline.get("PMID", ""))
                title = clean_text(str(article_data.get("ArticleTitle", "")))

                abstract_sections = article_data.get("Abstract", {}).get("AbstractText", [])
                if not isinstance(abstract_sections, list):
                    abstract_sections = [abstract_sections]
                abstract = clean_text(" ".join(str(s) for s in abstract_sections))

                journal_info = article_data.get("Journal", {})
                journal = clean_text(str(journal_info.get("Title", ""))) if journal_info else ""
                journal = re.sub(r'\s*\([^)]*\)', '', journal).strip()
                issn = extract_issn(journal_info)

                doi = ""
                for id_obj in article_data.get("ELocationID", []):
                    if hasattr(id_obj, "attributes") and id_obj.attributes.get("EIdType") == "doi":
                        doi = str(id_obj)
                        break
                if not doi:
                    article_ids = article.get("PubmedData", {}).get("ArticleIdList", [])
                    for aid in article_ids:
                        if hasattr(aid, "attributes") and aid.attributes.get("IdType") == "doi":
                            doi = str(aid)
                            break

                pub_date = self._parse_date(article)
                if not pub_date or pub_date < _MIN_PUB_DATE:
                    continue

                pub_types = article_data.get("PublicationTypeList", [])
                article_type = map_article_type(pub_types, title, abstract)

                # Corresponding author & affiliation
                author_list = article_data.get("AuthorList", [])
                corr_author, first_aff = extract_corresponding_author(author_list)

                # Journal matching
                matched = journal_matcher.match(journal, issn)
                jcr_q = matched["jcr_quartile"] if matched else None
                xr_q = matched["xinrui_quartile"] if matched else None
                impact_factor = matched["if"] if matched else None
                is_top = matched["is_top"] if matched else False

                papers.append({
                    "pmid": pmid,
                    "title": title,
                    "abstract": abstract,
                    "journal": journal,
                    "issn": issn,
                    "doi": doi,
                    "publication_date": pub_date,
                    "article_type": article_type,
                    "jcr_quartile": jcr_q,
                    "xinrui_quartile": xr_q,
                    "if": impact_factor,
                    "is_top": is_top,
                    "is_cns": is_cns_journal(journal),
                    "corresponding_author": corr_author,
                    "first_affiliation": first_aff,
                })

            time.sleep(self.delay)

        return papers

    def fetch_historical(self, start_date: date, end_date: date) -> List[Dict]:
        """Fetch all historical papers from PubMed using NCBI History Server."""
        term = 'resistome* OR "antibiotics resistance gene*"'
        mindate = start_date.strftime("%Y/%m/%d")
        maxdate = end_date.strftime("%Y/%m/%d")

        print(f"[Historical] Searching PubMed: {mindate} -> {maxdate}")

        # Step 1: esearch with usehistory
        search_handle = Entrez.esearch(
            db="pubmed",
            term=term,
            datetype="pdat",
            mindate=mindate,
            maxdate=maxdate,
            usehistory="y",
            sort="date",
        )
        search_record = Entrez.read(search_handle)
        search_handle.close()

        count = int(search_record.get("Count", 0))
        webenv = search_record.get("WebEnv", "")
        query_key = search_record.get("QueryKey", "")

        print(f"[Historical] Total records found: {count}")

        if count == 0 or not webenv or not query_key:
            return []

        papers = []
        retmax = 200
        retries = 3

        for retstart in range(0, count, retmax):
            for attempt in range(retries):
                try:
                    handle = Entrez.efetch(
                        db="pubmed",
                        WebEnv=webenv,
                        query_key=query_key,
                        retstart=retstart,
                        retmax=retmax,
                        rettype="medline",
                        retmode="xml",
                    )
                    records = Entrez.read(handle)
                    handle.close()

                    for article in records.get("PubmedArticle", []):
                        medline = article.get("MedlineCitation", {})
                        article_data = medline.get("Article", {})

                        pmid = str(medline.get("PMID", ""))
                        title = clean_text(str(article_data.get("ArticleTitle", "")))

                        abstract_sections = article_data.get("Abstract", {}).get("AbstractText", [])
                        if not isinstance(abstract_sections, list):
                            abstract_sections = [abstract_sections]
                        abstract = clean_text(" ".join(str(s) for s in abstract_sections))

                        journal_info = article_data.get("Journal", {})
                        journal = clean_text(str(journal_info.get("Title", ""))) if journal_info else ""
                        journal = re.sub(r'\s*\([^)]*\)', '', journal).strip()
                        issn = extract_issn(journal_info)

                        doi = ""
                        for id_obj in article_data.get("ELocationID", []):
                            if hasattr(id_obj, "attributes") and id_obj.attributes.get("EIdType") == "doi":
                                doi = str(id_obj)
                                break
                        if not doi:
                            article_ids = article.get("PubmedData", {}).get("ArticleIdList", [])
                            for aid in article_ids:
                                if hasattr(aid, "attributes") and aid.attributes.get("IdType") == "doi":
                                    doi = str(aid)
                                    break

                        pub_date = self._parse_date(article)
                        if not pub_date or pub_date < _MIN_PUB_DATE:
                            continue

                        pub_types = article_data.get("PublicationTypeList", [])
                        article_type = map_article_type(pub_types, title, abstract)

                        author_list = article_data.get("AuthorList", [])
                        corr_author, first_aff = extract_corresponding_author(author_list)

                        matched = journal_matcher.match(journal, issn)
                        jcr_q = matched["jcr_quartile"] if matched else None
                        xr_q = matched["xinrui_quartile"] if matched else None
                        impact_factor = matched["if"] if matched else None
                        is_top = matched["is_top"] if matched else False

                        papers.append({
                            "pmid": pmid,
                            "title": title,
                            "abstract": abstract,
                            "journal": journal,
                            "issn": issn,
                            "doi": doi,
                            "publication_date": pub_date,
                            "article_type": article_type,
                            "jcr_quartile": jcr_q,
                            "xinrui_quartile": xr_q,
                            "if": impact_factor,
                            "is_top": is_top,
                            "is_cns": is_cns_journal(journal),
                            "corresponding_author": corr_author,
                            "first_affiliation": first_aff,
                        })

                    break  # success, exit retry loop
                except HTTPError as e:
                    if e.code == 429:
                        print(f"[Historical] 429 at retstart={retstart}, attempt={attempt+1}, sleeping 1s...")
                        time.sleep(1)
                        continue
                    raise
                except Exception as e:
                    print(f"[Historical] Error at retstart={retstart}, attempt={attempt+1}: {e}")
                    if attempt < retries - 1:
                        time.sleep(1)
                        continue
                    raise
            else:
                # All retries exhausted
                raise RuntimeError(f"Failed to fetch retstart={retstart} after {retries} attempts")

            if retstart + retmax < count:
                time.sleep(0.15)

        return papers

    @staticmethod
    def _parse_date(article: Dict) -> Optional[date]:
        """Extract publication date with 4-tier priority:
        1. ArticleDate (Year/Month/Day)
        2. JournalIssue/PubDate
        3. PubMedPubDate with PubStatus="entrez"
        4. Earliest PubMedPubDate in History
        """

        def _to_date(year, month_raw, day_raw) -> Optional[date]:
            if not year:
                return None
            month_map = {
                "Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4,
                "May": 5, "Jun": 6, "Jul": 7, "Aug": 8,
                "Sep": 9, "Oct": 10, "Nov": 11, "Dec": 12,
            }
            month = month_map.get(month_raw, month_raw)
            if isinstance(month, str):
                month = int(month) if month.isdigit() else 1
            day = int(day_raw) if str(day_raw).isdigit() else 1
            try:
                return date(int(year), month, day)
            except Exception:
                return None

        article_data = article.get("MedlineCitation", {}).get("Article", {})

        # 1. ArticleDate (can be a list; prefer first element)
        ad = article_data.get("ArticleDate", {})
        if isinstance(ad, list) and ad:
            ad = ad[0]
        if isinstance(ad, dict) and ad:
            d = _to_date(ad.get("Year"), ad.get("Month", "1"), ad.get("Day", "1"))
            if d:
                return d

        # 2. JournalIssue/PubDate
        jissue = article_data.get("Journal", {}).get("JournalIssue", {})
        pd = jissue.get("PubDate", {})
        if pd:
            d = _to_date(pd.get("Year"), pd.get("Month", "1"), pd.get("Day", "1"))
            if d:
                return d

        # 3 & 4. PubmedData/History
        history = article.get("PubmedData", {}).get("History", [])
        if history:
            candidates = []
            for entry in history:
                if not isinstance(entry, dict):
                    continue
                d = _to_date(entry.get("Year"), entry.get("Month", "1"), entry.get("Day", "1"))
                if d:
                    candidates.append((d, entry.get("PubStatus", "")))
            if candidates:
                # 3. Prefer entrez
                for d, status in candidates:
                    if status == "entrez":
                        return d
                # 4. Fallback to earliest
                return min(candidates, key=lambda x: x[0])[0]

        return None


pubmed_fetcher = PubMedFetcher()
