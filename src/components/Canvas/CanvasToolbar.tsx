'use client';
import { Tool } from './InfiniteCanvas';

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'select', icon: '↖', label: 'Select' },
  { id: 'text', icon: 'T', label: 'Text' },
  { id: 'sticky', icon: '📝', label: 'Sticky' },
  { id: 'image', icon: '🖼', label: 'Image' },
  { id: 'link', icon: '🔗', label: 'Link' },
  { id: 'stroke', icon: '✏️', label: 'Draw' },
];

interface Props {
  tool: Tool;
  onToolChange: (t: Tool) => void;
}

export default function CanvasToolbar({ tool, onToolChange }: Props) {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-1 bg-gray-900 border border-gray-700 rounded-xl p-1 shadow-xl z-10">
      {TOOLS.map(t => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => onToolChange(t.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all ${
            tool === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          {t.icon}
        </button>
      ))}
    </div>
  );
}
