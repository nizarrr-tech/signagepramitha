import { useState, useRef } from 'react';
import { Upload, Trash2, Film, Image, Loader2 } from 'lucide-react';
import { uploadFile, deleteMedia, API_URL } from '../lib/api';
import toast from 'react-hot-toast';

interface Media {
  id: string;
  filename: string;
  url: string;
  type: 'VIDEO' | 'IMAGE';
  createdAt: string;
}

interface Props {
  type: 'VIDEO' | 'IMAGE';
  items: Media[];
  onRefresh: () => void;
  onSelect?: (url: string) => void;
  selectedUrls?: string[];
  label: string;
}

export default function MediaUpload({ type, items, onRefresh, onSelect, selectedUrls = [], label }: Props) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const accept = type === 'VIDEO' ? 'video/mp4,video/webm,video/quicktime' : 'image/*';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        await uploadFile(fd);
      }
      toast.success(`${files.length} file berhasil diupload`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Upload gagal');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus file ini?')) return;
    try {
      await deleteMedia(id);
      toast.success('File dihapus');
      onRefresh();
    } catch {
      toast.error('Gagal menghapus file');
    }
  };

  const Icon = type === 'VIDEO' ? Film : Image;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-200 flex items-center gap-2">
          <Icon size={16} className={type === 'VIDEO' ? 'text-purple-400' : 'text-green-400'} />
          {label}
        </h3>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="btn-primary text-sm flex items-center gap-2 py-1.5"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload
        </button>
        <input ref={fileRef} type="file" accept={accept} multiple hidden onChange={handleUpload} />
      </div>

      {items.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Icon size={32} className="mx-auto mb-2 text-gray-600" />
          <p className="text-gray-500 text-sm">Klik atau drag file ke sini</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => {
            const isSelected = selectedUrls.includes(item.url);
            return (
              <div
                key={item.id}
                className={`relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  isSelected ? 'border-blue-500' : 'border-gray-700 hover:border-gray-500'
                }`}
                onClick={() => onSelect?.(item.url)}
              >
                {type === 'IMAGE' ? (
                  <img
                    src={`${API_URL}${item.url}`}
                    alt={item.filename}
                    className="w-full h-20 object-cover"
                  />
                ) : (
                  <div className="w-full h-20 bg-gray-800 flex items-center justify-center">
                    <Film size={24} className="text-purple-400" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                  <div className="p-2 w-full flex items-center justify-between">
                    <span className="text-xs text-white truncate max-w-[80%]">{item.filename}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
