/**
 * Player page — disable SSR sepenuhnya.
 * Semua logika ada di PlayerApp (dynamic import, no SSR).
 */
import dynamic from 'next/dynamic';

// Ini satu-satunya cara yang benar di Next.js Pages Router
// untuk disable SSR sepenuhnya pada sebuah halaman
const PlayerApp = dynamic(() => import('../components/PlayerApp'), {
  ssr: false,
  loading: () => (
    <div style={{
      position: 'fixed', inset: 0, background: '#000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 18 }}>
        Memuat player...
      </div>
    </div>
  ),
});

export default function PlayerPage() {
  return <PlayerApp />;
}
