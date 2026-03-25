from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.comment import Comment
from app.models.post import Post
from app.models.user import User
from app.schemas.comment import CommentCreateRequest, CommentUpdateRequest
from app.schemas.post import CommentAuthorResponse, CommentResponse


class CommentService:
    def create_comment(self, db: Session, author: User, payload: CommentCreateRequest) -> CommentResponse:
        post = db.scalar(select(Post).where(Post.id == payload.post_id))
        if not post:
            raise LookupError('帖子不存在')
        comment = Comment(post_id=payload.post_id, parent_id=payload.parent_id, author_id=author.id, content=payload.content)
        db.add(comment)
        post.comment_count += 1
        db.commit()
        db.refresh(comment)
        return self._to_response(db, comment.id)

    def update_comment(self, db: Session, comment_id: int, author: User, payload: CommentUpdateRequest) -> CommentResponse | None:
        comment = db.scalar(select(Comment).where(Comment.id == comment_id).options(joinedload(Comment.author)))
        if not comment:
            return None
        if comment.author_id != author.id:
            raise PermissionError('只能编辑自己的评论')
        comment.content = payload.content
        db.commit()
        return self._to_response(db, comment.id)

    def delete_comment(self, db: Session, comment_id: int, author: User) -> bool:
        comment = db.scalar(select(Comment).where(Comment.id == comment_id))
        if not comment:
            return False
        if comment.author_id != author.id:
            raise PermissionError('只能删除自己的评论')
        post = db.scalar(select(Post).where(Post.id == comment.post_id))
        if post and post.comment_count > 0:
            post.comment_count -= 1
        db.delete(comment)
        db.commit()
        return True

    def _to_response(self, db: Session, comment_id: int) -> CommentResponse:
        comment = db.scalar(select(Comment).where(Comment.id == comment_id).options(joinedload(Comment.author)))
        assert comment is not None
        return CommentResponse(
            id=comment.id,
            post_id=comment.post_id,
            parent_id=comment.parent_id,
            content=comment.content,
            like_count=comment.like_count,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author=CommentAuthorResponse.model_validate(comment.author),
            replies=[],
        )


comment_service = CommentService()
