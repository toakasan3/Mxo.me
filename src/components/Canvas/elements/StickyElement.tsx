'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

export default function StickyElement({ element, onDelete }: Props) {
  const { x, y, data } = element;
  return (
    <div
      className="absolute group rounded-lg shadow-lg p-3 w-44 min-h-24"
      style={{ left: x, top: y, backgroundColor: (data.color as string) || '#FFEAA7', color: '#333' }}
    >
      <p className="text-sm whitespace-pre-wrap break-words">{data.text as string}</p>
      {element.is_locked && <span className="absolute top-1 right-1 text-xs opacity-50" title="Locked">🔒</span>}
      <button onClick={onDelete} className="hidden group-hover:block absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs leading-5 text-center">×</button>
    </div>
  );
}
