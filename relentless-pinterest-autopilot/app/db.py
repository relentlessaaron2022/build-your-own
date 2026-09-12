"""SQLAlchemy models and session management.

SQLite by default (per spec: "start with SQLite, design it so PostgreSQL or
Supabase can be substituted later"). Because we never touch raw SQL and rely
only on SQLAlchemy's dialect-agnostic column types, swapping
DATABASE_URL to a postgres:// or supabase connection string is the only
change required.
"""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    site: Mapped[str] = mapped_column(String(120))
    landing_url: Mapped[str] = mapped_column(String(1000))
    category: Mapped[str] = mapped_column(String(120))
    objective: Mapped[str] = mapped_column(String(255), default="")
    status: Mapped[str] = mapped_column(String(40), default="active")  # active|paused|archived
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    source_content: Mapped[list["SourceContent"]] = relationship(back_populates="campaign")
    keywords: Mapped[list["Keyword"]] = relationship(back_populates="campaign")
    pin_concepts: Mapped[list["PinConcept"]] = relationship(back_populates="campaign")


class SourceContent(Base):
    __tablename__ = "source_content"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaigns.id"), nullable=True)
    url: Mapped[str] = mapped_column(String(1000), unique=True)
    title: Mapped[str] = mapped_column(String(500), default="")
    body_excerpt: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(1000), default="")
    publish_date: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    category: Mapped[str] = mapped_column(String(120), default="")
    evergreen_score: Mapped[float] = mapped_column(Float, default=0.0)
    commercial_score: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[str] = mapped_column(String(40), default="discovered")  # discovered|scored|promoted|rejected
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    campaign: Mapped[Optional["Campaign"]] = relationship(back_populates="source_content")


class Keyword(Base):
    __tablename__ = "keywords"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    keyword: Mapped[str] = mapped_column(String(255))
    campaign_id: Mapped[Optional[int]] = mapped_column(ForeignKey("campaigns.id"), nullable=True)
    intent: Mapped[str] = mapped_column(String(60), default="informational")  # informational|commercial|navigational
    score: Mapped[float] = mapped_column(Float, default=0.0)
    used_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    campaign: Mapped[Optional["Campaign"]] = relationship(back_populates="keywords")


class PinConcept(Base):
    __tablename__ = "pin_concepts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    campaign_id: Mapped[int] = mapped_column(ForeignKey("campaigns.id"))
    source_id: Mapped[Optional[int]] = mapped_column(ForeignKey("source_content.id"), nullable=True)
    headline: Mapped[str] = mapped_column(String(500))
    subheadline: Mapped[str] = mapped_column(String(500), default="")
    description: Mapped[str] = mapped_column(Text, default="")
    cta: Mapped[str] = mapped_column(String(120), default="")
    keyword: Mapped[str] = mapped_column(String(255), default="")
    visual_style: Mapped[str] = mapped_column(String(120), default="bold_headline")
    landing_url: Mapped[str] = mapped_column(String(1000))
    board_id: Mapped[str] = mapped_column(String(120), default="")
    status: Mapped[str] = mapped_column(
        String(40), default="draft"
    )  # draft|ready|regenerate|scheduled|published|failed|winner|deprioritized
    headline_family: Mapped[str] = mapped_column(String(60), default="list")
    fingerprint: Mapped[str] = mapped_column(String(64), default="", index=True)
    parent_concept_id: Mapped[Optional[int]] = mapped_column(ForeignKey("pin_concepts.id"), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    campaign: Mapped["Campaign"] = relationship(back_populates="pin_concepts")
    pins: Mapped[list["Pin"]] = relationship(back_populates="concept")


class Pin(Base):
    __tablename__ = "pins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    concept_id: Mapped[int] = mapped_column(ForeignKey("pin_concepts.id"))
    pinterest_pin_id: Mapped[str] = mapped_column(String(120), default="")
    image_path: Mapped[str] = mapped_column(String(1000), default="")
    image_hash: Mapped[str] = mapped_column(String(300), default="", index=True)
    text_hash: Mapped[str] = mapped_column(String(64), default="", index=True)
    board_id: Mapped[str] = mapped_column(String(120), default="")
    destination_url: Mapped[str] = mapped_column(String(1000), default="")
    scheduled_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    published_at: Mapped[Optional[dt.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(
        String(40), default="queued"
    )  # queued|scheduled|publishing|published|failed|regenerate
    retry_count: Mapped[int] = mapped_column(Integer, default=0)
    last_error: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    concept: Mapped["PinConcept"] = relationship(back_populates="pins")
    metrics: Mapped[list["PinMetric"]] = relationship(back_populates="pin")


class PinMetric(Base):
    __tablename__ = "pin_metrics"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    pin_id: Mapped[int] = mapped_column(ForeignKey("pins.id"))
    impressions: Mapped[int] = mapped_column(Integer, default=0)
    saves: Mapped[int] = mapped_column(Integer, default=0)
    outbound_clicks: Mapped[int] = mapped_column(Integer, default=0)
    engagement_rate: Mapped[float] = mapped_column(Float, default=0.0)
    save_rate: Mapped[float] = mapped_column(Float, default=0.0)
    ctr: Mapped[float] = mapped_column(Float, default=0.0)
    conversions: Mapped[int] = mapped_column(Integer, default=0)
    revenue: Mapped[float] = mapped_column(Float, default=0.0)
    date: Mapped[dt.date] = mapped_column(DateTime(timezone=True), default=utcnow)

    pin: Mapped["Pin"] = relationship(back_populates="metrics")


engine = create_engine(settings.database_url, echo=False, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False, future=True)


def init_db() -> None:
    Base.metadata.create_all(engine)


def get_session():
    return SessionLocal()
