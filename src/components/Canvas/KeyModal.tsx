'use client';
import { useEffect, useRef, useState } from 'react';

interface Props {
  hint: string | null;
  onConfirm: (key: string) => void;
  onCancel: () => void;
  /** Optional error text from a failed verification attempt. */
  error?: string | null;
}

export default function KeyModal({ hint, onConfirm, onCancel, error }: Props) {
  const [key, setKey] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && key.trim()) onConfirm(key.trim());
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onKeyDown={handleKey}>
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-6 w-80 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔒</span>
          <h2 className="text-white font-semibold text-lg">Locked element</h2>
        </div>
        <p className="text-gray-400 text-sm">Enter the secret key to modify this item.</p>
        {hint && (
          <p className="text-yellow-400 text-xs bg-yellow-400/10 border border-yellow-400/30 rounded-lg px-3 py-2">
            Hint: {hint}
          </p>
        )}
        <div className="space-y-1">
          <label className="text-gray-300 text-sm">Secret key</label>
          <input
            ref={inputRef}
            type="password"
            className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter key…"
            value={key}
            onChange={e => setKey(e.target.value)}
          />
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => key.trim() && onConfirm(key.trim())}
            disabled={!key.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
}
