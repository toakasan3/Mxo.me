'use client';
import { useEffect, useState } from 'react';
import { apiUrl } from '@/lib/api';

interface CursorData {
  userId: string;
  x: number;
  y: number;
  name: string;
  color: string;
}

interface Props {
  boardCode: string;
  userId: string;
  offset: { x: number; y: number };
  scale: number;
}

export default function Cursors({ boardCode, userId, offset, scale }: Props) {
  const [cursors, setCursors] = useState<CursorData[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/presence?room=${boardCode}`));
        if (res.ok) {
          const data: CursorData[] = await res.json();
          setCursors(data.filter(c => c.userId !== userId));
        }
      } catch {
        // ignore network errors
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [boardCode, userId]);

  return (
    <>
      {cursors.map(cursor => (
        <div
          key={cursor.userId}
          className="absolute pointer-events-none z-50 transition-all duration-200"
          style={{
            left: cursor.x * scale + offset.x,
            top: cursor.y * scale + offset.y,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M0 0L0 14L5 10L8 16L10 15L7 9L14 9Z" fill={cursor.color} stroke="#000" strokeWidth="0.5" />
          </svg>
          <div
            className="mt-1 px-1.5 py-0.5 rounded text-xs text-white font-medium whitespace-nowrap shadow"
            style={{ backgroundColor: cursor.color }}
          >
            {cursor.name}
          </div>
        </div>
      ))}
    </>
  );
}
