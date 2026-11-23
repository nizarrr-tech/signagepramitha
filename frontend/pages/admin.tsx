import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Monitor, Image as ImageIcon, AlignLeft, Calendar,
  Send, Loader2, Layout, Settings,
  Eye, Upload, X, ChevronRight, Palette, Lock, LogOut,
  GripVertical, ArrowUp, ArrowDown
} from 'lucide-react';
import NavBar from '../components/NavBar';
import LoginGate from '../components/LoginGate';
import MediaUpload from '../components/MediaUpload';
import ScheduleEditor from '../components/ScheduleEditor';
import LayoutEditor from '../components/LayoutEditor';
import {
  fetchSignageConfig, updateSignageContent,
  fetchImages, uploadFile, API_URL,
} from '../lib/api';
import { clearSession } from '../lib/auth';
import {
  Media, ScheduleRow, SignageContent,
  LayoutConfig, DEFAULT_LAYOUT
} from '../lib/types';

const CLIENT_ID = 'PRAMITHA';

const TABS = [
  { id: 'content',  label: 'Konten',        icon: Monitor   },
  { id: 'layout',   label: 'Layout Editor',  icon: Layout    },
  { id: 'schedule', label: 'Jadwal',         icon: Calendar  },
  { id: 'media',    label: 'Media Library',  icon: ImageIcon },
  { id: 'settings', label: 'Pengaturan',     icon: Settings  },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminPage() {
  return (
    <LoginGate title="Admin CMS">
      <AdminContent />
    </LoginGate>
  );
}

// ─────────────────────────────────────────────
// ADMIN CONTENT (setelah login)
// ─────────────────────────────────────────────
function AdminContent() {
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [tab,        setTab]        = useState<TabId>('content');

  const [mainImages,    setMainImages]    = useState<string[]>([]); // playlist gambar zona video
  const [slideUrls,     setSlideUrls]     = useState<string[]>([]); // slideshow bawah
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [runningText,   setRunningText]   = useState('');
  const [scheduleTable, setScheduleTable] = useState<ScheduleRow[]>([]);
  const [layoutConfig,  setLayoutConfig]  = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [clinicName,    setClinicName]    = useState('Klinik Pramitha');
  const [themeColor,    setThemeColor]    = useState('#dc2626');
  const [images,        setImages]        = useState<Media[]>([]);
  const [bgUploading,   setBgUploading]   = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [cfg, imgs] = await Promise.all([
        fetchSignageConfig(CLIENT_ID),
        fetchImages(),
      ]);
      const c: SignageContent = cfg.data.content;
      setMainImages(c.videoUrls      || []); // videoUrls dipakai sebagai playlist gambar utama
      setSlideUrls(c.slideUrls       || []);
      setBackgroundUrl(c.backgroundUrl || '');
      setRunningText(c.runningText    || '');
      setScheduleTable(c.scheduleTable || []);
      setLayoutConfig(c.layoutConfig  || DEFAULT_LAYOUT);
      setClinicName(c.clinicName      || 'Klinik Pramitha');
      setThemeColor(c.themeColor      || '#dc2626');
      setImages(imgs.data);
    } catch { toast.error('Gagal memuat konfigurasi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await updateSignageContent(CLIENT_ID, {
        videoUrls:    mainImages, // simpan sebagai videoUrls di DB
        slideUrls,
        backgroundUrl,
        runningText,
        scheduleTable,
        layoutConfig,
        clinicName,
        themeColor,
      });
      toast.success('✅ Konten berhasil dikirim ke layar!', { duration: 4000 });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Publish gagal');
    } finally { setPublishing(false); }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBgUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await uploadFile(fd);
      setBackgroundUrl(res.data.url);
      await fetchImages().then(r => setImages(r.data));
      toast.success('Background diupload');
    } catch { toast.error('Upload gagal'); }
    finally { setBgUploading(false); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-red-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <NavBar />

      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: themeColor + '33', border: `1px solid ${themeColor}66` }}>
                <Monitor size={18} style={{ color: themeColor }} />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight">{clinicName}</h1>
                <p className="text-xs text-gray-500">Client: <span className="font-mono text-red-400">{CLIENT_ID}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href="/player?client=PRAMITHA" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors">
                <Eye size={15} /> Preview
              </a>
              <button onClick={handlePublish} disabled={publishing}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}>
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {publishing ? 'Mengirim...' : 'Publish ke Layar'}
              </button>
              <button onClick={() => { if(confirm('Keluar dari CMS?')) { clearSession(); window.location.reload(); } }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-700 text-sm transition-colors"
                title="Logout">
                <LogOut size={15} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 pb-0">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active ? 'text-white border-red-500' : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}>
                  <Icon size={14} />{t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-screen-2xl mx-auto w-full px-6 py-6 flex-1">

        {/* KONTEN */}
        {tab === 'content' && (
          <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
            <div className="xl:col-span-3 space-y-5">

              {/* Background */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <ImageIcon size={16} className="text-yellow-400" /> Background Layar
                </h2>
                <div className="flex gap-4">
                  <label className="relative flex-shrink-0 w-48 h-28 rounded-xl overflow-hidden border-2 border-dashed border-gray-700 hover:border-gray-500 cursor-pointer transition-colors bg-gray-800 flex items-center justify-center">
                    {backgroundUrl ? (
                      <>
                        <img src={`${API_URL}${backgroundUrl}`} className="w-full h-full object-cover" alt="bg" />
                        <button onClick={e => { e.preventDefault(); setBackgroundUrl(''); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">
                          <X size={12} />
                        </button>
                      </>
                    ) : bgUploading ? (
                      <Loader2 size={22} className="animate-spin text-gray-400" />
                    ) : (
                      <div className="text-center"><Upload size={20} className="text-gray-500 mx-auto mb-1" /><span className="text-xs text-gray-500">Upload</span></div>
                    )}
                    <input type="file" accept="image/*" hidden onChange={handleBgUpload} />
                  </label>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 mb-1 block">URL Background</label>
                    <input className="input text-sm" value={backgroundUrl} onChange={e => setBackgroundUrl(e.target.value)} placeholder="/resources/bg.jpg" />
                    <p className="text-xs text-gray-600 mt-1.5">Resolusi ideal: 1920 × 1080 px</p>
                  </div>
                </div>
              </div>

              {/* Playlist Gambar Utama (zona video) */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <ImageIcon size={16} className="text-purple-400" /> Playlist Gambar Utama
                  <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{mainImages.length} dipilih</span>
                </h2>
                <p className="text-xs text-gray-500 mb-4">Gambar tampil bergantian di zona tengah layar (1274×622px). Bisa diurutkan.</p>
                <MediaUpload type="IMAGE" items={images}
                  onRefresh={() => fetchImages().then(r => setImages(r.data))}
                  onSelect={url => setMainImages(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url])}
                  selectedUrls={mainImages} label="Klik gambar untuk pilih / batalkan" />
                {/* Urutan playlist */}
                {mainImages.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2 font-semibold uppercase tracking-wide">Urutan Tampil (seret untuk atur)</p>
                    <div className="space-y-1.5">
                      {mainImages.map((url, i) => (
                        <div key={url} className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2 group">
                          <span className="text-gray-600 text-xs w-5 text-center">{i+1}</span>
                          <img src={`${API_URL}${url}`} className="w-10 h-7 object-cover rounded flex-shrink-0" alt="" />
                          <span className="text-gray-300 text-xs flex-1 truncate font-mono">{url.split('/').pop()}</span>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => { if(i===0) return; const a=[...mainImages]; [a[i-1],a[i]]=[a[i],a[i-1]]; setMainImages(a); }}
                              disabled={i===0}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-30">
                              <ArrowUp size={12} />
                            </button>
                            <button
                              onClick={() => { if(i===mainImages.length-1) return; const a=[...mainImages]; [a[i],a[i+1]]=[a[i+1],a[i]]; setMainImages(a); }}
                              disabled={i===mainImages.length-1}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-30">
                              <ArrowDown size={12} />
                            </button>
                            <button onClick={() => setMainImages(p => p.filter(u => u !== url))}
                              className="p-1 text-red-500 hover:text-red-400">
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Slide */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <ImageIcon size={16} className="text-green-400" /> Slideshow Gambar
                  <span className="ml-auto text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{slideUrls.length} dipilih</span>
                </h2>
                <MediaUpload type="IMAGE" items={images}
                  onRefresh={() => fetchImages().then(r => setImages(r.data))}
                  onSelect={url => setSlideUrls(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url])}
                  selectedUrls={slideUrls} label="Klik untuk pilih / batalkan" />
                {slideUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slideUrls.map(url => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-600 group">
                        <img src={`${API_URL}${url}`} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => setSlideUrls(p => p.filter(u => u !== url))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <X size={14} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Running Text */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <AlignLeft size={16} className="text-cyan-400" /> Running Text
                </h2>
                <textarea className="input min-h-[72px] resize-none text-sm" value={runningText}
                  onChange={e => setRunningText(e.target.value)} placeholder="Selamat datang di Klinik Pramitha..." />
                {runningText && (
                  <div className="mt-3 rounded-lg overflow-hidden bg-gray-800 relative h-10 flex items-center">
                    <div className="absolute left-0 top-0 h-full px-3 bg-red-700 flex items-center z-10">
                      <span className="text-white text-xs font-bold tracking-widest">INFO</span>
                    </div>
                    <div className="overflow-hidden ml-16 flex-1">
                      <div className="text-yellow-300 text-sm font-semibold whitespace-nowrap"
                        style={{ display:'inline-block', animation:'marquee 12s linear infinite' }}>
                        {runningText}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right sidebar */}
            <div className="xl:col-span-2 space-y-5">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4">📊 Ringkasan</h2>
                <div className="space-y-2.5">
                  {[
                    { label: 'Gambar Utama', val: mainImages.length,    unit: 'gambar', color: 'text-purple-400' },
                    { label: 'Slide bawah',  val: slideUrls.length,     unit: 'gambar', color: 'text-green-400' },
                    { label: 'Jadwal',       val: scheduleTable.length, unit: 'baris',  color: 'text-orange-400' },
                    { label: 'Background',   val: backgroundUrl ? '✓' : '—', unit: '', color: 'text-yellow-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <span className={`font-bold text-sm ${item.color}`}>{item.val} <span className="text-gray-500 font-normal text-xs">{item.unit}</span></span>
                    </div>
                  ))}
                </div>
                <button onClick={handlePublish} disabled={publishing}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}bb)` }}>
                  {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {publishing ? 'Mengirim...' : 'Publish ke Layar'}
                </button>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-3">🔗 Link Player</h2>
                <a href="/player?client=PRAMITHA" target="_blank" rel="noopener noreferrer"
                  className="block p-3 bg-gray-800 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-400">/player?client=PRAMITHA</span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </div>
                </a>
                <p className="text-xs text-gray-600 mt-2">Tekan F11 untuk fullscreen</p>
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT */}
        {tab === 'layout' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Layout Editor</h2>
                <p className="text-sm text-gray-400 mt-0.5">Seret zona · Resize sudut · Klik mata untuk sembunyikan</p>
              </div>
              <button onClick={handlePublish} disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: themeColor }}>
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Simpan & Publish
              </button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <LayoutEditor layout={layoutConfig} onChange={setLayoutConfig} />
            </div>
          </div>
        )}

        {/* JADWAL */}
        {tab === 'schedule' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Jadwal Dokter / Layanan</h2>
                <p className="text-sm text-gray-400 mt-0.5">Publish agar perubahan muncul di layar</p>
              </div>
              <button onClick={handlePublish} disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: themeColor }}>
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Simpan & Publish
              </button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <ScheduleEditor rows={scheduleTable} onChange={setScheduleTable} />
            </div>
          </div>
        )}

        {/* MEDIA */}
        {tab === 'media' && (
          <div className="max-w-2xl">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-green-400" /> Library Gambar
                <span className="ml-auto text-xs text-gray-500">{images.length} file</span>
              </h2>
              <MediaUpload type="IMAGE" items={images}
                onRefresh={() => fetchImages().then(r => setImages(r.data))}
                label="Upload gambar JPG/PNG/WebP" />
            </div>
          </div>
        )}

        {/* SETTINGS */}
        {tab === 'settings' && (
          <div className="max-w-xl space-y-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <Palette size={16} className="text-pink-400" /> Identitas & Tema
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Nama Klinik</label>
                  <input className="input" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Klinik Pramitha" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Warna Tema</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent" />
                    <input className="input flex-1 font-mono text-sm" value={themeColor} onChange={e => setThemeColor(e.target.value)} />
                    <div className="w-10 h-10 rounded-lg border border-gray-700" style={{ background: themeColor }} />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {['#dc2626','#2563eb','#16a34a','#9333ea','#ea580c','#0891b2'].map(c => (
                      <button key={c} onClick={() => setThemeColor(c)}
                        className="w-7 h-7 rounded-lg border-2 transition-all"
                        style={{ background: c, borderColor: themeColor === c ? '#fff' : 'transparent' }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Password info */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Lock size={16} className="text-red-400" /> Keamanan CMS
              </h2>
              <p className="text-sm text-gray-400">
                Password CMS diatur di file <code className="text-yellow-400 bg-gray-800 px-1.5 py-0.5 rounded">frontend/pages/admin.tsx</code> pada baris:
              </p>
              <div className="mt-2 bg-gray-800 rounded-lg px-3 py-2 font-mono text-xs text-green-300">
                const CMS_PASSWORD = '{`pramitha2024`}';
              </div>
              <p className="text-xs text-gray-600 mt-2">Ganti nilainya lalu push ke GitHub untuk memperbarui password.</p>
              <button onClick={() => { if(confirm('Keluar dari CMS?')) { clearSession(); window.location.reload(); } }}
                className="mt-4 w-full py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-800 hover:bg-red-900/20 flex items-center justify-center gap-2 transition-colors">
                <LogOut size={14} /> Keluar / Logout
              </button>
            </div>

            <button onClick={handlePublish} disabled={publishing}
              className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: themeColor }}>
              {publishing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              Simpan Semua Pengaturan
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes marquee {
          0%   { transform: translateX(100%); }
          100% { transform: translateX(-200%); }
        }
      `}</style>
    </div>
  );
}
