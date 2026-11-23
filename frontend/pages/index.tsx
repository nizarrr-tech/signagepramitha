import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Monitor, Users, Wifi, Key, ExternalLink,
  CheckCircle2, XCircle, Loader2, ChevronRight,
  Play, Settings, Layout, Calendar, Image as ImageIcon,
  Globe, Tv
} from 'lucide-react';
import { getServerUrl } from '../lib/network';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://signagepramitha-production.up.railway.app';

// ── Semua link dalam urutan operasional ────────────────────
const LINKS = [
  {
    group: '📺 Layar Signage (Tanpa Password)',
    items: [
      {
        href:    '/player?client=PRAMITHA',
        label:   'Player Layar Signage',
        desc:    'Tampilan fullscreen untuk monitor/TV klinik. Tekan F11 setelah dibuka.',
        icon:    Tv,
        color:   'from-red-900/40 to-red-800/20 border-red-700',
        badge:   'Tanpa Password',
        badgeColor: 'bg-green-900/50 text-green-400',
        external: true,
        step:    1,
      },
    ],
  },
  {
    group: '⚙️ Panel Admin & Operator (Butuh Password)',
    items: [
      {
        href:    '/admin',
        label:   'Admin CMS',
        desc:    'Kelola konten layar: background, slideshow gambar, running text, jadwal, layout.',
        icon:    Monitor,
        color:   'from-blue-900/40 to-blue-800/20 border-blue-700',
        badge:   'Butuh Password',
        badgeColor: 'bg-yellow-900/50 text-yellow-400',
        external: false,
        step:    2,
      },
      {
        href:    '/operator',
        label:   'Panel Operator Antrian',
        desc:    'Panggil nomor antrian, ulang panggilan, input manual untuk Loket 1–5.',
        icon:    Users,
        color:   'from-purple-900/40 to-purple-800/20 border-purple-700',
        badge:   'Butuh Password',
        badgeColor: 'bg-yellow-900/50 text-yellow-400',
        external: false,
        step:    3,
      },
    ],
  },
  {
    group: '🔧 Pengaturan Sistem (Khusus Admin)',
    items: [
      {
        href:    '/password',
        label:   'Password Manager',
        desc:    'Lihat, generate, dan bagikan password CMS ke operator. Butuh Admin Secret dari Railway.',
        icon:    Key,
        color:   'from-yellow-900/40 to-yellow-800/20 border-yellow-700',
        badge:   'Admin Secret',
        badgeColor: 'bg-orange-900/50 text-orange-400',
        external: false,
        step:    4,
      },
      {
        href:    '/network',
        label:   'Konfigurasi Jaringan',
        desc:    'Atur URL server backend untuk akses dari lokasi berbeda atau internet.',
        icon:    Wifi,
        color:   'from-cyan-900/40 to-cyan-800/20 border-cyan-700',
        badge:   'Jaringan',
        badgeColor: 'bg-cyan-900/50 text-cyan-400',
        external: false,
        step:    5,
      },
    ],
  },
];

export default function HomePage() {
  const [status, setStatus] = useState<'checking'|'online'|'offline'>('checking');
  const [apiUrl, setApiUrl] = useState(API_URL);

  useEffect(() => {
    // Ambil URL dari localStorage kalau ada
    const saved = typeof window !== 'undefined' ? localStorage.getItem('signage_server_url') : null;
    const url = saved || API_URL;
    setApiUrl(url);

    // Cek status backend
    fetch(`${url}/api/clients`, { signal: AbortSignal.timeout(5000) })
      .then(r => setStatus(r.ok ? 'online' : 'offline'))
      .catch(() => setStatus('offline'));
  }, []);

  return (
    <>
      <Head><title>Digital Signage Pramitha — Dashboard</title></Head>
      <div className="min-h-screen bg-gray-950">

        {/* Header */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center shadow-xl shadow-red-900/40 flex-shrink-0">
                  <Tv size={28} className="text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white">Digital Signage</h1>
                  <p className="text-gray-400 text-sm mt-0.5">Klinik Pramitha — Sistem Informasi & Antrian</p>
                </div>
              </div>
              {/* Status backend */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${
                status === 'online'   ? 'bg-green-900/30 border-green-700/50 text-green-400' :
                status === 'offline'  ? 'bg-red-900/30 border-red-700/50 text-red-400' :
                'bg-gray-800 border-gray-700 text-gray-500'
              }`}>
                {status === 'checking' ? <Loader2 size={14} className="animate-spin" /> :
                 status === 'online'   ? <CheckCircle2 size={14} /> :
                 <XCircle size={14} />}
                Server {status === 'checking' ? 'Memeriksa...' : status === 'online' ? 'Online' : 'Offline'}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">

          {/* Urutan Penggunaan */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              📋 Urutan Penggunaan Harian
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { n: 1, label: 'Buka Player',      sub: 'di monitor/TV', color: 'bg-red-600' },
                { n: 2, label: 'Admin CMS',         sub: 'atur konten',   color: 'bg-blue-600' },
                { n: 3, label: 'Panel Operator',    sub: 'panggil antrian', color: 'bg-purple-600' },
                { n: 4, label: 'Password Manager',  sub: 'kelola akses',  color: 'bg-yellow-600' },
                { n: 5, label: 'Konfigurasi Net',   sub: 'atur jaringan', color: 'bg-cyan-600' },
              ].map(item => (
                <div key={item.n} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                  <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center text-white font-black text-sm flex-shrink-0`}>
                    {item.n}
                  </div>
                  <div>
                    <div className="text-white text-xs font-semibold leading-tight">{item.label}</div>
                    <div className="text-gray-500 text-xs">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link Groups */}
          {LINKS.map(group => (
            <div key={group.group}>
              <h2 className="text-sm font-bold text-gray-400 mb-3 uppercase tracking-wide">{group.group}</h2>
              <div className="space-y-3">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const Content = (
                    <div className={`bg-gradient-to-br ${item.color} border rounded-2xl p-5 flex items-center gap-4 hover:scale-[1.01] transition-all cursor-pointer group`}>
                      {/* Step number */}
                      <div className="w-10 h-10 bg-black/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-black text-lg">{item.step}</span>
                      </div>
                      {/* Icon */}
                      <div className="w-10 h-10 bg-black/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon size={20} className="text-white" />
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white font-bold text-base">{item.label}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${item.badgeColor}`}>
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mt-0.5 leading-snug">{item.desc}</p>
                      </div>
                      {/* Arrow */}
                      <div className="flex-shrink-0">
                        {item.external
                          ? <ExternalLink size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                          : <ChevronRight size={18} className="text-gray-500 group-hover:text-white transition-colors" />}
                      </div>
                    </div>
                  );

                  return item.external ? (
                    <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                      {Content}
                    </a>
                  ) : (
                    <Link key={item.href} href={item.href}>
                      {Content}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Info box */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="text-sm font-bold text-white mb-3">ℹ️ Informasi Sistem</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Backend API',  val: apiUrl,                              mono: true },
                { label: 'Frontend',     val: 'https://signagepramitha.vercel.app', mono: true },
                { label: 'Player',       val: '/player?client=PRAMITHA',            mono: true },
                { label: 'Canvas',       val: '1920 × 1080 px',                    mono: false },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-800 last:border-0">
                  <span className="text-gray-500">{item.label}</span>
                  <span className={item.mono ? 'font-mono text-blue-400 text-xs' : 'text-white text-xs'}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
