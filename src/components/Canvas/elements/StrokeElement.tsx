'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

export default function StrokeElement({ element, onDelete }: Props) {
  const { data } = element;
  const pts = data.points as { x: number; y: number }[];
  if (!pts || pts.length < 2) return null;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), minY = Math.min(...ys);
  const maxX = Math.max(...xs), maxY = Math.max(...ys);
  const pad = 10;
  const w = maxX - minX + pad * 2;
  const h = maxY - minY + pad * 2;
  return (
    <div className="absolute group" style={{ left: minX - pad, top: minY - pad, width: w, height: h }}>
      <svg width={w} height={h} style={{ overflow: 'visible' }}>
        <path
          d={`M ${pts.map(p => `${p.x - minX + pad},${p.y - minY + pad}`).join(' L ')}`}
          fill="none"
          stroke={(data.color as string) || '#fff'}
          strokeWidth={(data.width as number) || 2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <button onClick={onDelete} className="hidden group-hover:block absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs leading-5 text-center">×</button>
    </div>
  );
}
