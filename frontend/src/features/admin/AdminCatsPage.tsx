import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { apiFetch, mediaUrl } from '../../lib/api';
import { ConfirmDialog } from './ConfirmDialog';

type CatItem = {
  id: number;
  name: string;
  campus: string;
  status: string;
  location: string;
  personality_tags: string[];
  images: Array<{ thumb_path: string; file_path: string }>;
};

function campusLabel(value: string) {
  if (value === 'east') return '东校区';
  if (value === 'south') return '南校区';
  if (value === 'north') return '北校区';
  return value;
}

function statusLabel(value: string) {
  if (value === 'visible') return '显示中';
  if (value === 'hidden') return '已隐藏';
  return value;
}

export function AdminCatsPage() {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<CatItem | null>(null);
  const catsQuery = useQuery({
    queryKey: ['admin-cats'],
    queryFn: () => apiFetch<{ items: CatItem[]; total: number }>('/admin/cats', { auth: true })
  });
  const deleteMutation = useMutation({
    mutationFn: (catId: number) => apiFetch<void>('/admin/cats/' + catId, { method: 'DELETE', auth: true }),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-cats'] });
    }
  });

  const cats = catsQuery.data?.items ?? [];

  return (
    <>
      <section className="shell-card p-6 md:p-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">猫档案管理</h2>
            <p className="mt-3 text-sm leading-7 text-ink-700">管理员可以查看现有档案、编辑资料、替换图集，或直接删除旧内容。</p>
          </div>
          <Link className="action-btn" to="/admin/cats/new">新增档案</Link>
        </div>

        {catsQuery.isLoading ? <div className="mt-6 rounded-3xl bg-white/70 px-5 py-4 text-sm text-ink-700">正在加载档案...</div> : null}

        <div className="mt-6 grid gap-3">
          {cats.map((cat) => (
            <article key={cat.id} className="rounded-[24px] border border-ink-900/10 bg-white px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  {cat.images[0] ? (
                    <img
                      alt={cat.name + '封面'}
                      className="h-20 w-20 rounded-[20px] object-cover"
                      src={mediaUrl(cat.images[0].thumb_path || cat.images[0].file_path)}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-[20px] bg-gradient-to-br from-ember-300/60 via-cream-100 to-moss-400/30" />
                  )}
                  <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="font-display text-2xl">{cat.name}</p>
                    <span className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-moss-700">{campusLabel(cat.campus)}</span>
                    <span className="rounded-full bg-ink-900/5 px-3 py-1 text-xs text-ink-700">{statusLabel(cat.status)}</span>
                  </div>
                  <p className="mt-2 text-sm text-ink-700">常驻地点：{cat.location}</p>
                  <p className="mt-2 text-sm text-ink-700">标签：{cat.personality_tags.join('、') || '未填写'}</p>
                </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link className="ghost-btn" to={'/admin/cats/' + cat.id + '/edit'}>
                    编辑
                  </Link>
                  <button
                    aria-label={'删除' + cat.name}
                    className="ghost-btn border-brick-200 text-brick-500 hover:border-brick-400 hover:text-brick-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => setPendingDelete(cat)}
                    type="button"
                  >
                    删除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {catsQuery.isLoading || cats.length > 0 ? null : <div className="mt-6 rounded-3xl bg-white/70 px-5 py-4 text-sm text-ink-700">还没有猫档案，先去新增第一只猫吧。</div>}
      </section>

      {pendingDelete ? (
        <ConfirmDialog
          busy={deleteMutation.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        />
      ) : null}
    </>
  );
}
