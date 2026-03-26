import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { useAuth } from '../../app/providers';
import { apiFetch } from '../../lib/api';

type Profile = {
  id: number;
  username: string;
  email: string;
  nickname: string;
  role: string;
};

export function ProfilePage() {
  const { role } = useAuth();
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Profile>('/auth/me', { auth: true }),
    enabled: Boolean(role)
  });

  if (!role) {
    return (
      <section className="shell-card p-6 md:p-8">
        <h2 className="section-title">我的动态</h2>
        <p className="mt-4 text-sm leading-7 text-ink-700">登录后可以查看自己的资料、帖子和评论。</p>
        <Link className="action-btn mt-6" to="/login">
          前往登录
        </Link>
      </section>
    );
  }

  return (
    <section className="grid gap-6 md:grid-cols-[0.9fr_1.1fr]">
      <div className="shell-card p-6">
        <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Profile</p>
        <h2 className="section-title mt-3">我的动态</h2>
        <p className="mt-3 text-sm leading-7 text-ink-700">昵称：{data?.nickname ?? '加载中...'}</p>
        <p className="mt-2 text-sm leading-7 text-ink-700">用户名：{data?.username ?? '-'}</p>
        <p className="mt-2 text-sm leading-7 text-ink-700">邮箱：{data?.email ?? '-'}</p>
        <p className="mt-2 text-sm leading-7 text-ink-700">身份：{data?.role ?? role}</p>
      </div>
      <div className="shell-card p-6">
        <h3 className="font-display text-3xl">最近发布</h3>
        <p className="mt-3 text-sm text-ink-700">当前版本已支持发帖与评论，后续可在这里扩展“我的帖子”和“我的评论”列表。</p>
      </div>
    </section>
  );
}
