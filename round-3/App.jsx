import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';

/*
 * Tur 3 — Dönem Planlayıcı (Eleştiri ve Team learnings sonrası)
 * Persona: Semih Aydın (25, Makine Mühendisliği 3. sınıf, SAE Formula topluluğu)
 * Dials: neutral=warm, accent=teal, shape=soft, density=comfortable, theme=dark (+ light + colorblind)
 * Team learnings applied:
 *   1. Büyütülmüş 5'li göz konforu tipografi ölçeği (14 / 16 / 19 / 28 / 34px), blok başlığı 16px --text, meta 14px --text-2.
 *   2. Ana aksiyon (+ Yeni teslim ekle) sayfa başlığının sağ üstünde (above the fold); Haftalık Program'da sürükle-bırak/uzat/kısalt
 *      Düzenleme Modu + ders/etkinlik ekleme-çıkarma + Geri al (Ctrl+Z); tüm formlarda Zorunlu/İsteğe bağlı + yardımcı metin + anlık doğrulama.
 */

const DIALS = {
  neutral: 'warm',
  accent: 'teal',
  shape: 'soft',
  density: 'comfortable',
};

const DAYS = [
  { idx: 0, short: 'Pzt', full: 'Pazartesi', dateLabel: '23 Kas' },
  { idx: 1, short: 'Sal', full: 'Salı', dateLabel: '24 Kas' },
  { idx: 2, short: 'Çar', full: 'Çarşamba', dateLabel: '25 Kas' },
  { idx: 3, short: 'Per', full: 'Perşembe', dateLabel: '26 Kas', isToday: true },
  { idx: 4, short: 'Cum', full: 'Cuma', dateLabel: '27 Kas' },
];

const COURSES = [
  { code: 'MAK301', name: 'Termodinamik II', instructor: 'Prof. Dr. Haluk Eren' },
  { code: 'MAK303', name: 'Akışkanlar Mekaniği', instructor: 'Doç. Dr. Selin Kaya' },
  { code: 'MAK305', name: 'Mukavemet II', instructor: 'Dr. Öğr. Üyesi Mert Aksoy' },
  { code: 'MAK307', name: 'Makine Elemanları I', instructor: 'Prof. Dr. Orhan Yıldız' },
  { code: 'MAK309', name: 'Üretim Yöntemleri Lab', instructor: 'Arş. Gör. Emre Çetin' },
  { code: 'MAK311', name: 'Sayısal Yöntemler', instructor: 'Dr. Öğr. Üyesi Deniz Arslan' },
  { code: 'SAE', name: 'SAE Formula Öğrenci Topluluğu', instructor: 'Takım Kaptanı: Kaan Demir' },
];

const BLOCK_TYPES = {
  ders: 'Ders',
  lab: 'Lab',
  sinav: 'Sınav',
  kulup: 'Kulüp',
};

const TASK_STATUS = {
  baslanmadi: 'Başlanmadı',
  devam: 'Devam',
  teslim: 'Teslim edildi',
};

const INITIAL_BLOCKS = [
  {
    id: 'b1',
    day: 0,
    start: '09:00',
    end: '10:50',
    course: 'MAK301',
    title: 'Termodinamik II',
    type: 'ders',
    place: 'M5 Amfi 2',
    instructor: 'Prof. Dr. Haluk Eren',
    note: 'Rankine çevrimi ve yeniden ısıtmalı sistemler işlenecek. Buhar tablolarını yanında getir.',
    files: [
      { name: 'Hafta07_Rankine_Cevrimi.pdf', size: '2.4 MB' },
      { name: 'Buhar_Tablolari_Ozet.pdf', size: '640 KB' },
    ],
  },
  {
    id: 'b2',
    day: 0,
    start: '13:00',
    end: '14:50',
    course: 'MAK305',
    title: 'Mukavemet II',
    type: 'ders',
    place: 'M3-204',
    instructor: 'Dr. Öğr. Üyesi Mert Aksoy',
    note: 'Eğik eğilme ve bileşik zorlama örnek çözümleri.',
    files: [{ name: 'Mukavemet2_Ornekler.pdf', size: '1.1 MB' }],
  },
  {
    id: 'b3',
    day: 1,
    start: '10:00',
    end: '11:50',
    course: 'MAK303',
    title: 'Akışkanlar Mekaniği',
    type: 'ders',
    place: 'M5 Amfi 1',
    instructor: 'Doç. Dr. Selin Kaya',
    note: 'Boru içi laminer ve türbülanslı akış, Moody diyagramı.',
    files: [{ name: 'Moody_Diyagrami.pdf', size: '480 KB' }],
  },
  {
    id: 'b4',
    day: 1,
    start: '15:00',
    end: '16:50',
    course: 'MAK311',
    title: 'Sayısal Yöntemler',
    type: 'ders',
    place: 'M2 Bilgisayar Lab 3',
    instructor: 'Dr. Öğr. Üyesi Deniz Arslan',
    note: 'MATLAB ile Newton-Raphson uygulaması.',
    files: [{ name: 'Lab05_KokBulma.m', size: '18 KB' }],
  },
  {
    id: 'b5',
    day: 2,
    start: '09:00',
    end: '10:50',
    course: 'MAK307',
    title: 'Makine Elemanları I',
    type: 'ders',
    place: 'M5 Amfi 2',
    instructor: 'Prof. Dr. Orhan Yıldız',
    note: 'Cıvata bağlantıları ve ön gerilme hesabı.',
    files: [{ name: 'Civata_Katalogu_DIN931.pdf', size: '3.2 MB' }],
  },
  {
    id: 'b6',
    day: 2,
    start: '14:00',
    end: '15:50',
    course: 'MAK309',
    title: 'Üretim Yöntemleri Lab',
    type: 'lab',
    place: 'Talaşlı İmalat Atölyesi',
    instructor: 'Arş. Gör. Emre Çetin',
    note: 'CNC torna ölçüm deneyi. İş önlüğü ve koruyucu gözlük zorunlu.',
    files: [{ name: 'Deney04_CNC_Foyu.pdf', size: '920 KB' }],
  },
  {
    id: 'b7',
    day: 2,
    start: '14:30',
    end: '16:00',
    course: 'SAE',
    title: 'SAE Şasi Toplantısı',
    type: 'kulup',
    place: 'Mühendislik Ek Bina B-04',
    instructor: 'Takım Kaptanı: Kaan Demir',
    note: 'Üretim Lab ile çakışıyor — Düzenle modunda sürükleyerek saati kaydırabilirsin.',
    files: [{ name: 'Sasi_Rev3_CAD_Notlari.pdf', size: '4.8 MB' }],
  },
  {
    id: 'b8',
    day: 3,
    start: '10:00',
    end: '11:30',
    course: 'MAK303',
    title: 'Akışkanlar Mekaniği Ara Sınav',
    type: 'sinav',
    place: 'M5 Amfi 2',
    instructor: 'Doç. Dr. Selin Kaya',
    note: 'Bölüm 1–5 dahil. Programlanabilir olmayan hesap makinesi ve tek sayfa formül kağıdı serbest.',
    files: [{ name: 'Sinav_Kapsami_Duyuru.pdf', size: '210 KB' }],
  },
  {
    id: 'b9',
    day: 3,
    start: '14:00',
    end: '15:50',
    course: 'MAK301',
    title: 'Termodinamik II (Problem)',
    type: 'ders',
    place: 'M3-108',
    instructor: 'Prof. Dr. Haluk Eren',
    note: 'Gaz türbinleri Brayton çevrimi problem çözümü.',
    files: [{ name: 'Problem_Seti_04.pdf', size: '510 KB' }],
  },
  {
    id: 'b10',
    day: 3,
    start: '17:30',
    end: '19:00',
    course: 'SAE',
    title: 'Sponsorluk & Bütçe Toplantısı',
    type: 'kulup',
    place: 'Kültür Merkezi Salon 3',
    instructor: 'Takım Kaptanı: Kaan Demir',
    note: 'Haftalık görev dağılımı ve yarışma takvimi güncellemesi.',
    files: [{ name: 'Kasim_Butce_Tablosu.xlsx', size: '145 KB' }],
  },
  {
    id: 'b11',
    day: 4,
    start: '09:00',
    end: '10:50',
    course: 'MAK307',
    title: 'Makine Elemanları I',
    type: 'ders',
    place: 'M5 Amfi 2',
    instructor: 'Prof. Dr. Orhan Yıldız',
    note: 'Mil tasarımı ve yorulma emniyet katsayısı.',
    files: [{ name: 'Mil_Tasarim_Slayt.pdf', size: '2.9 MB' }],
  },
  {
    id: 'b12',
    day: 4,
    start: '13:30',
    end: '15:00',
    course: 'MAK305',
    title: 'Mukavemet II Quiz 2',
    type: 'sinav',
    place: 'M3-204',
    instructor: 'Dr. Öğr. Üyesi Mert Aksoy',
    note: 'Burulma ve kesme gerilmesi. 45 dakikalık kısa sınav.',
    files: [{ name: 'Quiz2_Calisma_Sorulari.pdf', size: '390 KB' }],
  },
];

const INITIAL_TASKS = [
  {
    id: 't1',
    title: 'CNC Torna Ölçüm Lab Raporu',
    course: 'MAK309',
    dueDate: '2026-11-26',
    dueTime: '23:59',
    remaining: 'Bugün · 23:59',
    daysLeft: 0,
    estHours: 2.5,
    status: 'devam',
    place: 'OBYS Ödev Yükleme',
    instructor: 'Arş. Gör. Emre Çetin',
    note: 'Tolerans tablosu ve yüzey pürüzlülüğü ölçümlerini PDF ekine koy.',
    files: [
      { name: 'Rapor_Sablonu.docx', size: '84 KB' },
      { name: 'Olcum_Verileri.csv', size: '12 KB' },
    ],
  },
  {
    id: 't2',
    title: 'Problem Seti 4: Rankine Çevrimi',
    course: 'MAK301',
    dueDate: '2026-11-27',
    dueTime: '17:00',
    remaining: 'Yarın · 17:00',
    daysLeft: 1,
    estHours: 3.0,
    status: 'baslanmadi',
    place: 'M5 Bölüm Sekreterliği / OBYS',
    instructor: 'Prof. Dr. Haluk Eren',
    note: '1–4. sorular el yazısı tarama veya LaTeX PDF olarak teslim edilecek.',
    files: [{ name: 'Termo2_PS4.pdf', size: '430 KB' }],
  },
  {
    id: 't3',
    title: 'MATLAB Kök Bulma Ödevi',
    course: 'MAK311',
    dueDate: '2026-11-29',
    dueTime: '23:59',
    remaining: '3 gün kaldı',
    daysLeft: 3,
    estHours: 2.0,
    status: 'baslanmadi',
    place: 'OBYS',
    instructor: 'Dr. Öğr. Üyesi Deniz Arslan',
    note: 'Newton-Raphson ve Sekant yakınsama grafiğini karşılaştır.',
    files: [{ name: 'Odev03_Yonerge.pdf', size: '290 KB' }],
  },
  {
    id: 't4',
    title: 'Cıvata Bağlantısı Emniyet Hesabı',
    course: 'MAK307',
    dueDate: '2026-12-01',
    dueTime: '18:00',
    remaining: '5 gün kaldı',
    daysLeft: 5,
    estHours: 4.0,
    status: 'devam',
    place: 'OBYS',
    instructor: 'Prof. Dr. Orhan Yıldız',
    note: 'M12 8.8 kalite cıvata için dinamik yük hesabı.',
    files: [{ name: 'Proje_Foyu_Bolum1.pdf', size: '1.6 MB' }],
  },
  {
    id: 't5',
    title: 'Süspansiyon Salıncak CAD Revizyonu',
    course: 'SAE',
    dueDate: '2026-11-25',
    dueTime: '20:00',
    remaining: 'Tamamlandı',
    daysLeft: -1,
    estHours: 3.5,
    status: 'teslim',
    place: 'Takım Drive / Şasi Klasörü',
    instructor: 'Takım Kaptanı: Kaan Demir',
    note: 'STEP dosyası yüklendi, sonlu elemanlar kontrolü geçti.',
    files: [{ name: 'Salincak_v3.step', size: '6.2 MB' }],
  },
  {
    id: 't6',
    title: 'Boru Akışı Deney Ön Raporu',
    course: 'MAK303',
    dueDate: '2026-11-24',
    dueTime: '12:00',
    remaining: 'Tamamlandı',
    daysLeft: -2,
    estHours: 1.5,
    status: 'teslim',
    place: 'OBYS',
    instructor: 'Doç. Dr. Selin Kaya',
    note: 'Reynolds sayısı hesapları onaylandı.',
    files: [{ name: 'OnRapor_BoruAkisi.pdf', size: '512 KB' }],
  },
];

/* ---------- time & layout helpers ---------- */
const SNAP = 5;
const MIN_DUR = 30;
const START_H = 8;
const END_H = 20;
const LO = START_H * 60;
const HI = END_H * 60;
const HOUR_PX = 54;
const GRID_H = (END_H - START_H) * HOUR_PX;

const pad = (n) => String(n).padStart(2, '0');
const toMin = (t) => {
  const [h, m] = (t || '08:00').split(':').map(Number);
  return h * 60 + m;
};
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const snapMin = (m) => Math.round(m / SNAP) * SNAP;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const overlaps = (a, b) => toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

function layoutDay(blocks) {
  const sorted = [...blocks].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(b.end) - toMin(a.end));
  const out = [];
  let cluster = [];
  let laneEnds = [];
  let clusterEnd = -1;

  const flush = () => {
    cluster.forEach((o) => {
      o.lanes = laneEnds.length;
    });
    cluster = [];
    laneEnds = [];
  };

  for (const b of sorted) {
    const st = toMin(b.start);
    const en = toMin(b.end);
    if (st >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    let lane = laneEnds.findIndex((endMin) => endMin <= st);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(en);
    } else {
      laneEnds[lane] = en;
    }
    const item = { ...b, lane, lanes: 1 };
    cluster.push(item);
    out.push(item);
    clusterEnd = Math.max(clusterEnd, en);
  }
  flush();

  out.forEach((o) => {
    const colliding = out.filter((p) => p.id !== o.id && overlaps(o, p));
    o.conflict = colliding.length > 0;
    o.conflictWith = colliding.map((c) => `${c.course} ${c.title} (${c.start}–${c.end})`);
  });
  return out;
}

function formatRemaining(dateStr, timeStr) {
  const today = new Date(2026, 10, 26);
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const diff = Math.round((target - today) / 86400000);
  if (diff < 0) return { label: `${-diff} gün gecikti`, daysLeft: diff };
  if (diff === 0) return { label: `Bugün · ${timeStr}`, daysLeft: 0 };
  if (diff === 1) return { label: `Yarın · ${timeStr}`, daysLeft: 1 };
  return { label: `${diff} gün kaldı`, daysLeft: diff };
}

/* ---------- inline SVG icons (16px, 1.5px stroke, currentColor) ---------- */
const PATHS = {
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  check: 'M5 12.5l4.5 4.5L19 7',
  close: 'M6 6l12 12M18 6L6 18',
  plus: 'M12 5v14M5 12h14',
  alert: 'M12 9v4M12 17h.01M10.3 4.8L2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.8a2 2 0 0 0-3.4 0z',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  eye: 'M2 12s3.8-6 10-6 10 6 10 6-3.8 6-10 6-10-6-10-6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  undo: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
};

function Icon({ name }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/* ================================== App ================================== */
export default function App() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [blocks, setBlocks] = useState(INITIAL_BLOCKS);
  const [history, setHistory] = useState([]);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [typeFilter, setTypeFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [hideDone, setHideDone] = useState(false);
  const [selection, setSelection] = useState({ kind: 'block', id: 'b6' });
  const [editMode, setEditMode] = useState(false);
  const [drag, setDrag] = useState(null); // { id, day, start, end, origDay, origStart, origEnd }
  const [modal, setModal] = useState(null); // null | { kind: 'task' } | { kind: 'block', block?, preset? }
  const [banner, setBanner] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNote, setEditingNote] = useState(false);
  const gridRef = useRef(null);

  useEffect(() => {
    Object.assign(document.documentElement.dataset, DIALS);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setEditingNote(false);
  }, [selection]);

  /* undo support for schedule edits */
  const pushHistory = () => setHistory((h) => [...h.slice(-29), blocks]);

  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setBlocks(prev);
    setHistory((h) => h.slice(0, -1));
    setBanner('Son program değişikliği geri alındı.');
  };

  useEffect(() => {
    if (!editMode) return undefined;
    const onKey = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'Escape' && !modal) {
        setEditMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const commitBlockMove = (block, next) => {
    const st = fromMin(next.start);
    const en = fromMin(next.end);
    if (next.day === block.day && st === block.start && en === block.end) return;
    pushHistory();
    setBlocks((prev) => prev.map((b) => (b.id === block.id ? { ...b, day: next.day, start: st, end: en } : b)));
    setBanner(`${block.course} (${block.title}) → ${DAYS[next.day].short} ${st}–${en} olarak taşındı.`);
  };

  const saveBlock = (blockData) => {
    pushHistory();
    const exists = blocks.some((b) => b.id === blockData.id);
    setBlocks((prev) => (exists ? prev.map((b) => (b.id === blockData.id ? blockData : b)) : [...prev, blockData]));
    setSelection({ kind: 'block', id: blockData.id });
    setModal(null);
    setBanner(exists ? `${blockData.course} (${blockData.title}) güncellendi.` : `${blockData.course} (${blockData.title}) haftalık programa eklendi.`);
  };

  const removeBlock = (block) => {
    pushHistory();
    setBlocks((prev) => prev.filter((b) => b.id !== block.id));
    if (selection?.kind === 'block' && selection.id === block.id) {
      setSelection(null);
    }
    setBanner(`${block.course} (${block.title}) programdan kaldırıldı.`);
  };

  /* pointer drag & resize inside weekly schedule */
  const beginDrag = (e, block, mode) => {
    if (!editMode || e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.closest('.sched-block')?.focus({ preventScroll: true });

    const st0 = toMin(block.start);
    const en0 = toMin(block.end);
    const dur = en0 - st0;
    const colRects = [...gridRef.current.querySelectorAll('.sched-col')].map((el) => el.getBoundingClientRect());
    const x0 = e.clientX;
    const y0 = e.clientY;
    let moved = false;
    let last = { day: block.day, start: st0, end: en0 };
    const base = { id: block.id, origDay: block.day, origStart: st0, origEnd: en0 };

    document.body.style.cursor = mode === 'move' ? 'grabbing' : 'ns-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev) => {
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      const rawMin = (dy / HOUR_PX) * 60;
      let day = block.day;
      let start = st0;
      let end = en0;

      if (mode === 'move') {
        const ci = colRects.findIndex((r) => ev.clientX >= r.left && ev.clientX < r.right);
        day = ci >= 0 ? ci : ev.clientX < colRects[0].left ? 0 : colRects.length - 1;
        start = clamp(snapMin(st0 + rawMin), LO, HI - dur);
        end = start + dur;
      } else if (mode === 'end') {
        end = clamp(snapMin(en0 + rawMin), st0 + MIN_DUR, HI);
      } else {
        start = clamp(snapMin(st0 + rawMin), LO, en0 - MIN_DUR);
      }
      last = { day, start, end };
      setDrag({ ...base, ...last });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setDrag(null);
      if (!moved) {
        if (mode === 'move') setSelection({ kind: 'block', id: block.id });
        return;
      }
      commitBlockMove(block, last);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  /* keyboard move & resize in edit mode */
  const onBlockKeyDown = (e, block) => {
    if (e.key === 'Enter' || (!editMode && e.key === ' ')) {
      e.preventDefault();
      setSelection({ kind: 'block', id: block.id });
      return;
    }
    if (!editMode) return;
    const st = toMin(block.start);
    const en = toMin(block.end);
    const step = e.altKey ? SNAP : 15;
    let next = null;
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const d = e.key === 'ArrowUp' ? -step : step;
      if (e.shiftKey) {
        next = { day: block.day, start: st, end: clamp(en + d, st + MIN_DUR, HI) };
      } else {
        const ns = clamp(st + d, LO, HI - (en - st));
        next = { day: block.day, start: ns, end: ns + (en - st) };
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      next = { day: clamp(block.day + (e.key === 'ArrowLeft' ? -1 : 1), 0, DAYS.length - 1), start: st, end: en };
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeBlock(block);
      return;
    }
    if (next) {
      e.preventDefault();
      commitBlockMove(block, next);
      requestAnimationFrame(() => gridRef.current?.querySelector(`[data-block-id="${block.id}"]`)?.focus({ preventScroll: true }));
    }
  };

  const onEmptySlotClick = (e, dayIdx) => {
    if (!editMode || e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickMin = LO + ((e.clientY - rect.top) / HOUR_PX) * 60;
    const startMin = clamp(Math.floor(clickMin / 30) * 30, LO, HI - 60);
    setModal({
      kind: 'block',
      preset: { day: dayIdx, start: fromMin(startMin), end: fromMin(Math.min(HI, startMin + 110)) },
    });
  };

  /* filtered & live-previewed blocks */
  const visibleBlocks = useMemo(
    () =>
      blocks.filter((b) => {
        if (typeFilter !== 'all' && b.type !== typeFilter) return false;
        if (courseFilter !== 'all' && b.course !== courseFilter) return false;
        return true;
      }),
    [blocks, typeFilter, courseFilter]
  );

  const dayColumns = useMemo(
    () =>
      DAYS.map((d) => {
        const list = [];
        visibleBlocks.forEach((b) => {
          if (drag && drag.id === b.id) {
            if (drag.day === d.idx) {
              list.push({ ...b, day: d.idx, start: fromMin(drag.start), end: fromMin(drag.end), dragging: true });
            }
          } else if (b.day === d.idx) {
            list.push(b);
          }
        });
        return layoutDay(list);
      }),
    [visibleBlocks, drag]
  );

  const allColumns = useMemo(
    () => DAYS.map((d) => layoutDay(blocks.filter((b) => b.day === d.idx))),
    [blocks]
  );

  const visibleTasks = useMemo(
    () =>
      tasks.filter((t) => {
        if (courseFilter !== 'all' && t.course !== courseFilter) return false;
        if (hideDone && t.status === 'teslim') return false;
        return true;
      }),
    [tasks, courseFilter, hideDone]
  );

  /* weekly metrics */
  const weeklyHours = useMemo(() => {
    const mins = blocks.filter((b) => b.type === 'ders' || b.type === 'lab').reduce((sum, b) => sum + (toMin(b.end) - toMin(b.start)), 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [blocks]);

  const dailyHours = useMemo(
    () =>
      DAYS.map((d) => {
        const mins = blocks.filter((b) => b.day === d.idx).reduce((sum, b) => sum + (toMin(b.end) - toMin(b.start)), 0);
        return Math.round((mins / 60) * 10) / 10;
      }),
    [blocks]
  );
  const maxDailyHour = Math.max(1, ...dailyHours);

  const pendingTasksCount = tasks.filter((t) => t.status !== 'teslim').length;
  const doneTasksCount = tasks.filter((t) => t.status === 'teslim').length;
  const examCount = blocks.filter((b) => b.type === 'sinav').length;
  const conflictCount = useMemo(() => {
    let n = 0;
    allColumns.forEach((col) => {
      col.forEach((a, i) => col.slice(i + 1).forEach((b) => overlaps(a, b) && n++));
    });
    return n;
  }, [allColumns]);

  const hourlyLoad = useMemo(() => {
    return Array.from({ length: 12 }, (_, idx) => {
      const hStart = (8 + idx) * 60;
      const hEnd = hStart + 60;
      return blocks.filter((b) => toMin(b.start) < hEnd && toMin(b.end) > hStart).length;
    });
  }, [blocks]);
  const maxHourlyLoad = Math.max(1, ...hourlyLoad);

  const selectedBlock = useMemo(() => {
    if (selection?.kind !== 'block') return null;
    for (const col of allColumns) {
      const found = col.find((b) => b.id === selection.id);
      if (found) return found;
    }
    return null;
  }, [selection, allColumns]);

  const selectedTask = useMemo(() => {
    if (selection?.kind !== 'task') return null;
    return tasks.find((t) => t.id === selection.id) || null;
  }, [selection, tasks]);

  const cycleTaskStatus = (id) => {
    const order = ['baslanmadi', 'devam', 'teslim'];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next = order[(order.indexOf(t.status) + 1) % order.length];
        setBanner(`"${t.title}" durumu "${TASK_STATUS[next]}" olarak güncellendi.`);
        return { ...t, status: next };
      })
    );
  };

  const setTaskStatus = (id, status) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        setBanner(`"${t.title}" durumu "${TASK_STATUS[status]}" olarak güncellendi.`);
        return { ...t, status };
      })
    );
  };

  const addTask = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
    setSelection({ kind: 'task', id: newTask.id });
    setModal(null);
    setBanner(`"${newTask.title}" teslim listesine eklendi.`);
  };

  const saveNote = (e) => {
    e.preventDefault();
    const cleaned = noteDraft.trim();
    if (selectedBlock) {
      setBlocks((prev) => prev.map((b) => (b.id === selectedBlock.id ? { ...b, note: cleaned } : b)));
      setBanner(`${selectedBlock.course} notu kaydedildi.`);
    } else if (selectedTask) {
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, note: cleaned } : t)));
      setBanner(`"${selectedTask.title}" notu kaydedildi.`);
    }
    setEditingNote(false);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setCourseFilter('all');
    setHideDone(false);
  };

  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const NOW_TOP = ((11 * 60 + 15 - LO) / 60) * HOUR_PX;

  const THEME_OPTIONS = [
    { id: 'dark', label: 'Koyu', icon: 'moon' },
    { id: 'light', label: 'Açık', icon: 'sun' },
    { id: 'colorblind', label: 'Renk Körlüğü', icon: 'eye' },
  ];

  const typeCounts = useMemo(
    () => ({
      all: blocks.length,
      ders: blocks.filter((b) => b.type === 'ders').length,
      lab: blocks.filter((b) => b.type === 'lab').length,
      sinav: blocks.filter((b) => b.type === 'sinav').length,
      kulup: blocks.filter((b) => b.type === 'kulup').length,
    }),
    [blocks]
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="calendar" />
          </span>
          <div>
            <div className="brand-name">Dönem</div>
            <div className="brand-meta">2026–2027 Güz · 23–27 Kasım</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="seg" role="group" aria-label="Tema ve göz konforu modu">
            {THEME_OPTIONS.map((opt) => (
              <button key={opt.id} type="button" aria-pressed={theme === opt.id} onClick={() => setTheme(opt.id)}>
                <Icon name={opt.icon} />
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
          <div className="user-pill">
            <span className="live-dot" aria-hidden="true" />
            <span>Semih Aydın · Makine Müh.</span>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Sayfa başlığı + ilk bakışta (above the fold) tek ana aksiyon */}
        <section className="page-header">
          <div>
            <h1 className="page-title">Bu Hafta</h1>
            <p className="page-sub">
              Perşembe, 26 Kasım · {conflictCount > 0 ? `${conflictCount} saat çakışması var — programı düzenleyerek çözebilirsin.` : 'Programda çakışma yok.'}
            </p>
          </div>
          <div className="page-actions">
            <select
              className="select-control"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              aria-label="Derse göre filtrele"
            >
              <option value="all">Tüm dersler (6 ders + SAE)</option>
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
            <button type="button" className="btn primary" onClick={() => setModal({ kind: 'task' })}>
              <Icon name="plus" />
              <span>Yeni teslim ekle</span>
            </button>
          </div>
        </section>

        {banner && (
          <div className="status-banner" role="status">
            <span className="status-banner-left">
              <span className="live-dot" aria-hidden="true" />
              <span>{banner}</span>
            </span>
            <div className="status-banner-actions">
              {history.length > 0 && (
                <button type="button" className="btn ghost" onClick={undo}>
                  <Icon name="undo" />
                  <span>Geri al</span>
                </button>
              )}
              <button type="button" className="icon-btn" onClick={() => setBanner('')} aria-label="Bildirimi kapat">
                <Icon name="close" />
              </button>
            </div>
          </div>
        )}

        {/* Bu haftanın yükü: 3 metrik kutusu */}
        <section className="tiles" aria-label="Bu haftanın yükü">
          <div className="tile">
            <div className="tile-head">
              <span className="label">Haftalık ders ve lab</span>
              <span className="tile-meta">Pzt–Cum</span>
            </div>
            <div className="value-row">
              <span className="value">{weeklyHours}</span>
              <span className="unit">saat</span>
            </div>
            <div className="tile-vis">
              <div className="bar-strip" aria-label="Günlük yoğunluk dağılımı">
                {dailyHours.map((h, i) => (
                  <div key={DAYS[i].short} className="bar-col" title={`${DAYS[i].full}: ${h} saat`}>
                    <div
                      className={`bar-item ${DAYS[i].isToday ? 'latest' : i < 3 ? 'recent' : ''}`}
                      style={{ height: `${Math.max(12, Math.round((h / maxDailyHour) * 100))}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="tile">
            <div className="tile-head">
              <span className="label">Bekleyen teslim</span>
              <span className="tile-meta num">
                {doneTasksCount}/{tasks.length} tamamlandı
              </span>
            </div>
            <div className="value-row">
              <span className="value">{pendingTasksCount}</span>
              <span className="unit">ödev</span>
            </div>
            <div className="tile-vis">
              <div
                className="meter"
                role="progressbar"
                aria-valuenow={Math.round((doneTasksCount / Math.max(1, tasks.length)) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div className="meter-fill" style={{ width: `${Math.round((doneTasksCount / Math.max(1, tasks.length)) * 100)}%` }} />
                <div className="meter-target" style={{ left: '75%' }} title="Haftalık hedef %75" />
              </div>
            </div>
          </div>

          <div className="tile">
            <div className="tile-head">
              <span className="label">Bu hafta sınav</span>
              <span className="tile-meta">{conflictCount > 0 ? `${conflictCount} çakışma var` : 'Çakışma yok'}</span>
            </div>
            <div className="value-row">
              <span className="value">{examCount}</span>
              <span className="unit">sınav</span>
            </div>
            <div className="tile-vis">
              <div className="bar-strip" aria-label="Saatlik (08:00–20:00) haftalık etkinlik dağılımı">
                {hourlyLoad.map((v, idx) => (
                  <div key={idx} className="bar-col" title={`${pad(8 + idx)}:00 — ${v} etkinlik`}>
                    <div
                      className={`bar-item ${idx === 3 ? 'latest' : v >= 2 ? 'recent' : ''}`}
                      style={{ height: v === 0 ? '3px' : `${Math.max(20, Math.round((v / maxHourlyLoad) * 100))}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Ana çalışma alanı: Sol (Haftalık Takvim + Yaklaşan Teslimler) | Sağ (Detay Paneli) */}
        <section className="workspace">
          <div className="workspace-main">
            {/* Etkileşimli Haftalık Program */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Haftalık Program</h2>
                  <span className="panel-sub">
                    {editMode
                      ? 'Düzenleme açık · Blokları sürükle, kenarlarından uzat veya boş saate tıkla'
                      : 'Pazartesi–Cuma · 08:00–20:00 · Detay için bloğa tıkla'}
                  </span>
                </div>
                <div className="panel-header-actions">
                  <button type="button" className="btn ghost" onClick={() => setModal({ kind: 'block', preset: { day: 3, start: '12:00', end: '13:30' } })}>
                    <Icon name="plus" />
                    <span>Ders / etkinlik ekle</span>
                  </button>
                  <button
                    type="button"
                    className={`btn ghost ${editMode ? 'is-active' : ''}`}
                    aria-pressed={editMode}
                    onClick={() => setEditMode((m) => !m)}
                  >
                    <Icon name={editMode ? 'check' : 'edit'} />
                    <span>{editMode ? 'Düzenlemeyi bitir' : 'Programı düzenle'}</span>
                  </button>
                </div>
              </div>

              <div className="panel-header">
                <div className="seg" role="group" aria-label="Türe göre filtrele">
                  {[['all', 'Tümü'], ...Object.entries(BLOCK_TYPES)].map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={typeFilter === k} onClick={() => setTypeFilter(k)}>
                      <span>{label}</span>
                      <span className="count">{typeCounts[k]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {editMode && (
                <div className="edit-bar" role="status">
                  <div className="edit-bar-left">
                    <span className="live-dot" aria-hidden="true" />
                    <span>
                      <strong>Düzenleme modu açık.</strong> Bloku sürükleyerek gün ve saatini değiştir, üst/alt kenarından uzat/kısalt, <strong>×</strong> ile kaldır. Klavyede oklar taşır, Shift+↑/↓ uzatır.
                    </span>
                  </div>
                  <div className="edit-bar-actions">
                    {conflictCount > 0 && (
                      <span className="chip danger">
                        <Icon name="alert" />
                        <span>{conflictCount} çakışma</span>
                      </span>
                    )}
                    <button type="button" className="btn ghost" onClick={undo} disabled={!history.length} title="Geri al (Ctrl+Z)">
                      <Icon name="undo" />
                      <span>Geri al</span>
                    </button>
                  </div>
                </div>
              )}

              {visibleBlocks.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">Seçilen filtrede program bloğu yok</p>
                  <p className="empty-desc">Filtreleri sıfırlayabilir ya da yeni bir ders/etkinlik ekleyebilirsin.</p>
                  <div className="footer-actions">
                    <button type="button" className="btn ghost" onClick={resetFilters}>
                      Filtreleri sıfırla
                    </button>
                    <button type="button" className="btn ghost" onClick={() => setModal({ kind: 'block', preset: { day: 0, start: '09:00', end: '10:50' } })}>
                      <Icon name="plus" />
                      <span>Ders ekle</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="schedule-scroll">
                  <div ref={gridRef} className="schedule-grid">
                    <div className="sched-corner" />
                    {DAYS.map((d) => (
                      <div key={d.idx} className="sched-day-head">
                        <span className="sched-day-label">
                          {d.isToday && <span className="live-dot" aria-hidden="true" />}
                          <span>{d.short}</span>
                        </span>
                        <span className="sched-day-num">{d.dateLabel}</span>
                      </div>
                    ))}

                    <div className="sched-times" style={{ height: GRID_H }}>
                      {hours.map((h) => (
                        <span key={h} className="sched-hour-label" style={{ top: (h - START_H) * HOUR_PX }}>
                          {pad(h)}:00
                        </span>
                      ))}
                    </div>

                    {DAYS.map((d, idx) => (
                      <div
                        key={d.idx}
                        className={`sched-col ${editMode ? 'is-editing' : ''} ${drag && drag.day === idx ? 'is-drop-target' : ''}`}
                        style={{ height: GRID_H }}
                        onClick={(e) => onEmptySlotClick(e, idx)}
                      >
                        {hours.map((h) => (
                          <div key={h} className="hour-rule" style={{ top: (h - START_H) * HOUR_PX }} />
                        ))}
                        {editMode &&
                          hours.map((h) => (
                            <div key={`half-${h}`} className="half-hour-rule" style={{ top: (h - START_H) * HOUR_PX + HOUR_PX / 2 }} />
                          ))}
                        {d.isToday && <div className="now-rule" style={{ top: NOW_TOP }} title="Şu an: 11:15" />}

                        {drag && drag.origDay === idx && (
                          <div
                            className="sched-ghost"
                            aria-hidden="true"
                            style={{
                              top: ((drag.origStart - LO) / 60) * HOUR_PX + 2,
                              height: Math.max(42, ((drag.origEnd - drag.origStart) / 60) * HOUR_PX - 4),
                            }}
                          />
                        )}

                        {dayColumns[idx].map((b) => {
                          const top = ((toMin(b.start) - LO) / 60) * HOUR_PX + 2;
                          const height = Math.max(44, ((toMin(b.end) - toMin(b.start)) / 60) * HOUR_PX - 4);
                          const widthPct = 100 / b.lanes;
                          const isSelected = selection?.kind === 'block' && selection.id === b.id;
                          const cls = [
                            'sched-block',
                            b.conflict && 'is-conflict',
                            editMode && 'is-editable',
                            b.dragging && 'is-dragging',
                          ]
                            .filter(Boolean)
                            .join(' ');
                          return (
                            <div
                              key={b.id}
                              data-block-id={b.id}
                              role="button"
                              tabIndex={0}
                              className={cls}
                              aria-selected={isSelected}
                              aria-label={`${b.title}, ${b.course}, ${DAYS[b.day].full} ${b.start}–${b.end}${b.conflict ? ', saat çakışması var' : ''}`}
                              style={{
                                top,
                                height,
                                left: `calc(${b.lane * widthPct}% + 4px)`,
                                width: `calc(${widthPct}% - 8px)`,
                              }}
                              onClick={editMode ? undefined : () => setSelection({ kind: 'block', id: b.id })}
                              onPointerDown={editMode ? (e) => beginDrag(e, b, 'move') : undefined}
                              onKeyDown={(e) => onBlockKeyDown(e, b)}
                            >
                              {editMode && <span className="block-handle top" aria-hidden="true" onPointerDown={(e) => beginDrag(e, b, 'start')} />}

                              <div className="block-top">
                                <span className="block-title">{b.title}</span>
                                {!editMode && b.conflict && (
                                  <span className="conflict-tag" title="Saat çakışması">
                                    <Icon name="alert" />
                                    {b.lanes === 1 && <span>Çakışma</span>}
                                  </span>
                                )}
                              </div>

                              <div className="block-foot">
                                <span>
                                  {b.course} · {b.start}–{b.end}
                                </span>
                                {b.lanes === 1 && height >= 76 && <span className="block-place">{b.place}</span>}
                              </div>

                              {b.dragging && (
                                <span className="drag-tip">
                                  {DAYS[b.day].short} · {b.start}–{b.end}
                                </span>
                              )}

                              {editMode && !b.dragging && (
                                <button
                                  type="button"
                                  className="block-remove"
                                  aria-label={`${b.title} bloğunu programdan kaldır`}
                                  title="Programdan kaldır"
                                  onPointerDown={(e) => e.stopPropagation()}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeBlock(b);
                                  }}
                                >
                                  <Icon name="close" />
                                </button>
                              )}

                              {editMode && <span className="block-handle bottom" aria-hidden="true" onPointerDown={(e) => beginDrag(e, b, 'end')} />}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Yaklaşan Teslimler Tablosu */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Yaklaşan Teslimler</h2>
                  <span className="panel-sub">Soldaki daireye basıp durumu ilerlet, satıra basıp sağda detayları gör</span>
                </div>
                <button type="button" className="btn ghost" onClick={() => setHideDone((v) => !v)}>
                  {hideDone ? 'Teslim edilenleri göster' : 'Teslim edilenleri gizle'}
                </button>
              </div>

              {visibleTasks.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">Gösterilecek teslim yok</p>
                  <p className="empty-desc">Bu derste bekleyen ödev kalmadı veya filtre aktif.</p>
                  <button type="button" className="btn ghost" onClick={resetFilters}>
                    Filtreleri sıfırla
                  </button>
                </div>
              ) : (
                <div className="table-wrap">
                  <div className="table-inner" role="table" aria-label="Yaklaşan teslimler">
                    <div className="thead" role="row">
                      <span role="columnheader" aria-label="Durum değiştir" />
                      <span role="columnheader">Teslim</span>
                      <span role="columnheader">Ders</span>
                      <span role="columnheader" className="cell-num">
                        Kalan süre
                      </span>
                      <span role="columnheader" className="cell-num">
                        Tahmini
                      </span>
                      <span role="columnheader">Durum</span>
                    </div>
                    {visibleTasks.map((t) => {
                      const isSelected = selection?.kind === 'task' && selection.id === t.id;
                      const isDone = t.status === 'teslim';
                      const isUrgent = !isDone && t.daysLeft <= 1;
                      return (
                        <div
                          key={t.id}
                          role="row"
                          tabIndex={0}
                          className="row"
                          aria-selected={isSelected}
                          onClick={() => setSelection({ kind: 'task', id: t.id })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelection({ kind: 'task', id: t.id });
                            }
                          }}
                        >
                          <button
                            type="button"
                            className="status-btn"
                            aria-label={`${t.title} durumunu değiştir (şu an: ${TASK_STATUS[t.status]})`}
                            onClick={(e) => {
                              e.stopPropagation();
                              cycleTaskStatus(t.id);
                            }}
                          >
                            <span className={`status-circle ${isDone ? 'is-done' : ''}`}>
                              {isDone ? <Icon name="check" /> : t.status === 'devam' ? <span className="live-dot" /> : null}
                            </span>
                          </button>

                          <div className="row-title-col">
                            <span className={`row-title ${isDone ? 'is-done' : ''}`}>{t.title}</span>
                            <span className="row-meta">{t.place}</span>
                          </div>

                          <span className="cell-code">{t.course}</span>

                          <span className={`cell-num ${isUrgent ? 'is-urgent' : ''}`}>
                            {isDone ? 'Teslim edildi' : t.remaining}
                          </span>

                          <span className="cell-num">{t.estHours} sa</span>

                          <div>
                            <span className={`chip ${isDone ? 'accent' : ''}`}>
                              {isDone && <Icon name="check" />}
                              <span>{TASK_STATUS[t.status]}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="footer">
                <span className="num">
                  {visibleTasks.length} / {tasks.length} teslim gösteriliyor
                </span>
                <div className="footer-actions">
                  {(typeFilter !== 'all' || courseFilter !== 'all' || hideDone) && (
                    <button type="button" className="btn ghost" onClick={resetFilters}>
                      Filtreleri temizle
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Detay Paneli */}
          <aside className="detail-pane" aria-label="Seçili öğe detayı">
            {selectedBlock ? (
              <>
                <div className="detail-head">
                  <div className="detail-chips">
                    <span className="chip">{BLOCK_TYPES[selectedBlock.type]}</span>
                    {selectedBlock.conflict && (
                      <span className="chip danger">
                        <Icon name="alert" />
                        <span>Çakışıyor</span>
                      </span>
                    )}
                    <span className="detail-code">{selectedBlock.course}</span>
                  </div>
                  <h2 className="detail-title">{selectedBlock.title}</h2>
                  <div className="detail-actions">
                    <button type="button" className="btn ghost" onClick={() => setModal({ kind: 'block', block: selectedBlock })}>
                      <Icon name="edit" />
                      <span>Saati / detayı düzenle</span>
                    </button>
                    <button type="button" className="btn ghost danger-text" onClick={() => removeBlock(selectedBlock)}>
                      <Icon name="trash" />
                      <span>Kaldır</span>
                    </button>
                  </div>
                </div>

                {selectedBlock.conflict && (
                  <div className="conflict-box" role="alert">
                    <div className="conflict-box-title">
                      <Icon name="alert" />
                      <span>Saat çakışması tespit edildi</span>
                    </div>
                    <div className="conflict-box-body">
                      Çakışan etkinlik: {selectedBlock.conflictWith.join(', ')}. Programı düzenle modunda sürükleyerek ayırabilirsin.
                    </div>
                  </div>
                )}

                <div className="meta-grid">
                  <div className="meta-cell">
                    <span className="meta-label">Yer</span>
                    <span className="meta-val">{selectedBlock.place}</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-label">Gün ve saat</span>
                    <span className="meta-val num">
                      {DAYS[selectedBlock.day].short} · {selectedBlock.start}–{selectedBlock.end}
                    </span>
                  </div>
                  <div className="meta-cell" style={{ gridColumn: '1 / -1' }}>
                    <span className="meta-label">Hoca / Sorumlu</span>
                    <span className="meta-val">{selectedBlock.instructor}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="panel-header">
                    <span className="section-label">Notlar</span>
                    {!editingNote && (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => {
                          setNoteDraft(selectedBlock.note || '');
                          setEditingNote(true);
                        }}
                      >
                        Notu düzenle
                      </button>
                    )}
                  </div>
                  {editingNote ? (
                    <form className="note-form" onSubmit={saveNote}>
                      <div className="field">
                        <div className="field-head">
                          <label htmlFor="detail-block-note">Ders / etkinlik notu</label>
                          <span className="field-req">İsteğe bağlı</span>
                        </div>
                        <textarea
                          id="detail-block-note"
                          className="textarea"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Ders notları, malzeme hatırlatması veya toplantı gündemi"
                        />
                        <span className="field-hint">Kaydedince anında bu dersin detayında görünür.</span>
                      </div>
                      <div className="footer-actions">
                        <button type="button" className="btn ghost" onClick={() => setEditingNote(false)}>
                          Vazgeç
                        </button>
                        <button type="submit" className="btn ghost">
                          Notu kaydet
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="note-box">{selectedBlock.note || 'Henüz not eklenmedi.'}</p>
                  )}
                </div>

                <div className="detail-section">
                  <span className="section-label">İlgili dosyalar ({selectedBlock.files.length})</span>
                  {selectedBlock.files.length === 0 ? (
                    <p className="note-box">Ekli dosya yok.</p>
                  ) : (
                    <ul className="file-list">
                      {selectedBlock.files.map((f) => (
                        <li key={f.name} className="file-row">
                          <span className="file-name">
                            <Icon name="file" />
                            <span>{f.name}</span>
                          </span>
                          <span className="file-size">{f.size}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : selectedTask ? (
              <>
                <div className="detail-head">
                  <div className="detail-chips">
                    <span className={`chip ${selectedTask.status === 'teslim' ? 'accent' : ''}`}>
                      {TASK_STATUS[selectedTask.status]}
                    </span>
                    <span className="detail-code">{selectedTask.course}</span>
                  </div>
                  <h2 className="detail-title">{selectedTask.title}</h2>
                </div>

                <div className="detail-section">
                  <span className="section-label">Teslim durumu</span>
                  <div className="seg" role="group" aria-label="Teslim durumunu seç">
                    {Object.entries(TASK_STATUS).map(([k, label]) => (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={selectedTask.status === k}
                        onClick={() => setTaskStatus(selectedTask.id, k)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="meta-grid">
                  <div className="meta-cell">
                    <span className="meta-label">Son teslim</span>
                    <span className="meta-val num">
                      {selectedTask.dueDate.split('-').reverse().join('.')} · {selectedTask.dueTime}
                    </span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-label">Tahmini süre</span>
                    <span className="meta-val num">{selectedTask.estHours} saat</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-label">Teslim yeri</span>
                    <span className="meta-val">{selectedTask.place}</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-label">Hoca / Sorumlu</span>
                    <span className="meta-val">{selectedTask.instructor}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="panel-header">
                    <span className="section-label">Notlar</span>
                    {!editingNote && (
                      <button
                        type="button"
                        className="btn ghost"
                        onClick={() => {
                          setNoteDraft(selectedTask.note || '');
                          setEditingNote(true);
                        }}
                      >
                        Notu düzenle
                      </button>
                    )}
                  </div>
                  {editingNote ? (
                    <form className="note-form" onSubmit={saveNote}>
                      <div className="field">
                        <div className="field-head">
                          <label htmlFor="detail-task-note">Teslim notu</label>
                          <span className="field-req">İsteğe bağlı</span>
                        </div>
                        <textarea
                          id="detail-task-note"
                          className="textarea"
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="Teslim formatı, kaynak bağlantısı veya kontrol listesi"
                        />
                        <span className="field-hint">Kaydedince bu teslimin detayında güncellenir.</span>
                      </div>
                      <div className="footer-actions">
                        <button type="button" className="btn ghost" onClick={() => setEditingNote(false)}>
                          Vazgeç
                        </button>
                        <button type="submit" className="btn ghost">
                          Notu kaydet
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="note-box">{selectedTask.note || 'Henüz not eklenmedi.'}</p>
                  )}
                </div>

                <div className="detail-section">
                  <span className="section-label">İlgili dosyalar ({selectedTask.files.length})</span>
                  {selectedTask.files.length === 0 ? (
                    <p className="note-box">Ekli dosya yok.</p>
                  ) : (
                    <ul className="file-list">
                      {selectedTask.files.map((f) => (
                        <li key={f.name} className="file-row">
                          <span className="file-name">
                            <Icon name="file" />
                            <span>{f.name}</span>
                          </span>
                          <span className="file-size">{f.size}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p className="empty-title">Detay görmek için seçim yap</p>
                <p className="empty-desc">Haftalık programdan bir bloğa veya teslim listesinden bir satıra tıkla.</p>
              </div>
            )}
          </aside>
        </section>
      </main>

      {modal?.kind === 'task' && <NewTaskModal onClose={() => setModal(null)} onCreate={addTask} />}
      {modal?.kind === 'block' && (
        <BlockModal
          block={modal.block}
          preset={modal.preset}
          onClose={() => setModal(null)}
          onSave={saveBlock}
          onDelete={(b) => {
            removeBlock(b);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

/* ============================ Ders / Etkinlik Modal ============================ */
function BlockModal({ block, preset = {}, onClose, onSave, onDelete }) {
  const isEdit = Boolean(block);
  const [course, setCourse] = useState(block?.course || COURSES[0].code);
  const [title, setTitle] = useState(block?.title || '');
  const [type, setType] = useState(block?.type || 'ders');
  const [day, setDay] = useState(block?.day ?? preset.day ?? 0);
  const [start, setStart] = useState(block?.start || preset.start || '09:00');
  const [end, setEnd] = useState(block?.end || preset.end || '10:50');
  const [place, setPlace] = useState(block?.place || '');
  const [instructor, setInstructor] = useState(block?.instructor || COURSES[0].instructor);
  const [note, setNote] = useState(block?.note || '');
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleCourseChange = (code) => {
    setCourse(code);
    const found = COURSES.find((c) => c.code === code);
    if (found && !isEdit) {
      if (!title.trim()) setTitle(found.name);
      setInstructor(found.instructor);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Ders veya etkinlik başlığı gerekli.';
    if (!place.trim()) nextErrors.place = 'Yer bilgisi gerekli (örn. M5 Amfi 2).';
    const stMin = toMin(start);
    const enMin = toMin(end);
    if (stMin < LO || enMin > HI) {
      nextErrors.time = 'Saatler haftalık çizelge aralığında (08:00–20:00) olmalı.';
    } else if (enMin - stMin < MIN_DUR) {
      nextErrors.time = `Bitiş saati başlangıçtan en az ${MIN_DUR} dakika sonra olmalı.`;
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSave({
      id: block?.id || `b_${Date.now()}`,
      day: Number(day),
      start,
      end,
      course,
      title: title.trim(),
      type,
      place: place.trim(),
      instructor: instructor.trim() || 'Belirtilmedi',
      note: note.trim(),
      files: block?.files || [],
    });
  };

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="block-modal-title">
        <div className="modal-header">
          <h2 id="block-modal-title" className="panel-title">
            {isEdit ? 'Ders / etkinliği düzenle' : 'Programa ders veya etkinlik ekle'}
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="close" />
          </button>
        </div>

        <form id="block-form" className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="field-row">
            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-course">Ders / topluluk</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <select id="blk-course" className="input" value={course} onChange={(e) => handleCourseChange(e.target.value)}>
                {COURSES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-type">Tür</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <select id="blk-type" className="input" value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(BLOCK_TYPES).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="blk-title">Başlık</label>
              <span className="field-req">Zorunlu</span>
            </div>
            <input
              ref={titleRef}
              id="blk-title"
              className="input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="Örn. Termodinamik II Etüt veya SAE Aerodinamik"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title ? <span className="error" role="alert">{errors.title}</span> : <span className="field-hint">Haftalık takvim bloğunda ana başlık olarak görünür.</span>}
          </div>

          <div className="field-row-3">
            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-day">Gün</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <select id="blk-day" className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {DAYS.map((d) => (
                  <option key={d.idx} value={d.idx}>
                    {d.full} ({d.dateLabel})
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-start">Başlangıç</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <input
                id="blk-start"
                type="time"
                min="08:00"
                max="19:30"
                className="input"
                value={start}
                onChange={(e) => {
                  setStart(e.target.value);
                  if (errors.time) setErrors((p) => ({ ...p, time: undefined }));
                }}
                aria-invalid={Boolean(errors.time)}
              />
            </div>

            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-end">Bitiş</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <input
                id="blk-end"
                type="time"
                min="08:30"
                max="20:00"
                className="input"
                value={end}
                onChange={(e) => {
                  setEnd(e.target.value);
                  if (errors.time) setErrors((p) => ({ ...p, time: undefined }));
                }}
                aria-invalid={Boolean(errors.time)}
              />
            </div>
          </div>
          {errors.time ? <span className="error" role="alert">{errors.time}</span> : <span className="field-hint">Takvim 08:00–20:00 arasını gösterir; ekledikten sonra sürükleyerek de kaydırabilirsin.</span>}

          <div className="field-row">
            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-place">Yer / derslik</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <input
                id="blk-place"
                className="input"
                value={place}
                onChange={(e) => {
                  setPlace(e.target.value);
                  if (errors.place) setErrors((p) => ({ ...p, place: undefined }));
                }}
                placeholder="Örn. M5 Amfi 2"
                aria-invalid={Boolean(errors.place)}
              />
              {errors.place && <span className="error" role="alert">{errors.place}</span>}
            </div>

            <div className="field">
              <div className="field-head">
                <label htmlFor="blk-inst">Hoca / sorumlu</label>
                <span className="field-req">İsteğe bağlı</span>
              </div>
              <input
                id="blk-inst"
                className="input"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="Örn. Prof. Dr. Haluk Eren"
              />
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="blk-note">Notlar</label>
              <span className="field-req">İsteğe bağlı</span>
            </div>
            <textarea
              id="blk-note"
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Yanına alman gereken malzemeler, konu başlıkları…"
            />
          </div>
        </form>

        <div className="modal-footer">
          {isEdit && (
            <button type="button" className="btn ghost danger-text" onClick={() => onDelete(block)}>
              <Icon name="trash" />
              <span>Programdan kaldır</span>
            </button>
          )}
          <div className="modal-footer-right">
            <button type="button" className="btn ghost" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" form="block-form" className="btn primary">
              {isEdit ? 'Değişiklikleri kaydet' : 'Programa ekle'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ Yeni Teslim Modal ============================ */
function NewTaskModal({ onClose, onCreate }) {
  const [course, setCourse] = useState(COURSES[0].code);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('2026-11-30');
  const [dueTime, setDueTime] = useState('23:59');
  const [estHours, setEstHours] = useState('2');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const titleRef = useRef(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!title.trim()) nextErrors.title = 'Teslim başlığı gerekli.';
    if (!dueDate) nextErrors.dueDate = 'Son teslim tarihi seçin.';
    const hoursNum = Number(estHours);
    if (!estHours || Number.isNaN(hoursNum) || hoursNum <= 0) {
      nextErrors.estHours = '0’dan büyük geçerli bir tahmini süre (saat) girin.';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const courseObj = COURSES.find((c) => c.code === course) || COURSES[0];
    const rem = formatRemaining(dueDate, dueTime);
    onCreate({
      id: `t_${Date.now()}`,
      title: title.trim(),
      course: courseObj.code,
      dueDate,
      dueTime,
      remaining: rem.label,
      daysLeft: rem.daysLeft,
      estHours: hoursNum,
      status: 'baslanmadi',
      place: 'OBYS',
      instructor: courseObj.instructor,
      note: note.trim() || 'Teslim detayı eklenmedi.',
      files: [],
    });
  };

  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-task-title">
        <div className="modal-header">
          <h2 id="new-task-title" className="panel-title">
            Yeni teslim ekle
          </h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="close" />
          </button>
        </div>

        <form id="new-task-form" className="modal-body" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <div className="field-head">
              <label htmlFor="task-course">Ders veya topluluk</label>
              <span className="field-req">Zorunlu</span>
            </div>
            <select id="task-course" className="input" value={course} onChange={(e) => setCourse(e.target.value)}>
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="task-title">Başlık</label>
              <span className="field-req">Zorunlu</span>
            </div>
            <input
              ref={titleRef}
              id="task-title"
              className="input"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              placeholder="Örn. Termodinamik Problem Seti 5"
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title ? <span className="error" role="alert">{errors.title}</span> : <span className="field-hint">Teslim listesinde ilk sütunda görünecek kısa ad.</span>}
          </div>

          <div className="field-row">
            <div className="field">
              <div className="field-head">
                <label htmlFor="task-date">Son teslim tarihi</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <input
                id="task-date"
                type="date"
                className="input"
                value={dueDate}
                onChange={(e) => {
                  setDueDate(e.target.value);
                  if (errors.dueDate) setErrors((p) => ({ ...p, dueDate: undefined }));
                }}
                aria-invalid={Boolean(errors.dueDate)}
              />
              {errors.dueDate && <span className="error" role="alert">{errors.dueDate}</span>}
            </div>
            <div className="field">
              <div className="field-head">
                <label htmlFor="task-time">Saat</label>
                <span className="field-req">Zorunlu</span>
              </div>
              <input id="task-time" type="time" className="input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="task-hours">Tahmini çalışma süresi (saat)</label>
              <span className="field-req">Zorunlu</span>
            </div>
            <input
              id="task-hours"
              type="number"
              step="0.5"
              min="0.5"
              className="input"
              value={estHours}
              onChange={(e) => {
                setEstHours(e.target.value);
                if (errors.estHours) setErrors((p) => ({ ...p, estHours: undefined }));
              }}
              aria-invalid={Boolean(errors.estHours)}
            />
            {errors.estHours ? <span className="error" role="alert">{errors.estHours}</span> : <span className="field-hint">Örn. 2 veya 2.5 saat; haftalık yük planlaması için kullanılır.</span>}
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="task-note">Notlar</label>
              <span className="field-req">İsteğe bağlı</span>
            </div>
            <textarea
              id="task-note"
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Teslim formatı, kaynaklar veya hatırlatmalar"
            />
          </div>
        </form>

        <div className="modal-footer">
          <div className="modal-footer-right">
            <button type="button" className="btn ghost" onClick={onClose}>
              Vazgeç
            </button>
            <button type="submit" form="new-task-form" className="btn primary">
              Teslimi kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
