from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.comments import router as comments_router
from app.api.likes import router as likes_router
from app.api.posts import router as posts_router
from app.api.banners import admin_router as admin_banners_router
from app.api.banners import router as banners_router
from app.api.cats import admin_router as admin_cats_router
from app.api.cats import router as cats_router
from app.api.home import router as home_router
from app.core.config import get_settings
from app.db.init_db import init_db


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield



def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )

    @app.get(f'{settings.api_prefix}/health')
    def health() -> dict[str, str]:
        return {'status': 'ok'}

    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(posts_router, prefix=settings.api_prefix)
    app.include_router(comments_router, prefix=settings.api_prefix)
    app.include_router(likes_router, prefix=settings.api_prefix)
    app.include_router(banners_router, prefix=settings.api_prefix)
    app.include_router(admin_banners_router, prefix=settings.api_prefix)
    app.include_router(cats_router, prefix=settings.api_prefix)
    app.include_router(admin_cats_router, prefix=settings.api_prefix)
    app.include_router(home_router, prefix=settings.api_prefix)
    if settings.storage_backend == 'local':
        app.mount(settings.media_url, StaticFiles(directory=settings.media_root), name='media')
    return app


app = create_app()
