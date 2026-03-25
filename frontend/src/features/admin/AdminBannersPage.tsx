import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { apiFetch, mediaUrl } from '../../lib/api';

type BannerItem = {
  id: number;
  title: string;
  subtitle: string;
  sort_order: number;
  images: Array<{ file_path: string; thumb_path: string }>;
};

export function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const bannersQuery = useQuery({
    queryKey: ['banners'],
    queryFn: () => apiFetch<BannerItem[]>('/banners')
  });
  const mutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return apiFetch('/admin/banners', {
        method: 'POST',
        auth: true,
        body: new FormData(event.currentTarget)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '保存失败');
    }
  });

  return (
    <section className="grid gap-6">
      <form className="shell-card grid gap-4 p-6 md:grid-cols-2" onSubmit={(event) => mutation.mutate(event)}>
        <h2 className="section-title md:col-span-2">轮播管理</h2>
        <input className="field" name="title" placeholder="标题" required />
        <input className="field" name="subtitle" placeholder="副标题" required />
        <input className="field" name="link_url" placeholder="跳转链接，例如 /cats" required />
        <input className="field" defaultValue="1" name="sort_order" placeholder="排序" type="number" />
        <select className="field" defaultValue="true" name="is_active">
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
        <input accept="image/*" className="field" multiple name="files" type="file" />
        {error ? <p className="text-sm text-brick-500 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <button className="action-btn" type="submit">{mutation.isPending ? '保存中...' : '新增轮播'}</button>
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {(bannersQuery.data ?? []).map((banner) => (
          <article key={banner.id} className="shell-card overflow-hidden p-0">
            {banner.images[0] ? <img alt={banner.title} className="h-48 w-full object-cover" src={mediaUrl(banner.images[0].thumb_path || banner.images[0].file_path)} /> : null}
            <div className="p-6">
              <p className="text-sm text-moss-700">排序 {banner.sort_order}</p>
              <h3 className="mt-2 font-display text-3xl">{banner.title}</h3>
              <p className="mt-3 text-sm text-ink-700">{banner.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
