'use client';
import { RecentRoom } from '@/lib/identity';

interface Props {
  room: RecentRoom;
  onJoin: () => void;
}

export default function BoardCard({ room, onJoin }: Props) {
  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold font-mono">
          {room.code.slice(0, 2)}
        </div>
        <span className="text-xs text-gray-600">{timeAgo(room.lastVisited)}</span>
      </div>
      <p className="font-mono text-sm font-medium text-gray-200 mb-1">{room.code}</p>
      <p className="text-xs text-gray-500 mb-4">{new Date(room.lastVisited).toLocaleDateString()}</p>
      <button
        onClick={onJoin}
        className="w-full bg-gray-800 hover:bg-blue-600 text-gray-300 hover:text-white text-sm py-2 rounded-lg transition-all"
      >
        Open Board →
      </button>
    </div>
  );
}
