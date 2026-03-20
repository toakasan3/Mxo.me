'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getOrCreateIdentity, getRecentRooms, updateName, addRecentRoom, Identity, RecentRoom } from '@/lib/identity';
import { apiUrl } from '@/lib/api';
import BoardCard from './BoardCard';

const TABS = ['My Boards', 'Join', 'Coord Search', 'Settings'] as const;
type Tab = typeof TABS[number];

export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('My Boards');
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [rooms, setRooms] = useState<RecentRoom[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = getOrCreateIdentity();
    setIdentity(id);
    setNewName(id.name);
    setRooms(getRecentRooms());

    const handler = () => {
      const updated = getOrCreateIdentity();
      setIdentity(updated);
    };
    window.addEventListener('identity-updated', handler);
    return () => window.removeEventListener('identity-updated', handler);
  }, []);

  async function createBoard() {
    if (!identity) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/api/boards'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': identity.uid },
        body: JSON.stringify({ owner_id: identity.uid, name: `${identity.name}'s Board` }),
      });
      if (!res.ok) throw new Error('Failed to create board');
      const board = await res.json();
      addRecentRoom(board.code);
      router.push(`/board/${board.code}`);
    } catch {
      setError('Failed to create board. Check your connection.');
    } finally {
      setCreating(false);
    }
  }

  function joinBoard() {
    const code = joinCode.trim().toUpperCase();
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-character board code.');
      return;
    }
    addRecentRoom(code);
    router.push(`/board/${code}`);
  }

  function saveName() {
    if (!newName.trim()) return;
    updateName(newName.trim());
  }

  if (!identity) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            InfiniteBoard
          </span>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">v2</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: identity.color }} />
          <span className="text-sm text-gray-300">{identity.name}</span>
          <span className="text-xs text-gray-600 font-mono">#{identity.uid}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 bg-gray-900 p-1 rounded-xl w-fit">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* My Boards Tab */}
        {tab === 'My Boards' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">My Boards</h2>
              <button
                onClick={createBoard}
                disabled={creating}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {creating ? 'Creating…' : '+ New Board'}
              </button>
            </div>
            {rooms.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-5xl mb-4">🎨</div>
                <p className="text-lg mb-2">No boards yet</p>
                <p className="text-sm">Create your first board to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <BoardCard key={room.code} room={room} onJoin={() => {
                    addRecentRoom(room.code);
                    router.push(`/board/${room.code}`);
                  }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Join Tab */}
        {tab === 'Join' && (
          <div className="max-w-md">
            <h2 className="text-xl font-semibold mb-6">Join a Board</h2>
            <div className="bg-gray-900 rounded-xl p-6 space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Board Code</label>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinBoard()}
                  maxLength={6}
                  placeholder="ABC123"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-lg tracking-widest placeholder-gray-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={joinBoard}
                className="w-full bg-blue-600 hover:bg-blue-500 px-4 py-3 rounded-lg font-medium transition-colors"
              >
                Join Board
              </button>
            </div>
          </div>
        )}

        {/* Coord Search Tab */}
        {tab === 'Coord Search' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-semibold">Coordinate System</h2>
            <div className="bg-gray-900 rounded-xl p-6 space-y-4 text-sm text-gray-300 leading-relaxed">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⊕</span>
                <div>
                  <p className="font-medium text-white">Secret Coordinate Search</p>
                  <p className="text-gray-400">Available inside any board via the crosshair icon in the top bar</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="font-medium text-white">How it works</h3>
                <p>Every point on the infinite canvas has an <strong className="text-blue-400">x, y coordinate</strong>. You can navigate directly to any coordinate using the coordinate search bar in a board.</p>
                <div className="bg-gray-800 rounded-lg p-4 font-mono text-sm space-y-1">
                  <p className="text-green-400">✓ 1200,500</p>
                  <p className="text-green-400">✓ -300 800</p>
                  <p className="text-green-400">✓ 0,0</p>
                  <p className="text-red-400">✗ hello world</p>
                  <p className="text-red-400">✗ 1.5, 2.3</p>
                </div>
                <h3 className="font-medium text-white">Features</h3>
                <ul className="space-y-2 list-disc list-inside text-gray-400">
                  <li>Shows elements near that coordinate (within 150px)</li>
                  <li>Reply thread pinned to that coordinate</li>
                  <li>Pulsing blue marker appears for 4 seconds</li>
                  <li>&quot;Jump there&quot; button pans canvas to the location</li>
                  <li>Replies are live via Supabase Realtime</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {tab === 'Settings' && (
          <div className="max-w-md space-y-6">
            <h2 className="text-xl font-semibold">Settings</h2>
            <div className="bg-gray-900 rounded-xl p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Your Identity</h3>
                <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-4 py-3">
                  <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: identity.color }} />
                  <div>
                    <p className="text-sm font-medium">{identity.name}</p>
                    <p className="text-xs text-gray-500 font-mono">ID: {identity.uid}</p>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Display Name</label>
                <div className="flex gap-2">
                  <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveName()}
                    maxLength={32}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={saveName}
                    className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-2">Color</h3>
                <div className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: identity.color }} />
                <p className="text-xs text-gray-600 mt-1">Color is randomly assigned and stored locally</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
