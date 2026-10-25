'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, X } from 'lucide-react';
import { uploadImage } from '@/lib/media';

/**
 * Add photos from the phone or computer (tap, or drag and drop), or paste a link.
 * Shows previews; the first photo is the cover. Photos can be reordered or removed.
 * @param {{
 *   value: string[],
 *   onChange: (urls: string[]) => void,
 *   max?: number,
 *   kind?: 'photo' | 'logo' | 'avatar',
 *   label?: string,
 *   hint?: string
 * }} props
 */
export function ImageUploader({ value = [], onChange, max = 8, kind = 'photo', label = 'Photos', hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [link, setLink] = useState('');
  const single = max === 1;
  const room = max - value.length;

  const addFiles = async (fileList) => {
    setError('');
    const files = [...fileList].slice(0, single ? 1 : room);
    if (files.length === 0) return;
    setBusy(true);
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadImage(file, kind));
      onChange(single ? urls : [...value, ...urls]);
    } catch (e) {
      setError(e.message || 'That image could not be added');
    } finally {
      setBusy(false);
    }
  };

  const addLink = () => {
    const url = link.trim();
    if (!/^https?:\/\/|^\//.test(url)) {
      setError('Paste a link that starts with https://');
      return;
    }
    onChange(single ? [url] : [...value, url]);
    setLink('');
    setLinkOpen(false);
    setError('');
  };

  const move = (from, to) => {
    const next = [...value];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div>
      <p className="text-sm font-medium text-halo-ink">{label}</p>
      {hint && <p className="mt-0.5 text-[13px] text-halo-text-muted">{hint}</p>}

      <div className={`mt-2 grid gap-3 ${single ? 'grid-cols-1 max-w-[220px]' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
        {value.map((src, i) => (
          <figure key={`${src.slice(0, 40)}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-halo-border bg-halo-placeholder">
            <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            {!single && i === 0 && (
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-medium text-white">
                <Star className="h-3 w-3" aria-hidden="true" /> Cover
              </span>
            )}
            <div className="absolute right-1.5 top-1.5 flex gap-1">
              {!single && i > 0 && (
                <button type="button" onClick={() => move(i, i - 1)} className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full bg-black/70 text-white" aria-label={`Move photo ${i + 1} earlier`}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              {!single && i < value.length - 1 && (
                <button type="button" onClick={() => move(i, i + 1)} className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full bg-black/70 text-white" aria-label={`Move photo ${i + 1} later`}>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="inline-flex h-8 w-8 min-h-0 min-w-0 items-center justify-center rounded-full bg-black/70 text-white" aria-label={`Remove photo ${i + 1}`}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </figure>
        ))}

        {(single ? value.length === 0 : room > 0) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`aspect-[4/3] flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-sm transition-colors ${
              dragging ? 'border-halo-gold bg-halo-gold-soft text-halo-ink' : 'border-halo-border-strong text-halo-text-muted hover:border-halo-ink hover:text-halo-ink'
            }`}
          >
            {busy ? <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" /> : <ImagePlus className="h-6 w-6" aria-hidden="true" />}
            <span className="font-medium">{busy ? 'Adding' : single ? 'Add image' : 'Add photos'}</span>
            <span className="text-xs">Tap to choose or drop here</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={!single}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div className="mt-2">
        {linkOpen ? (
          <div className="flex gap-2">
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className="flex-1 px-3 min-h-[40px] rounded-lg border border-halo-border-strong bg-halo-surface text-sm text-halo-ink"
              aria-label="Image link"
            />
            <button type="button" onClick={addLink} className="px-3 rounded-lg bg-halo-ink text-white text-sm font-semibold min-h-[40px]">
              Add
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => setLinkOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-halo-text-muted hover:text-halo-ink min-h-[32px]">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            Or paste an image link
          </button>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-halo-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
