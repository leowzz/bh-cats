type ConfirmDialogProps = {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  title = '确认删除这条内容吗？',
  description = '删除后不可恢复。',
  confirmLabel = '确认删除',
  cancelLabel = '取消删除',
  busy = false,
  onConfirm,
  onCancel
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 px-4" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
      <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-card">
        <h3 className="font-display text-3xl text-ink-900" id="confirm-dialog-title">
          {title}
        </h3>
        <p className="mt-3 text-sm leading-7 text-ink-700">{description}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button className="ghost-btn" disabled={busy} onClick={onCancel} type="button">
            {cancelLabel}
          </button>
          <button
            className="action-btn bg-brick-500 hover:bg-brick-600"
            disabled={busy}
            onClick={onConfirm}
            type="button"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
