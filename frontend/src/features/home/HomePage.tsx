import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../lib/api';

type HomePayload = {
  stats: {
    total_cats: number;
    active_cats_today: number;
  };
  today_best: {
    id: number;
    name: string;
    score: number;
    reason: string;
  } | null;
  hot_cats: Array<{
    id: number;
    name: string;
    like_count: number;
    view_count: number;
  }>;
};

export function HomePage() {
  const { data } = useQuery({
    queryKey: ['home'],
    queryFn: () => apiFetch<HomePayload>('/home')
  });

  const totalCats = data?.stats.total_cats ?? 36;
  const activeCats = data?.stats.active_cats_today ?? 9;
  const best = data?.today_best ?? {
    id: 0,
    name: '奶油',
    score: 92,
    reason: '近期互动热度高，相关讨论活跃。'
  };
  const hotCats = data?.hot_cats ?? [
    { id: 1, name: '奶油', like_count: 24, view_count: 180 },
    { id: 2, name: '团子', like_count: 18, view_count: 120 },
    { id: 3, name: '煤球', like_count: 12, view_count: 96 }
  ];

  return (
    <div className="grid gap-8">
      <section className="shell-card overflow-hidden">
        <div className="grid gap-8 bg-[length:18px_18px] bg-grain px-6 py-10 md:grid-cols-[1.3fr_0.7fr] md:px-10">
          <div className="space-y-5">
            <p className="text-sm uppercase tracking-[0.45em] text-moss-700">校园流浪猫数字档案</p>
            <h2 className="font-display text-4xl leading-tight text-ink-900 md:text-6xl">把校园里的每一只猫，都认真记下来。</h2>
            <p className="max-w-2xl text-base leading-7 text-ink-700">
              这里有档案、社区和每日推荐，帮助同学们更方便地认识、记录并守护北华大学东南北三校区的校园猫。
            </p>
            <div className="flex flex-wrap gap-3">
              <Link className="action-btn" to="/cats">
                浏览猫档案
              </Link>
              <Link className="ghost-btn" to="/community">
                进入社区
              </Link>
            </div>
          </div>
          <div className="grid gap-4">
            <div className="rounded-[24px] bg-ember-300/30 p-5">
              <p className="text-sm text-ink-700">今日最佳</p>
              <h3 className="mt-2 font-display text-3xl">{best.name}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-700">{best.reason}</p>
              {best.id ? (
                <Link className="mt-4 inline-flex text-sm font-semibold text-moss-700" to={`/cats/${best.id}`}>
                  查看详情 →
                </Link>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-sm text-ink-700">校猫总数</p>
                <p className="mt-3 text-4xl font-semibold text-ink-900">{totalCats}</p>
              </div>
              <div className="rounded-[24px] bg-white p-5">
                <p className="text-sm text-ink-700">今日活跃</p>
                <p className="mt-3 text-4xl font-semibold text-ink-900">{activeCats}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {['东校区', '南校区', '北校区'].map((campus, index) => (
          <article key={campus} className="shell-card p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-moss-700">0{index + 1}</p>
            <h3 className="mt-3 font-display text-3xl">{campus}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-700">整理常驻猫猫、活动区域和近期讨论，帮助大家更快找到熟面孔。</p>
          </article>
        ))}
      </section>

      <section className="shell-card p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Hot Cats</p>
            <h3 className="section-title mt-3">热门猫猫</h3>
          </div>
          <Link className="ghost-btn" to="/cats">
            查看全部
          </Link>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {hotCats.map((cat) => (
            <Link key={cat.id} className="rounded-[24px] border border-ink-900/10 bg-white p-5 transition hover:-translate-y-1" to={`/cats/${cat.id}`}>
              <p className="text-sm text-moss-700">点赞 {cat.like_count}</p>
              <h4 className="mt-2 font-display text-3xl">{cat.name}</h4>
              <p className="mt-3 text-sm text-ink-700">浏览量 {cat.view_count}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
