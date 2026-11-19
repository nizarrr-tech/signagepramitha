import { useState, useEffect } from 'react';
import { Monitor, Lock, Eye, EyeOff, X, Loader2, RefreshCw } from 'lucide-react';
import { isAuthenticated, saveSession, clearSession, verifyPassword } from '../lib/auth';

interface Props {
  title:    string;
  children: React.ReactNode;
  onLogout?: () => void;
}

/**
 * LoginGate — bungkus halaman apapun dengan proteksi password.
 * Player tidak menggunakan komponen ini.
 */
export default function LoginGate({ title, children, onLogout }: Props) {
  const [authed,  setAuthed]  = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setAuthed(isAuthenticated());
    setChecked(true);
  }, []);

  const handleLogout = () => {
    clearSession();
    setAuthed(false);
    onLogout?.();
  };

  const handleLogin = () => {
    saveSession();
    setAuthed(true);
  };

  if (!checked) return null;
  if (!authed)  return <LoginScreen title={title} onLogin={handleLogin} />;

  // Inject logout handler ke children via context-free approach
  return <>{children}</>;
}

// ── Login Screen UI ───────────────────────────────────────
export function LoginScreen({ title, onLogin }: { title: string; onLogin: () => void }) {
  const [pw,      setPw]      = useState('');
  const [show,    setShow]    = useState(false);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setLoading(true);
    setError('');
    const ok = await verifyPassword(pw.trim());
    if (ok) {
      onLogin();
    } else {
      setError('Password salah. Hubungi administrator untuk mendapat password.');
      setPw('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-900/40">
            <Monitor size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">Klinik Pramitha</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 shadow-2xl">
          <div className="flex items-center gap-2 mb-5">
            <Lock size={15} className="text-red-400" />
            <span className="text-sm font-semibold text-white">Masukkan Password Akses</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={show ? 'text' : 'password'}
                className="input pr-10 text-sm font-mono tracking-widest"
                placeholder="Contoh: ABcd-1234"
                value={pw}
                onChange={e => { setPw(e.target.value); setError(''); }}
                autoFocus
              />
              <button type="button" onClick={() => setShow(!show)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && (
              <div className="bg-red-950/40 border border-red-800/60 rounded-xl px-4 py-3 text-sm text-red-400 flex items-start gap-2">
                <X size={14} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={loading || !pw.trim()}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all bg-red-600 hover:bg-red-500 active:scale-95">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Memverifikasi...</>
                : <><Lock size={16} /> Masuk</>}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-600 text-center">
              Password di-generate otomatis oleh sistem.<br />
              Hubungi <span className="text-gray-500">administrator</span> untuk mendapatkan akses.
            </p>
          </div>
        </div>

        {/* Player — tanpa password */}
        <div className="mt-5 text-center">
          <a href="/player?client=PRAMITHA" target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-700 hover:text-gray-500 transition-colors inline-flex items-center gap-1.5">
            <Monitor size={11} /> Buka Player Layar (tanpa password)
          </a>
        </div>
      </div>
    </div>
  );
}
