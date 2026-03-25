import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormEvent, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useAuth } from '../../app/providers';
import { apiFetch, mediaUrl } from '../../lib/api';

type CommentItem = {
  id: number;
  content: string;
  author: { nickname: string };
  replies: CommentItem[];
};

type PostDetail = {
  id: number;
  title: string;
  content: string;
  images: Array<{ file_path: string; thumb_path: string }>;
  comments: CommentItem[];
};

export function PostDetailPage() {
  const { id } = useParams();
  const { role } = useAuth();
  const [error, setError] = useState('');
  const queryClient = useQueryClient();
  const postQuery = useQuery({
    queryKey: ['post', id],
    queryFn: () => apiFetch<PostDetail>(`/posts/${id}`),
    enabled: Boolean(id)
  });

  const createComment = useMutation({
    mutationFn: async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const content = new FormData(form).get('content');
      return apiFetch(`/comments`, {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ post_id: Number(id), content })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      setError('');
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '评论失败');
    }
  });

  const post = postQuery.data;

  return (
    <section className="grid gap-6">
      <div className="shell-card overflow-hidden p-0">
        {post?.images?.[0] ? <img alt={post.title} className="h-72 w-full object-cover" src={mediaUrl(post.images[0].file_path)} /> : null}
        <div className="p-6 md:p-8">
          <p className="text-sm uppercase tracking-[0.4em] text-moss-700">Post Detail</p>
          <h2 className="section-title mt-3">{post?.title ?? `帖子详情 #${id}`}</h2>
          <p className="mt-4 text-sm leading-7 text-ink-700">{post?.content ?? '这里会展示帖子图集、评论列表与回复结构。'}</p>
        </div>
      </div>

      {role ? (
        <form className="shell-card grid gap-4 p-6" onSubmit={(event) => createComment.mutate(event)}>
          <h3 className="font-display text-3xl">发表评论</h3>
          <textarea className="field" name="content" placeholder="说点什么..." required rows={4} />
          {error ? <p className="text-sm text-brick-500">{error}</p> : null}
          <button className="action-btn" type="submit">提交评论</button>
        </form>
      ) : null}

      <div className="grid gap-4">
        {(post?.comments ?? []).map((comment) => (
          <article key={comment.id} className="shell-card p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-moss-700">{comment.author.nickname}</p>
            <p className="mt-3 text-sm leading-7 text-ink-700">{comment.content}</p>
            <div className="mt-4 grid gap-3 border-l border-ink-900/10 pl-4">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="rounded-2xl bg-cream-50 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.3em] text-moss-700">{reply.author.nickname}</p>
                  <p className="mt-2 text-sm text-ink-700">{reply.content}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
