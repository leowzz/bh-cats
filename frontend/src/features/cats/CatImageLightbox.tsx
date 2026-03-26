import { useEffect } from 'react';

import { mediaUrl } from '../../lib/api';

type CatImageLightboxProps = {
  catName: string;
  images: Array<{ file_path: string }>;
  activeIndex: number | null;
  onClose: () => void;
};

export function CatImageLightbox({ catName, images, activeIndex, onClose }: CatImageLightboxProps) {
  useEffect(() => {
    if (activeIndex == null) return undefined;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, onClose]);

  if (activeIndex == null || !images[activeIndex]) {
    return null;
  }

  return (
    <div
      aria-label={catName + '图片预览'}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/80 px-4"
      onClick={onClose}
      role="dialog"
    >
      <div className="relative w-full max-w-5xl rounded-[28px] bg-white p-4 shadow-card" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="关闭预览"
          className="absolute right-4 top-4 rounded-full border border-ink-900/10 bg-white px-3 py-2 text-sm text-ink-700"
          onClick={onClose}
          type="button"
        >
          关闭
        </button>
        <img
          alt={catName + '大图 ' + String(activeIndex + 1)}
          className="max-h-[80vh] w-full rounded-[20px] object-contain"
          src={mediaUrl(images[activeIndex].file_path)}
        />
      </div>
    </div>
  );
}
