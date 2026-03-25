import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';

import { apiFetch, mediaUrl } from '../../lib/api';

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
  images: Array<{ file_path: string; thumb_path: string }>;
};

export function CatDetailPage() {
  const { id } = useParams();
  const { data } = useQuery({
    queryKey: ['cat', id],
    queryFn: () => apiFetch<CatDetail>(`/cats/${id}`),
    enabled: Boolean(id)
  });

  return (
    <section className="grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
      <div className="shell-card overflow-hidden">
        {data?.images?.[0] ? (
          <img alt={data.name} className="h-full min-h-[360px] w-full object-cover" src={mediaUrl(data.images[0].file_path)} />
        ) : (
          <div className="min-h-[360px] bg-gradient-to-br from-ember-300/60 via-cream-100 to-moss-400/30" />
        )}
      </div>
      <div className="shell-card p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Cat Profile</p>
        <h2 className="section-title mt-3">{data?.name ?? `猫猫详情 #${id}`}</h2>
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
  );
}

function campusLabel(value: string) {
  if (value === 'east') return '东校区';
  if (value === 'south') return '南校区';
  if (value === 'north') return '北校区';
  return value;
}
