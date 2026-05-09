import re
import string
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Paper
from app import schemas
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/keywords", tags=["keywords"])

# Cache: { language: (timestamp, data) }
_cache = {}
CACHE_TTL_SECONDS = 3600  # 1 hour

# English stopwords (NLTK + academic commons)
STOPWORDS_EN = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves",
    # Academic / domain-generic filler words
    "study", "studies", "result", "results", "analysis", "analyses", "method", "methods", "using", "used",
    "use", "based", "show", "shows", "showed", "shown", "found", "finding", "findings", "suggest",
    "suggests", "suggested", "indicate", "indicates", "indicated", "demonstrate", "demonstrates",
    "demonstrated", "report", "reports", "reported", "evaluate", "evaluates", "evaluated", "assess",
    "assesses", "assessed", "compare", "compares", "compared", "investigate", "investigates",
    "investigated", "determine", "determines", "determined", "examine", "examines", "examined",
    "identify", "identifies", "identified", "observe", "observes", "observed", "reveal", "reveals",
    "revealed", "conclusion", "conclusions", "however", "therefore", "thus", "furthermore", "moreover",
    "additionally", "especially", "significantly", "recently", "previously", "currently", "various",
    "several", "numerous", "different", "high", "low", "higher", "lower", "increased", "decreased",
    "increase", "decrease", "changes", "change", "effect", "effects", "affect", "affects", "affected",
    "data", "level", "levels", "group", "groups", "sample", "samples", "total", "also", "may", "might",
    "can", "could", "would", "should", "will", "shall", "must", "among", "within", "across", "via",
    "et", "al", "fig", "figure", "table", "supplementary", "additional", "online", " Supporting",
    "information", "appendix", "per", "versus", "vs", "e.g", "i.e", "etc", "due", "owing", "accordance",
}


def _tokenize(text: str) -> list[str]:
    text = text.lower()
    # Replace punctuation with spaces
    for p in string.punctuation:
        text = text.replace(p, " ")
    tokens = []
    for token in text.split():
        token = token.strip()
        # Remove pure digits and short words
        if len(token) < 3 or token.isdigit():
            continue
        # Remove tokens with digits inside (e.g., "abc123")
        if any(ch.isdigit() for ch in token):
            continue
        if token in STOPWORDS_EN:
            continue
        tokens.append(token)
    return tokens


@router.get("", response_model=schemas.KeywordResponse)
def get_keywords(
    limit: int = 50,
    language: str = "en",
    db: Session = Depends(get_db),
):
    global _cache
    cache_key = f"{language}:{limit}"
    now = datetime.utcnow()
    if cache_key in _cache:
        ts, data = _cache[cache_key]
        if now - ts < timedelta(seconds=CACHE_TTL_SECONDS):
            return data

    rows = db.query(Paper.title, Paper.abstract_en).filter(Paper.abstract_en.isnot(None)).all()
    all_text = " ".join(
        (t or "") + " " + (a or "")
        for t, a in rows
    )
    tokens = _tokenize(all_text)
    counter = Counter(tokens)
    top = counter.most_common(limit)

    result = schemas.KeywordResponse(
        keywords=[schemas.KeywordItem(text=w, value=c) for w, c in top]
    )
    _cache[cache_key] = (now, result)
    return result
