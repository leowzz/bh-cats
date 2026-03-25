import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiFetch } from '../../lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      return apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          nickname: formData.get('nickname'),
          email: formData.get('email'),
          password: formData.get('password')
        })
      });
    },
    onSuccess: () => navigate('/login'),
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '注册失败');
    }
  });

  return (
    <section className="mx-auto w-full max-w-xl shell-card p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Register</p>
      <h2 className="section-title mt-3">注册账号</h2>
      <form className="mt-6 grid gap-4" onSubmit={(event) => mutation.mutate(event)}>
        <input className="field" name="nickname" placeholder="昵称" required />
        <input className="field" name="email" placeholder="邮箱" required type="email" />
        <input className="field" name="password" placeholder="密码" required type="password" />
        {error ? <p className="text-sm text-brick-500">{error}</p> : null}
        <button className="action-btn" type="submit">{mutation.isPending ? '创建中...' : '创建账号'}</button>
      </form>
    </section>
  );
}
