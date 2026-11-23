import { useEffect, useRef, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  DEFAULT_LAYOUT, LayoutConfig, LayoutZones,
  ZoneRect, ScheduleRow, CustomZone
} from '../lib/types';

const CANVAS_W = 1920;
const CANVAS_H = 1080;
const DEFAULT_API = process.env.NEXT_PUBLIC_API_URL
  || 'https://signagepramitha-production.up.railway.app';

// ─── Types ────────────────────────────────────────────────
interface QSlot { slotNumber: number; loketName: string; currentNumber: string; }
interface SData {
  content: {
    videoUrls: string[]; slideUrls: string[]; runningText: string;
    scheduleTable: ScheduleRow[]; backgroundUrl: string;
    layoutConfig: LayoutConfig; clinicName: string; themeColor: string;
  };
  queueSlots: QSlot[];
}

// ─── Utils ────────────────────────────────────────────────
const DAYS = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli',
  'Agustus','September','Oktober','November','Desember'];

function h2r(hex: string, a: number) {
  try {
    if (!hex || hex.length < 7) return `rgba(220,38,38,${a})`;
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  } catch { return `rgba(220,38,38,${a})`; }
}

function dk(hex: string) {
  try {
    if (!hex || hex.length < 7) return '#7f0000';
    const r = Math.max(0, parseInt(hex.slice(1,3),16) - 60);
    const g = Math.max(0, parseInt(hex.slice(3,5),16) - 10);
    const b = Math.max(0, parseInt(hex.slice(5,7),16) - 10);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  } catch { return '#7f0000'; }
}

function zs(z: ZoneRect): React.CSSProperties {
  return { position:'absolute', left:z.x, top:z.y, width:z.w, height:z.h, overflow:'hidden' };
}

function buildSlides(el: HTMLDivElement, urls: string[], base: string) {
  el.innerHTML = '';
  if (!urls.length) return null;
  urls.forEach((u,i) => {
    const img = document.createElement('img');
    img.src = base + u;
    img.style.cssText = `position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:${i===0?1:0};transition:opacity 1.2s ease-in-out;`;
    el.appendChild(img);
  });
  if (urls.length <= 1) return null;
  let idx = 0;
  return setInterval(() => {
    const imgs = el.querySelectorAll('img');
    (imgs[idx] as HTMLElement).style.opacity = '0';
    idx = (idx + 1) % imgs.length;
    (imgs[idx] as HTMLElement).style.opacity = '1';
  }, 5000);
}

// ─── TTS ──────────────────────────────────────────────────
let _tq: string[] = [], _tb = false;
function tts(t: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  _tq.push(t); if (!_tb) _tn();
}
function _tn() {
  if (!_tq.length) { _tb = false; return; }
  _tb = true;
  const u = new SpeechSynthesisUtterance(_tq.shift()!);
  u.lang='id-ID'; u.rate=0.88; u.pitch=1.1; u.volume=1;
  const vs = window.speechSynthesis.getVoices();
  const v = vs.find(x => x.lang.startsWith('id')) || vs[0];
  if (v) u.voice = v;
  u.onend = u.onerror = _tn;
  window.speechSynthesis.speak(u);
}
function sp(n: string) {
  const d: Record<string,string> = {
    '0':'nol','1':'satu','2':'dua','3':'tiga','4':'empat',
    '5':'lima','6':'enam','7':'tujuh','8':'delapan','9':'sembilan'
  };
  return n.split('').map(c => d[c] ?? c).join(' ');
}

// ─── Shell component ─────────────────────────────────────
// Wrapper yang menunggu router ready sebelum render Player
export default function PlayerPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (router.isReady) setReady(true);
  }, [router.isReady]);

  if (!ready) {
    return (
      <div style={{ position:'fixed', inset:0, background:'#000', display:'flex',
        alignItems:'center', justifyContent:'center' }}>
        <div style={{ color:'rgba(255,255,255,.4)', fontSize:18 }}>Memuat player...</div>
      </div>
    );
  }

  const clientId = (router.query.client as string) || 'PRAMITHA';
  const apiUrl   = (router.query.api    as string) || DEFAULT_API;

  return <Player clientId={clientId} apiUrl={apiUrl} />;
}

// ─── Main Player ──────────────────────────────────────────
function Player({ clientId, apiUrl }: { clientId: string; apiUrl: string }) {
  const canvasRef    = useRef<HTMLDivElement>(null);
  const mainRef      = useRef<HTMLDivElement>(null);
  const slideRef     = useRef<HTMLDivElement>(null);
  const mainTimer    = useRef<ReturnType<typeof setInterval>|null>(null);
  const slideTimer   = useRef<ReturnType<typeof setInterval>|null>(null);

  const [layout,   setLayout]   = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [theme,    setTheme]    = useState('#dc2626');
  const [clinic,   setClinic]   = useState('Klinik Pramitha');
  const [bg,       setBg]       = useState('');
  const [imgs,     setImgs]     = useState<string[]>([]);
  const [rtxt,     setRtxt]     = useState('Selamat datang...');
  const [sched,    setSched]    = useState<ScheduleRow[]>([]);
  const [slots,    setSlots]    = useState<QSlot[]>([]);
  const [flash,    setFlash]    = useState<number|null>(null);
  const [ttsInfo,  setTtsInfo]  = useState<{num:string;loket:string}|null>(null);
  const [conn,     setConn]     = useState<'connecting'|'connected'|'offline'>('connecting');
  const [clock,    setClock]    = useState({ time:'', date:'' });

  // Scale
  const doScale = useCallback(() => {
    const el = canvasRef.current; if (!el) return;
    const s = Math.min(window.innerWidth/CANVAS_W, window.innerHeight/CANVAS_H);
    el.style.transform = `scale(${s})`;
    el.style.left = `${(window.innerWidth  - CANVAS_W*s)/2}px`;
    el.style.top  = `${(window.innerHeight - CANVAS_H*s)/2}px`;
  }, []);

  useEffect(() => {
    doScale();
    window.addEventListener('resize', doScale);
    document.addEventListener('fullscreenchange', () => setTimeout(doScale, 100));
    return () => window.removeEventListener('resize', doScale);
  }, [doScale]);

  useEffect(() => { doScale(); }, [layout, doScale]);

  // Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock({
        time: n.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
        date: `${DAYS[n.getDay()]}, ${n.getDate()} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`,
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // Apply
  const apply = useCallback((d: SData) => {
    const c = d.content;
    setLayout(c.layoutConfig  || DEFAULT_LAYOUT);
    setTheme(c.themeColor     || '#dc2626');
    setClinic(c.clinicName    || 'Klinik Pramitha');
    setBg(c.backgroundUrl     || '');
    setImgs(c.videoUrls       || []);
    setRtxt(c.runningText     || 'Selamat datang...');
    setSched(c.scheduleTable  || []);
    setSlots(d.queueSlots     || []);

    if (mainRef.current) {
      if (mainTimer.current) clearInterval(mainTimer.current);
      mainTimer.current = buildSlides(mainRef.current, c.videoUrls || [], apiUrl);
    }
    if (slideRef.current) {
      if (slideTimer.current) clearInterval(slideTimer.current);
      slideTimer.current = buildSlides(slideRef.current, c.slideUrls || [], apiUrl);
    }

    try { localStorage.setItem(`sc_${clientId}`, JSON.stringify(d)); } catch {}
  }, [apiUrl, clientId]);

  // Load
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${apiUrl}/api/signage/${clientId}`);
      if (!r.ok) throw new Error();
      apply(await r.json());
    } catch {
      try {
        const c = localStorage.getItem(`sc_${clientId}`);
        if (c) apply(JSON.parse(c));
      } catch {}
    }
  }, [apiUrl, clientId, apply]);

  // Init
  useEffect(() => {
    load();
    const iv = setInterval(load, 5*60*1000);

    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
    }

    const sc = document.createElement('script');
    sc.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
    sc.onload = () => {
      const sock = (window as any).io(apiUrl, {
        query: { clientId },
        transports: ['websocket','polling'],
        reconnection: true,
      });
      sock.on('connect',    () => setConn('connected'));
      sock.on('disconnect', () => setConn('offline'));
      sock.on(`queue:${clientId}`, (d: any) => {
        setSlots(p => p.map(s => s.slotNumber===d.slotNumber ? {...s,...d} : s));
        setFlash(d.slotNumber);
        setTtsInfo({ num: d.currentNumber, loket: d.loketName });
        tts(`Nomor antrian ${sp(d.currentNumber)}, silakan menuju ke ${d.loketName}`);
        setTimeout(() => setFlash(null),   4000);
        setTimeout(() => setTtsInfo(null), 5500);
      });
      sock.on(`refresh:${clientId}`, apply);
    };
    document.head.appendChild(sc);

    return () => clearInterval(iv);
  }, [load, apply, apiUrl, clientId]);

  const dark = dk(theme);
  const slotKeys: (keyof LayoutZones)[] = ['slot1','slot2','slot3','slot4','slot5'];

  return (
    <>
      <Head>
        <title>{`Player — ${clientId}`}</title>
      </Head>

      <div style={{ position:'fixed',inset:0,overflow:'hidden',
        background:`radial-gradient(ellipse at 20% 50%,${h2r(dark,.8)} 0%,#000 100%)` }}>

        {/* Canvas */}
        <div ref={canvasRef} style={{ position:'absolute', width:CANVAS_W, height:CANVAS_H,
          transformOrigin:'0 0', overflow:'hidden' }}>

          {/* BG */}
          <div style={{ position:'absolute',inset:0,zIndex:0,
            background: bg ? undefined : `linear-gradient(160deg,${dark} 0%,${theme} 35%,#eee 65%,#fff 100%)` }}>
            {bg && <img src={`${apiUrl}${bg}`} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }} />}
          </div>

          {/* Stripe */}
          <div style={{ position:'absolute',left:618,top:0,width:12,height:1080,zIndex:5,opacity:.18,
            background:`repeating-linear-gradient(180deg,${theme} 0,${theme} 18px,#fff 18px,#fff 36px)` }} />

          {/* Queue Slots */}
          {slotKeys.map((key,i) => {
            const z = layout[key] as ZoneRect;
            if (!z?.visible) return null;
            const slot = slots.find(s=>s.slotNumber===i+1) || { slotNumber:i+1, loketName:`Loket ${i+1}`, currentNumber:'000' };
            const fl = flash===slot.slotNumber;
            return (
              <div key={key} style={{ ...zs(z), zIndex:10, borderRadius:18,
                border:`3px solid ${fl?'#fff':h2r(theme,.4)}`,
                background: fl ? 'linear-gradient(135deg,#fff,#ffe0e0)' : `linear-gradient(135deg,${h2r(theme,.9)},${h2r(dark,.85)})`,
                display:'flex', alignItems:'center', padding:'0 28px', gap:20,
                boxShadow: fl ? `0 0 80px ${h2r(theme,.9)}` : '4px 4px 24px rgba(0,0,0,.4)',
                backdropFilter:'blur(8px)', transition:'all .15s' }}>
                <div style={{ position:'absolute',left:0,top:'12%',height:'76%',width:6,borderRadius:3,
                  background: fl ? `linear-gradient(to bottom,${theme},#fff,${theme})` : 'linear-gradient(to bottom,rgba(255,255,255,.6),rgba(255,255,255,.1),rgba(255,255,255,.6))' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:20,fontWeight:700,letterSpacing:'1.5px',textTransform:'uppercase',
                    color:fl?h2r(theme,.7):'rgba(255,220,220,.85)',marginBottom:4 }}>{slot.loketName}</div>
                  <div style={{ fontSize:28,fontWeight:800,color:fl?theme:'#fff' }}>Nomor Antrian</div>
                </div>
                <div style={{ fontSize:88,fontWeight:900,fontFamily:'Courier New,monospace',
                  letterSpacing:4,minWidth:200,textAlign:'center',lineHeight:1,
                  color:fl?theme:'#fff',textShadow:`0 0 30px ${h2r(theme,.6)}` }}>
                  {slot.currentNumber||'000'}
                </div>
              </div>
            );
          })}

          {/* Gambar Utama */}
          {(layout.video as ZoneRect)?.visible && (
            <div style={{ ...zs(layout.video as ZoneRect), zIndex:10, borderRadius:16, background:'#000',
              border:`3px solid ${h2r(theme,.3)}`, boxShadow:'0 8px 40px rgba(0,0,0,.5)' }}>
              <div ref={mainRef} style={{ position:'absolute',inset:0,borderRadius:14,overflow:'hidden' }}>
                {imgs.length===0 && (
                  <div style={{ width:'100%',height:'100%',display:'flex',flexDirection:'column',
                    alignItems:'center',justifyContent:'center',
                    background:`radial-gradient(circle,${h2r(dark,.8)} 0%,#000 100%)` }}>
                    <div style={{ color:'rgba(255,255,255,.25)',fontSize:20 }}>Menunggu gambar...</div>
                  </div>
                )}
              </div>
              <div style={{ position:'absolute',top:0,left:0,zIndex:5,
                background:`linear-gradient(90deg,${h2r(dark,.9)},transparent)`,
                padding:'10px 36px 10px 20px',borderRadius:'13px 0 0 0',
                fontSize:22,fontWeight:800,color:'#fff',letterSpacing:1,textTransform:'uppercase' }}>
                {clinic}
              </div>
            </div>
          )}

          {/* Slide bawah */}
          {(layout.slide as ZoneRect)?.visible && (
            <div ref={slideRef} style={{ ...zs(layout.slide as ZoneRect), zIndex:10, borderRadius:14,
              border:`3px solid ${h2r(theme,.35)}`, background:`linear-gradient(135deg,${h2r(dark,.6)},#000)` }} />
          )}

          {/* Tabel */}
          {(layout.table as ZoneRect)?.visible && (
            <div style={{ ...zs(layout.table as ZoneRect), zIndex:10, borderRadius:14,
              background:h2r(dark,.93), border:`3px solid ${h2r('#fff',.12)}`,
              backdropFilter:'blur(8px)', padding:'10px 14px' }}>
              <div style={{ display:'grid',gridTemplateColumns:'155px 1fr 145px',gap:6,
                padding:'6px 8px',background:'rgba(0,0,0,.3)',borderRadius:7,marginBottom:5,
                fontSize:17,fontWeight:800,color:'rgba(255,210,210,.95)',textTransform:'uppercase' }}>
                <span>Poli</span><span>Dokter</span><span style={{textAlign:'right'}}>Jam</span>
              </div>
              {sched.length===0
                ? <div style={{textAlign:'center',color:'rgba(255,200,200,.3)',fontSize:14,paddingTop:8}}>Tidak ada jadwal</div>
                : sched.slice(0,4).map((r,i) => (
                  <div key={i} style={{ display:'grid',gridTemplateColumns:'155px 1fr 145px',gap:6,
                    padding:'5px 8px',borderBottom:'1px solid rgba(255,255,255,.07)',
                    fontSize:16,color:'rgba(255,235,235,.9)' }}>
                    <span style={{color:'#fca5a5',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.poli}</span>
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.dokter}</span>
                    <span style={{color:'#fde68a',fontWeight:600,textAlign:'right',whiteSpace:'nowrap'}}>{r.jam}</span>
                  </div>
                ))
              }
            </div>
          )}

          {/* Running text */}
          {(layout.rtext as ZoneRect)?.visible && (
            <div style={{ ...zs(layout.rtext as ZoneRect), zIndex:20, borderRadius:'0 10px 10px 0',
              background:`linear-gradient(90deg,${dark},${theme})`,
              display:'flex',alignItems:'center',overflow:'hidden' }}>
              <div style={{ flexShrink:0,background:'rgba(0,0,0,.4)',height:'100%',
                display:'flex',alignItems:'center',padding:'0 24px',
                fontSize:22,fontWeight:900,color:'#fff',letterSpacing:2,textTransform:'uppercase',
                whiteSpace:'nowrap' }}>INFO</div>
              <div style={{ flex:1,overflow:'hidden',position:'relative',height:'100%' }}>
                <div key={rtxt} style={{ position:'absolute',whiteSpace:'nowrap',fontSize:28,fontWeight:700,
                  color:'#fff',top:'50%',transform:'translateY(-50%)',
                  animation:`rtScroll ${Math.max(18,rtxt.length*.28)}s linear infinite` }}>
                  {rtxt}
                </div>
              </div>
            </div>
          )}

          {/* DateTime */}
          {(layout.datetime as ZoneRect)?.visible && (
            <div style={{ ...zs(layout.datetime as ZoneRect), zIndex:20, borderRadius:'10px 10px 0 0',
              background:`linear-gradient(135deg,${dark},${theme})`,
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              border:`2px solid ${h2r('#fff',.2)}`,borderBottom:'none',gap:3 }}>
              <div style={{ fontSize:34,fontWeight:900,color:'#fff',fontFamily:'Courier New,monospace',letterSpacing:3 }}>
                {clock.time}
              </div>
              <div style={{ fontSize:14,color:'rgba(255,215,215,.9)',fontWeight:600 }}>{clock.date}</div>
            </div>
          )}

          {/* Extra zones */}
          {(layout.extras||[]).filter(e=>e.visible).map(ez => (
            <EZone key={ez.id} ez={ez} apiUrl={apiUrl} sched={sched} clock={clock} theme={theme} dark={dark} />
          ))}

        </div>{/* /canvas */}

        {/* TTS Banner */}
        <div style={{ position:'fixed',bottom:120,left:'50%',zIndex:999,pointerEvents:'none',
          transform:`translateX(-50%) translateY(${ttsInfo?0:130}px)`,
          opacity:ttsInfo?1:0, transition:'transform .5s cubic-bezier(.175,.885,.32,1.275),opacity .5s',
          background:`linear-gradient(135deg,${dark},${theme})`,
          border:'3px solid #fff',borderRadius:22,padding:'24px 60px',textAlign:'center',
          boxShadow:`0 0 60px ${h2r(theme,.6)}` }}>
          <div style={{fontSize:17,color:'rgba(255,210,210,.85)',textTransform:'uppercase',letterSpacing:3,marginBottom:8}}>
            Nomor Antrian Dipanggil
          </div>
          <div style={{fontSize:80,fontWeight:900,color:'#fff',fontFamily:'Courier New,monospace',letterSpacing:6,lineHeight:1}}>
            {ttsInfo?.num}
          </div>
          <div style={{width:60,height:3,background:'rgba(255,255,255,.4)',margin:'10px auto',borderRadius:2}} />
          <div style={{fontSize:30,color:'rgba(255,215,215,.9)',fontWeight:700}}>{ttsInfo?.loket}</div>
        </div>

        {/* Status */}
        <div style={{ position:'fixed',top:14,right:14,zIndex:999,
          padding:'5px 14px',borderRadius:20,fontSize:13,fontWeight:600,
          opacity:conn==='connected'?.5:1,
          background:conn==='connected'?h2r(theme,.2):conn==='offline'?'rgba(0,0,0,.6)':'rgba(234,179,8,.2)',
          border:`1px solid ${conn==='connected'?theme:conn==='offline'?'#666':'#eab308'}`,
          color:conn==='connected'?'#fca5a5':conn==='offline'?'#aaa':'#fde047' }}>
          ⬤ {conn==='connected'?'Live':conn==='offline'?'Offline':'Connecting...'}
        </div>

        <FSBtn theme={theme} />
      </div>

      <style>{`
        @keyframes rtScroll{0%{left:100%}100%{left:-100%}}
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html,body{overflow:hidden;background:#000;width:100%;height:100%;}
      `}</style>
    </>
  );
}

// ─── Extra Zone ───────────────────────────────────────────
function EZone({ ez, apiUrl, sched, clock, theme, dark }: {
  ez:CustomZone; apiUrl:string; sched:ScheduleRow[];
  clock:{time:string;date:string}; theme:string; dark:string;
}) {
  const b: React.CSSProperties = {
    position:'absolute',left:ez.x,top:ez.y,width:ez.w,height:ez.h,
    overflow:'hidden',opacity:ez.opacity??1,zIndex:18
  };
  if (ez.type==='colorbox') return <div style={{...b,background:ez.color||'#1e3a5f',borderRadius:10}}/>;
  if (ez.type==='text') return (
    <div style={{...b,background:ez.color||'rgba(5,15,50,.85)',borderRadius:10,
      display:'flex',alignItems:'center',justifyContent:'center',padding:'0 20px',textAlign:'center'}}>
      <div style={{fontSize:ez.fontSize||28,fontWeight:700,color:'#fff',lineHeight:1.3}}>{ez.text}</div>
    </div>
  );
  if (ez.type==='rtext2') return (
    <div style={{...b,background:ez.color||h2r(dark,.9),borderRadius:'0 8px 8px 0',display:'flex',alignItems:'center'}}>
      <div style={{flex:1,overflow:'hidden',position:'relative',height:'100%'}}>
        <div key={ez.text} style={{position:'absolute',whiteSpace:'nowrap',fontSize:24,fontWeight:700,
          color:'#fff',top:'50%',transform:'translateY(-50%)',
          animation:`rtScroll ${Math.max(14,(ez.text||'').length*.25)}s linear infinite`}}>
          {ez.text}
        </div>
      </div>
    </div>
  );
  if (ez.type==='image') return (
    <div style={{...b,borderRadius:10}}>
      {ez.imageUrl&&<img src={`${apiUrl}${ez.imageUrl}`} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}/>}
    </div>
  );
  if (ez.type==='clock') return (
    <div style={{...b,background:ez.color||h2r(dark,.9),borderRadius:12,
      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:4}}>
      <div style={{fontSize:Math.round(ez.h*.38),fontWeight:900,color:'#fff',fontFamily:'Courier New,monospace',letterSpacing:3}}>
        {clock.time}
      </div>
      <div style={{fontSize:Math.round(ez.h*.14),color:'rgba(255,215,215,.85)',fontWeight:600}}>{clock.date}</div>
    </div>
  );
  if (ez.type==='table2') return (
    <div style={{...b,background:ez.color||h2r(dark,.93),borderRadius:12,padding:'10px 14px'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr',gap:6,padding:'5px 8px',
        background:'rgba(0,0,0,.3)',borderRadius:7,marginBottom:5,fontSize:15,fontWeight:800,
        color:'rgba(255,210,210,.95)',textTransform:'uppercase'}}>
        <span>Poli</span><span>Dokter</span><span style={{textAlign:'right'}}>Jam</span>
      </div>
      {sched.map((r,i)=>(
        <div key={i} style={{display:'grid',gridTemplateColumns:'1fr 1.5fr 1fr',gap:6,
          padding:'4px 8px',borderBottom:'1px solid rgba(255,255,255,.07)',fontSize:14,color:'rgba(255,235,235,.9)'}}>
          <span style={{color:'#fca5a5',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.poli}</span>
          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.dokter}</span>
          <span style={{color:'#fde68a',fontWeight:600,textAlign:'right',whiteSpace:'nowrap'}}>{r.jam}</span>
        </div>
      ))}
    </div>
  );
  return null;
}

// ─── Fullscreen ───────────────────────────────────────────
function FSBtn({ theme }: { theme: string }) {
  const [vis, setVis] = useState(true);
  const [fs,  setFs]  = useState(false);
  const t = useRef<ReturnType<typeof setTimeout>|null>(null);

  const show = useCallback(() => {
    setVis(true);
    if (t.current) clearTimeout(t.current);
    t.current = setTimeout(() => setVis(false), 4000);
  }, []);

  useEffect(() => {
    show();
    window.addEventListener('mousemove', show);
    document.addEventListener('fullscreenchange', () => {
      setFs(!!document.fullscreenElement);
      setTimeout(() => window.dispatchEvent(new Event('resize')), 100);
    });
    return () => window.removeEventListener('mousemove', show);
  }, [show]);

  return (
    <button onClick={() => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(()=>{});
      else document.exitFullscreen?.();
    }} style={{
      position:'fixed',bottom:20,right:20,zIndex:999,
      background:h2r(theme,.85),border:'2px solid rgba(255,255,255,.4)',
      color:'#fff',borderRadius:12,padding:'10px 20px',fontSize:14,fontWeight:700,
      cursor:'pointer',backdropFilter:'blur(8px)',
      opacity:vis?1:0,pointerEvents:vis?'auto':'none',transition:'opacity .4s'
    }}>
      {fs?'✕ Keluar Fullscreen':'⛶ Fullscreen'}
    </button>
  );
}
