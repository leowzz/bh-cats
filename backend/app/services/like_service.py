from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cat import Cat
from app.models.comment import Comment
from app.models.like import Like
from app.models.post import Post
from app.models.user import User


TARGET_MODELS = {
    'cat': Cat,
    'post': Post,
    'comment': Comment,
}


class LikeService:
    def toggle_like(self, db: Session, *, target_type: str, target_id: int, user: User | None = None, device_id: str | None = None) -> tuple[bool, int]:
        if target_type not in TARGET_MODELS:
            raise ValueError('无效的点赞目标')
        if not user and not device_id:
            raise ValueError('游客点赞需要 device_id')
        model = TARGET_MODELS[target_type]
        target = db.scalar(select(model).where(model.id == target_id))
        if not target:
            raise LookupError('目标不存在')

        query = select(Like).where(Like.target_type == target_type, Like.target_id == target_id)
        if user:
            query = query.where(Like.user_id == user.id)
        else:
            query = query.where(Like.device_id == device_id)
        existing = db.scalar(query)
        if existing:
            db.delete(existing)
            if target.like_count > 0:
                target.like_count -= 1
            db.commit()
            return False, target.like_count

        db.add(Like(target_type=target_type, target_id=target_id, user_id=user.id if user else None, device_id=None if user else device_id))
        target.like_count += 1
        db.commit()
        return True, target.like_count


like_service = LikeService()
