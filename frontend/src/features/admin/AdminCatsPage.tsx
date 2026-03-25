import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { apiFetch } from '../../lib/api';

type CatItem = {
  id: number;
  name: string;
  campus: string;
  status: string;
  location: string;
};

export function AdminCatsPage() {
  const { data } = useQuery({
    queryKey: ['admin-cats'],
    queryFn: () => apiFetch<{ items: CatItem[]; total: number }>('/cats', { auth: true })
  });

  return (
    <section className="shell-card p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">猫档案管理</h2>
          <p className="mt-3 text-sm leading-7 text-ink-700">管理员可以新增、编辑、隐藏和排序猫档案图集。</p>
        </div>
        <Link className="action-btn" to="/admin/cats/new">新增档案</Link>
      </div>
      <div className="mt-6 grid gap-3">
        {(data?.items ?? []).map((cat) => (
          <Link key={cat.id} className="rounded-2xl border border-ink-900/10 bg-white px-5 py-4" to={`/admin/cats/${cat.id}/edit`}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-display text-2xl">{cat.name}</p>
                <p className="mt-1 text-sm text-ink-700">{cat.location}</p>
              </div>
              <p className="text-sm text-moss-700">{cat.status}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
