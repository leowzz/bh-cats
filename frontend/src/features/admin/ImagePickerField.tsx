import clsx from 'clsx';

function selectionLabel(files: File[], emptyLabel: string) {
  if (files.length === 0) return emptyLabel;
  return '已选择 ' + files.length + ' 张图片';
}

type ImagePickerFieldProps = {
  id: string;
  name: string;
  selectedFiles: File[];
  onChange: (files: File[]) => void;
  resetKey?: number;
  emptyLabel?: string;
  className?: string;
};

export function ImagePickerField({
  id,
  name,
  selectedFiles,
  onChange,
  resetKey = 0,
  emptyLabel = '未选择图片',
  className
}: ImagePickerFieldProps) {
  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      <input
        key={id + '-' + resetKey}
        accept="image/*"
        aria-label="上传图片"
        className="sr-only"
        id={id}
        multiple
        name={name}
        onChange={(event) => onChange(Array.from(event.currentTarget.files ?? []))}
        type="file"
      />
      <div className="flex flex-wrap items-center gap-3">
        <label className="ghost-btn cursor-pointer" htmlFor={id}>
          上传图片
        </label>
        <p className="text-sm text-ink-700">{selectionLabel(selectedFiles, emptyLabel)}</p>
      </div>
    </div>
  );
}
