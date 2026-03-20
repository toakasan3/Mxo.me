'use client';
import { useEffect, useRef, useState } from 'react';

export type ModalField = { label: string; placeholder?: string; value?: string };

interface Props {
  title: string;
  fields: ModalField[];
  onConfirm: (values: string[]) => void;
  onCancel: () => void;
}

export default function ElementInputModal({ title, fields, onConfirm, onCancel }: Props) {
  const [values, setValues] = useState<string[]>(fields.map(f => f.value ?? ''));
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter') onConfirm(values);
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onKeyDown={handleKey}>
      <div className="bg-gray-800 border border-gray-600 rounded-xl shadow-2xl p-6 w-96 space-y-4">
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        {fields.map((field, i) => (
          <div key={i} className="space-y-1">
            <label className="text-gray-300 text-sm">{field.label}</label>
            <input
              ref={i === 0 ? firstRef : undefined}
              type="text"
              className="w-full bg-gray-700 border border-gray-500 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={field.placeholder}
              value={values[i]}
              onChange={e => setValues(prev => prev.map((v, j) => j === i ? e.target.value : v))}
            />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-1">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(values)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
