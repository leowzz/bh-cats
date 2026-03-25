import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch, mediaUrl } from '../../lib/api';

type CatItem = {
  id: number;
  name: string;
  campus: string;
  breed: string;
  location: string;
  personality_tags: string[];
  images: Array<{ thumb_path: string; file_path: string }>;
};

export function CatsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['cats'],
    queryFn: () => apiFetch<{ items: CatItem[]; total: number }>('/cats')
  });

  const cats = data?.items ?? [];

  return (
    <section className="grid gap-6">
      <div className="shell-card p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Cat Archive</p>
        <h2 className="section-title mt-3">猫猫档案</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">按校区、关键词和热度查找校园猫，首页和详情页会展示基础资料、标签、浏览量与点赞数。</p>
      </div>
      {isLoading ? <div className="shell-card p-6">正在加载档案...</div> : null}
      <div className="grid gap-5 md:grid-cols-3">
        {(cats.length ? cats : [
          { id: 0, name: '奶油', campus: 'east', breed: '中华田园猫', location: '图书馆附近', personality_tags: ['亲人', '贪吃'], images: [] },
          { id: 0, name: '团子', campus: 'south', breed: '中华田园猫', location: '操场边', personality_tags: ['谨慎', '爱晒太阳'], images: [] },
          { id: 0, name: '煤球', campus: 'north', breed: '黑猫', location: '宿舍区', personality_tags: ['活泼', '喜欢追人'], images: [] }
        ]).map((cat) => (
          <Link key={`${cat.name}-${cat.location}`} className="shell-card overflow-hidden p-0 transition hover:-translate-y-1" to={cat.id ? `/cats/${cat.id}` : '/cats'}>
            {cat.images[0] ? (
              <img alt={cat.name} className="h-48 w-full object-cover" src={mediaUrl(cat.images[0].thumb_path || cat.images[0].file_path)} />
            ) : (
              <div className="h-48 bg-gradient-to-br from-ember-300/60 via-cream-100 to-moss-400/30" />
            )}
            <div className="p-6">
              <p className="text-sm text-moss-700">{campusLabel(cat.campus)}</p>
              <h3 className="mt-2 font-display text-3xl">{cat.name}</h3>
              <p className="mt-4 text-sm leading-6 text-ink-700">{cat.personality_tags.join('、')}</p>
              <p className="mt-2 text-sm text-ink-700">常驻地点：{cat.location}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function campusLabel(value: string) {
  if (value === 'east') return '东校区';
  if (value === 'south') return '南校区';
  if (value === 'north') return '北校区';
  return value;
}
