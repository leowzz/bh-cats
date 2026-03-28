import { useMutation, useQuery } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
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
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: () => apiFetch<Profile>('/auth/me', { auth: true }),
    enabled: Boolean(role)
  });
  const changePasswordMutation = useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      return apiFetch<void>('/auth/change-password', {
        method: 'POST',
        auth: true,
        body: JSON.stringify(payload)
      });
    },
    onSuccess: () => {
      setError('');
      setSuccess('密码修改成功，请使用新密码重新登录。');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (mutationError) => {
      setSuccess('');
      setError(mutationError instanceof Error ? mutationError.message : '修改密码失败');
    }
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
        <h3 className="font-display text-3xl">修改密码</h3>
        <p className="mt-3 text-sm text-ink-700">为了账号安全，请先输入当前密码，再设置新的登录密码。</p>
        <form
          className="mt-6 grid gap-4"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            setError('');
            setSuccess('');
            if (newPassword !== confirmPassword) {
              setError('两次输入的新密码不一致');
              return;
            }
            changePasswordMutation.mutate({
              current_password: currentPassword,
              new_password: newPassword
            });
          }}
        >
          <input
            className="field"
            name="currentPassword"
            placeholder="当前密码"
            required
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <input
            className="field"
            name="newPassword"
            placeholder="新密码"
            required
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <input
            className="field"
            name="confirmPassword"
            placeholder="确认新密码"
            required
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error ? <p className="text-sm text-brick-500">{error}</p> : null}
          {success ? <p className="text-sm text-moss-700">{success}</p> : null}
          <button className="action-btn" type="submit">
            {changePasswordMutation.isPending ? '提交中...' : '修改密码'}
          </button>
        </form>
      </div>
    </section>
  );
}
