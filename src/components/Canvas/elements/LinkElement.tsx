'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

/** Ensure we only navigate to safe http/https URLs. */
function safeHref(value: unknown): string {
  if (typeof value !== 'string') return '#';
  try {
    const u = new URL(value);
    if (u.protocol === 'https:' || u.protocol === 'http:') return value;
  } catch {
    // not a valid URL
  }
  return '#';
}

export default function LinkElement({ element, onDelete }: Props) {
  const { x, y, data } = element;
  const href = safeHref(data.url);
  return (
    <div className="absolute group" style={{ left: x, top: y }}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-900/50 border border-blue-500/40 text-blue-300 hover:text-blue-200 px-3 py-2 rounded-lg text-sm flex items-center gap-2 max-w-xs"
        onClick={e => e.stopPropagation()}
      >
        🔗 {data.label as string}
      </a>
      <button onClick={onDelete} className="hidden group-hover:block absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs leading-5 text-center">×</button>
    </div>
  );
}
