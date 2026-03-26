from collections.abc import Sequence
from datetime import UTC, datetime
from pathlib import Path
import shutil

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.core.config import get_settings
from app.models.comment import Comment
from app.models.post import Post, PostImage
from app.models.user import User
from app.schemas.post import CommentAuthorResponse, CommentResponse, PostAuthorResponse, PostImageResponse, PostListResponse, PostResponse
from app.services.media_service import MediaService


class PostService:
    def __init__(self) -> None:
        settings = get_settings()
        self.media_service = MediaService(settings.media_root, settings.image_max_bytes)

    def list_posts(self, db: Session) -> PostListResponse:
        posts = db.scalars(
            select(Post)
            .where(Post.status == 'visible', Post.deleted_at.is_(None))
            .options(joinedload(Post.author), selectinload(Post.images))
            .order_by(Post.created_at.desc())
        ).unique().all()
        return PostListResponse(items=[self._to_response(db, post) for post in posts], total=len(posts))

    def get_post(self, db: Session, post_id: int) -> PostResponse | None:
        post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)).options(joinedload(Post.author), selectinload(Post.images)))
        if not post or post.status != 'visible':
            return None
        return self._to_response(db, post, include_comments=True)

    def create_post(self, db: Session, author: User, title: str, content: str, related_cat_id: int | None, files: Sequence[UploadFile]) -> PostResponse:
        post = Post(author_id=author.id, title=title, content=content, related_cat_id=related_cat_id, status='visible')
        db.add(post)
        db.commit()
        db.refresh(post)
        self._attach_files(db, post, files)
        return self._to_response(db, post)

    def update_post(self, db: Session, post_id: int, author: User, title: str, content: str, related_cat_id: int | None, files: Sequence[UploadFile] | None) -> PostResponse | None:
        post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)).options(joinedload(Post.author), selectinload(Post.images)))
        if not post:
            return None
        if post.author_id != author.id:
            raise PermissionError('只能编辑自己的帖子')
        post.title = title
        post.content = content
        post.related_cat_id = related_cat_id
        db.commit()
        if files:
            self._replace_files(db, post, files)
        db.refresh(post)
        return self._to_response(db, post)

    def delete_post(self, db: Session, post_id: int, author: User) -> bool:
        post = db.scalar(select(Post).where(Post.id == post_id, Post.deleted_at.is_(None)).options(selectinload(Post.images)))
        if not post:
            return False
        if post.author_id != author.id:
            raise PermissionError('只能删除自己的帖子')
        post.deleted_at = datetime.now(UTC)
        db.commit()
        return True

    def _attach_files(self, db: Session, post: Post, files: Sequence[UploadFile]) -> None:
        for idx, upload in enumerate(files):
            saved = self.media_service.process_upload(upload.file.read(), owner_type='posts', owner_id=post.id)
            db.add(
                PostImage(
                    post_id=post.id,
                    file_path=saved.file_path,
                    thumb_path=saved.thumb_path,
                    sort_order=idx,
                    width=saved.width,
                    height=saved.height,
                )
            )
        db.commit()
        db.refresh(post)

    def _replace_files(self, db: Session, post: Post, files: Sequence[UploadFile]) -> None:
        post_dir = Path(get_settings().media_root) / 'posts' / str(post.id)
        if post_dir.exists():
            shutil.rmtree(post_dir)
        for image in list(post.images):
            db.delete(image)
        db.commit()
        self._attach_files(db, post, files)

    def _to_response(self, db: Session, post: Post, include_comments: bool = False) -> PostResponse:
        comments = self._build_comment_tree(db, post.id) if include_comments else []
        return PostResponse(
            id=post.id,
            title=post.title,
            content=post.content,
            status=post.status,
            related_cat_id=post.related_cat_id,
            like_count=post.like_count,
            comment_count=post.comment_count,
            created_at=post.created_at,
            updated_at=post.updated_at,
            author=PostAuthorResponse.model_validate(post.author),
            images=[PostImageResponse.model_validate(image) for image in post.images],
            comments=comments,
        )

    def _build_comment_tree(self, db: Session, post_id: int) -> list[CommentResponse]:
        comments = db.scalars(
            select(Comment).where(Comment.post_id == post_id, Comment.deleted_at.is_(None)).options(joinedload(Comment.author)).order_by(Comment.created_at.asc())
        ).all()
        by_parent: dict[int | None, list[Comment]] = {}
        for comment in comments:
            by_parent.setdefault(comment.parent_id, []).append(comment)

        def build(comment: Comment) -> CommentResponse:
            return CommentResponse(
                id=comment.id,
                post_id=comment.post_id,
                parent_id=comment.parent_id,
                content=comment.content,
                like_count=comment.like_count,
                created_at=comment.created_at,
                updated_at=comment.updated_at,
                author=CommentAuthorResponse.model_validate(comment.author),
                replies=[build(reply) for reply in by_parent.get(comment.id, [])],
            )

        return [build(comment) for comment in by_parent.get(None, [])]


post_service = PostService()
