'use client';
import { CanvasElement } from '../InfiniteCanvas';

interface Props { element: CanvasElement; onDelete: () => void; }

export default function ImageElement({ element, onDelete }: Props) {
  const { x, y, data } = element;
  return (
    <div className="absolute group" style={{ left: x, top: y }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.url as string} alt="" style={{ width: (data.width as number) || 200, height: (data.height as number) || 150, objectFit: 'cover', borderRadius: 8 }} />
      <button onClick={onDelete} className="hidden group-hover:block absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white text-xs leading-5 text-center">×</button>
    </div>
  );
}
