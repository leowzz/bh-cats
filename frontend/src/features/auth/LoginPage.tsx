import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../app/providers';
import { apiFetch } from '../../lib/api';

type LoginResponse = {
  access_token: string;
  user: {
    role: 'user' | 'admin';
  };
};

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password')
        })
      });
    },
    onSuccess: (data) => {
      login(data.access_token, data.user.role);
      navigate(data.user.role === 'admin' ? '/admin' : '/profile');
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '登录失败');
    }
  });

  return (
    <section className="mx-auto w-full max-w-xl shell-card p-6 md:p-8">
      <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Login</p>
      <h2 className="section-title mt-3">登录账号</h2>
      <form className="mt-6 grid gap-4" onSubmit={(event) => mutation.mutate(event)}>
        <input className="field" name="email" placeholder="邮箱" required type="email" />
        <input className="field" name="password" placeholder="密码" required type="password" />
        {error ? <p className="text-sm text-brick-500">{error}</p> : null}
        <button className="action-btn" type="submit">{mutation.isPending ? '登录中...' : '登录'}</button>
      </form>
    </section>
  );
}
