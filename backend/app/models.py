from sqlalchemy import Column, Integer, String, Text, DateTime, Date, Float, Boolean
from app.database import Base
from datetime import datetime

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    pmid = Column(String(32), unique=True, index=True, nullable=True)
    doi = Column(String(128), unique=True, index=True, nullable=True)

    title = Column(Text, nullable=False)
    abstract_en = Column(Text, nullable=True)
    abstract_cn = Column(Text, nullable=True)
    journal = Column(String(256), nullable=True, index=True)
    jcr_quartile = Column(String(8), nullable=True, index=True)
    xinrui_quartile = Column(String(8), nullable=True, index=True)
    if_ = Column("if", Float, nullable=True)
    is_top = Column(Boolean, default=False)
    is_cns = Column(Boolean, default=False)
    publication_date = Column(Date, nullable=True, index=True)
    article_type = Column(String(64), nullable=True, index=True)

    methods = Column(Text, nullable=True)
    research_subject = Column(Text, nullable=True)
    highlights = Column(Text, nullable=True)
    conclusion = Column(Text, nullable=True)
    sample_source = Column(Text, nullable=True)
    subject_category = Column(String(128), nullable=True)
    corresponding_author = Column(String(256), nullable=True)
    first_affiliation = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UpdateLog(Base):
    __tablename__ = "update_logs"

    id = Column(Integer, primary_key=True, index=True)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    searched = Column(Integer, default=0)
    fetched = Column(Integer, default=0)
    new_count = Column(Integer, default=0)
    enriched = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    status = Column(String(20), default="success")
    error_msg = Column(Text, nullable=True)

class Visitor(Base):
    __tablename__ = "visitors"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String(64), index=True)
    country = Column(String(64), nullable=True)
    country_code = Column(String(8), nullable=True)
    city = Column(String(64), nullable=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    visited_at = Column(DateTime, default=datetime.utcnow, index=True)
    path = Column(String(256), default="/")
    user_agent = Column(String(512), nullable=True)


class VisitorLog(Base):
    __tablename__ = "visitor_log"

    id = Column(Integer, primary_key=True, index=True)
    ip = Column(String(64), index=True)
    country = Column(String(64), nullable=True)
    city = Column(String(64), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    visit_time = Column(DateTime, default=datetime.utcnow, index=True)


class Guestbook(Base):
    __tablename__ = "guestbook"

    id = Column(Integer, primary_key=True, index=True)
    nickname = Column(String(64), nullable=False, default="匿名访客")
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    ip = Column(String(64), nullable=True)
