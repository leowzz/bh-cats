from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Banner(Base):
    __tablename__ = 'banners'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    subtitle: Mapped[str] = mapped_column(String(255), default='')
    link_url: Mapped[str] = mapped_column(String(255), default='')
    sort_order: Mapped[int] = mapped_column(Integer, default=0, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    images = relationship('BannerImage', back_populates='banner', cascade='all, delete-orphan', order_by='BannerImage.sort_order')


class BannerImage(Base):
    __tablename__ = 'banner_images'

    id: Mapped[int] = mapped_column(primary_key=True)
    banner_id: Mapped[int] = mapped_column(ForeignKey('banners.id', ondelete='CASCADE'), index=True)
    file_path: Mapped[str] = mapped_column(String(255))
    thumb_path: Mapped[str] = mapped_column(String(255))
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    width: Mapped[int] = mapped_column(Integer, default=0)
    height: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    banner = relationship('Banner', back_populates='images')
