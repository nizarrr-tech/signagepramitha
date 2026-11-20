/**
 * CMS Authentication
 * Password disimpan di backend (database), diverifikasi via API.
 */

const AUTH_KEY = 'cms_auth_pramitha';
const EXP_KEY  = 'cms_auth_exp';
const SESSION_HOURS = 8; // sesi berlaku 8 jam

/** Simpan sesi login */
export function saveSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(AUTH_KEY, '1');
  const exp = Date.now() + SESSION_HOURS * 60 * 60 * 1000;
  sessionStorage.setItem(EXP_KEY, String(exp));
}

/** Cek apakah sesi masih valid */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const ok  = sessionStorage.getItem(AUTH_KEY) === '1';
  const exp = parseInt(sessionStorage.getItem(EXP_KEY) || '0', 10);
  if (ok && Date.now() < exp) return true;
  clearSession();
  return false;
}

/** Hapus sesi */
export function clearSession() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem(EXP_KEY);
}

/** Verifikasi password ke backend */
export async function verifyPassword(password: string): Promise<boolean> {
  try {
    // Coba ambil URL dari localStorage dulu, fallback ke Railway URL
    const url = typeof window !== 'undefined'
      ? (localStorage.getItem('signage_server_url') || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')
      : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

    const res = await fetch(`${url}/api/auth/verify`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
