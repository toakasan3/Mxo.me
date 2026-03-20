'use client';
import { useEffect, useState, useRef } from 'react';
import { Coordinate } from '@/lib/coord-utils';
import { Identity } from '@/lib/identity';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';
import { CanvasElement } from '../Canvas/InfiniteCanvas';

interface Reply {
  id: string;
  author_name: string;
  author_id: string;
  message: string;
  created_at: string;
}

interface Props {
  boardCode: string;
  coord: Coordinate;
  identity: Identity;
  elements: CanvasElement[];
  onClose: () => void;
}

const NEARBY_RADIUS = 150;

export default function CoordPanel({ boardCode, coord, identity, elements, onClose }: Props) {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const nearbyElements = elements.filter(el =>
    Math.sqrt((el.x - coord.x) ** 2 + (el.y - coord.y) ** 2) <= NEARBY_RADIUS && !el.deleted
  );

  useEffect(() => {
    async function loadReplies() {
      const res = await fetch(apiUrl(`/api/coord-replies?board=${boardCode}&x=${coord.x}&y=${coord.y}`));
      if (res.ok) setReplies(await res.json());
    }
    loadReplies();

    const channel = supabase
      .channel(`coord:${boardCode}:${coord.x}:${coord.y}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'coord_replies',
        filter: `board_code=eq.${boardCode}`,
      }, payload => {
        const r = payload.new as Reply & { coord_x: number; coord_y: number };
        if (r.coord_x === coord.x && r.coord_y === coord.y) {
          setReplies(prev => [...prev, r]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardCode, coord.x, coord.y]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  async function sendReply() {
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await fetch(apiUrl('/api/coord-replies'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': identity.uid },
        body: JSON.stringify({
          board_code: boardCode,
          coord_x: coord.x,
          coord_y: coord.y,
          author_id: identity.uid,
          author_name: identity.name,
          message: message.trim(),
        }),
      });
      setMessage('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="absolute right-0 top-8 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden" style={{ maxHeight: '500px' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <span className="text-sm font-medium text-white font-mono">({coord.x}, {coord.y})</span>
          <p className="text-xs text-gray-500">{nearbyElements.length} nearby element{nearbyElements.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
      </div>

      {nearbyElements.length > 0 && (
        <div className="px-4 py-3 border-b border-gray-800">
          <p className="text-xs font-medium text-gray-400 mb-2">Nearby</p>
          <div className="space-y-1">
            {nearbyElements.map(el => (
              <div key={el.id} className="text-xs bg-gray-800 rounded px-2 py-1 text-gray-300">
                {el.type} @ ({Math.round(el.x)}, {Math.round(el.y)})
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {replies.length === 0 && (
          <p className="text-xs text-gray-600 text-center py-4">No replies yet. Be the first!</p>
        )}
        {replies.map(r => (
          <div key={r.id} className={`flex flex-col gap-0.5 ${r.author_id === identity.uid ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-500">{r.author_name}</span>
            <div className={`text-sm rounded-xl px-3 py-2 max-w-[90%] break-words ${
              r.author_id === identity.uid ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-200'
            }`}>
              {r.message}
            </div>
            <span className="text-xs text-gray-700">{new Date(r.created_at).toLocaleTimeString()}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
            placeholder="Reply at this coordinate…"
            maxLength={1000}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 placeholder-gray-600"
          />
          <button
            onClick={sendReply}
            disabled={sending || !message.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 px-3 py-2 rounded-lg text-sm transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}
