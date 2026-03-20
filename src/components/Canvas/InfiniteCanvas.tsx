'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Identity } from '@/lib/identity';
import { Coordinate } from '@/lib/coord-utils';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/api';
import CanvasToolbar from './CanvasToolbar';
import TextElement from './elements/TextElement';
import StickyElement from './elements/StickyElement';
import ImageElement from './elements/ImageElement';
import LinkElement from './elements/LinkElement';
import StrokeElement from './elements/StrokeElement';
import Cursors from './Cursors';
import CoordPanel from '@/components/CoordSearch/CoordPanel';
import ElementInputModal, { ModalField } from './ElementInputModal';

export type Tool = 'select' | 'text' | 'sticky' | 'image' | 'link' | 'stroke';

export interface CanvasElement {
  id: string;
  board_code: string;
  type: string;
  x: number;
  y: number;
  data: Record<string, unknown>;
  author_id: string;
  deleted: boolean;
}

interface Props {
  boardCode: string;
  identity: Identity;
  jumpTo: Coordinate | null;
  marker: Coordinate | null;
}

export default function InfiniteCanvas({ boardCode, identity, jumpTo, marker }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  // renderTick drives re-renders when refs (offset, scale) change; value itself is intentionally not read
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [renderTick, setRenderTick] = useState(0);
  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);

  const [tool, setTool] = useState<Tool>('select');
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedCoord, setSelectedCoord] = useState<Coordinate | null>(null);
  const [coordPanelOpen, setCoordPanelOpen] = useState(false);

  // Pending element placement (replaces window.prompt)
  type PendingPlacement = { type: string; x: number; y: number; fields: ModalField[] };
  const [pendingPlacement, setPendingPlacement] = useState<PendingPlacement | null>(null);

  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const spaceDown = useRef(false);

  // Stroke drawing state
  const isDrawingStroke = useRef(false);
  const strokePoints = useRef<{ x: number; y: number }[]>([]);

  // Load elements from Supabase
  useEffect(() => {
    async function loadElements() {
      const res = await fetch(apiUrl(`/api/elements?board=${boardCode}`));
      if (res.ok) {
        const data = await res.json();
        setElements(data.filter((e: CanvasElement) => !e.deleted));
      }
    }
    loadElements();

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`board:${boardCode}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'elements', filter: `board_code=eq.${boardCode}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const el = payload.new as CanvasElement;
          if (!el.deleted) setElements(prev => [...prev.filter(e => e.id !== el.id), el]);
        } else if (payload.eventType === 'UPDATE') {
          const el = payload.new as CanvasElement;
          if (el.deleted) {
            setElements(prev => prev.filter(e => e.id !== el.id));
          } else {
            setElements(prev => prev.map(e => e.id === el.id ? el : e));
          }
        } else if (payload.eventType === 'DELETE') {
          setElements(prev => prev.filter(e => e.id !== (payload.old as CanvasElement).id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [boardCode]);

  // Jump to coordinate
  useEffect(() => {
    if (!jumpTo) return;
    offsetRef.current = { x: -jumpTo.x + window.innerWidth / 2, y: -jumpTo.y + window.innerHeight / 2 };
    forceRender();
  }, [jumpTo, forceRender]);

  // Presence reporting
  useEffect(() => {
    let lastX = 0, lastY = 0;
    const onMouseMove = (e: MouseEvent) => {
      lastX = (e.clientX - offsetRef.current.x) / scaleRef.current;
      lastY = (e.clientY - offsetRef.current.y) / scaleRef.current;
    };
    window.addEventListener('mousemove', onMouseMove);

    const interval = setInterval(async () => {
      await fetch(apiUrl('/api/presence'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: boardCode, userId: identity.uid, x: Math.round(lastX), y: Math.round(lastY), name: identity.name, color: identity.color }),
      }).catch(() => {});
    }, 2000);

    return () => { window.removeEventListener('mousemove', onMouseMove); clearInterval(interval); };
  }, [boardCode, identity]);

  // Pan/zoom event handlers
  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(scaleRef.current * delta, 0.1), 10);
    const scaleDiff = newScale / scaleRef.current;
    offsetRef.current.x = mouseX - scaleDiff * (mouseX - offsetRef.current.x);
    offsetRef.current.y = mouseY - scaleDiff * (mouseY - offsetRef.current.y);
    scaleRef.current = newScale;
    forceRender();
  }, [forceRender]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && !spaceDown.current) {
      spaceDown.current = true;
      if (containerRef.current) containerRef.current.style.cursor = 'grab';
    }
  }, []);
  const onKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space') {
      spaceDown.current = false;
      if (containerRef.current) containerRef.current.style.cursor = '';
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp); };
  }, [onKeyDown, onKeyUp]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse or space+left: pan
    if (e.button === 1 || (e.button === 0 && spaceDown.current)) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - offsetRef.current.x, y: e.clientY - offsetRef.current.y };
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
      return;
    }

    if (e.button === 0 && tool === 'stroke') {
      isDrawingStroke.current = true;
      const cx = (e.clientX - offsetRef.current.x) / scaleRef.current;
      const cy = (e.clientY - offsetRef.current.y) / scaleRef.current;
      strokePoints.current = [{ x: cx, y: cy }];
      return;
    }
  }, [tool]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning.current) {
      offsetRef.current = { x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y };
      forceRender();
      return;
    }
    if (isDrawingStroke.current) {
      const cx = (e.clientX - offsetRef.current.x) / scaleRef.current;
      const cy = (e.clientY - offsetRef.current.y) / scaleRef.current;
      strokePoints.current = [...strokePoints.current, { x: cx, y: cy }];
      forceRender();
    }
  }, [forceRender]);

  const addElement = useCallback(async (type: string, x: number, y: number, data: Record<string, unknown>) => {
    await fetch(apiUrl('/api/elements'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': identity.uid },
      body: JSON.stringify({ board_code: boardCode, type, x, y, data, author_id: identity.uid }),
    });
  }, [boardCode, identity.uid]);

  const onMouseUp = useCallback(async (e: React.MouseEvent) => {
    if (isPanning.current) {
      isPanning.current = false;
      if (containerRef.current) containerRef.current.style.cursor = spaceDown.current ? 'grab' : '';
      return;
    }

    if (isDrawingStroke.current) {
      isDrawingStroke.current = false;
      const pts = strokePoints.current;
      strokePoints.current = [];
      if (pts.length > 1) {
        await addElement('stroke', pts[0].x, pts[0].y, { points: pts, color: identity.color, width: 2 });
      }
      forceRender();
      return;
    }

    if (tool === 'select') return;

    const cx = (e.clientX - offsetRef.current.x) / scaleRef.current;
    const cy = (e.clientY - offsetRef.current.y) / scaleRef.current;

    if (tool === 'text') {
      setPendingPlacement({ type: 'text', x: cx, y: cy, fields: [{ label: 'Text content', placeholder: 'Enter text…' }] });
    } else if (tool === 'sticky') {
      setPendingPlacement({ type: 'sticky', x: cx, y: cy, fields: [{ label: 'Sticky note content', placeholder: 'Note…' }] });
    } else if (tool === 'image') {
      setPendingPlacement({ type: 'image', x: cx, y: cy, fields: [{ label: 'Image URL', placeholder: 'https://…' }] });
    } else if (tool === 'link') {
      setPendingPlacement({ type: 'link', x: cx, y: cy, fields: [{ label: 'URL', placeholder: 'https://…' }, { label: 'Label (optional)', placeholder: 'Display text' }] });
    }
  }, [tool, identity.color, addElement, forceRender]);

  async function deleteElement(id: string) {
    await fetch(apiUrl('/api/elements'), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-User-Id': identity.uid },
      body: JSON.stringify({ id, deleted: true }),
    });
  }

  const transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${scaleRef.current})`;

  // Build live stroke SVG path
  const livePath = isDrawingStroke.current && strokePoints.current.length > 1
    ? `M ${strokePoints.current.map(p => `${p.x},${p.y}`).join(' L ')}`
    : '';

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-gray-950 select-none"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onContextMenu={e => e.preventDefault()}
      style={{ cursor: tool === 'stroke' ? 'crosshair' : tool !== 'select' ? 'crosshair' : undefined }}
    >
      {/* Grid dots */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" x={offsetRef.current.x % (20 * scaleRef.current)} y={offsetRef.current.y % (20 * scaleRef.current)} width={20 * scaleRef.current} height={20 * scaleRef.current} patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#374151" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Infinite plane */}
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{ transform, willChange: 'transform' }}
      >
        {/* Live stroke overlay */}
        {livePath && (
          <svg className="absolute pointer-events-none" style={{ left: -10000, top: -10000, width: '20000px', height: '20000px', overflow: 'visible' }}>
            <path d={livePath} fill="none" stroke={identity.color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}

        {/* Coord marker */}
        {marker && (
          <div
            className="absolute pointer-events-none"
            style={{ left: marker.x - 16, top: marker.y - 16 }}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 opacity-80 animate-ping absolute" />
            <div className="w-8 h-8 rounded-full bg-blue-400 opacity-90 flex items-center justify-center absolute">
              <div className="w-2 h-2 rounded-full bg-white" />
            </div>
          </div>
        )}

        {/* Elements */}
        {elements.map(el => {
          const props = { key: el.id, element: el, onDelete: () => deleteElement(el.id) };
          if (el.type === 'text') return <TextElement {...props} />;
          if (el.type === 'sticky') return <StickyElement {...props} />;
          if (el.type === 'image') return <ImageElement {...props} />;
          if (el.type === 'link') return <LinkElement {...props} />;
          if (el.type === 'stroke') return <StrokeElement {...props} />;
          return null;
        })}
      </div>

      {/* Cursors overlay (screen-space) */}
      <Cursors boardCode={boardCode} userId={identity.uid} offset={offsetRef.current} scale={scaleRef.current} />

      {/* Toolbar */}
      <CanvasToolbar tool={tool} onToolChange={setTool} />

      {/* Coord panel */}
      {coordPanelOpen && selectedCoord && (
        <CoordPanel
          boardCode={boardCode}
          coord={selectedCoord}
          identity={identity}
          elements={elements}
          onClose={() => setCoordPanelOpen(false)}
        />
      )}

      {/* Element input modal (replaces window.prompt) */}
      {pendingPlacement && (
        <ElementInputModal
          title={`Add ${pendingPlacement.type}`}
          fields={pendingPlacement.fields}
          onConfirm={async (values) => {
            const { type, x, y } = pendingPlacement;
            if (type === 'text' && values[0]?.trim()) {
              await addElement('text', x, y, { text: values[0].trim(), fontSize: 16, color: '#ffffff' });
            } else if (type === 'sticky') {
              await addElement('sticky', x, y, { text: values[0]?.trim() || 'Note', color: '#FFEAA7' });
            } else if (type === 'image' && values[0]?.trim()) {
              await addElement('image', x, y, { url: values[0].trim(), width: 200, height: 150 });
            } else if (type === 'link' && values[0]?.trim()) {
              await addElement('link', x, y, { url: values[0].trim(), label: values[1]?.trim() || values[0].trim() });
            }
            setPendingPlacement(null);
          }}
          onCancel={() => setPendingPlacement(null)}
        />
      )}
    </div>
  );
}
