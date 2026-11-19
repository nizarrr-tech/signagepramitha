import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ChevronRight, RotateCcw, Hash, Settings, Loader2,
  Volume2, RefreshCw, AlertCircle, CheckCircle2, LogOut
} from 'lucide-react';
import NavBar from '../components/NavBar';
import LoginGate from '../components/LoginGate';
import { fetchQueue, callQueue, resetQueue, updateLoket } from '../lib/api';
import { getSocket } from '../lib/socket';
import { clearSession } from '../lib/auth';

const CLIENT_ID = 'PRAMITHA';

interface Slot {
  id: string;
  slotNumber: number;
  loketName: string;
  currentNumber: string;
  updatedAt: string;
}

const SLOT_COLORS = [
  'from-blue-900/40 to-blue-800/20 border-blue-700',
  'from-green-900/40 to-green-800/20 border-green-700',
  'from-purple-900/40 to-purple-800/20 border-purple-700',
  'from-orange-900/40 to-orange-800/20 border-orange-700',
  'from-red-900/40 to-red-800/20 border-red-700',
];
const NUM_COLORS = ['text-blue-300','text-green-300','text-purple-300','text-orange-300','text-red-300'];
const BTN_COLORS = [
  'bg-blue-700 hover:bg-blue-600',
  'bg-green-700 hover:bg-green-600',
  'bg-purple-700 hover:bg-purple-600',
  'bg-orange-700 hover:bg-orange-600',
  'bg-red-700 hover:bg-red-600',
];

export default function OperatorPage() {
  return (
    <LoginGate title="Panel Operator Antrian">
      <OperatorContent />
    </LoginGate>
  );
}

function OperatorContent() {
  const [slots,        setSlots]        = useState<Slot[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [calling,      setCalling]      = useState<number | null>(null);
  const [manualNums,   setManualNums]   = useState<Record<number, string>>({});
  const [editingLoket, setEditingLoket] = useState<number | null>(null);
  const [loketNames,   setLoketNames]   = useState<Record<number, string>>({});
  const [lastCalled,   setLastCalled]   = useState<{ slotNumber: number; loketName: string; number: string } | null>(null);
  const [socketStatus, setSocketStatus] = useState<'connecting'|'connected'|'disconnected'>('connecting');

  const loadSlots = useCallback(async () => {
    try {
      const res = await fetchQueue(CLIENT_ID);
      setSlots(res.data);
      const names: Record<number, string> = {};
      res.data.forEach((s: Slot) => { names[s.slotNumber] = s.loketName; });
      setLoketNames(names);
    } catch { toast.error('Gagal memuat data antrian'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadSlots();
    const socket = getSocket();
    socket.on('connect',    () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on(`queue:${CLIENT_ID}`, (data: any) => {
      setSlots(prev => prev.map(s => s.slotNumber === data.slotNumber ? { ...s, ...data } : s));
    });
    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off(`queue:${CLIENT_ID}`);
    };
  }, [loadSlots]);

  const handleCall = async (slot: Slot, action: 'next'|'repeat'|'manual') => {
    setCalling(slot.slotNumber);
    try {
      const body: any = { slotNumber: slot.slotNumber, action };
      if (action === 'manual') {
        const num = manualNums[slot.slotNumber];
        if (!num?.trim()) { toast.error('Masukkan nomor antrian manual'); return; }
        body.number = num.trim();
      }
      const res = await callQueue(CLIENT_ID, body);
      const updated = res.data.slot;
      setSlots(prev => prev.map(s => s.slotNumber === slot.slotNumber ? { ...s, ...updated } : s));
      setLastCalled({ slotNumber: updated.slotNumber, loketName: updated.loketName, number: updated.currentNumber });
      toast.success(res.data.message, { duration: 3000 });
      if (action === 'manual') setManualNums(prev => ({ ...prev, [slot.slotNumber]: '' }));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memanggil antrian');
    } finally { setCalling(null); }
  };

  const handleResetAll = async () => {
    if (!confirm('Reset semua nomor antrian ke 000?')) return;
    try { await resetQueue(CLIENT_ID); await loadSlots(); toast.success('Semua antrian direset'); }
    catch { toast.error('Reset gagal'); }
  };

  const handleSaveLoket = async (slotNumber: number) => {
    try {
      await updateLoket(CLIENT_ID, { slotNumber, loketName: loketNames[slotNumber] });
      setSlots(prev => prev.map(s => s.slotNumber === slotNumber ? { ...s, loketName: loketNames[slotNumber] } : s));
      setEditingLoket(null);
      toast.success('Nama loket diperbarui');
    } catch { toast.error('Gagal menyimpan nama loket'); }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-500" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="max-w-screen-xl mx-auto w-full px-4 py-6 flex-1">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel Operator Antrian</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Client: <span className="text-blue-400 font-mono">{CLIENT_ID}</span>
              <span className={`ml-3 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                socketStatus==='connected'    ? 'bg-green-900/50 text-green-400' :
                socketStatus==='disconnected' ? 'bg-red-900/50 text-red-400' :
                'bg-yellow-900/50 text-yellow-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  socketStatus==='connected'    ? 'bg-green-400' :
                  socketStatus==='disconnected' ? 'bg-red-400' : 'bg-yellow-400 animate-pulse'}`} />
                {socketStatus==='connected' ? 'Live' : socketStatus==='disconnected' ? 'Offline' : 'Connecting...'}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadSlots} className="btn-secondary flex items-center gap-2 text-sm py-2">
              <RefreshCw size={14} /> Refresh
            </button>
            <button onClick={handleResetAll} className="btn-danger flex items-center gap-2 text-sm py-2">
              <RotateCcw size={14} /> Reset Semua
            </button>
            <button
              onClick={() => { if(confirm('Keluar dari panel?')) { clearSession(); window.location.reload(); } }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-700 text-gray-500 hover:text-red-400 hover:border-red-700 text-sm transition-colors"
              title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* Last Called */}
        {lastCalled && (
          <div className="mb-5 bg-green-900/30 border border-green-700 rounded-xl px-5 py-4 flex items-center gap-3">
            <CheckCircle2 size={20} className="text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-200 font-semibold">Terakhir dipanggil</p>
              <p className="text-green-300 text-sm">
                Nomor <span className="font-mono font-bold text-lg">{lastCalled.number}</span> →{' '}
                <span className="font-semibold">{lastCalled.loketName}</span>
              </p>
            </div>
          </div>
        )}

        {/* Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {slots.map(slot => {
            const ci = slot.slotNumber - 1;
            const isCalling = calling === slot.slotNumber;
            return (
              <div key={slot.slotNumber} className={`rounded-2xl border bg-gradient-to-br p-5 ${SLOT_COLORS[ci]}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm ${BTN_COLORS[ci]}`}>
                      {slot.slotNumber}
                    </div>
                    {editingLoket === slot.slotNumber ? (
                      <div className="flex items-center gap-1">
                        <input className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white w-28"
                          value={loketNames[slot.slotNumber] || ''}
                          onChange={e => setLoketNames(prev => ({ ...prev, [slot.slotNumber]: e.target.value }))}
                          onKeyDown={e => { if(e.key==='Enter') handleSaveLoket(slot.slotNumber); }} autoFocus />
                        <button onClick={() => handleSaveLoket(slot.slotNumber)} className="text-green-400 text-xs font-bold">✓</button>
                        <button onClick={() => setEditingLoket(null)} className="text-gray-400 text-xs">✕</button>
                      </div>
                    ) : (
                      <span className="font-bold text-white text-lg cursor-pointer hover:underline"
                        onClick={() => setEditingLoket(slot.slotNumber)}>
                        {slot.loketName}
                      </span>
                    )}
                  </div>
                  <button onClick={() => setEditingLoket(slot.slotNumber)} className="text-gray-500 hover:text-gray-300">
                    <Settings size={14} />
                  </button>
                </div>

                <div className="text-center py-4 my-2 bg-black/30 rounded-xl">
                  <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Nomor Antrian</p>
                  <p className={`text-5xl font-black font-mono tracking-wider ${NUM_COLORS[ci]}`}>
                    {slot.currentNumber || '—'}
                  </p>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleCall(slot, 'next')} disabled={isCalling}
                      className={`${BTN_COLORS[ci]} text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-sm`}>
                      {isCalling ? <Loader2 size={16} className="animate-spin" /> : <ChevronRight size={18} />}
                      Panggil +1
                    </button>
                    <button onClick={() => handleCall(slot, 'repeat')} disabled={isCalling}
                      className="bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 disabled:opacity-50 text-sm">
                      <Volume2 size={16} /> Ulang
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      className="bg-black/40 border border-gray-600 text-white rounded-xl px-3 py-2 flex-1 text-center font-mono text-sm placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-current"
                      placeholder="A001 / 015"
                      value={manualNums[slot.slotNumber] || ''}
                      onChange={e => setManualNums(prev => ({ ...prev, [slot.slotNumber]: e.target.value.toUpperCase() }))}
                      onKeyDown={e => { if(e.key==='Enter') handleCall(slot, 'manual'); }} />
                    <button onClick={() => handleCall(slot, 'manual')}
                      disabled={isCalling || !manualNums[slot.slotNumber]?.trim()}
                      className="bg-gray-700 hover:bg-gray-600 text-white rounded-xl px-3 py-2 disabled:opacity-40">
                      <Hash size={16} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3 text-right">
                  {new Date(slot.updatedAt).toLocaleTimeString('id-ID')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-400">
            <p className="font-medium text-gray-300 mb-1">Panduan Operator</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-white">Panggil +1</strong>: Tambah 1 dari nomor sebelumnya (A001 → A002)</li>
              <li><strong className="text-white">Ulang</strong>: Panggil ulang nomor yang sama</li>
              <li><strong className="text-white">Manual</strong>: Ketik nomor spesifik lalu tekan Enter</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
