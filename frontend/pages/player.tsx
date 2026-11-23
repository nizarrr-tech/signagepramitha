import { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { API_URL } from '../lib/api';
import { DEFAULT_LAYOUT, LayoutConfig, LayoutZones, ZoneRect, ScheduleRow, CustomZone } from '../lib/types';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

// ─── Types ────────────────────────────────────────────────
interface QueueSlot { slotNumber: number; loketName: string; currentNumber: string; }
interface SignageData {
  content: {
    videoUrls:     string[];
    slideUrls:     string[];
    runningText:   string;
    scheduleTable: ScheduleRow[];
    backgroundUrl: string;
    layoutConfig:  LayoutConfig;
    clinicName:    string;
    themeColor:    string;
  };
  queueSlots: QueueSlot[];
}

// ─── Utils ────────────────────────────────────────────────
const DAYS   = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
                'Agustus','September','Oktober','November','Desember'];

function h2r(hex: string, alpha: number): string {
  if (!hex || hex.length < 7) return `rgba(220,38,38,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function darken(hex: string): string {
  if (!hex || hex.length < 7) return '#7f0000';
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 60);
  const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - 10);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 10);
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

function zs(z: ZoneRect): React.CSSProperties {
  return { position: 'absolute', left: z.x, top: z.y, width: z.w, height: z.h, overflow: 'hidden' };
}

// ─── TTS ──────────────────────────────────────────────────
let _ttsQ: string[] = [];
let _ttsBusy = false;

function ttsSpeak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  _ttsQ.push(text);
  if (!_ttsBusy) _ttsNext();
}
function _ttsNext() {
  if (!_ttsQ.length) { _ttsBusy = false; return; }
  _ttsBusy = true;
  const u = new SpeechSynthesisUtterance(_ttsQ.shift()!);
  u.lang = 'id-ID'; u.rate = 0.88; u.pitch = 1.1; u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang.startsWith('id')) || voices[0];
  if (v) u.voice = v;
  u.onend = u.onerror = _ttsNext;
  window.speechSynthesis.speak(u);
}
function spellingNum(n: string): string {
  const d: Record<string, string> = {
    '0':'nol','1':'satu','2':'dua','3':'tiga','4':'empat',
    '5':'lima','6':'enam','7':'tujuh','8':'delapan','9':'sembilan',
  };
  return n.split('').map(c => d[c] ?? c).join(' ');
}

// ─── Main Component ───────────────────────────────────────
export default function PlayerPage() {
  const router   = useRouter();
  const clientId = (router.query.client as string) || 'PRAMITHA';
  const apiUrl   = (router.query.api    as string) || API_URL;

  const canvasRef    = useRef<HTMLDivElement>(null);
  const slideZoneRef = useRef<HTMLDivElement>(null);
  const slideIdxRef  = useRef(0);
  const slideTimer   = useRef<ReturnType<typeof setInterval> | null>(null);

  const [layout,       setLayout]       = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [themeColor,   setThemeColor]   = useState('#dc2626');
  const [clinicName,   setClinicName]   = useState('Klinik Pramitha');
  const [bgUrl,        setBgUrl]        = useState('');
  const [videoUrls,    setVideoUrls]    = useState<string[]>([]);
  const [runningText,  setRunningText]  = useState('Selamat datang...');
  const [scheduleRows, setScheduleRows] = useState<ScheduleRow[]>([]);
  const [slots,        setSlots]        = useState<QueueSlot[]>([]);
  const [flashSlot,    setFlashSlot]    = useState<number | null>(null);
  const [ttsInfo,      setTtsInfo]      = useState<{ num: string; loket: string } | null>(null);
  const [connStatus,   setConnStatus]   = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [clock,        setClock]        = useState({ time: '', date: '' });

  // ── Scale ──────────────────────────────────────────────
  const scaleCanvas = useCallback(() => {
    const el = canvasRef.current;
    if (!el) return;
    const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
    el.style.transform = `scale(${scale})`;
    el.style.left = `${(window.innerWidth  - CANVAS_W * scale) / 2}px`;
    el.style.top  = `${(window.innerHeight - CANVAS_H * scale) / 2}px`;
  }, []);

  useEffect(() => {
    scaleCanvas();
    window.addEventListener('resize', scaleCanvas);
    document.addEventListener('fullscreenchange', () => setTimeout(scaleCanvas, 80));
    return () => window.removeEventListener('resize', scaleCanvas);
  }, [scaleCanvas]);

  useEffect(() => { scaleCanvas(); }, [layout, scaleCanvas]);

  // ── Clock ──────────────────────────────────────────────
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock({
        time: now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: `${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── Video (sekarang slideshow gambar utama) ──────────────
  const playVideo = useCallback((urls: string[]) => {
    // Fungsi ini sekarang handle slideshow gambar di zona video
    // Implementasi di initMainSlideshow
  }, []);

  // ── Main slideshow (zona video) ───────────────────────────
  const mainSlideRef = useRef<HTMLDivElement>(null);
  const mainSlideIdx = useRef(0);
  const mainSlideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const initMainSlideshow = useCallback((urls: string[]) => {
    const zone = mainSlideRef.current;
    if (!zone) return;
    if (mainSlideTimer.current) clearInterval(mainSlideTimer.current);
    zone.innerHTML = '';
    if (!urls.length) return;
    mainSlideIdx.current = 0;
    urls.forEach((url, i) => {
      const img = document.createElement('img');
      img.src = apiUrl + url;
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${i===0?1:0};transition:opacity 1.2s ease-in-out;`;
      zone.appendChild(img);
    });
    if (urls.length > 1) {
      mainSlideTimer.current = setInterval(() => {
        const imgs = zone.querySelectorAll('img');
        (imgs[mainSlideIdx.current] as HTMLElement).style.opacity = '0';
        mainSlideIdx.current = (mainSlideIdx.current + 1) % imgs.length;
        (imgs[mainSlideIdx.current] as HTMLElement).style.opacity = '1';
      }, 5000);
    }
  }, [apiUrl]);

  // ── Slideshow ──────────────────────────────────────────
  const initSlideshow = useCallback((urls: string[]) => {
    const zone = slideZoneRef.current;
    if (!zone) return;
    if (slideTimer.current) clearInterval(slideTimer.current);
    zone.innerHTML = '';
    if (!urls.length) return;
    slideIdxRef.current = 0;
    urls.forEach((url, i) => {
      const img = document.createElement('img');
      img.src = apiUrl + url;
      img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${i === 0 ? 1 : 0};transition:opacity 1s ease-in-out;`;
      zone.appendChild(img);
    });
    if (urls.length > 1) {
      slideTimer.current = setInterval(() => {
        const imgs = zone.querySelectorAll('img');
        (imgs[slideIdxRef.current] as HTMLElement).style.opacity = '0';
        slideIdxRef.current = (slideIdxRef.current + 1) % imgs.length;
        (imgs[slideIdxRef.current] as HTMLElement).style.opacity = '1';
      }, 5000);
    }
  }, [apiUrl]);

  // ── Apply state ────────────────────────────────────────
  const applyState = useCallback((d: SignageData) => {
    const c = d.content;
    setLayout(c.layoutConfig   || DEFAULT_LAYOUT);
    setThemeColor(c.themeColor  || '#dc2626');
    setClinicName(c.clinicName  || 'Klinik Pramitha');
    setBgUrl(c.backgroundUrl    || '');
    setVideoUrls(c.videoUrls    || []); // videoUrls = gambar utama
    setRunningText(c.runningText || 'Selamat datang...');
    setScheduleRows(c.scheduleTable || []);
    setSlots(d.queueSlots       || []);
    initMainSlideshow(c.videoUrls || []); // gambar utama di zona video
    initSlideshow(c.slideUrls   || []); // gambar bawah di zona slide
    try { localStorage.setItem(`sc_${clientId}`, JSON.stringify(d)); } catch {}
  }, [initMainSlideshow, initSlideshow, clientId]);

  // ── Load config ────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/signage/${clientId}`);
      if (!res.ok) throw new Error(String(res.status));
      applyState(await res.json());
    } catch {
      try {
        const cached = localStorage.getItem(`sc_${clientId}`);
        if (cached) applyState(JSON.parse(cached));
      } catch {}
    }
  }, [apiUrl, clientId, applyState]);

  // ── WebSocket + init ───────────────────────────────────
  useEffect(() => {
    if (!router.isReady) return;
    loadConfig();
    const interval = setInterval(loadConfig, 5 * 60 * 1000);

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
    script.onload = () => {
      const io   = (window as any).io;
      const sock = io(apiUrl, { query: { clientId }, transports: ['websocket', 'polling'], reconnection: true });

      sock.on('connect',    () => setConnStatus('connected'));
      sock.on('disconnect', () => setConnStatus('offline'));

      sock.on(`queue:${clientId}`, (d: any) => {
        setSlots(prev => prev.map(s => s.slotNumber === d.slotNumber ? { ...s, ...d } : s));
        setFlashSlot(d.slotNumber);
        setTtsInfo({ num: d.currentNumber, loket: d.loketName });
        ttsSpeak(`Nomor antrian ${spellingNum(d.currentNumber)}, silakan menuju ke ${d.loketName}`);
        setTimeout(() => setFlashSlot(null), 4000);
        setTimeout(() => setTtsInfo(null),   5500);
        try {
          const c = JSON.parse(localStorage.getItem(`sc_${clientId}`) || '{}');
          if (c.queueSlots) {
            c.queueSlots = c.queueSlots.map((s: any) => s.slotNumber === d.slotNumber ? { ...s, ...d } : s);
            localStorage.setItem(`sc_${clientId}`, JSON.stringify(c));
          }
        } catch {}
      });

      sock.on(`refresh:${clientId}`, (d: SignageData) => applyState(d));
    };
    document.head.appendChild(script);

    return () => clearInterval(interval);
  }, [router.isReady, clientId, apiUrl, loadConfig, applyState]);

  // ── Derived colors ─────────────────────────────────────
  const dark = darken(themeColor);
  const slotKeys: (keyof LayoutZones)[] = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5'];

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>{`Signage Player — ${clientId}`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden',
        background: `radial-gradient(ellipse at 20% 50%, ${h2r(dark, 0.8)} 0%, #000 100%)` }}>

        {/* ── CANVAS ── */}
        <div ref={canvasRef} style={{
          position: 'absolute', width: CANVAS_W, height: CANVAS_H,
          transformOrigin: '0 0', overflow: 'hidden',
        }}>

          {/* Background */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0,
            background: bgUrl ? undefined
              : `linear-gradient(160deg, ${dark} 0%, ${themeColor} 35%, #e8e8e8 65%, #fff 100%)`,
          }}>
            {bgUrl && (
              <img src={`${apiUrl}${bgUrl}`} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.03,
              backgroundImage: `radial-gradient(circle, ${themeColor} 1px, transparent 1px)`,
              backgroundSize: '40px 40px' }} />
          </div>

          {/* Decorative stripe */}
          <div style={{ position: 'absolute', left: 618, top: 0, width: 12, height: 1080, zIndex: 5,
            opacity: 0.18,
            background: `repeating-linear-gradient(180deg,${themeColor} 0,${themeColor} 18px,#fff 18px,#fff 36px)` }} />

          {/* Queue Slots */}
          {slotKeys.map((key, i) => {
            const z = layout[key] as ZoneRect;
            if (!z?.visible) return null;
            const slot = slots.find(s => s.slotNumber === i + 1) || {
              slotNumber: i + 1, loketName: `Loket ${i + 1}`, currentNumber: '000',
            };
            const flash = flashSlot === slot.slotNumber;
            return (
              <div key={key} style={{
                ...zs(z), zIndex: 10, borderRadius: 18,
                border: `3px solid ${flash ? '#fff' : h2r(themeColor, 0.4)}`,
                background: flash
                  ? 'linear-gradient(135deg,#fff,#ffe0e0)'
                  : `linear-gradient(135deg,${h2r(themeColor, 0.9)},${h2r(dark, 0.85)})`,
                display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20,
                boxShadow: flash
                  ? `0 0 80px ${h2r(themeColor, 0.9)},0 0 30px ${h2r(themeColor, 0.5)}`
                  : '4px 4px 24px rgba(0,0,0,0.4)',
                transition: 'all 0.15s ease', backdropFilter: 'blur(8px)',
              }}>
                {/* left accent bar */}
                <div style={{ position: 'absolute', left: 0, top: '12%', height: '76%', width: 6, borderRadius: 3,
                  background: flash
                    ? `linear-gradient(to bottom,${themeColor},#fff,${themeColor})`
                    : 'linear-gradient(to bottom,rgba(255,255,255,.6),rgba(255,255,255,.1),rgba(255,255,255,.6))' }} />
                {/* label */}
                <div style={{ flex: 1, lineHeight: 1.3 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                    color: flash ? h2r(themeColor, 0.7) : 'rgba(255,220,220,.85)', marginBottom: 4 }}>
                    {slot.loketName}
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800,
                    color: flash ? themeColor : '#fff',
                    textShadow: flash ? 'none' : '0 2px 8px rgba(0,0,0,.4)' }}>
                    Nomor Antrian
                  </div>
                </div>
                {/* number */}
                <div style={{ fontSize: 88, fontWeight: 900, fontFamily: 'Courier New,monospace',
                  letterSpacing: 4, minWidth: 200, textAlign: 'center', lineHeight: 1,
                  color: flash ? themeColor : '#fff',
                  textShadow: flash
                    ? `0 0 20px ${h2r(themeColor, 0.4)}`
                    : `0 0 30px ${h2r(themeColor, 0.6)},0 4px 12px rgba(0,0,0,.5)` }}>
                  {slot.currentNumber || '000'}
                </div>
              </div>
            );
          })}

          {/* Zona Gambar Utama (sebelumnya video) */}
          {layout.video?.visible && (
            <div style={{ ...zs(layout.video), zIndex:10, borderRadius:16, background:'#000',
              border:`3px solid ${h2r(themeColor,0.3)}`,
              boxShadow:'0 8px 40px rgba(0,0,0,.5)' }}>
              {/* Slideshow gambar utama */}
              <div ref={mainSlideRef} style={{ position:'absolute', inset:0, borderRadius:14, overflow:'hidden' }}>
                {videoUrls.length === 0 && (
                  <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'center',
                    background:`radial-gradient(circle,${h2r(dark,0.8)} 0%,#000 100%)` }}>
                    <div style={{ width:80, height:80, borderRadius:'50%',
                      border:`2px solid ${h2r(themeColor,0.4)}`,
                      background:h2r(themeColor,0.15),
                      display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="white" opacity={0.5}>
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.1 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                    <span style={{ color:h2r('#fff',0.3), fontSize:22 }}>Menunggu gambar...</span>
                  </div>
                )}
              </div>
              {/* Clinic name overlay */}
              <div style={{ position:'absolute', top:0, left:0, zIndex:5,
                background:`linear-gradient(90deg,${h2r(dark,0.9)},transparent)`,
                padding:'10px 36px 10px 20px', borderRadius:'13px 0 0 0',
                fontSize:22, fontWeight:800, color:'#fff', letterSpacing:1,
                textTransform:'uppercase', textShadow:'0 2px 6px rgba(0,0,0,.4)' }}>
                {clinicName}
              </div>
            </div>
          )}

          {/* Slideshow */}
          {layout.slide?.visible && (
            <div ref={slideZoneRef} style={{ ...zs(layout.slide), zIndex: 10, borderRadius: 14,
              border: `3px solid ${h2r(themeColor, 0.35)}`,
              boxShadow: '0 4px 20px rgba(0,0,0,.4)',
              background: `linear-gradient(135deg,${h2r(dark, 0.6)},#000)` }} />
          )}

          {/* Schedule Table */}
          {layout.table?.visible && (
            <div style={{ ...zs(layout.table), zIndex: 10, borderRadius: 14,
              background: h2r(dark, 0.93),
              border: `3px solid ${h2r('#ffffff', 0.12)}`,
              boxShadow: '0 4px 20px rgba(0,0,0,.4)',
              backdropFilter: 'blur(8px)', padding: '10px 14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '155px 1fr 145px', gap: 6,
                padding: '6px 8px', background: 'rgba(0,0,0,.3)', borderRadius: 7, marginBottom: 5,
                fontSize: 17, fontWeight: 800, color: 'rgba(255,210,210,.95)',
                textTransform: 'uppercase', letterSpacing: '.5px' }}>
                <span>Poli</span><span>Dokter</span>
                <span style={{ textAlign: 'right' }}>Jam</span>
              </div>
              {scheduleRows.slice(0, 4).map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '155px 1fr 145px', gap: 6,
                  padding: '5px 8px', borderBottom: '1px solid rgba(255,255,255,.07)',
                  fontSize: 16, color: 'rgba(255,235,235,.9)' }}>
                  <span style={{ color: '#fca5a5', fontWeight: 700,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.poli}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.dokter}</span>
                  <span style={{ color: '#fde68a', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{row.jam}</span>
                </div>
              ))}
              {scheduleRows.length === 0 && (
                <div style={{ textAlign: 'center', color: 'rgba(255,200,200,.3)', fontSize: 14, paddingTop: 8 }}>
                  Tidak ada jadwal
                </div>
              )}
            </div>
          )}

          {/* Running Text */}
          {layout.rtext?.visible && (
            <div style={{ ...zs(layout.rtext), zIndex: 20, borderRadius: '0 10px 10px 0',
              background: `linear-gradient(90deg,${dark} 0%,${themeColor} 15%,${h2r(themeColor, 0.9)} 100%)`,
              display: 'flex', alignItems: 'center',
              borderTop: `2px solid ${h2r('#ffffff', 0.2)}`,
              borderRight: `2px solid ${h2r('#ffffff', 0.1)}`,
              boxShadow: `4px 0 24px ${h2r(dark, 0.6)}` }}>
              <div style={{ flexShrink: 0, background: 'rgba(0,0,0,.4)', height: '100%',
                display: 'flex', alignItems: 'center', padding: '0 24px',
                fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: 2,
                textTransform: 'uppercase', whiteSpace: 'nowrap',
                borderRight: `2px solid ${h2r('#ffffff', 0.15)}` }}>
                INFO
              </div>
              <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
                <div key={runningText} style={{
                  position: 'absolute', whiteSpace: 'nowrap', fontSize: 28, fontWeight: 700,
                  color: '#fff', top: '50%', transform: 'translateY(-50%)',
                  letterSpacing: '.5px', textShadow: '0 2px 8px rgba(0,0,0,.3)',
                  animation: `rtScroll ${Math.max(18, runningText.length * 0.28)}s linear infinite`,
                }}>
                  {runningText}
                </div>
              </div>
            </div>
          )}

          {/* DateTime */}
          {layout.datetime?.visible && (
            <div style={{ ...zs(layout.datetime), zIndex: 20, borderRadius: '10px 10px 0 0',
              background: `linear-gradient(135deg,${dark},${themeColor})`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: `2px solid ${h2r('#ffffff', 0.2)}`, borderBottom: 'none', gap: 3,
              boxShadow: `0 -6px 24px ${h2r(dark, 0.5)}` }}>
              <div style={{ fontSize: 34, fontWeight: 900, color: '#fff',
                fontFamily: 'Courier New,monospace', letterSpacing: 3,
                textShadow: `0 0 20px ${h2r(themeColor, 0.4)}` }}>
                {clock.time}
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,215,215,.9)', fontWeight: 600, letterSpacing: '.3px' }}>
                {clock.date}
              </div>
            </div>
          )}

          {/* ── Extra / Custom Zones ── */}
          {(layout.extras || []).filter(ez => ez.visible).map(ez => (
            <ExtraZone key={ez.id} ez={ez} apiUrl={apiUrl} scheduleRows={scheduleRows} clock={clock} themeColor={themeColor} dark={dark} />
          ))}

        </div>{/* /canvas */}

        {/* TTS Banner */}
        <div style={{
          position: 'fixed', bottom: 120, left: '50%',
          transform: `translateX(-50%) translateY(${ttsInfo ? 0 : 130}px)`,
          opacity: ttsInfo ? 1 : 0,
          transition: 'transform .5s cubic-bezier(.175,.885,.32,1.275),opacity .5s',
          background: `linear-gradient(135deg,${dark},${themeColor})`,
          border: '3px solid #fff', borderRadius: 22, padding: '24px 60px',
          textAlign: 'center', zIndex: 999, pointerEvents: 'none',
          boxShadow: `0 0 60px ${h2r(themeColor, 0.6)},0 24px 60px rgba(0,0,0,.5)`,
        }}>
          <div style={{ fontSize: 17, color: 'rgba(255,210,210,.85)',
            textTransform: 'uppercase', letterSpacing: 3, marginBottom: 8 }}>
            Nomor Antrian Dipanggil
          </div>
          <div style={{ fontSize: 80, fontWeight: 900, color: '#fff',
            fontFamily: 'Courier New,monospace', letterSpacing: 6, lineHeight: 1,
            textShadow: `0 0 30px ${h2r(themeColor, 0.5)}` }}>
            {ttsInfo?.num}
          </div>
          <div style={{ width: 60, height: 3, background: 'rgba(255,255,255,.4)', margin: '10px auto', borderRadius: 2 }} />
          <div style={{ fontSize: 30, color: 'rgba(255,215,215,.9)', fontWeight: 700 }}>
            {ttsInfo?.loket}
          </div>
        </div>

        {/* Connection pill */}
        <div style={{
          position: 'fixed', top: 14, right: 14, zIndex: 999,
          padding: '5px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600,
          transition: 'opacity .3s',
          opacity:    connStatus === 'connected' ? 0.5 : 1,
          background: connStatus === 'connected'   ? h2r(themeColor, 0.2)
                    : connStatus === 'offline'      ? 'rgba(0,0,0,.6)'
                    : 'rgba(234,179,8,.2)',
          border: `1px solid ${connStatus === 'connected' ? themeColor : connStatus === 'offline' ? '#666' : '#eab308'}`,
          color:  connStatus === 'connected' ? '#fca5a5' : connStatus === 'offline' ? '#aaa' : '#fde047',
        }}>
          ⬤ {connStatus === 'connected' ? 'Live' : connStatus === 'offline' ? 'Offline' : 'Connecting...'}
        </div>

        {/* Fullscreen button */}
        <FsBtn color={themeColor} />

      </div>

      <style>{`
        @keyframes rtScroll { 0%{left:100%} 100%{left:-100%} }
        *,*::before,*::after { margin:0; padding:0; box-sizing:border-box; }
        html,body { overflow:hidden; background:#000; width:100%; height:100%; }
      `}</style>
    </>
  );
}

// ─── Extra Zone Renderer ─────────────────────────────────
interface EZProps {
  ez:           CustomZone;
  apiUrl:       string;
  scheduleRows: ScheduleRow[];
  clock:        { time: string; date: string };
  themeColor:   string;
  dark:         string;
}

function ExtraZone({ ez, apiUrl, scheduleRows, clock, themeColor, dark }: EZProps) {
  const base: React.CSSProperties = {
    position: 'absolute', left: ez.x, top: ez.y, width: ez.w, height: ez.h,
    overflow: 'hidden', opacity: ez.opacity ?? 1, zIndex: 18,
  };

  if (ez.type === 'colorbox') {
    return <div style={{ ...base, background: ez.color || '#1e3a5f', borderRadius: 10 }} />;
  }

  if (ez.type === 'text') {
    return (
      <div style={{ ...base, background: ez.color || 'rgba(5,15,50,.85)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: ez.fontSize || 28, fontWeight: 700, color: '#fff',
          textShadow: '0 2px 6px rgba(0,0,0,.5)', lineHeight: 1.3 }}>
          {ez.text}
        </div>
      </div>
    );
  }

  if (ez.type === 'rtext2') {
    const dur = Math.max(14, (ez.text || '').length * 0.25);
    return (
      <div style={{ ...base, background: ez.color || h2r(dark, 0.9),
        borderRadius: '0 8px 8px 0', display: 'flex', alignItems: 'center',
        borderTop: `2px solid ${h2r('#fff', 0.15)}` }}>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
          <div key={ez.text} style={{
            position: 'absolute', whiteSpace: 'nowrap', fontSize: 24, fontWeight: 700,
            color: '#fff', top: '50%', transform: 'translateY(-50%)',
            animation: `rtScroll ${dur}s linear infinite`,
          }}>
            {ez.text || ''}
          </div>
        </div>
      </div>
    );
  }

  if (ez.type === 'image') {
    if (!ez.imageUrl) return <div style={{ ...base, background: '#111', borderRadius: 10 }} />;
    return (
      <div style={{ ...base, borderRadius: 10 }}>
        <img src={`${apiUrl}${ez.imageUrl}`} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }

  if (ez.type === 'clock') {
    return (
      <div style={{ ...base, background: ez.color || h2r(dark, 0.9),
        borderRadius: 12, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 4,
        border: `2px solid ${h2r('#fff', 0.15)}` }}>
        <div style={{ fontSize: Math.round(ez.h * 0.38), fontWeight: 900, color: '#fff',
          fontFamily: 'Courier New,monospace', letterSpacing: 3 }}>{clock.time}</div>
        <div style={{ fontSize: Math.round(ez.h * 0.14), color: 'rgba(255,215,215,.85)', fontWeight: 600 }}>{clock.date}</div>
      </div>
    );
  }

  if (ez.type === 'table2') {
    return (
      <div style={{ ...base, background: ez.color || h2r(dark, 0.93),
        borderRadius: 12, padding: '10px 14px',
        border: `2px solid ${h2r('#fff', 0.1)}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 6,
          padding: '5px 8px', background: 'rgba(0,0,0,.3)', borderRadius: 7, marginBottom: 5,
          fontSize: 15, fontWeight: 800, color: 'rgba(255,210,210,.95)',
          textTransform: 'uppercase', letterSpacing: '.5px' }}>
          <span>Poli</span><span>Dokter</span><span style={{ textAlign: 'right' }}>Jam</span>
        </div>
        {scheduleRows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 6,
            padding: '4px 8px', borderBottom: '1px solid rgba(255,255,255,.07)',
            fontSize: 14, color: 'rgba(255,235,235,.9)' }}>
            <span style={{ color: '#fca5a5', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.poli}</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.dokter}</span>
            <span style={{ color: '#fde68a', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{row.jam}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// ─── Fullscreen Button ────────────────────────────────────
function FsBtn({ color }: { color: string }) {
  const [visible, setVisible] = useState(true);
  const [isFs,    setIsFs]    = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 4000);
  };

  useEffect(() => {
    show();
    window.addEventListener('mousemove', show);
    document.addEventListener('fullscreenchange', () => {
      setIsFs(!!document.fullscreenElement);
      setTimeout(() => {
        const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
        // trigger resize event so scaleCanvas runs
        window.dispatchEvent(new Event('resize'));
      }, 100);
    });
    return () => window.removeEventListener('mousemove', show);
  }, []);

  const toggle = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  const bg = (() => {
    if (!color || color.length < 7) return 'rgba(139,0,0,.85)';
    const r = parseInt(color.slice(1,3),16);
    const g = parseInt(color.slice(3,5),16);
    const b = parseInt(color.slice(5,7),16);
    return `rgba(${r},${g},${b},.85)`;
  })();

  return (
    <button onClick={toggle} style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 999,
      background: bg, border: '2px solid rgba(255,255,255,.4)',
      color: '#fff', borderRadius: 12, padding: '10px 20px',
      fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '.5px',
      backdropFilter: 'blur(8px)',
      opacity:        visible ? 1 : 0,
      pointerEvents:  visible ? 'auto' : 'none',
      transition:     'opacity .4s',
    }}>
      {isFs ? '✕ Keluar Fullscreen' : '⛶ Fullscreen'}
    </button>
  );
}
