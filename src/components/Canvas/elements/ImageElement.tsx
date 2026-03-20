'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

/** Only render images from safe http/https URLs to avoid data: / javascript: URIs. */
function safeSrc(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol === 'https:' || u.protocol === 'http:') return value;
  } catch {
    // not a valid URL
  }
  return null;
}

export default function ImageElement({ element, onDelete }: Props) {
  const { x, y, data } = element;
  const src = safeSrc(data.url);
  if (!src) return null;
  return (
    <div className="absolute group" style={{ left: x, top: y }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ width: (data.width as number) || 200, height: (data.height as number) || 150, objectFit: 'cover', borderRadius: 8 }} />
      <button onClick={onDelete} className="hidden group-hover:block absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs leading-5 text-center">×</button>
    </div>
  );
}
