import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Monitor, Film, Image as ImageIcon, AlignLeft, Calendar,
  Tv, Send, Loader2, Trash2, Plus, Layout, Settings,
  Eye, Upload, X, ChevronRight, Palette
} from 'lucide-react';
import NavBar from '../components/NavBar';
import MediaUpload from '../components/MediaUpload';
import ScheduleEditor from '../components/ScheduleEditor';
import LayoutEditor from '../components/LayoutEditor';
import {
  fetchSignageConfig, updateSignageContent,
  fetchVideos, fetchImages, fetchChannels, createChannel, deleteChannel,
  uploadFile, API_URL,
} from '../lib/api';
import {
  Media, ScheduleRow, Channel, SignageContent,
  LayoutConfig, DEFAULT_LAYOUT
} from '../lib/types';

const CLIENT_ID = 'PRAMITHA';

const TABS = [
  { id: 'content',  label: 'Konten',       icon: Monitor },
  { id: 'layout',   label: 'Layout Editor', icon: Layout  },
  { id: 'schedule', label: 'Jadwal',        icon: Calendar },
  { id: 'media',    label: 'Media Library', icon: Film    },
  { id: 'channel',  label: 'Channel TV',    icon: Tv      },
  { id: 'settings', label: 'Pengaturan',    icon: Settings },
] as const;

type TabId = typeof TABS[number]['id'];

export default function AdminPage() {
  const [loading,    setLoading]    = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [tab,        setTab]        = useState<TabId>('content');

  // Content state
  const [videoUrls,     setVideoUrls]     = useState<string[]>([]);
  const [slideUrls,     setSlideUrls]     = useState<string[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState('');
  const [runningText,   setRunningText]   = useState('');
  const [scheduleTable, setScheduleTable] = useState<ScheduleRow[]>([]);
  const [layoutConfig,  setLayoutConfig]  = useState<LayoutConfig>(DEFAULT_LAYOUT);
  const [clinicName,    setClinicName]    = useState('Klinik Pramitha');
  const [themeColor,    setThemeColor]    = useState('#dc2626');

  // Library
  const [videos,   setVideos]   = useState<Media[]>([]);
  const [images,   setImages]   = useState<Media[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [newChCode,  setNewChCode]  = useState('');
  const [newChName,  setNewChName]  = useState('');
  const [bgUploading, setBgUploading] = useState(false);

  const loadAll = useCallback(async () => {
    try {
      const [cfg, vids, imgs, chs] = await Promise.all([
        fetchSignageConfig(CLIENT_ID),
        fetchVideos(), fetchImages(), fetchChannels(),
      ]);
      const c: SignageContent = cfg.data.content;
      setVideoUrls(c.videoUrls || []);
      setSlideUrls(c.slideUrls || []);
      setBackgroundUrl(c.backgroundUrl || '');
      setRunningText(c.runningText || '');
      setScheduleTable(c.scheduleTable || []);
      setLayoutConfig(c.layoutConfig || DEFAULT_LAYOUT);
      setClinicName(c.clinicName || 'Klinik Pramitha');
      setThemeColor(c.themeColor || '#dc2626');
      setVideos(vids.data);
      setImages(imgs.data);
      setChannels(chs.data);
    } catch { toast.error('Gagal memuat konfigurasi'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePublish = async () => {
    setPublishing(true);
    try {
      await updateSignageContent(CLIENT_ID, {
        videoUrls, slideUrls, backgroundUrl, runningText,
        scheduleTable, layoutConfig, clinicName, themeColor,
      });
      toast.success('✅ Semua perubahan berhasil dikirim ke layar!', { duration: 4000 });
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

  const handleAddChannel = async () => {
    if (!newChCode || !newChName) return toast.error('Isi kode dan nama');
    try {
      await createChannel({ code: parseInt(newChCode), name: newChName });
      setNewChCode(''); setNewChName('');
      fetchChannels().then(r => setChannels(r.data));
      toast.success('Channel ditambahkan');
    } catch { toast.error('Gagal'); }
  };

  const handleDeleteChannel = async (id: string) => {
    try {
      await deleteChannel(id);
      setChannels(prev => prev.filter(c => c.id !== id));
      toast.success('Channel dihapus');
    } catch { toast.error('Gagal menghapus'); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-red-500 mx-auto mb-3" />
          <p className="text-gray-400">Memuat konfigurasi...</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gray-950">
      <NavBar />

      {/* ── Page Header ── */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-screen-2xl mx-auto px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: themeColor + '33', border: `1px solid ${themeColor}66` }}>
                <Monitor size={18} style={{ color: themeColor }} />
              </div>
              <div>
                <h1 className="font-bold text-white text-base leading-tight">{clinicName}</h1>
                <p className="text-xs text-gray-500">Client ID: <span className="font-mono text-red-400">{CLIENT_ID}</span></p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`http://localhost:3002?client=${CLIENT_ID}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 text-sm transition-colors"
              >
                <Eye size={15} /> Preview
              </a>
              <button
                onClick={handlePublish}
                disabled={publishing}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}cc)` }}
              >
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                {publishing ? 'Mengirim...' : 'Publish ke Layar'}
              </button>
            </div>
          </div>

          {/* Tab Nav */}
          <div className="flex gap-1 pb-0">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    active
                      ? 'text-white border-red-500'
                      : 'text-gray-500 border-transparent hover:text-gray-300'
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="max-w-screen-2xl mx-auto w-full px-6 py-6 flex-1">

        {/* ══ TAB: KONTEN ══ */}
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
                        <button
                          onClick={(e) => { e.preventDefault(); setBackgroundUrl(''); }}
                          className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white"
                        ><X size={12} /></button>
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

              {/* Video Playlist */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Film size={16} className="text-purple-400" /> Playlist Video
                  <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{videoUrls.length} dipilih</span>
                </h2>
                <MediaUpload
                  type="VIDEO" items={videos}
                  onRefresh={() => fetchVideos().then(r => setVideos(r.data))}
                  onSelect={url => setVideoUrls(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url])}
                  selectedUrls={videoUrls} label="Klik untuk pilih / batalkan"
                />
                {videoUrls.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {videoUrls.map((url, i) => (
                      <div key={url} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                        <span className="text-gray-600 text-xs w-4">{i+1}</span>
                        <Film size={12} className="text-purple-400 flex-shrink-0" />
                        <span className="text-gray-300 text-xs flex-1 truncate font-mono">{url}</span>
                        <button onClick={() => setVideoUrls(p => p.filter(u => u !== url))} className="text-red-500 hover:text-red-400">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Slideshow */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <ImageIcon size={16} className="text-green-400" /> Slideshow Gambar
                  <span className="ml-auto text-xs font-normal text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">{slideUrls.length} dipilih</span>
                </h2>
                <MediaUpload
                  type="IMAGE" items={images}
                  onRefresh={() => fetchImages().then(r => setImages(r.data))}
                  onSelect={url => setSlideUrls(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url])}
                  selectedUrls={slideUrls} label="Klik untuk pilih / batalkan"
                />
                {slideUrls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {slideUrls.map(url => (
                      <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-600 group">
                        <img src={`${API_URL}${url}`} className="w-full h-full object-cover" alt="" />
                        <button
                          onClick={() => setSlideUrls(p => p.filter(u => u !== url))}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        ><X size={14} className="text-red-400" /></button>
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
                <textarea
                  className="input min-h-[72px] resize-none text-sm"
                  value={runningText}
                  onChange={e => setRunningText(e.target.value)}
                  placeholder="Selamat datang di Klinik Pramitha..."
                />
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
              {/* Summary card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-4">📊 Ringkasan Konten</h2>
                <div className="space-y-2.5">
                  {[
                    { label: 'Video playlist',    val: videoUrls.length,     unit: 'file',  color: 'text-purple-400' },
                    { label: 'Slide aktif',        val: slideUrls.length,     unit: 'gambar', color: 'text-green-400' },
                    { label: 'Baris jadwal',       val: scheduleTable.length, unit: 'baris', color: 'text-orange-400' },
                    { label: 'Background',         val: backgroundUrl ? '✓ Ada' : '—', unit: '', color: 'text-yellow-400' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <span className="text-gray-400 text-sm">{item.label}</span>
                      <span className={`font-bold text-sm ${item.color}`}>{item.val} <span className="text-gray-500 font-normal text-xs">{item.unit}</span></span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handlePublish} disabled={publishing}
                  className="mt-4 w-full py-2.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                  style={{ background: `linear-gradient(135deg, ${themeColor}, ${themeColor}bb)` }}
                >
                  {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  {publishing ? 'Mengirim...' : 'Publish ke Layar'}
                </button>
              </div>

              {/* Player link */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-white mb-3">🔗 Link Player</h2>
                <a
                  href={`http://localhost:3002?client=${CLIENT_ID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 bg-gray-800 hover:bg-gray-750 rounded-xl border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-blue-400">localhost:3002?client={CLIENT_ID}</span>
                    <ChevronRight size={14} className="text-gray-500" />
                  </div>
                </a>
                <p className="text-xs text-gray-600 mt-2">Tekan F11 di browser layar untuk fullscreen</p>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: LAYOUT EDITOR ══ */}
        {tab === 'layout' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Layout Editor</h2>
                <p className="text-sm text-gray-400 mt-0.5">Seret zona untuk memindahkan · Seret sudut untuk resize · Klik mata untuk sembunyikan</p>
              </div>
              <button
                onClick={handlePublish} disabled={publishing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: themeColor }}
              >
                {publishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Simpan & Publish
              </button>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <LayoutEditor layout={layoutConfig} onChange={setLayoutConfig} />
            </div>
          </div>
        )}

        {/* ══ TAB: JADWAL ══ */}
        {tab === 'schedule' && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-white">Jadwal Dokter / Layanan</h2>
                <p className="text-sm text-gray-400 mt-0.5">Perubahan langsung muncul di tabel layar setelah di-publish</p>
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

        {/* ══ TAB: MEDIA LIBRARY ══ */}
        {tab === 'media' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Film size={16} className="text-purple-400" /> Library Video
                <span className="ml-auto text-xs text-gray-500">{videos.length} file</span>
              </h2>
              <MediaUpload type="VIDEO" items={videos}
                onRefresh={() => fetchVideos().then(r => setVideos(r.data))}
                label="Upload video MP4/WebM" />
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <ImageIcon size={16} className="text-green-400" /> Library Gambar
                <span className="ml-auto text-xs text-gray-500">{images.length} file</span>
              </h2>
              <MediaUpload type="IMAGE" items={images}
                onRefresh={() => fetchImages().then(r => setImages(r.data))}
                label="Upload gambar JPG/PNG" />
            </div>
          </div>
        )}

        {/* ══ TAB: CHANNEL TV ══ */}
        {tab === 'channel' && (
          <div className="max-w-xl">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Tv size={16} className="text-indigo-400" /> Daftar Channel TV
              </h2>
              <div className="space-y-1.5 mb-4 max-h-72 overflow-y-auto">
                {channels.map(ch => (
                  <div key={ch.id} className="flex items-center gap-3 bg-gray-800 hover:bg-gray-750 rounded-xl px-4 py-2.5 group">
                    <span className="font-mono text-xs text-gray-500 w-10">{ch.code}</span>
                    <span className="text-sm font-medium text-white flex-1">{ch.name}</span>
                    <button onClick={() => handleDeleteChannel(ch.id)} className="text-gray-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                {channels.length === 0 && <p className="text-gray-600 text-sm text-center py-4">Belum ada channel</p>}
              </div>
              <div className="border-t border-gray-800 pt-4">
                <p className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">Tambah Channel</p>
                <div className="flex gap-2">
                  <input className="input w-20 text-sm py-2" placeholder="Kode" value={newChCode} onChange={e => setNewChCode(e.target.value)} type="number" />
                  <input className="input flex-1 text-sm py-2" placeholder="Nama Channel" value={newChName} onChange={e => setNewChName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddChannel()} />
                  <button onClick={handleAddChannel} className="px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: themeColor }}>
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: SETTINGS ══ */}
        {tab === 'settings' && (
          <div className="max-w-xl space-y-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-5 flex items-center gap-2">
                <Palette size={16} className="text-pink-400" /> Identitas & Tema
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Nama Klinik / Instansi</label>
                  <input className="input" value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Klinik Pramitha" />
                  <p className="text-xs text-gray-600 mt-1">Muncul sebagai overlay di pojok video player</p>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5 block">Warna Tema Utama</label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={themeColor} onChange={e => setThemeColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent" />
                    <input className="input flex-1 font-mono text-sm" value={themeColor} onChange={e => setThemeColor(e.target.value)} />
                    <div className="w-10 h-10 rounded-lg border border-gray-700 flex-shrink-0" style={{ background: themeColor }} />
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

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Settings size={16} className="text-gray-400" /> Informasi Sistem
              </h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Client ID',    val: CLIENT_ID,              mono: true },
                  { label: 'Backend API',  val: 'http://localhost:3001', mono: true },
                  { label: 'Player URL',   val: `http://localhost:3002?client=${CLIENT_ID}`, mono: true },
                  { label: 'Canvas',       val: '1920 × 1080 px',       mono: false },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-800 last:border-0">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={item.mono ? 'font-mono text-blue-400' : 'text-white'}>{item.val}</span>
                  </div>
                ))}
              </div>
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
