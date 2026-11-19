import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import NavBar from '../components/NavBar';
import {
  getServerUrl, saveServerUrl, resetServerUrl,
  testConnection, getCurrentHost,
} from '../lib/network';
import {
  Wifi, WifiOff, RefreshCw, Save, RotateCcw, Monitor,
  Server, CheckCircle2, XCircle, Loader2, Copy,
  ExternalLink, Globe, Zap, Shield, ChevronDown, ChevronUp,
  Terminal, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Tab types ────────────────────────────────────────────
type TabId = 'config' | 'ngrok' | 'cloudflare' | 'guide';

export default function NetworkPage() {
  const [tab,        setTab]        = useState<TabId>('config');
  const [serverUrl,  setServerUrl]  = useState('');
  const [inputUrl,   setInputUrl]   = useState('');
  const [testing,    setTesting]    = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latency: number } | null>(null);
  const [currentHost, setCurrentHost] = useState('');

  useEffect(() => {
    const url = getServerUrl();
    setServerUrl(url);
    setInputUrl(url);
    setCurrentHost(getCurrentHost());
  }, []);

  const handleTest = async (url = inputUrl) => {
    if (!url.trim()) return;
    setTesting(true); setTestResult(null);
    const r = await testConnection(url.trim());
    setTestResult(r);
    setTesting(false);
    r.ok ? toast.success(`✅ Terhubung! ${r.latency}ms`) : toast.error('❌ Gagal terhubung');
  };

  const handleSave = async () => {
    const url = inputUrl.trim();
    if (!url) return toast.error('URL kosong');
    if (!url.startsWith('http')) return toast.error('URL harus diawali http:// atau https://');
    setTesting(true);
    const r = await testConnection(url);
    setTesting(false);
    if (!r.ok) {
      if (!confirm(`Server tidak merespons (${r.latency}ms).\nSimpan tetap?`)) return;
    }
    saveServerUrl(url);
    setServerUrl(url);
    toast.success('✅ URL disimpan! Refresh halaman lain untuk berlaku.');
  };

  const handleReset = () => {
    resetServerUrl();
    const def = 'http://localhost:3001';
    setInputUrl(def); setServerUrl(def); setTestResult(null);
    toast.success('Reset ke localhost');
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Disalin!'); };

  const isRemote = serverUrl && !serverUrl.includes('localhost') && !serverUrl.includes('127.0.0.1');
  const ipBase   = currentHost !== 'localhost' ? currentHost : null;

  const TABS = [
    { id: 'config' as TabId,     label: 'Konfigurasi',        icon: Wifi    },
    { id: 'cloudflare' as TabId, label: 'Cloudflare Tunnel',  icon: Shield  },
    { id: 'ngrok' as TabId,      label: 'ngrok',              icon: Zap     },
    { id: 'guide' as TabId,      label: 'Panduan Lengkap',    icon: Globe   },
  ];

  return (
    <>
      <Head><title>Jaringan — Signage CMS</title></Head>
      <div className="min-h-screen bg-gray-950">
        <NavBar />

        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-600/40 flex items-center justify-center">
                <Globe size={20} className="text-blue-400" />
              </div>
              Akses Jarak Jauh
            </h1>
            <p className="text-gray-400 mt-2 text-sm">
              Hubungkan CMS dan Player meskipun beda WiFi, beda kota, beda internet — tanpa biaya server.
            </p>
          </div>

          {/* Status bar */}
          <div className={`rounded-2xl border p-4 mb-5 flex items-center gap-3 ${
            testResult?.ok   ? 'bg-green-900/20 border-green-700/40' :
            testResult?.ok === false ? 'bg-red-900/20 border-red-700/40' :
            isRemote ? 'bg-blue-900/20 border-blue-700/40' : 'bg-gray-900 border-gray-800'
          }`}>
            {testing ? <Loader2 size={18} className="text-blue-400 animate-spin" /> :
             testResult?.ok ? <CheckCircle2 size={18} className="text-green-400" /> :
             testResult?.ok === false ? <XCircle size={18} className="text-red-400" /> :
             isRemote ? <Globe size={18} className="text-blue-400" /> :
             <Monitor size={18} className="text-gray-500" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white">
                {testing ? 'Menguji...' :
                 testResult?.ok ? `Terhubung (${testResult.latency}ms)` :
                 testResult?.ok === false ? 'Tidak terhubung' :
                 isRemote ? 'Mode Remote' : 'Mode Lokal (localhost)'}
              </div>
              <div className="text-xs text-gray-500 font-mono truncate">{serverUrl}</div>
            </div>
            <button onClick={() => handleTest(serverUrl)} disabled={testing}
              className="text-gray-500 hover:text-white text-xs flex items-center gap-1">
              <RefreshCw size={12} /> Test
            </button>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 mb-5 bg-gray-900 border border-gray-800 rounded-xl p-1">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'
                  }`}>
                  <Icon size={13} />{t.label}
                </button>
              );
            })}
          </div>

          {/* ══ TAB: CONFIG ══ */}
          {tab === 'config' && (
            <div className="space-y-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 block">
                  URL Server Backend
                </label>
                <div className="flex gap-2">
                  <input className="input flex-1 font-mono text-sm" value={inputUrl}
                    onChange={e => { setInputUrl(e.target.value); setTestResult(null); }}
                    placeholder="https://xxxx.trycloudflare.com"
                    onKeyDown={e => e.key === 'Enter' && handleTest()} />
                  <button onClick={() => handleTest()} disabled={testing}
                    className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0">
                    {testing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                    Test
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleSave} disabled={testing}
                    className="flex-1 py-2.5 rounded-xl bg-green-700 hover:bg-green-600 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                    <Save size={14} /> Simpan & Gunakan
                  </button>
                  <button onClick={handleReset}
                    className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 text-sm font-semibold flex items-center gap-1.5">
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>
              </div>

              {/* Quick suggestions */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">URL Cepat</h3>
                <div className="space-y-2">
                  {[
                    { label: 'Localhost (komputer ini)', url: 'http://localhost:3001', badge: 'lokal' },
                    ...(ipBase ? [{ label: `LAN (${ipBase})`, url: `http://${ipBase}:3001`, badge: 'LAN' }] : []),
                  ].map(s => (
                    <div key={s.url} className="flex items-center justify-between p-3 bg-gray-800 rounded-xl">
                      <div>
                        <span className="text-xs font-medium text-white">{s.label}</span>
                        <div className="text-xs font-mono text-blue-400">{s.url}</div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => { setInputUrl(s.url); setTestResult(null); }}
                          className="px-2.5 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg">Pilih</button>
                        <button onClick={() => copy(s.url)}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg"><Copy size={11} /></button>
                      </div>
                    </div>
                  ))}
                  <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl">
                    <div className="text-xs text-blue-300 font-semibold mb-1">💡 Untuk beda internet</div>
                    <div className="text-xs text-gray-400">Gunakan tab <strong className="text-white">Cloudflare Tunnel</strong> atau <strong className="text-white">ngrok</strong> untuk mendapat URL publik gratis, lalu masukkan di sini.</div>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">🔗 Semua Link Akses</h3>
                <div className="space-y-1.5 text-xs font-mono">
                  {[
                    { label: 'Admin CMS',  path: '/admin' },
                    { label: 'Operator',   path: '/operator' },
                    { label: 'Player',     path: `/player?client=PRAMITHA${inputUrl && !inputUrl.includes('localhost') ? `&api=${inputUrl}` : ''}` },
                    { label: 'Network',    path: '/network' },
                  ].map(item => {
                    const fullUrl = `http://localhost:3000${item.path}`;
                    return (
                      <div key={item.label} className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-gray-500">{item.label}: </span>
                          <span className="text-blue-400 break-all">{fullUrl}</span>
                        </div>
                        <div className="flex gap-1.5 ml-2 flex-shrink-0">
                          <button onClick={() => copy(fullUrl)} className="text-gray-500 hover:text-white"><Copy size={11} /></button>
                          <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white"><ExternalLink size={11} /></a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: CLOUDFLARE ══ */}
          {tab === 'cloudflare' && (
            <div className="space-y-4">
              {/* Info box */}
              <div className="bg-orange-950/30 border border-orange-700/40 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Shield size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white mb-1">Cloudflare Tunnel — Gratis Selamanya</div>
                    <div className="text-sm text-gray-300">
                      Tidak perlu domain, tidak perlu port forwarding, tidak perlu IP publik.
                      Koneksi terenkripsi HTTPS otomatis. Cocok untuk produksi permanen.
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick tunnel (no account needed) */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Zap size={15} className="text-yellow-400" /> Quick Tunnel — Tanpa Akun
                </h3>
                <p className="text-xs text-gray-400 mb-4">URL berubah setiap restart. Cocok untuk demo/testing.</p>
                <Steps steps={[
                  {
                    n: '1', title: 'Download cloudflared',
                    content: (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Download file <code className="bg-gray-800 px-1.5 py-0.5 rounded text-blue-300">cloudflared.exe</code> ke folder SIGNAGE ANTRIAN:</p>
                        <Code>https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe</Code>
                        <p className="text-xs text-gray-500 mt-1">Atau jalankan <code className="text-yellow-300">tunnel-cloudflare.bat</code> — download otomatis.</p>
                      </div>
                    ),
                  },
                  {
                    n: '2', title: 'Pastikan backend jalan',
                    content: <Code>start-all.bat</Code>,
                  },
                  {
                    n: '3', title: 'Jalankan tunnel',
                    content: (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Double-click file:</p>
                        <Code>tunnel-cloudflare.bat</Code>
                        <p className="text-sm text-gray-300 mt-2 mb-1">Atau manual di Command Prompt:</p>
                        <Code>cloudflared tunnel --url http://localhost:3001</Code>
                      </div>
                    ),
                  },
                  {
                    n: '4', title: 'Copy URL yang muncul',
                    content: (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Tunggu hingga muncul baris seperti ini:</p>
                        <Code>https://abc-random-xyz.trycloudflare.com</Code>
                        <p className="text-sm text-gray-300 mt-2">Copy URL tersebut, lalu masukkan di tab <strong className="text-white">Konfigurasi</strong>.</p>
                      </div>
                    ),
                  },
                  {
                    n: '5', title: 'Bagikan ke operator/viewer',
                    content: (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Player bisa dibuka dari mana saja:</p>
                        <Code>{`http://[IP-lokal]:3000/player?client=PRAMITHA\n  &api=https://abc-random-xyz.trycloudflare.com`}</Code>
                        <p className="text-xs text-gray-500 mt-1">Atau gunakan <code className="text-yellow-300">tunnel-full.bat</code> untuk tunnel backend + frontend sekaligus.</p>
                      </div>
                    ),
                  },
                ]} />
              </div>

              {/* Named tunnel (with account - permanent URL) */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Shield size={15} className="text-green-400" /> Named Tunnel — URL Tetap (Perlu Akun)
                </h3>
                <p className="text-xs text-gray-400 mb-4">URL tidak berubah meski restart. Perlu akun Cloudflare gratis + domain (bisa pakai subdomain gratis dari Cloudflare).</p>
                <Steps steps={[
                  {
                    n: '1', title: 'Daftar akun Cloudflare gratis',
                    content: <Code>https://dash.cloudflare.com/sign-up</Code>,
                  },
                  {
                    n: '2', title: 'Login cloudflared',
                    content: <Code>cloudflared tunnel login</Code>,
                  },
                  {
                    n: '3', title: 'Buat tunnel',
                    content: <Code>cloudflared tunnel create signage-pramitha</Code>,
                  },
                  {
                    n: '4', title: 'Buat file konfigurasi',
                    content: (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Buat file <code className="text-yellow-300">~/.cloudflared/config.yml</code>:</p>
                        <Code>{`tunnel: signage-pramitha
credentials-file: C:/Users/[USER]/.cloudflared/[ID].json
ingress:
  - hostname: signage.domainanda.com
    service: http://localhost:3001
  - service: http_status:404`}</Code>
                      </div>
                    ),
                  },
                  {
                    n: '5', title: 'Jalankan',
                    content: <Code>cloudflared tunnel run signage-pramitha</Code>,
                  },
                ]} />
              </div>
            </div>
          )}

          {/* ══ TAB: NGROK ══ */}
          {tab === 'ngrok' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-700/40 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Zap size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-white mb-1">ngrok — Paling Cepat Setup</div>
                    <div className="text-sm text-gray-300">
                      URL berubah setiap restart (versi gratis). Butuh akun ngrok gratis.
                      Cocok untuk demo dan testing cepat.
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-yellow-400">
                      <AlertTriangle size={12} />
                      Versi gratis: 1 tunnel aktif, URL berubah setiap restart, 40 koneksi/menit
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <Steps steps={[
                  {
                    n: '1', title: 'Daftar akun gratis',
                    content: (
                      <div>
                        <Code>https://ngrok.com/signup</Code>
                        <p className="text-xs text-gray-500 mt-1">Login dengan Google / GitHub — tidak perlu kartu kredit.</p>
                      </div>
                    ),
                  },
                  {
                    n: '2', title: 'Download & install ngrok',
                    content: (
                      <div>
                        <Code>https://ngrok.com/download</Code>
                        <p className="text-xs text-gray-500 mt-1">Ekstrak <code className="text-yellow-300">ngrok.exe</code> ke folder SIGNAGE ANTRIAN atau ke <code className="text-yellow-300">C:\Windows</code>.</p>
                      </div>
                    ),
                  },
                  {
                    n: '3', title: 'Hubungkan akun (sekali saja)',
                    content: (
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Copy authtoken dari <span className="text-blue-400">dashboard.ngrok.com → Your Authtoken</span>, lalu:</p>
                        <Code>ngrok config add-authtoken TOKEN_ANDA_DISINI</Code>
                      </div>
                    ),
                  },
                  {
                    n: '4', title: 'Jalankan tunnel backend',
                    content: (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Double-click:</p>
                        <Code>tunnel-ngrok.bat</Code>
                        <p className="text-sm text-gray-300 mt-2 mb-1">Atau manual:</p>
                        <Code>ngrok http 3001</Code>
                      </div>
                    ),
                  },
                  {
                    n: '5', title: 'Copy URL yang muncul',
                    content: (
                      <div>
                        <p className="text-sm text-gray-300 mb-2">Di tampilan ngrok, cari baris:</p>
                        <Code>Forwarding  https://xxxx-xx-xx.ngrok-free.app → http://localhost:3001</Code>
                        <p className="text-sm text-gray-300 mt-2">Copy URL <code className="text-green-400">https://xxxx...ngrok-free.app</code> dan masukkan di tab Konfigurasi.</p>
                      </div>
                    ),
                  },
                ]} />
              </div>
            </div>
          )}

          {/* ══ TAB: GUIDE ══ */}
          {tab === 'guide' && (
            <div className="space-y-4">

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">📊 Perbandingan Metode</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        {['Metode','Biaya','URL Tetap','Setup','Batas'].map(h => (
                          <th key={h} className="text-left py-2 pr-3 text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Cloudflare Quick', 'Gratis', '❌ Berubah', '⭐ 1 menit', 'Tidak ada'],
                        ['Cloudflare Named', 'Gratis', '✅ Tetap', '⭐⭐ 10 menit', 'Perlu domain'],
                        ['ngrok Free', 'Gratis', '❌ Berubah', '⭐ 5 menit', '40 req/menit'],
                        ['ngrok Pro', '$10/bln', '✅ Tetap', '⭐ 5 menit', 'Tidak ada'],
                        ['VPS (Render.com)', 'Gratis–$7', '✅ Tetap', '⭐⭐⭐ Deploy', 'Sleep 30 mnt'],
                      ].map(row => (
                        <tr key={row[0]} className="border-b border-gray-800">
                          {row.map((cell, i) => (
                            <td key={i} className={`py-2 pr-3 ${i === 0 ? 'font-semibold text-white' : 'text-gray-400'}`}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">🏗️ Arsitektur Remote</h3>
                <div className="bg-gray-800 rounded-xl p-4 font-mono text-xs text-gray-300 leading-relaxed">
                  <div className="text-green-400">╔═══ Laptop Klinik (Server) ═══╗</div>
                  <div>║  Backend :3001               ║</div>
                  <div>║  Frontend :3000              ║</div>
                  <div>║  cloudflared / ngrok         ║</div>
                  <div className="text-green-400">╚══════════════╤══════════════╝</div>
                  <div className="text-center">               │ HTTPS tunnel</div>
                  <div className="text-center text-blue-400">   ┌────────────┴────────────┐</div>
                  <div className="text-center text-blue-400">   ▼                         ▼</div>
                  <div className="flex gap-4 mt-1">
                    <div className="flex-1">
                      <div className="text-yellow-400">┌─ Laptop Operator ─┐</div>
                      <div>│ Browser CMS        │</div>
                      <div>│ /admin /operator   │</div>
                      <div className="text-yellow-400">└───────────────────┘</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-purple-400">┌─ Layar Player ────┐</div>
                      <div>│ Browser /player    │</div>
                      <div>│ Fullscreen 1080p   │</div>
                      <div className="text-purple-400">└───────────────────┘</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">❓ Troubleshooting</h3>
                <div className="space-y-3">
                  {[
                    { q: 'Tunnel jalan tapi WebSocket tidak terhubung', a: 'Cloudflare dan ngrok mendukung WebSocket secara otomatis. Pastikan menggunakan URL https:// bukan http://.' },
                    { q: 'URL tunnel berubah setelah restart', a: 'Gunakan Cloudflare Named Tunnel atau ngrok berbayar untuk URL tetap. Atau update URL di halaman Konfigurasi setiap kali restart.' },
                    { q: 'Video tidak muncul di Player remote', a: 'File video diakses dari URL backend. Pastikan parameter ?api= di Player URL mengarah ke URL tunnel yang benar.' },
                    { q: 'ngrok menampilkan halaman "Visit Site"', a: 'Tambahkan header di request: "ngrok-skip-browser-warning: true". Sudah ditangani otomatis di kode.' },
                    { q: 'Koneksi lambat', a: 'Tunnel gratis melalui server Cloudflare/ngrok yang mungkin jauh. Upgrade ke plan berbayar atau gunakan VPS regional (Singapore lebih dekat ke Indonesia).' },
                  ].map(item => (
                    <div key={item.q} className="border border-gray-800 rounded-xl p-3">
                      <div className="text-sm font-semibold text-yellow-400 mb-1">❓ {item.q}</div>
                      <div className="text-sm text-gray-400">→ {item.a}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ─── Helper Components ────────────────────────────────────
function Code({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-lg px-3 py-2 font-mono text-xs text-green-300 whitespace-pre-wrap break-all">
      {children}
    </div>
  );
}

function Steps({ steps }: { steps: { n: string; title: string; content: React.ReactNode }[] }) {
  return (
    <div className="space-y-4">
      {steps.map(step => (
        <div key={step.n} className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-700 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white mt-0.5">
            {step.n}
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white mb-1.5">{step.title}</div>
            {step.content}
          </div>
        </div>
      ))}
    </div>
  );
}
