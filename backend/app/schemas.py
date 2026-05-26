from pydantic import BaseModel, field_serializer
from datetime import date, datetime, timezone, timedelta
from typing import Optional

class PaperBase(BaseModel):
    title: str
    journal: Optional[str] = None
    jcr_quartile: Optional[str] = None
    xinrui_quartile: Optional[str] = None
    if_: Optional[float] = None
    is_top: Optional[bool] = False
    is_cns: Optional[bool] = False
    publication_date: Optional[date] = None
    article_type: Optional[str] = None
    abstract_cn: Optional[str] = None
    methods: Optional[str] = None
    research_subject: Optional[str] = None
    highlights: Optional[str] = None
    conclusion: Optional[str] = None
    sample_source: Optional[str] = None
    subject_category: Optional[str] = None
    corresponding_author: Optional[str] = None
    first_affiliation: Optional[str] = None
    doi: Optional[str] = None

class PaperCreate(PaperBase):
    pmid: Optional[str] = None
    abstract_en: Optional[str] = None

class PaperResponse(PaperBase):
    id: int
    pmid: Optional[str] = None
    abstract_en: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaperListItem(BaseModel):
    id: int
    title: str
    journal: Optional[str] = None
    jcr_quartile: Optional[str] = None
    xinrui_quartile: Optional[str] = None
    if_: Optional[float] = None
    is_top: Optional[bool] = False
    is_cns: Optional[bool] = False
    publication_date: Optional[date] = None
    article_type: Optional[str] = None
    abstract_cn: Optional[str] = None
    methods: Optional[str] = None
    research_subject: Optional[str] = None
    highlights: Optional[str] = None
    conclusion: Optional[str] = None
    sample_source: Optional[str] = None
    subject_category: Optional[str] = None
    corresponding_author: Optional[str] = None
    first_affiliation: Optional[str] = None
    doi: Optional[str] = None

    class Config:
        from_attributes = True

class PaperListResponse(BaseModel):
    total: int
    items: list[PaperListItem]

class StatsResponse(BaseModel):
    total_papers: int
    this_month: int
    today: int
    by_quartile: dict[str, int]
    by_type: dict[str, int]
    monthly_distribution: list[dict]

# ── Update Log ──
class UpdateLogResponse(BaseModel):
    id: int
    triggered_at: datetime
    searched: int
    fetched: int
    new_count: int
    enriched: int
    failed_count: int
    status: str
    error_msg: Optional[str] = None

    @field_serializer('triggered_at')
    def serialize_triggered_at(self, dt: datetime) -> str:
        beijing = timezone(timedelta(hours=8))
        return dt.replace(tzinfo=timezone.utc).astimezone(beijing).isoformat()

    class Config:
        from_attributes = True

class UpdateLogListResponse(BaseModel):
    total: int
    items: list[UpdateLogResponse]

# ── Visitor ──
class VisitorCreate(BaseModel):
    ip: str
    country: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    path: str = "/"
    user_agent: Optional[str] = None

class VisitorResponse(BaseModel):
    id: int
    ip: str
    country: Optional[str] = None
    country_code: Optional[str] = None
    city: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    visited_at: datetime
    path: str

    class Config:
        from_attributes = True

class VisitorStatsResponse(BaseModel):
    total_visitors: int
    today_visitors: int
    countries: list[dict]
    coordinates: list[dict]


# ── Extended Stats ──
class StatsResponse(BaseModel):
    total_count: int
    today_new_count: int
    this_month: int
    top_ratio: float
    subjects_distribution: dict[str, int]
    cns_ratio: float
    total_visitors: int
    today_visitors: int


class TrendResponse(BaseModel):
    dates: list[str]
    counts: list[int]


class YearlyStatsResponse(BaseModel):
    years: list[int]
    counts: list[int]


class MonthlyResponse(BaseModel):
    months: list[str]
    counts: list[int]


# ── Visitor Map ──
class VisitorMapLocation(BaseModel):
    country: str
    city: str
    latitude: float
    longitude: float
    count: int


class VisitorMapResponse(BaseModel):
    locations: list[VisitorMapLocation]


# ── Guestbook ──
class GuestbookCreate(BaseModel):
    nickname: Optional[str] = None
    content: str


class GuestbookItem(BaseModel):
    id: int
    nickname: str
    content: str
    created_at: datetime
    ip: Optional[str] = None

    @field_serializer('created_at')
    def serialize_created_at(self, dt: datetime) -> str:
        beijing = timezone(timedelta(hours=8))
        return dt.replace(tzinfo=timezone.utc).astimezone(beijing).isoformat()

    class Config:
        from_attributes = True


class GuestbookListResponse(BaseModel):
    total: int
    items: list[GuestbookItem]


# ── Keywords ──
class KeywordItem(BaseModel):
    text: str
    value: int


class KeywordResponse(BaseModel):
    keywords: list[KeywordItem]
