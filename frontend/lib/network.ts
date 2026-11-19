/**
 * Network config — menyimpan URL server backend di localStorage
 * agar bisa diubah dari UI tanpa rebuild, mendukung 2 laptop berbeda.
 */

const LS_KEY = 'signage_server_url';

/** Default fallback (sama-komputer / localhost) */
export const DEFAULT_SERVER_URL = 'http://localhost:3001';

/**
 * Ambil server URL aktif.
 * Urutan prioritas:
 *  1. Query param `?api=...` di URL browser (override sementara)
 *  2. localStorage (disimpan dari halaman Network Config)
 *  3. env variable NEXT_PUBLIC_API_URL
 *  4. http://localhost:3001
 */
export function getServerUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || DEFAULT_SERVER_URL;
  }
  // 1. query param
  const params = new URLSearchParams(window.location.search);
  const qp = params.get('api');
  if (qp) return qp.replace(/\/$/, '');

  // 2. localStorage
  const saved = localStorage.getItem(LS_KEY);
  if (saved) return saved.replace(/\/$/, '');

  // 3. env
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  return DEFAULT_SERVER_URL;
}

/** Simpan server URL ke localStorage */
export function saveServerUrl(url: string): void {
  const clean = url.trim().replace(/\/$/, '');
  localStorage.setItem(LS_KEY, clean);
}

/** Hapus override, kembali ke default */
export function resetServerUrl(): void {
  localStorage.removeItem(LS_KEY);
}

/** Test koneksi ke server — return true jika berhasil */
export async function testConnection(url: string): Promise<{ ok: boolean; latency: number; version?: string }> {
  const start = Date.now();
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/api/clients`, { signal: AbortSignal.timeout(5000) });
    const latency = Date.now() - start;
    return { ok: res.ok, latency };
  } catch {
    return { ok: false, latency: Date.now() - start };
  }
}

/** Dapatkan IP lokal yang mungkin (dari window.location) */
export function getCurrentHost(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname;
}
