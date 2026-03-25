import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../lib/api';

type HomePayload = {
  stats: {
    total_cats: number;
    active_cats_today: number;
  };
};

export function AdminDashboardPage() {
  const { data } = useQuery({
    queryKey: ['admin-home'],
    queryFn: () => apiFetch<HomePayload>('/home', { auth: true })
  });

  const cards = [
    ['猫档案', String(data?.stats.total_cats ?? 0)],
    ['今日活跃', String(data?.stats.active_cats_today ?? 0)],
    ['系统状态', '正常']
  ];

  return (
    <section className="grid gap-6">
      <div className="shell-card p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-brick-500">Admin</p>
        <h2 className="section-title mt-3">管理仪表盘</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700">查看猫档案、帖子和轮播的整体情况，并进入管理页面。</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="action-btn" to="/admin/cats/new">新增猫档案</Link>
          <Link className="ghost-btn" to="/admin/banners">管理轮播</Link>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <div key={label} className="shell-card p-6">
            <p className="text-sm text-ink-700">{label}</p>
            <p className="mt-2 text-4xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
