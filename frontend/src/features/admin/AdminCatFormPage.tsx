import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { apiFetch, mediaUrl } from '../../lib/api';
import { CatImageLightbox } from '../cats/CatImageLightbox';
import { ImagePickerField } from './ImagePickerField';

type CatImage = {
  id: number;
  file_path: string;
  thumb_path: string;
  is_cover: boolean;
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

function buildCatPayload(form: CatFormState, options: { coverImageId?: number | null; removeImageIds?: number[]; files?: File[] } = {}) {
  const payload = new FormData();
  payload.set('name', form.name.trim());
  payload.set('campus', form.campus);
  payload.set('breed', form.breed.trim());
  payload.set('gender', form.gender);
  payload.set('sterilized', form.sterilized);
  payload.set('location', form.location.trim());
  payload.set('personality_tags', JSON.stringify(parseTags(form.personality_tags)));
  payload.set('description', form.description.trim());
  payload.set('status', form.status);
  payload.set('remove_image_ids', JSON.stringify(options.removeImageIds ?? []));
  if (options.coverImageId != null) {
    payload.set('cover_image_id', String(options.coverImageId));
  }
  (options.files ?? []).forEach((file) => payload.append('files', file));
  return payload;
}

export function AdminCatFormPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEditing = typeof id === 'string';
  const [form, setForm] = useState<CatFormState>(createEmptyForm());
  const [serverForm, setServerForm] = useState<CatFormState>(createEmptyForm());
  const [currentImages, setCurrentImages] = useState<CatImage[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removeImageIds, setRemoveImageIds] = useState<number[]>([]);
  const [coverImageId, setCoverImageId] = useState<number | null>(null);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
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
      const nextForm = mapCatToForm(catQuery.data);
      setForm(nextForm);
      setServerForm(nextForm);
      setCurrentImages(catQuery.data.images);
      setSelectedFiles([]);
      setRemoveImageIds([]);
      setCoverImageId(catQuery.data.images.find((image) => image.is_cover)?.id ?? catQuery.data.images[0]?.id ?? null);
      setPreviewIndex(null);
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

  const uploadImagesMutation = useMutation({
    mutationFn: (files: File[]) => {
      if (!isEditing || typeof id !== 'string') {
        throw new Error('当前页面不支持即时上传');
      }
      return apiFetch<CatDetail>('/admin/cats/' + id, {
        method: 'PUT',
        auth: true,
        body: buildCatPayload(serverForm, {
          coverImageId,
          files
        })
      });
    },
    onSuccess: (cat) => {
      setServerForm(mapCatToForm(cat));
      setCurrentImages(cat.images);
      setCoverImageId(cat.images.find((image) => image.is_cover)?.id ?? cat.images[0]?.id ?? null);
      setSelectedFiles([]);
      setRemoveImageIds([]);
      setPickerKey((value) => value + 1);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '上传失败');
    }
  });

  const deleteImagesMutation = useMutation({
    mutationFn: (imageIds: number[]) => {
      if (!isEditing || typeof id !== 'string') {
        throw new Error('当前页面不支持即时删除');
      }
      return apiFetch<CatDetail>('/admin/cats/' + id, {
        method: 'PUT',
        auth: true,
        body: buildCatPayload(serverForm, {
          coverImageId,
          removeImageIds: imageIds
        })
      });
    },
    onSuccess: (cat) => {
      setServerForm(mapCatToForm(cat));
      setCurrentImages(cat.images);
      setCoverImageId(cat.images.find((image) => image.is_cover)?.id ?? cat.images[0]?.id ?? null);
      setRemoveImageIds([]);
      setPreviewIndex(null);
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '删除失败');
    }
  });

  function updateField<Key extends keyof CatFormState>(key: Key, value: CatFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleRemoveImage(imageId: number) {
    setRemoveImageIds((current) => {
      const next = current.includes(imageId) ? current.filter((value) => value !== imageId) : [...current, imageId];
      const remainingImageIds = currentImages.filter((image) => !next.includes(image.id)).map((image) => image.id);
      if (coverImageId != null && !remainingImageIds.includes(coverImageId)) {
        setCoverImageId(remainingImageIds[0] ?? null);
      }
      return next;
    });
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

    mutation.mutate(
      buildCatPayload(
        {
          ...form,
          name,
          location,
          description
        },
        isEditing
          ? {
              coverImageId,
              removeImageIds,
              files: selectedFiles
            }
          : {
              files: selectedFiles
            }
      )
    );
  }
  const uploadSelectionLabel = '当前已选择 ' + selectedFiles.length + ' 张待上传';

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
          emptyLabel={uploadSelectionLabel}
          id="cat-files"
          name="files"
          onChange={setSelectedFiles}
          resetKey={pickerKey}
          selectedFiles={selectedFiles}
        />
        {isEditing ? (
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <p className="text-sm text-ink-700">将新增到现有图片，当前共 {currentImages.length} 张</p>
            {selectedFiles.length > 0 ? (
              <button
                className="ghost-btn"
                disabled={uploadImagesMutation.isPending}
                onClick={() => uploadImagesMutation.mutate(selectedFiles)}
                type="button"
              >
                {uploadImagesMutation.isPending ? '上传中...' : '立即上传图片'}
              </button>
            ) : null}
          </div>
        ) : null}

        {currentImages.length > 0 ? (
          <div className="md:col-span-2 grid gap-3">
            <p className="text-sm text-ink-700">当前图片管理：可勾选移除、设置封面，点击缩略图查看大图。</p>
            {removeImageIds.length > 0 ? (
              <div>
                <button
                  className="ghost-btn border-brick-200 text-brick-500 hover:border-brick-400 hover:text-brick-600"
                  disabled={deleteImagesMutation.isPending}
                  onClick={() => deleteImagesMutation.mutate(removeImageIds)}
                  type="button"
                >
                  {deleteImagesMutation.isPending ? '删除中...' : '删除所选图片'}
                </button>
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {currentImages.map((image, index) => (
                <div
                  key={image.id}
                  className="rounded-[24px] border border-ink-900/10 p-3"
                  data-removed={removeImageIds.includes(image.id) ? 'true' : 'false'}
                >
                  <button
                    aria-label={`查看${form.name || '猫猫'}图片 ${index + 1}`}
                    className="block w-full overflow-hidden rounded-2xl"
                    onClick={() => setPreviewIndex(index)}
                    type="button"
                  >
                    <img
                      alt={form.name || '猫猫图片'}
                      className="h-28 w-full object-cover"
                      src={mediaUrl(image.thumb_path || image.file_path)}
                    />
                  </button>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-ink-700">
                      <input
                        aria-label={`移除${form.name || '猫猫'}图片 ${index + 1}`}
                        checked={removeImageIds.includes(image.id)}
                        onChange={() => toggleRemoveImage(image.id)}
                        type="checkbox"
                      />
                      移除
                    </label>
                    <button
                      aria-label={`设为${form.name || '猫猫'}封面 ${index + 1}`}
                      className={coverImageId === image.id ? 'action-btn px-3 py-2 text-sm' : 'ghost-btn px-3 py-2 text-sm'}
                      disabled={removeImageIds.includes(image.id)}
                      onClick={() => setCoverImageId(image.id)}
                      type="button"
                    >
                      {coverImageId === image.id ? '当前封面' : '设为封面'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-brick-500 md:col-span-2">{error}</p> : null}
        <div className="md:col-span-2">
          <button className="action-btn" disabled={mutation.isPending} type="submit">{mutation.isPending ? '保存中...' : '保存档案'}</button>
        </div>
      </form>
      <CatImageLightbox
        activeIndex={previewIndex}
        catName={form.name || '猫猫'}
        images={currentImages}
        onClose={() => setPreviewIndex(null)}
      />
    </section>
  );
}
