import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../app/providers';
import { apiFetch, mediaUrl } from '../../lib/api';

type PostItem = {
  id: number;
  title: string;
  content: string;
  related_cat_id: number | null;
  like_count: number;
  comment_count: number;
  author: { id: number; nickname: string };
  images: Array<{ file_path: string; thumb_path: string }>;
};

type CatOption = { id: number; name: string };

export function CommunityPage() {
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [error, setError] = useState('');

  const postsQuery = useQuery({
    queryKey: ['posts'],
    queryFn: () => apiFetch<{ items: PostItem[]; total: number }>('/posts')
  });
  const catsQuery = useQuery({
    queryKey: ['cat-options'],
    queryFn: () => apiFetch<{ items: CatOption[]; total: number }>('/cats')
  });

  const createPost = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      return apiFetch<PostItem>('/posts', { method: 'POST', auth: true, body: formData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '发帖失败');
    }
  });

  const posts = postsQuery.data?.items ?? [];

  return (
    <section className="grid gap-6">
      <div className="shell-card p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Community</p>
        <h2 className="section-title mt-3">校园社区</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-700">用户可以发帖、评论和回复，也可以关联某只校园猫，形成围绕猫猫的实时社区记录。</p>
      </div>

      {role ? (
        <form className="shell-card grid gap-4 p-6" onSubmit={(event) => createPost.mutate(event)}>
          <h3 className="font-display text-3xl">发布新帖子</h3>
          <input className="field" name="title" placeholder="帖子标题" required />
          <textarea className="field" name="content" placeholder="想分享什么？" required rows={5} />
          <select className="field" defaultValue="" name="related_cat_id">
            <option value="">不关联猫猫</option>
            {(catsQuery.data?.items ?? []).map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <input accept="image/*" className="field" multiple name="files" type="file" />
          {error ? <p className="text-sm text-brick-500">{error}</p> : null}
          <button className="action-btn" disabled={createPost.isPending} type="submit">
            {createPost.isPending ? '发布中...' : '发布帖子'}
          </button>
        </form>
      ) : null}

      <div className="grid gap-5">
        {posts.map((post) => (
          <Link key={post.id} className="shell-card overflow-hidden p-0 transition hover:-translate-y-1" to={`/posts/${post.id}`}>
            {post.images[0] ? <img alt={post.title} className="h-52 w-full object-cover" src={mediaUrl(post.images[0].thumb_path || post.images[0].file_path)} /> : null}
            <div className="p-6">
              <p className="text-xs uppercase tracking-[0.35em] text-moss-700">{post.author.nickname}</p>
              <h3 className="mt-2 font-display text-3xl">{post.title}</h3>
              <p className="mt-3 line-clamp-3 text-sm leading-7 text-ink-700">{post.content}</p>
              <p className="mt-4 text-sm text-ink-700">点赞 {post.like_count} · 评论 {post.comment_count}</p>
            </div>
          </Link>
        ))}
        {!posts.length ? <div className="shell-card p-6 text-sm text-ink-700">还没有帖子，成为第一个发帖的人吧。</div> : null}
      </div>
    </section>
  );
}
