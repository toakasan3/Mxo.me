'use client';
import { useState } from 'react';
import { parseCoordinate, Coordinate } from '@/lib/coord-utils';
import { Identity } from '@/lib/identity';
import { apiUrl } from '@/lib/api';
import CoordPanel from './CoordPanel';
import { CanvasElement } from '@/components/Canvas/InfiniteCanvas';

interface Props {
  boardCode: string;
  identity: Identity;
  onCoordSearch: (coord: Coordinate) => void;
}

export default function CoordSearchBar({ boardCode, identity, onCoordSearch }: Props) {
  const [input, setInput] = useState('');
  const [coord, setCoord] = useState<Coordinate | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [elements, setElements] = useState<CanvasElement[]>([]);

  function handleChange(val: string) {
    setInput(val);
    const parsed = parseCoordinate(val);
    if (parsed) {
      setCoord(parsed);
    } else {
      setCoord(null);
    }
  }

  async function handleSearch() {
    if (!coord) return;
    onCoordSearch(coord);
    const res = await fetch(apiUrl(`/api/elements?board=${boardCode}`));
    if (res.ok) {
      const data = await res.json();
      setElements(data);
    }
    setPanelOpen(true);
  }

  return (
    <div className="flex items-center gap-2 relative">
      <span className="text-gray-400 text-lg select-none" title="Coordinate Search">⊕</span>
      <input
        value={input}
        onChange={e => handleChange(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSearch()}
        placeholder="x,y"
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white w-28 focus:outline-none focus:border-blue-500 font-mono placeholder-gray-600"
      />
      {coord && (
        <button
          onClick={handleSearch}
          className="bg-blue-600 hover:bg-blue-500 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors"
        >
          Jump
        </button>
      )}
      {panelOpen && coord && (
        <CoordPanel
          boardCode={boardCode}
          coord={coord}
          identity={identity}
          elements={elements}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </div>
  );
}
