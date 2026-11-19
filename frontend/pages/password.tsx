/**
 * /password — Halaman rahasia untuk melihat dan me-reset password CMS.
 * Hanya bisa diakses jika tahu ADMIN_SECRET dari Railway.
 * URL ini tidak ditampilkan di navbar.
 */
import { useState } from 'react';
import Head from 'next/head';
import { Key, RefreshCw, Copy, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getServerUrl } from '../lib/network';
import toast from 'react-hot-toast';

export default function PasswordPage() {
  const [secret,    setSecret]    = useState('');
  const [password,  setPassword]  = useState('');
  const [createdAt, setCreatedAt] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [generating,setGenerating]= useState(false);
  const [show,      setShow]      = useState(false);
  const [unlocked,  setUnlocked]  = useState(false);

  const API = getServerUrl();

  const fetchPassword = async () => {
    if (!secret.trim()) return toast.error('Masukkan Admin Secret');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/password`, {
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) { toast.error('Secret salah atau akses ditolak'); return; }
      const data = await res.json();
      setPassword(data.password);
      setCreatedAt(new Date(data.createdAt).toLocaleString('id-ID'));
      setUnlocked(true);
    } catch { toast.error('Gagal terhubung ke server'); }
    finally { setLoading(false); }
  };

  const generateNew = async () => {
    if (!secret.trim()) return;
    if (!confirm('Generate password baru? Password lama tidak bisa dipakai lagi.')) return;
    setGenerating(true);
    try {
      const res = await fetch(`${API}/api/auth/generate`, {
        method: 'POST',
        headers: { 'x-admin-secret': secret },
      });
      if (!res.ok) { toast.error('Gagal generate password'); return; }
      const data = await res.json();
      setPassword(data.password);
      setCreatedAt(new Date(data.createdAt).toLocaleString('id-ID'));
      toast.success('✅ Password baru berhasil dibuat!');
    } catch { toast.error('Gagal terhubung'); }
    finally { setGenerating(false); }
  };

  const copy = () => {
    navigator.clipboard.writeText(password);
    toast.success('Password disalin!');
  };

  return (
    <>
      <Head><title>Password Manager — Signage CMS</title></Head>
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-yellow-600/20 border border-yellow-600/40 flex items-center justify-center mx-auto mb-4">
              <Key size={26} className="text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold text-white">Password Manager</h1>
            <p className="text-gray-500 text-sm mt-1">Kelola password akses CMS</p>
          </div>

          {/* Admin secret input */}
          {!unlocked ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={15} className="text-yellow-400" />
                <span className="text-sm font-semibold text-white">Verifikasi Admin</span>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Masukkan <code className="text-yellow-400 bg-gray-800 px-1.5 py-0.5 rounded">ADMIN_SECRET</code> dari
                environment variable Railway untuk mengakses panel ini.
              </p>
              <div className="space-y-3">
                <input className="input text-sm font-mono" type="password"
                  placeholder="Admin secret key..."
                  value={secret} onChange={e => setSecret(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && fetchPassword()} autoFocus />
                <button onClick={fetchPassword} disabled={loading || !secret.trim()}
                  className="w-full py-2.5 rounded-xl bg-yellow-700 hover:bg-yellow-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {loading ? <Loader2 size={15} className="animate-spin" /> : <Key size={15} />}
                  {loading ? 'Memverifikasi...' : 'Buka Panel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Password display */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={15} className="text-green-400" />
                  <span className="text-sm font-semibold text-white">Password CMS Aktif</span>
                </div>

                {/* Password box */}
                <div className="bg-gray-800 rounded-xl p-4 mb-3 relative">
                  <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Password</div>
                  <div className="text-3xl font-black font-mono tracking-[0.3em] text-white text-center py-2">
                    {show ? password : password.replace(/[^-]/g, '●')}
                  </div>
                  <div className="flex justify-center gap-2 mt-3">
                    <button onClick={() => setShow(!show)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
                      {show ? <EyeOff size={12} /> : <Eye size={12} />}
                      {show ? 'Sembunyikan' : 'Tampilkan'}
                    </button>
                    <button onClick={copy}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-xs text-gray-300 transition-colors">
                      <Copy size={12} /> Salin
                    </button>
                  </div>
                </div>

                <p className="text-xs text-gray-600 text-center">
                  Dibuat: {createdAt}
                </p>
              </div>

              {/* Generate new */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <RefreshCw size={14} className="text-blue-400" /> Generate Password Baru
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  Password lama akan langsung tidak berlaku. Bagikan password baru ke operator/admin CMS.
                </p>
                <button onClick={generateNew} disabled={generating}
                  className="w-full py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                  {generating ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  {generating ? 'Generating...' : 'Generate Password Baru'}
                </button>
              </div>

              {/* Cara pakai */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-3">📋 Cara Bagikan ke Operator</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <p>1. Klik <strong className="text-white">Tampilkan</strong> untuk melihat password</p>
                  <p>2. Klik <strong className="text-white">Salin</strong> atau catat passwordnya</p>
                  <p>3. Bagikan ke operator via WhatsApp/pesan</p>
                  <p>4. Operator buka: <code className="text-blue-400">signagepramitha.vercel.app/admin</code></p>
                  <p>5. Masukkan password → Masuk ke CMS</p>
                </div>
                <div className="mt-3 p-3 bg-yellow-950/30 border border-yellow-800/40 rounded-xl">
                  <p className="text-xs text-yellow-400">
                    ⚠️ Jangan bagikan <code>ADMIN_SECRET</code>. Hanya bagikan <strong>password CMS</strong> ke operator.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
