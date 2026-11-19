import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Eye, EyeOff, Plus, Trash2, Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  LayoutConfig, LayoutZones, DEFAULT_LAYOUT, ZONE_LABELS, ZoneRect,
  CustomZone, CustomZoneType, CUSTOM_ZONE_OPTIONS,
} from '../lib/types';
import { API_URL } from '../lib/api';

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const PREVIEW_W = 740;
const PREVIEW_H = Math.round((PREVIEW_W / CANVAS_W) * CANVAS_H);

// Colors for fixed zones
const FIXED_COLORS: Record<string, string> = {
  bg: 'transparent', slot1: 'rgba(220,38,38,.35)', slot2: 'rgba(220,38,38,.28)',
  slot3: 'rgba(220,38,38,.22)', slot4: 'rgba(220,38,38,.17)', slot5: 'rgba(220,38,38,.13)',
  video: 'rgba(59,130,246,.30)', slide: 'rgba(16,185,129,.30)', table: 'rgba(245,158,11,.30)',
  rtext: 'rgba(139,92,246,.35)', datetime: 'rgba(236,72,153,.35)',
};
const FIXED_BORDER: Record<string, string> = {
  bg: '#374151', slot1: '#dc2626', slot2: '#dc2626', slot3: '#dc2626',
  slot4: '#dc2626', slot5: '#dc2626', video: '#3b82f6',
  slide: '#10b981', table: '#f59e0b', rtext: '#8b5cf6', datetime: '#ec4899',
};
const EXTRA_COLORS = ['#6366f1','#ec4899','#14b8a6','#f97316','#84cc16','#eab308','#8b5cf6'];

type ZoneKey = keyof LayoutZones;
type AnyKey  = ZoneKey | string; // string = extra zone id

interface DragState { mx: number; my: number; zx: number; zy: number; zw: number; zh: number; }

interface Props {
  layout:   LayoutConfig;
  onChange: (layout: LayoutConfig) => void;
}

function uid() { return Math.random().toString(36).slice(2, 9); }

export default function LayoutEditor({ layout, onChange }: Props) {
  const [selected,  setSelected]  = useState<AnyKey | null>(null);
  const [dragging,  setDragging]  = useState(false);
  const [resizing,  setResizing]  = useState<string | null>(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [editExtra, setEditExtra] = useState<string | null>(null);

  const dragStart = useRef<DragState | null>(null);
  const scale     = PREVIEW_W / CANVAS_W;

  const extras: CustomZone[] = layout.extras || [];

  // ── Helpers ──────────────────────────────────────────────
  const toCanvas = (px: number) => Math.round(px / scale);

  const updateFixed = useCallback((key: ZoneKey, patch: Partial<ZoneRect>) => {
    onChange({ ...layout, [key]: { ...layout[key], ...patch } });
  }, [layout, onChange]);

  const updateExtra = useCallback((id: string, patch: Partial<CustomZone>) => {
    onChange({
      ...layout,
      extras: (layout.extras || []).map(e => e.id === id ? { ...e, ...patch } : e),
    });
  }, [layout, onChange]);

  const removeExtra = useCallback((id: string) => {
    onChange({ ...layout, extras: (layout.extras || []).filter(e => e.id !== id) });
    if (selected === id) setSelected(null);
    if (editExtra === id) setEditExtra(null);
  }, [layout, onChange, selected, editExtra]);

  // ── Drag & resize ─────────────────────────────────────────
  const startDrag = (e: React.MouseEvent, key: AnyKey) => {
    if (key === 'bg') return;
    e.stopPropagation();
    setSelected(key);
    setDragging(true);
    const isFixed = key in FIXED_BORDER;
    const z = isFixed ? layout[key as ZoneKey] : extras.find(ex => ex.id === key)!;
    dragStart.current = { mx: e.clientX, my: e.clientY, zx: z.x, zy: z.y, zw: z.w, zh: z.h };
  };

  const startResize = (e: React.MouseEvent, key: AnyKey, handle: string) => {
    e.stopPropagation();
    setSelected(key);
    setResizing(handle);
    const isFixed = key in FIXED_BORDER;
    const z = isFixed ? layout[key as ZoneKey] : extras.find(ex => ex.id === key)!;
    dragStart.current = { mx: e.clientX, my: e.clientY, zx: z.x, zy: z.y, zw: z.w, zh: z.h };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragStart.current || !selected || (!dragging && !resizing)) return;
      const dx = toCanvas(e.clientX - dragStart.current.mx);
      const dy = toCanvas(e.clientY - dragStart.current.my);
      const { zx, zy, zw, zh } = dragStart.current;
      const isFixed = selected in FIXED_BORDER;

      if (dragging) {
        const nx = Math.max(0, Math.min(CANVAS_W - zw, zx + dx));
        const ny = Math.max(0, Math.min(CANVAS_H - zh, zy + dy));
        if (isFixed) updateFixed(selected as ZoneKey, { x: nx, y: ny });
        else         updateExtra(selected, { x: nx, y: ny });
      } else if (resizing) {
        let nx = zx, ny = zy, nw = zw, nh = zh;
        if (resizing.includes('e')) nw = Math.max(40, zw + dx);
        if (resizing.includes('s')) nh = Math.max(24, zh + dy);
        if (resizing.includes('w')) { nx = Math.min(zx + zw - 40, zx + dx); nw = Math.max(40, zw - dx); }
        if (resizing.includes('n')) { ny = Math.min(zy + zh - 24, zy + dy); nh = Math.max(24, zh - dy); }
        const patch = { x: Math.max(0, nx), y: Math.max(0, ny), w: Math.min(CANVAS_W - nx, nw), h: Math.min(CANVAS_H - ny, nh) };
        if (isFixed) updateFixed(selected as ZoneKey, patch);
        else         updateExtra(selected, patch);
      }
    };
    const onUp = () => { setDragging(false); setResizing(null); dragStart.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, resizing, selected, updateFixed, updateExtra]);

  // ── Add custom zone ───────────────────────────────────────
  const addZone = (type: CustomZoneType) => {
    const opt    = CUSTOM_ZONE_OPTIONS.find(o => o.type === type)!;
    const newZ: CustomZone = {
      id: uid(), type, label: opt.label,
      x: 100, y: 100, w: 400, h: 200, visible: true,
      color: '#1e3a5f',
      text: type === 'text' ? 'Teks baru' : type === 'rtext2' ? 'Running text tambahan...' : '',
      fontSize: 28, opacity: 1,
    };
    onChange({ ...layout, extras: [...(layout.extras || []), newZ] });
    setSelected(newZ.id);
    setShowAdd(false);
    setEditExtra(newZ.id);
  };

  // ── Resize handles ────────────────────────────────────────
  const Handles = ({ zKey }: { zKey: AnyKey }) => (
    <>
      {['se','sw','ne','nw','e','s','w','n'].map(h => {
        const isCorner = h.length === 2;
        return (
          <div key={h} onMouseDown={e => startResize(e, zKey, h)} style={{
            position: 'absolute', width: isCorner ? 9 : 7, height: isCorner ? 9 : 7,
            background: '#fff', borderRadius: 2, zIndex: 30, cursor: `${h}-resize`,
            border: `1.5px solid ${zKey in FIXED_BORDER ? FIXED_BORDER[zKey as string] : '#6366f1'}`,
            ...(h.includes('e') ? { right: -4 } : h.includes('w') ? { left: -4 } : { left: 'calc(50% - 4px)' }),
            ...(h.includes('s') ? { bottom: -4 } : h.includes('n') ? { top: -4 } : { top: 'calc(50% - 4px)' }),
          }} />
        );
      })}
    </>
  );

  const fixedKeys = Object.keys(ZONE_LABELS) as (keyof LayoutZones)[];

  return (
    <div className="flex gap-5 select-none">

      {/* ── Preview Canvas ── */}
      <div className="flex-1 min-w-0">
        <div
          className="relative border-2 border-gray-700 rounded-xl overflow-hidden"
          style={{ width: PREVIEW_W, height: PREVIEW_H, background: '#111', cursor: 'default' }}
          onClick={() => setSelected(null)}
        >
          {/* BG gradient hint */}
          <div className="absolute inset-0 opacity-20"
            style={{ background: 'linear-gradient(135deg,#7f0000 0%,#c0392b 30%,#e8e8e8 60%,#fff 100%)' }} />

          {/* Fixed zones */}
          {fixedKeys.map(key => {
            const z    = layout[key];
            const isSel = selected === key;
            if (!z.visible && key !== 'bg') return null;
            return (
              <div key={key} onMouseDown={e => startDrag(e, key)} style={{
                position: 'absolute',
                left: z.x * scale, top: z.y * scale, width: z.w * scale, height: z.h * scale,
                background: FIXED_COLORS[key],
                border: `${isSel ? 2 : 1}px ${isSel ? 'solid' : 'dashed'} ${FIXED_BORDER[key]}`,
                borderRadius: 4, cursor: key === 'bg' ? 'default' : 'move',
                zIndex: isSel ? 20 : key === 'bg' ? 0 : 10,
                boxShadow: isSel ? `0 0 0 2px ${FIXED_BORDER[key]}44` : 'none',
              }}>
                {key !== 'bg' && (
                  <div style={{ position: 'absolute', top: 2, left: 4,
                    fontSize: Math.max(7, z.w * scale * 0.07), fontWeight: 700,
                    color: FIXED_BORDER[key], pointerEvents: 'none',
                    textShadow: '0 1px 2px rgba(0,0,0,.8)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                    {ZONE_LABELS[key]}
                  </div>
                )}
                {isSel && key !== 'bg' && <Handles zKey={key} />}
              </div>
            );
          })}

          {/* Extra zones */}
          {extras.map((ez, colorIdx) => {
            if (!ez.visible) return null;
            const isSel  = selected === ez.id;
            const color  = EXTRA_COLORS[colorIdx % EXTRA_COLORS.length];
            return (
              <div key={ez.id} onMouseDown={e => startDrag(e, ez.id)} style={{
                position: 'absolute',
                left: ez.x * scale, top: ez.y * scale, width: ez.w * scale, height: ez.h * scale,
                background: `${color}33`,
                border: `${isSel ? 2 : 1}px ${isSel ? 'solid' : 'dashed'} ${color}`,
                borderRadius: 4, cursor: 'move', zIndex: isSel ? 25 : 15,
                boxShadow: isSel ? `0 0 0 2px ${color}44` : 'none',
              }}>
                <div style={{ position: 'absolute', top: 2, left: 4,
                  fontSize: Math.max(7, ez.w * scale * 0.07), fontWeight: 700,
                  color, pointerEvents: 'none', textShadow: '0 1px 2px rgba(0,0,0,.8)',
                  whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  {CUSTOM_ZONE_OPTIONS.find(o => o.type === ez.type)?.icon} {ez.label}
                </div>
                {isSel && <Handles zKey={ez.id} />}
              </div>
            );
          })}

          {/* Canvas size hint */}
          <div style={{ position: 'absolute', bottom: 3, right: 6,
            fontSize: 9, color: 'rgba(255,255,255,.25)', pointerEvents: 'none' }}>
            1920 × 1080
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          Klik &amp; seret untuk pindah · Seret sudut untuk resize · Klik kosong untuk deselect
        </p>
      </div>

      {/* ── Side Panel ── */}
      <div className="w-64 flex-shrink-0 flex flex-col gap-2 max-h-[480px] overflow-y-auto pr-1">

        {/* Fixed zones */}
        <div className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mb-0.5">Zona Tetap</div>
        {fixedKeys.map(key => {
          const z    = layout[key];
          const isSel = selected === key;
          return (
            <div key={key} onClick={() => setSelected(isSel ? null : key)}
              className={`rounded-xl border p-2.5 cursor-pointer transition-all ${
                isSel ? 'border-blue-500 bg-blue-950/40' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
              }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: FIXED_BORDER[key] }} />
                  <span className="text-xs font-semibold text-white">{ZONE_LABELS[key]}</span>
                </div>
                {key !== 'bg' && (
                  <button onClick={e => { e.stopPropagation(); updateFixed(key, { visible: !z.visible }); }}
                    className="text-gray-600 hover:text-white">
                    {z.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                )}
              </div>
              {isSel && (
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {(['x','y','w','h'] as const).map(f => (
                    <div key={f}>
                      <div className="text-xs text-gray-500 mb-0.5 uppercase">{f}</div>
                      <input type="number"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                        value={z[f]}
                        onChange={e => updateFixed(key, { [f]: parseInt(e.target.value)||0 })}
                        onClick={ev => ev.stopPropagation()} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Extra zones */}
        {extras.length > 0 && (
          <>
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wide px-1 mt-2 mb-0.5">Zona Kustom</div>
            {extras.map((ez, colorIdx) => {
              const isSel  = selected === ez.id;
              const color  = EXTRA_COLORS[colorIdx % EXTRA_COLORS.length];
              const isEdit = editExtra === ez.id;
              return (
                <div key={ez.id} onClick={() => setSelected(isSel ? null : ez.id)}
                  className={`rounded-xl border p-2.5 cursor-pointer transition-all ${
                    isSel ? 'border-indigo-500 bg-indigo-950/30' : 'border-gray-800 bg-gray-900 hover:border-gray-700'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                      <span className="text-xs font-semibold text-white">
                        {CUSTOM_ZONE_OPTIONS.find(o => o.type === ez.type)?.icon} {ez.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={ev => { ev.stopPropagation(); updateExtra(ez.id, { visible: !ez.visible }); }}
                        className="text-gray-600 hover:text-white"><Eye size={11} /></button>
                      <button onClick={ev => { ev.stopPropagation(); setEditExtra(isEdit ? null : ez.id); }}
                        className={`${isEdit ? 'text-indigo-400' : 'text-gray-600 hover:text-white'}`}>
                        <Settings2 size={11} />
                      </button>
                      <button onClick={ev => { ev.stopPropagation(); removeExtra(ez.id); }}
                        className="text-gray-600 hover:text-red-400"><Trash2 size={11} /></button>
                    </div>
                  </div>

                  {/* Coordinates */}
                  {isSel && (
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      {(['x','y','w','h'] as const).map(f => (
                        <div key={f}>
                          <div className="text-xs text-gray-500 mb-0.5 uppercase">{f}</div>
                          <input type="number"
                            className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                            value={ez[f]}
                            onChange={e => updateExtra(ez.id, { [f]: parseInt(e.target.value)||0 })}
                            onClick={ev => ev.stopPropagation()} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content editor */}
                  {isEdit && (
                    <div className="mt-2 space-y-2 border-t border-gray-700 pt-2" onClick={ev => ev.stopPropagation()}>
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Label</div>
                        <input className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                          value={ez.label} onChange={e => updateExtra(ez.id, { label: e.target.value })} />
                      </div>
                      {(ez.type === 'text' || ez.type === 'rtext2') && (
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Teks</div>
                          <textarea className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white resize-none"
                            rows={2} value={ez.text || ''} onChange={e => updateExtra(ez.id, { text: e.target.value })} />
                        </div>
                      )}
                      {ez.type === 'image' && (
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">URL Gambar</div>
                          <input className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                            value={ez.imageUrl || ''} onChange={e => updateExtra(ez.id, { imageUrl: e.target.value })}
                            placeholder="/resources/logo.png" />
                        </div>
                      )}
                      {(ez.type === 'colorbox' || ez.type === 'text') && (
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Warna Latar</div>
                          <div className="flex gap-1.5">
                            <input type="color" value={ez.color || '#1e3a5f'}
                              onChange={e => updateExtra(ez.id, { color: e.target.value })}
                              className="w-8 h-7 rounded border border-gray-700 cursor-pointer bg-transparent" />
                            <input className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white font-mono"
                              value={ez.color || '#1e3a5f'} onChange={e => updateExtra(ez.id, { color: e.target.value })} />
                          </div>
                        </div>
                      )}
                      {ez.type === 'text' && (
                        <div>
                          <div className="text-xs text-gray-500 mb-0.5">Ukuran Font</div>
                          <input type="number" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs text-white"
                            value={ez.fontSize || 28} onChange={e => updateExtra(ez.id, { fontSize: parseInt(e.target.value)||28 })} />
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-gray-500 mb-0.5">Opacity ({Math.round((ez.opacity ?? 1) * 100)}%)</div>
                        <input type="range" min={0} max={1} step={0.05}
                          value={ez.opacity ?? 1} onChange={e => updateExtra(ez.id, { opacity: parseFloat(e.target.value) })}
                          className="w-full" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}

        {/* Add zone button */}
        <div className="mt-1">
          <button onClick={() => setShowAdd(!showAdd)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-700 hover:border-indigo-600 text-gray-500 hover:text-indigo-400 text-xs font-semibold transition-colors">
            <Plus size={13} /> Tambah Zona Kustom
            {showAdd ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showAdd && (
            <div className="mt-1.5 space-y-1">
              {CUSTOM_ZONE_OPTIONS.map(opt => (
                <button key={opt.type} onClick={() => addZone(opt.type)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-indigo-600 rounded-xl text-left transition-colors">
                  <span className="text-base">{opt.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-white">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <button onClick={() => { onChange({ ...DEFAULT_LAYOUT, extras: [] }); setSelected(null); }}
          className="w-full flex items-center justify-center gap-2 text-xs text-gray-600 hover:text-white border border-gray-800 hover:border-gray-600 rounded-xl py-2 transition-colors mt-1">
          <RotateCcw size={11} /> Reset semua ke default
        </button>
      </div>
    </div>
  );
}
