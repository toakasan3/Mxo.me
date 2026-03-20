'use client';
import { Tool } from './InfiniteCanvas';

const TOOLS: { id: Tool; icon: string; label: string; shortcut: string }[] = [
  { id: 'select', icon: '↖', label: 'Select', shortcut: 'S' },
  { id: 'text', icon: 'T', label: 'Text', shortcut: 'T' },
  { id: 'sticky', icon: '📝', label: 'Sticky', shortcut: 'N' },
  { id: 'image', icon: '🖼', label: 'Image', shortcut: 'I' },
  { id: 'link', icon: '🔗', label: 'Link', shortcut: 'L' },
  { id: 'stroke', icon: '✏️', label: 'Draw', shortcut: 'D' },
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
          title={`${t.label} (${t.shortcut})`}
          onClick={() => onToolChange(t.id)}
          className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-all relative ${
            tool === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}
        >
          {t.icon}
          <span className={`absolute bottom-0.5 right-1 text-[9px] font-mono leading-none ${
            tool === t.id ? 'text-blue-200' : 'text-gray-600'
          }`}>
            {t.shortcut}
          </span>
        </button>
      ))}
    </div>
  );
}
