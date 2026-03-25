from datetime import datetime, timedelta, UTC

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.banner import Banner
from app.models.cat import Cat
from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post


class HomeService:
    def pick_today_best_cat(self, db: Session):
        cats = db.scalars(select(Cat).where(Cat.status == 'visible')).all()
        best: dict | None = None
        recent_cutoff = datetime.now(UTC) - timedelta(days=7)
        for cat in cats:
            related_post_count = db.scalar(select(func.count(Post.id)).where(Post.related_cat_id == cat.id)) or 0
            recent_post_count = db.scalar(select(func.count(Post.id)).where(Post.related_cat_id == cat.id, Post.created_at >= recent_cutoff)) or 0
            recent_comment_count = db.scalar(
                select(func.count(Comment.id)).join(Post, Comment.post_id == Post.id).where(Post.related_cat_id == cat.id, Comment.created_at >= recent_cutoff)
            ) or 0
            recent_like_count = db.scalar(
                select(func.count(Like.id)).where(Like.target_type == 'cat', Like.target_id == cat.id, Like.created_at >= recent_cutoff)
            ) or 0
            score = cat.like_count * 5 + cat.view_count + related_post_count * 8 + recent_post_count * 3 + recent_comment_count * 2 + recent_like_count * 2
            if not best or score > best['score']:
                best = {
                    'cat': cat,
                    'score': score,
                    'reason': '近期互动热度高，相关讨论活跃' if related_post_count else '浏览量和点赞数位居前列',
                }
        return best

    def build_homepage(self, db: Session) -> dict:
        total_cats = db.scalar(select(func.count(Cat.id)).where(Cat.status == 'visible')) or 0
        recent_cutoff = datetime.now(UTC) - timedelta(days=1)
        active_cat_ids = set(db.scalars(select(Post.related_cat_id).where(Post.related_cat_id.is_not(None), Post.created_at >= recent_cutoff)).all())
        banners = db.scalars(select(Banner).where(Banner.is_active.is_(True)).order_by(Banner.sort_order.asc())).all()
        best = self.pick_today_best_cat(db)
        latest_posts = db.scalars(select(Post).where(Post.status == 'visible').order_by(Post.created_at.desc()).limit(5)).all()
        hot_cats = db.scalars(select(Cat).where(Cat.status == 'visible').order_by(Cat.like_count.desc(), Cat.view_count.desc()).limit(6)).all()
        return {
            'stats': {'total_cats': total_cats, 'active_cats_today': len(active_cat_ids)},
            'today_best': best,
            'banners': banners,
            'latest_posts': latest_posts,
            'hot_cats': hot_cats,
        }


home_service = HomeService()
