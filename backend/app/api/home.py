from fastapi import APIRouter

from app.api.deps import DbSession
from app.services.cat_service import cat_service
from app.services.home_service import home_service

router = APIRouter(prefix='/home', tags=['home'])


@router.get('')
def get_home(db: DbSession) -> dict:
    payload = home_service.build_homepage(db)
    today_best = payload['today_best']
    return {
        'stats': payload['stats'],
        'today_best': {
            'id': today_best['cat'].id,
            'name': today_best['cat'].name,
            'score': today_best['score'],
            'reason': today_best['reason'],
        }
        if today_best
        else None,
        'banners': [
            {'id': banner.id, 'title': banner.title, 'subtitle': banner.subtitle, 'link_url': banner.link_url, 'sort_order': banner.sort_order}
            for banner in payload['banners']
        ],
        'latest_posts': [
            {'id': post.id, 'title': post.title, 'created_at': post.created_at.isoformat() if post.created_at else None}
            for post in payload['latest_posts']
        ],
        'hot_cats': [
            {
                'id': cat.id,
                'name': cat.name,
                'like_count': cat.like_count,
                'view_count': cat.view_count,
                'images': cat_service.serialize_images(cat.images),
            }
            for cat in payload['hot_cats']
        ],
    }
