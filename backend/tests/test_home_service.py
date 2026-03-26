from app.models.cat import Cat
from app.models.post import Post
from app.models.user import User
from app.services.home_service import HomeService


def test_pick_today_best_cat_prefers_more_engagement(db_session) -> None:
    user = User(username='poster_test', email='poster@test.local', password_hash='x', nickname='发帖人', role='user', is_active=True)
    db_session.add(user)
    db_session.flush()

    low_cat = Cat(name='阿黄', campus='east', breed='田园', gender='male', sterilized=False, location='东区', description='', personality_tags='[]', status='visible', view_count=10, like_count=1)
    top_cat = Cat(name='阿狸', campus='north', breed='田园', gender='female', sterilized=True, location='北区', description='', personality_tags='[]', status='visible', view_count=20, like_count=4)
    db_session.add_all([low_cat, top_cat])
    db_session.flush()

    db_session.add(Post(author_id=user.id, related_cat_id=top_cat.id, title='偶遇', content='今天见到阿狸'))
    db_session.commit()

    service = HomeService()
    best = service.pick_today_best_cat(db_session)
    assert best is not None
    assert best['cat'].name == '阿狸'
    assert best['score'] > 0
