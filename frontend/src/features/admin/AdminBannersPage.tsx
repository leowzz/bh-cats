import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';

import { apiFetch, mediaUrl } from '../../lib/api';
import { ConfirmDialog } from './ConfirmDialog';
import { ImagePickerField } from './ImagePickerField';

type BannerItem = {
  id: number;
  title: string;
  subtitle: string;
  link_url: string;
  sort_order: number;
  is_active: boolean;
  images: Array<{ file_path: string; thumb_path: string }>;
};

type BannerFormState = {
  title: string;
  subtitle: string;
  link_url: string;
  sort_order: string;
  is_active: string;
};

function createEmptyBannerForm(): BannerFormState {
  return {
    title: '',
    subtitle: '',
    link_url: '/cats',
    sort_order: '1',
    is_active: 'true'
  };
}

function mapBannerToForm(banner: BannerItem): BannerFormState {
  return {
    title: banner.title,
    subtitle: banner.subtitle,
    link_url: banner.link_url,
    sort_order: String(banner.sort_order),
    is_active: String(banner.is_active)
  };
}

export function AdminBannersPage() {
  const queryClient = useQueryClient();
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BannerItem | null>(null);
  const [form, setForm] = useState<BannerFormState>(createEmptyBannerForm());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pickerKey, setPickerKey] = useState(0);
  const [error, setError] = useState('');

  const bannersQuery = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => apiFetch<BannerItem[]>('/admin/banners', { auth: true })
  });

  function resetForm() {
    setEditingBannerId(null);
    setForm(createEmptyBannerForm());
    setSelectedFiles([]);
    setPickerKey((value) => value + 1);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: FormData) =>
      apiFetch(editingBannerId == null ? '/admin/banners' : '/admin/banners/' + editingBannerId, {
        method: editingBannerId == null ? 'POST' : 'PUT',
        auth: true,
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      resetForm();
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '保存失败');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (bannerId: number) => apiFetch<void>('/admin/banners/' + bannerId, { method: 'DELETE', auth: true }),
    onSuccess: async () => {
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      if (editingBannerId == null) return;
      resetForm();
    }
  });

  function updateField<Key extends keyof BannerFormState>(key: Key, value: BannerFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleEdit(banner: BannerItem) {
    setEditingBannerId(banner.id);
    setForm(mapBannerToForm(banner));
    setSelectedFiles([]);
    setPickerKey((value) => value + 1);
    setError('');
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const payload = new FormData();
    payload.set('title', form.title.trim());
    payload.set('subtitle', form.subtitle.trim());
    payload.set('link_url', form.link_url.trim());
    payload.set('sort_order', String(Number(form.sort_order || '0')));
    payload.set('is_active', form.is_active);
    selectedFiles.forEach((file) => payload.append('files', file));
    saveMutation.mutate(payload);
  }

  const banners = bannersQuery.data ?? [];
  const editingBanner = banners.find((banner) => banner.id === editingBannerId) ?? null;
  const fileHint = editingBanner == null || editingBanner.images.length === 0 ? '未选择图片' : '当前已上传 ' + editingBanner.images.length + ' 张图片';

  return (
    <section className="grid gap-6">
      <form className="shell-card grid gap-4 p-6 md:grid-cols-2" onSubmit={handleSubmit}>
        <h2 className="section-title md:col-span-2">轮播管理</h2>
        <input className="field" name="title" onChange={(event) => updateField('title', event.currentTarget.value)} placeholder="标题" required value={form.title} />
        <input className="field" name="subtitle" onChange={(event) => updateField('subtitle', event.currentTarget.value)} placeholder="副标题" required value={form.subtitle} />
        <input className="field" name="link_url" onChange={(event) => updateField('link_url', event.currentTarget.value)} placeholder="跳转链接，例如 /cats" required value={form.link_url} />
        <input className="field" name="sort_order" onChange={(event) => updateField('sort_order', event.currentTarget.value)} placeholder="排序" type="number" value={form.sort_order} />
        <select className="field" name="is_active" onChange={(event) => updateField('is_active', event.currentTarget.value)} value={form.is_active}>
          <option value="true">启用</option>
          <option value="false">停用</option>
        </select>
        <ImagePickerField
          className="md:col-span-2"
          emptyLabel={fileHint}
          id="banner-files"
          name="files"
          onChange={setSelectedFiles}
          resetKey={pickerKey}
          selectedFiles={selectedFiles}
        />

        {editingBanner == null || editingBanner.images.length === 0 ? null : (
          <div className="md:col-span-2 grid gap-3">
            <p className="text-sm text-ink-700">当前轮播图片，重新上传会替换现有图片：</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {editingBanner.images.map((image, index) => (
                <img
                  key={image.file_path + String(index)}
                  alt={form.title || '轮播图片'}
                  className="h-24 w-full rounded-2xl object-cover"
                  src={mediaUrl(image.thumb_path || image.file_path)}
                />
              ))}
            </div>
          </div>
        )}

        {error ? <p className="text-sm text-brick-500 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button className="action-btn" disabled={saveMutation.isPending} type="submit">{editingBannerId == null ? '新增轮播' : '保存轮播'}</button>
          {editingBannerId == null ? null : (
            <button className="ghost-btn" onClick={resetForm} type="button">
              取消编辑
            </button>
          )}
        </div>
      </form>

      <div className="grid gap-4 md:grid-cols-2">
        {banners.map((banner) => (
          <article key={banner.id} className="shell-card overflow-hidden p-0" data-testid={'banner-card-' + banner.id}>
            {banner.images[0] ? <img alt={banner.title} className="h-48 w-full object-cover" src={mediaUrl(banner.images[0].thumb_path || banner.images[0].file_path)} /> : <div className="h-48 bg-gradient-to-br from-cream-100 via-ember-200/40 to-moss-400/20" />}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-moss-700">排序 {banner.sort_order}</p>
                <span className="rounded-full bg-ink-900/5 px-3 py-1 text-xs text-ink-700">{banner.is_active ? '启用中' : '已停用'}</span>
              </div>
              <h3 className="mt-2 font-display text-3xl">{banner.title}</h3>
              <p className="mt-3 text-sm text-ink-700">{banner.subtitle}</p>
              <p className="mt-2 text-sm text-ink-700">链接：{banner.link_url}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button aria-label={'编辑轮播 ' + banner.title} className="ghost-btn" onClick={() => handleEdit(banner)} type="button">编辑</button>
                <button
                  aria-label={'删除轮播 ' + banner.title}
                  className="ghost-btn border-brick-200 text-brick-500 hover:border-brick-400 hover:text-brick-600"
                  disabled={deleteMutation.isPending}
                  onClick={() => setPendingDelete(banner)}
                  type="button"
                >
                  删除
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {bannersQuery.isLoading ? <div className="shell-card p-6 text-sm text-ink-700">正在加载轮播...</div> : null}
      {bannersQuery.isLoading || banners.length > 0 ? null : <div className="shell-card p-6 text-sm text-ink-700">还没有轮播内容，先创建第一条吧。</div>}

      {pendingDelete ? (
        <ConfirmDialog
          busy={deleteMutation.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        />
      ) : null}
    </section>
  );
}
