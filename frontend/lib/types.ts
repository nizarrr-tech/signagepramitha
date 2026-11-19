// ─── Zone types ───────────────────────────────────────────
export interface ZoneRect {
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
}

// Extra zone types that can be added in the Layout Editor
export type CustomZoneType =
  | 'table2'      // jadwal dokter ke-2
  | 'text'        // teks statis
  | 'image'       // gambar statis
  | 'colorbox'    // kotak warna solid
  | 'clock'       // jam tambahan
  | 'rtext2';     // running text ke-2

export interface CustomZone extends ZoneRect {
  id:        string;
  type:      CustomZoneType;
  label:     string;
  // content — depends on type
  text?:     string;         // for 'text' | 'rtext2'
  imageUrl?: string;         // for 'image'
  color?:    string;         // for 'colorbox' | text background
  fontSize?: number;         // for 'text'
  opacity?:  number;         // 0–1
}

// ─── Fixed layout ─────────────────────────────────────────
export interface LayoutConfig {
  bg:       ZoneRect;
  slot1:    ZoneRect;
  slot2:    ZoneRect;
  slot3:    ZoneRect;
  slot4:    ZoneRect;
  slot5:    ZoneRect;
  video:    ZoneRect;
  slide:    ZoneRect;
  table:    ZoneRect;
  rtext:    ZoneRect;
  datetime: ZoneRect;
  // Extra zones added by user
  extras?:  CustomZone[];
}

export const DEFAULT_LAYOUT: LayoutConfig = {
  bg:       { x: 0,    y: 0,    w: 1920, h: 1080, visible: true },
  slot1:    { x: 5,    y: 9,    w: 597,  h: 190,  visible: true },
  slot2:    { x: 5,    y: 203,  w: 597,  h: 190,  visible: true },
  slot3:    { x: 5,    y: 397,  w: 597,  h: 190,  visible: true },
  slot4:    { x: 5,    y: 590,  w: 597,  h: 190,  visible: true },
  slot5:    { x: 5,    y: 784,  w: 597,  h: 190,  visible: true },
  video:    { x: 628,  y: 155,  w: 1274, h: 622,  visible: true },
  slide:    { x: 625,  y: 790,  w: 640,  h: 188,  visible: true },
  table:    { x: 1272, y: 790,  w: 639,  h: 188,  visible: true },
  rtext:    { x: 0,    y: 1011, w: 1551, h: 67,   visible: true },
  datetime: { x: 1562, y: 994,  w: 347,  h: 79,   visible: true },
  extras:   [],
};

export const ZONE_LABELS: Record<keyof Omit<LayoutConfig, 'extras'>, string> = {
  bg:       'Background',
  slot1:    'Antrian 1',
  slot2:    'Antrian 2',
  slot3:    'Antrian 3',
  slot4:    'Antrian 4',
  slot5:    'Antrian 5',
  video:    'Video Player',
  slide:    'Slideshow',
  table:    'Jadwal / Tabel',
  rtext:    'Running Text',
  datetime: 'Jam & Tanggal',
};

export const CUSTOM_ZONE_OPTIONS: { type: CustomZoneType; label: string; icon: string; desc: string }[] = [
  { type: 'table2',   label: 'Tabel Jadwal 2',    icon: '📋', desc: 'Tabel jadwal dokter tambahan' },
  { type: 'text',     label: 'Teks Statis',        icon: '✏️', desc: 'Kotak teks bebas' },
  { type: 'rtext2',   label: 'Running Text 2',     icon: '📢', desc: 'Teks berjalan tambahan' },
  { type: 'image',    label: 'Gambar Statis',      icon: '🖼️', desc: 'Gambar/logo tambahan' },
  { type: 'colorbox', label: 'Kotak Warna',        icon: '🟥', desc: 'Kotak warna solid / divider' },
  { type: 'clock',    label: 'Jam Tambahan',       icon: '🕐', desc: 'Jam & tanggal ke-2' },
];

// ─── Other model types ────────────────────────────────────
export interface ScheduleRow { poli: string; dokter: string; jam: string; }
export interface Media        { id: string; filename: string; url: string; type: 'VIDEO' | 'IMAGE'; createdAt: string; }
export interface QueueSlot    { slotNumber: number; loketName: string; currentNumber: string; updatedAt: string; }
export interface Channel      { id: string; code: number; name: string; }

export interface SignageContent {
  videoUrls:     string[];
  slideUrls:     string[];
  runningText:   string;
  scheduleTable: ScheduleRow[];
  backgroundUrl: string;
  layoutConfig:  LayoutConfig;
  clinicName:    string;
  themeColor:    string;
}
