import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiFetch, mediaUrl } from '../../lib/api';
import { ImagePickerField } from './ImagePickerField';

type CatImage = {
  file_path: string;
  thumb_path: string;
};

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
  status: string;
  images: CatImage[];
};

type CatFormState = {
  name: string;
  campus: string;
  breed: string;
  gender: string;
  sterilized: string;
  location: string;
  personality_tags: string;
  description: string;
  status: string;
};

function createEmptyForm(): CatFormState {
  return {
    name: '',
    campus: 'east',
    breed: '中华田园猫',
    gender: 'unknown',
    sterilized: 'false',
    location: '',
    personality_tags: '',
    description: '',
    status: 'visible'
  };
}

function mapCatToForm(cat: CatDetail): CatFormState {
  return {
    name: cat.name,
    campus: cat.campus,
    breed: cat.breed,
    gender: cat.gender,
    sterilized: String(cat.sterilized),
    location: cat.location,
    personality_tags: cat.personality_tags.join(', '),
    description: cat.description,
    status: cat.status
  };
}

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function AdminCatFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEditing = typeof id === 'string';
  const [form, setForm] = useState<CatFormState>(createEmptyForm());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [pickerKey, setPickerKey] = useState(0);
  const [error, setError] = useState('');

  const catQuery = useQuery({
    queryKey: ['admin-cat', id],
    enabled: isEditing,
    queryFn: async () => {
      if (typeof id !== 'string') {
        throw new Error('缺少猫档案 ID');
      }
      return apiFetch<CatDetail>('/admin/cats/' + id, { auth: true });
    }
  });

  useEffect(() => {
    if (catQuery.data) {
      setForm(mapCatToForm(catQuery.data));
      setSelectedFiles([]);
      setPickerKey((value) => value + 1);
      setError('');
      return;
    }
    if (isEditing) return;
    setForm(createEmptyForm());
  }, [catQuery.data, isEditing]);

  const mutation = useMutation({
    mutationFn: (payload: FormData) =>
      apiFetch(isEditing ? '/admin/cats/' + id : '/admin/cats', {
        method: isEditing ? 'PUT' : 'POST',
        auth: true,
        body: payload
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-cats'] });
      navigate('/admin/cats');
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '保存失败');
    }
  });

  function updateField<Key extends keyof CatFormState>(key: Key, value: CatFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    const name = form.name.trim();
    const location = form.location.trim();
    const description = form.description.trim();
    if (name.length === 0) {
      setError('名称不能为空');
      return;
    }
    if (location.length === 0) {
      setError('常驻地点不能为空');
      return;
    }
    if (description.length === 0) {
      setError('简介不能为空');
      return;
    }

    const payload = new FormData();
    payload.set('name', name);
    payload.set('campus', form.campus);
    payload.set('breed', form.breed.trim());
    payload.set('gender', form.gender);
    payload.set('sterilized', form.sterilized);
    payload.set('location', location);
    payload.set('personality_tags', JSON.stringify(parseTags(form.personality_tags)));
    payload.set('description', description);
    payload.set('status', form.status);
    selectedFiles.forEach((file) => payload.append('files', file));
    mutation.mutate(payload);
  }

  const currentImages = catQuery.data?.images ?? [];
  const fileHint = currentImages.length > 0 ? '当前已上传 ' + currentImages.length + ' 张图片' : '未选择图片';

  if (isEditing && catQuery.isLoading && catQuery.data == null) {
    return <section className="shell-card p-6 md:p-8">正在加载档案...</section>;
  }

  return (
    <section className="shell-card p-6 md:p-8">
      <h2 className="section-title">{isEditing ? '编辑猫档案' : '新增猫档案'}</h2>
      <form className="mt-6 grid gap-4 md:grid-cols-2" noValidate onSubmit={handleSubmit}>
        <input className="field" name="name" onChange={(event) => updateField('name', event.currentTarget.value)} placeholder="猫猫名称" required value={form.name} />
        <select className="field" name="campus" onChange={(event) => updateField('campus', event.currentTarget.value)} value={form.campus}>
          <option value="east">东校区</option>
          <option value="south">南校区</option>
          <option value="north">北校区</option>
        </select>
        <input className="field" name="breed" onChange={(event) => updateField('breed', event.currentTarget.value)} placeholder="品种" value={form.breed} />
        <select className="field" name="gender" onChange={(event) => updateField('gender', event.currentTarget.value)} value={form.gender}>
          <option value="male">公</option>
          <option value="female">母</option>
          <option value="unknown">未知</option>
        </select>
        <select className="field" name="sterilized" onChange={(event) => updateField('sterilized', event.currentTarget.value)} value={form.sterilized}>
          <option value="false">未绝育/未知</option>
          <option value="true">已绝育</option>
        </select>
        <input className="field" name="location" onChange={(event) => updateField('location', event.currentTarget.value)} placeholder="常驻地点" required value={form.location} />
        <input
          className="field md:col-span-2"
          name="personality_tags"
          onChange={(event) => updateField('personality_tags', event.currentTarget.value)}
          placeholder="例如：亲人, 贪吃"
          value={form.personality_tags}
        />
        <textarea
          className="field md:col-span-2"
          name="description"
          onChange={(event) => updateField('description', event.currentTarget.value)}
          placeholder="简介"
          required
          rows={5}
          value={form.description}
        />
        <select className="field" name="status" onChange={(event) => updateField('status', event.currentTarget.value)} value={form.status}>
          <option value="visible">显示</option>
          <option value="hidden">隐藏</option>
        </select>
        <ImagePickerField
          className="md:col-span-2"
          emptyLabel={fileHint}
          id="cat-files"
          name="files"
          onChange={setSelectedFiles}
          resetKey={pickerKey}
          selectedFiles={selectedFiles}
        />

        {currentImages.length > 0 ? (
          <div className="md:col-span-2 grid gap-3">
            <p className="text-sm text-ink-700">当前图片预览，重新上传会替换整组图片：</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {currentImages.map((image, index) => (
                <img
                  key={image.file_path + String(index)}
                  alt={form.name || '猫猫图片'}
                  className="h-24 w-full rounded-2xl object-cover"
                  src={mediaUrl(image.thumb_path || image.file_path)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-brick-500 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <button className="action-btn" disabled={mutation.isPending} type="submit">{mutation.isPending ? '保存中...' : '保存档案'}</button>
        </div>
      </form>
    </section>
  );
}
