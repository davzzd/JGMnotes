import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';

const MAX_SIDE = 1600;

// Phone photos are several MB; shrink to a web-sized JPEG before upload.
async function toJpeg(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  return new File([blob], 'cover.jpg', { type: 'image/jpeg' });
}

// value: { file, preview } | { remove: true } | undefined (unchanged). currentUrl is the saved cover, if any.
export default function CoverInput({ currentUrl, value, onChange, disabled }) {
  const input = useRef(null);
  const [error, setError] = useState('');
  const shown = value?.file ? value.preview : value?.remove ? null : currentUrl;

  const pick = async (file) => {
    if (!file) return;
    setError('');
    try {
      const jpeg = await toJpeg(file);
      onChange({ file: jpeg, preview: URL.createObjectURL(jpeg) });
    } catch {
      setError('That image could not be read. Try a JPG or PNG.');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="well relative aspect-video w-44 shrink-0 overflow-hidden">
        {shown ? (
          <img src={shown} alt="Cover preview" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink3">
            <ImagePlus size={22} />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm text-ink2">
          {shown ? 'Shown on the notes list instead of the YouTube thumbnail.' : 'Optional. Without one, the YouTube thumbnail is used.'}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button type="button" disabled={disabled} className="btn-soft !py-2" onClick={() => input.current.click()}>
            <ImagePlus size={16} /> {shown ? 'Replace image' : 'Choose image'}
          </button>
          {shown && (
            <button
              type="button"
              disabled={disabled}
              className="btn-ghost !py-2 hover:!bg-danger-soft hover:!text-danger"
              onClick={() => onChange(currentUrl ? { remove: true } : undefined)}
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
        {error && <p className="mt-2 text-xs font-medium text-danger">{error}</p>}
      </div>

      <input
        ref={input}
        type="file"
        hidden
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => {
          pick(e.target.files[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
