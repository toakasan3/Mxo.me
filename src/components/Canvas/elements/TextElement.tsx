'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

export default function TextElement({ element, onDelete }: Props) {
  const { x, y, data } = element;
  return (
    <div
      className="absolute group"
      style={{ left: x, top: y, fontSize: (data.fontSize as number) || 16, color: (data.color as string) || '#fff', maxWidth: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      {data.text as string}
      {element.is_locked && <span className="ml-1 text-xs opacity-60" title="Locked">🔒</span>}
      <button onClick={onDelete} className="hidden group-hover:block absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs leading-5 text-center">×</button>
    </div>
  );
}
