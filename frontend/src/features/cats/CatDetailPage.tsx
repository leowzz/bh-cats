import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { apiFetch, mediaUrl } from '../../lib/api';
import { CatImageLightbox } from './CatImageLightbox';
import { CatLikeButton } from './CatLikeButton';

type CatDetail = {
  id: number;
  name: string;
  campus: string;
  breed: string;
  gender: string;
  sterilized: boolean;
  location: string;
  personality_tags: string[];
  description: string;
  view_count: number;
  like_count: number;
  images: Array<{ id?: number; file_path: string; thumb_path: string; is_cover?: boolean }>;
};

export function CatDetailPage() {
  const { id } = useParams();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const { data } = useQuery({
    queryKey: ['cat', id],
    queryFn: () => apiFetch<CatDetail>(`/cats/${id}`),
    enabled: Boolean(id)
  });

  const images = data?.images ?? [];
  const activeImage = images[selectedIndex] ?? images[0];

  return (
    <>
      <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <div className="shell-card overflow-hidden">
            {activeImage ? (
              <button className="block w-full" onClick={() => setPreviewIndex(selectedIndex)} type="button">
                <img alt={data?.name ?? '猫猫图片'} className="h-full min-h-[360px] w-full object-cover" src={mediaUrl(activeImage.file_path)} />
              </button>
            ) : (
              <div className="min-h-[360px] bg-gradient-to-br from-ember-300/60 via-cream-100 to-moss-400/30" />
            )}
          </div>
          {images.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.map((image, index) => (
                <button
                  key={image.id ?? image.file_path}
                  aria-label={`查看${data?.name ?? '猫猫'}图片 ${index + 1}`}
                  className="overflow-hidden rounded-[20px] border border-ink-900/10"
                  onClick={() => {
                    setSelectedIndex(index);
                    setPreviewIndex(index);
                  }}
                  type="button"
                >
                  <img className="h-20 w-full object-cover" src={mediaUrl(image.thumb_path || image.file_path)} />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="shell-card p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Cat Profile</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <h2 className="section-title">{data?.name ?? `猫猫详情 #${id}`}</h2>
            {data?.id ? <CatLikeButton catId={data.id} catName={data.name} initialLikeCount={data.like_count} /> : null}
          </div>
          <div className="mt-6 grid gap-3 text-sm leading-7 text-ink-700">
            <p>校区：{data ? campusLabel(data.campus) : '东校区'}</p>
            <p>品种：{data?.breed ?? '中华田园猫'}</p>
            <p>性别：{data?.gender ?? 'unknown'}</p>
            <p>绝育：{data?.sterilized ? '已绝育' : '未绝育/未知'}</p>
            <p>常驻地点：{data?.location ?? '图书馆附近'}</p>
            <p>标签：{data?.personality_tags?.join('、') ?? '亲人、贪吃'}</p>
            <p>浏览量：{data?.view_count ?? 0}</p>
            <p>点赞数：{data?.like_count ?? 0}</p>
          </div>
          <p className="mt-6 text-sm leading-7 text-ink-700">{data?.description ?? '这里会展示猫猫图集、基础信息、浏览量、点赞数以及关联帖子。'}</p>
        </div>
      </section>
      <CatImageLightbox
        activeIndex={previewIndex}
        catName={data?.name ?? '猫猫'}
        images={images}
        onClose={() => setPreviewIndex(null)}
      />
    </>
  );
}

function campusLabel(value: string) {
  if (value === 'east') return '东校区';
  if (value === 'south') return '南校区';
  if (value === 'north') return '北校区';
  return value;
}
