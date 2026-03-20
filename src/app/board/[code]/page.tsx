'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import InfiniteCanvas from '@/components/Canvas/InfiniteCanvas';
import CoordSearchBar from '@/components/CoordSearch/CoordSearchBar';
import { getOrCreateIdentity, addRecentRoom, Identity } from '@/lib/identity';
import { Coordinate } from '@/lib/coord-utils';

export default function BoardPage() {
  const params = useParams();
  const code = (params.code as string).toUpperCase();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [jumpTo, setJumpTo] = useState<Coordinate | null>(null);
  const [marker, setMarker] = useState<Coordinate | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const id = getOrCreateIdentity();
    setIdentity(id);
    addRecentRoom(code);
  }, [code]);

  function handleCoordSearch(coord: Coordinate) {
    setJumpTo(coord);
    setMarker(coord);
    setTimeout(() => setMarker(null), 4000);
  }

  async function copyBoardCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API not available (e.g. non-https)
    }
  }

  if (!identity) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-950">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">← Home</Link>
          <span className="text-gray-600">|</span>
          <button
            onClick={copyBoardCode}
            title="Copy board code"
            className="flex items-center gap-1.5 font-mono text-sm font-medium text-gray-300 hover:text-white transition-colors group"
          >
            <span>{code}</span>
            <span className="text-xs text-gray-600 group-hover:text-gray-400 transition-colors">
              {copied ? '✓' : '⎘'}
            </span>
          </button>
        </div>
        <CoordSearchBar boardCode={code} identity={identity} onCoordSearch={handleCoordSearch} />
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: identity.color }} />
          <span className="text-sm text-gray-400">{identity.name}</span>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <InfiniteCanvas
          boardCode={code}
          identity={identity}
          jumpTo={jumpTo}
          marker={marker}
        />
      </div>
    </div>
  );
}
