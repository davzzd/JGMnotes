import { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import { formatSize } from '../lib/filters';

const LANGUAGES = ['English', 'Malayalam'];
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = /\.(pdf|docx?|pptx?)$/i;

// items: [{ key, label, file_name, size_bytes, progress? }]
export default function FileDropzone({ items, onAdd, onLabel, onRemove, busy }) {
  const input = useRef(null);
  const [over, setOver] = useState(false);
  const [rejected, setRejected] = useState([]);

  const take = (fileList) => {
    const ok = [];
    const bad = [];
    for (const f of fileList) {
      if (!ALLOWED.test(f.name)) bad.push(`${f.name} — only PDF, Word or PowerPoint files`);
      else if (f.size > MAX_BYTES) bad.push(`${f.name} — larger than 25 MB`);
      else ok.push(f);
    }
    setRejected(bad);
    if (ok.length) onAdd(ok);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          take(e.dataTransfer.files);
        }}
        className={`well flex w-full flex-col items-center gap-2 px-6 py-9 text-center transition ${
          over ? '!bg-accent-soft' : ''
        }`}
      >
        <UploadCloud size={26} className="text-accent" />
        <span className="text-sm font-semibold text-ink">Drop files here or click to choose</span>
        <span className="text-xs text-ink3">PDF, Word or PowerPoint · up to 25 MB each</span>
      </button>
      <input
        ref={input}
        type="file"
        multiple
        hidden
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        onChange={(e) => {
          take(e.target.files);
          e.target.value = '';
        }}
      />

      {rejected.map((msg) => (
        <p key={msg} className="rounded-lg bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
          {msg}
        </p>
      ))}

      {items.map((item) => (
        <div key={item.key} className="relative flex items-center gap-3 overflow-hidden rounded-xl bg-s3 p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
            <FileText size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{item.file_name}</p>
            <p className="text-xs text-ink3">
              {formatSize(item.size_bytes)}
              {item.progress != null && ` · ${item.progress >= 1 ? 'Uploaded' : `Uploading ${Math.round(item.progress * 100)}%`}`}
            </p>
          </div>
          <div className="flex w-36 flex-col gap-1.5 sm:w-44">
            <div className="well">
              <select
                value={LANGUAGES.includes(item.label) ? item.label : item.label ? 'other' : ''}
                onChange={(e) => onLabel(item.key, e.target.value === 'other' ? 'Other' : e.target.value)}
                aria-label={`Language of ${item.file_name}`}
                disabled={busy}
                className="field !px-3 !py-2 !text-sm"
              >
                <option value="">Language…</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>
            {item.label && !LANGUAGES.includes(item.label) && (
              <div className="well">
                <input
                  value={item.label === 'Other' ? '' : item.label}
                  onChange={(e) => onLabel(item.key, e.target.value || 'Other')}
                  placeholder="Custom label"
                  aria-label={`Label for ${item.file_name}`}
                  disabled={busy}
                  className="field !px-3 !py-2 !text-sm"
                />
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => onRemove(item.key)}
            className="btn-ghost !p-2 hover:!bg-danger-soft hover:!text-danger"
            aria-label={`Remove ${item.file_name}`}
          >
            <Trash2 size={16} />
          </button>
          {item.progress != null && (
            <span
              className="absolute bottom-0 left-0 h-0.5 bg-accent transition-all duration-200"
              style={{ width: `${item.progress * 100}%` }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
