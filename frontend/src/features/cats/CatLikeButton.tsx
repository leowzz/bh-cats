import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { apiFetch } from '../../lib/api';
import { getDeviceId } from '../../lib/auth';

type CatLikeButtonProps = {
  catId: number;
  catName: string;
  initialLikeCount: number;
  className?: string;
};

type LikeToggleResponse = {
  liked: boolean;
  like_count: number;
};

export function CatLikeButton({ catId, catName, initialLikeCount, className }: CatLikeButtonProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);

  const toggleMutation = useMutation({
    mutationFn: () =>
      apiFetch<LikeToggleResponse>('/likes/toggle', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({
          target_type: 'cat',
          target_id: catId,
          device_id: getDeviceId()
        })
      }),
    onSuccess: (data) => {
      setLiked(data.liked);
      setLikeCount(data.like_count);
    }
  });

  return (
    <button
      aria-label={(liked ? '取消点赞' : '点赞') + catName}
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold transition',
        liked
          ? 'border-brick-300 bg-brick-50 text-brick-600'
          : 'border-ink-900/10 bg-white text-ink-700 hover:border-moss-400 hover:text-moss-700',
        className
      )}
      disabled={toggleMutation.isPending}
      onClick={() => toggleMutation.mutate()}
      type="button"
    >
      <span aria-hidden="true">{liked ? '♥' : '♡'}</span>
      <span>{likeCount}</span>
    </button>
  );
}
