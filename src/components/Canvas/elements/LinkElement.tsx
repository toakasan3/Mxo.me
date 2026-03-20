'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

export default function LinkElement({ element, onDelete }: Props) {
  const { x, y, data } = element;
  return (
    <div className="absolute group" style={{ left: x, top: y }}>
      <a
        href={data.url as string}
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
