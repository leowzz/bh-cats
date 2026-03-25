import { useMutation } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiFetch } from '../../lib/api';

export function AdminCatFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      if (!formData.get('status')) {
        formData.set('status', 'visible');
      }
      return apiFetch(id ? `/admin/cats/${id}` : '/admin/cats', {
        method: id ? 'PUT' : 'POST',
        auth: true,
        body: formData
      });
    },
    onSuccess: () => navigate('/admin/cats'),
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '保存失败');
    }
  });

  return (
    <section className="shell-card p-6 md:p-8">
      <h2 className="section-title">{id ? '编辑猫档案' : '新增猫档案'}</h2>
      <form className="mt-6 grid gap-4 md:grid-cols-2" onSubmit={(event) => mutation.mutate(event)}>
        <input className="field" name="name" placeholder="猫猫名称" required />
        <select className="field" defaultValue="east" name="campus">
          <option value="east">东校区</option>
          <option value="south">南校区</option>
          <option value="north">北校区</option>
        </select>
        <input className="field" defaultValue="中华田园猫" name="breed" placeholder="品种" />
        <select className="field" defaultValue="unknown" name="gender">
          <option value="male">公</option>
          <option value="female">母</option>
          <option value="unknown">未知</option>
        </select>
        <select className="field" defaultValue="false" name="sterilized">
          <option value="false">未绝育/未知</option>
          <option value="true">已绝育</option>
        </select>
        <input className="field" name="location" placeholder="常驻地点" required />
        <input className="field md:col-span-2" defaultValue='["亲人"]' name="personality_tags" placeholder='标签 JSON，例如 ["亲人","贪吃"]' />
        <textarea className="field md:col-span-2" name="description" placeholder="简介" rows={5} />
        <select className="field" defaultValue="visible" name="status">
          <option value="visible">显示</option>
          <option value="hidden">隐藏</option>
        </select>
        <input accept="image/*" className="field" multiple name="files" type="file" />
        {error ? <p className="text-sm text-brick-500 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <button className="action-btn" type="submit">{mutation.isPending ? '保存中...' : '保存档案'}</button>
        </div>
      </form>
    </section>
  );
}
