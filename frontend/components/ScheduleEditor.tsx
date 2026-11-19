import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Row {
  poli: string;
  dokter: string;
  jam: string;
}

interface Props {
  rows: Row[];
  onChange: (rows: Row[]) => void;
}

export default function ScheduleEditor({ rows, onChange }: Props) {
  const updateRow = (idx: number, field: keyof Row, value: string) => {
    const updated = [...rows];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const addRow = () => {
    onChange([...rows, { poli: '', dokter: '', jam: '' }]);
  };

  const removeRow = (idx: number) => {
    onChange(rows.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-800 text-gray-300">
              <th className="text-left px-3 py-2 w-8">#</th>
              <th className="text-left px-3 py-2">Poli / Layanan</th>
              <th className="text-left px-3 py-2">Dokter / Petugas</th>
              <th className="text-left px-3 py-2">Jam</th>
              <th className="w-10 px-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-6 text-gray-500">
                  Belum ada jadwal. Klik "+ Tambah Baris" untuk menambah.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx} className="border-t border-gray-700 hover:bg-gray-800/50">
                  <td className="px-3 py-1.5 text-gray-500">{idx + 1}</td>
                  <td className="px-2 py-1.5">
                    <input
                      className="input text-sm py-1"
                      value={row.poli}
                      onChange={(e) => updateRow(idx, 'poli', e.target.value)}
                      placeholder="Poli Umum"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="input text-sm py-1"
                      value={row.dokter}
                      onChange={(e) => updateRow(idx, 'dokter', e.target.value)}
                      placeholder="dr. Nama"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      className="input text-sm py-1 w-32"
                      value={row.jam}
                      onChange={(e) => updateRow(idx, 'jam', e.target.value)}
                      placeholder="08:00 - 12:00"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-300 p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <button onClick={addRow} className="mt-2 btn-secondary text-sm flex items-center gap-1 py-1.5">
        <Plus size={14} /> Tambah Baris
      </button>
    </div>
  );
}
