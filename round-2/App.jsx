import { useEffect, useMemo, useRef, useState } from 'react';
import './styles.css';

/*
 * Tur 2 — Dönem Planlayıcı
 * Persona: Semih Aydın (25, Makine Mühendisliği 3. sınıf, SAE Formula topluluğu)
 * Dials: neutral=warm, accent=teal, shape=soft, density=comfortable, theme=dark (+ light + colorblind)
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
    title: 'SAE Şasi & Süspansiyon Toplantısı',
    type: 'kulup',
    place: 'Mühendislik Ek Bina B-04',
    instructor: 'Takım Kaptanı: Kaan Demir',
    note: 'Üretim Lab ile çakışıyor — 15:50 çıkışında katılacağını Kaan’a bildir.',
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
    title: 'Sponsorluk & Bütçe Gözden Geçirme',
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

/* ---------- helpers ---------- */
const toMin = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

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
  const today = new Date(2026, 10, 26); // 26 Kasım 2026
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
  pin: 'M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
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
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [typeFilter, setTypeFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [hideDone, setHideDone] = useState(false);
  const [selection, setSelection] = useState({ kind: 'block', id: 'b6' }); // starts on conflicting lab so detail pane is immediately useful
  const [modalOpen, setModalOpen] = useState(false);
  const [banner, setBanner] = useState('');
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNote, setEditingNote] = useState(false);

  useEffect(() => {
    Object.assign(document.documentElement.dataset, DIALS);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    setEditingNote(false);
  }, [selection]);

  /* filtered blocks and tasks */
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
    () => DAYS.map((d) => layoutDay(visibleBlocks.filter((b) => b.day === d.idx))),
    [visibleBlocks]
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

  /* resolve selected item for right detail pane */
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
    setModalOpen(false);
    setBanner(`"${newTask.title}" teslim listesine eklendi.`);
  };

  const saveNote = (e) => {
    e.preventDefault();
    const cleaned = noteDraft.trim();
    if (selectedBlock) {
      setBlocks((prev) => prev.map((b) => (b.id === selectedBlock.id ? { ...b, note: cleaned } : b)));
      setBanner(`${selectedBlock.course} notu güncellendi.`);
    } else if (selectedTask) {
      setTasks((prev) => prev.map((t) => (t.id === selectedTask.id ? { ...t, note: cleaned } : t)));
      setBanner(`"${selectedTask.title}" notu güncellendi.`);
    }
    setEditingNote(false);
  };

  const resetFilters = () => {
    setTypeFilter('all');
    setCourseFilter('all');
    setHideDone(false);
  };

  /* timeline dimensions: 08:00–20:00 (12 hours) */
  const START_H = 8;
  const END_H = 20;
  const HOUR_PX = 44;
  const GRID_H = (END_H - START_H) * HOUR_PX;
  const hours = Array.from({ length: END_H - START_H }, (_, i) => START_H + i);
  const NOW_TOP = ((11 * 60 + 15 - START_H * 60) / 60) * HOUR_PX; // Perşembe 11:15

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
        <section className="page-header">
          <div>
            <h1 className="page-title">Bu Hafta</h1>
            <p className="page-sub">
              Perşembe, 26 Kasım · {conflictCount > 0 ? `${conflictCount} saat çakışması dikkat bekliyor.` : 'Programda çakışma yok.'}
            </p>
          </div>
          <div className="controls-group">
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
          </div>
        </section>

        {banner && (
          <div className="status-banner" role="status">
            <span className="status-banner-left">
              <span className="live-dot" aria-hidden="true" />
              <span>{banner}</span>
            </span>
            <button type="button" className="icon-btn" onClick={() => setBanner('')} aria-label="Bildirimi kapat">
              <Icon name="close" />
            </button>
          </div>
        )}

        {/* Bu haftanın yükü: 3 özet kutusu */}
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
              <div className="meter-wrap">
                <div className="meter" role="progressbar" aria-valuenow={Math.round((doneTasksCount / Math.max(1, tasks.length)) * 100)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="meter-fill" style={{ width: `${Math.round((doneTasksCount / Math.max(1, tasks.length)) * 100)}%` }} />
                  <div className="meter-target" style={{ left: '75%' }} title="Haftalık hedef %75" />
                </div>
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
              <div className="bar-strip" aria-label="Saatlik (08:00–20:00) haftalık yoğunluk dağılımı">
                {hourlyLoad.map((v, idx) => (
                  <div key={idx} className="bar-col" title={`${String(8 + idx).padStart(2, '0')}:00 — ${v} etkinlik`}>
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
            {/* Haftalık Takvim */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Haftalık Program</h2>
                  <span className="panel-sub">Pazartesi–Cuma · 08:00–20:00 · Detay için bloğa tıkla</span>
                </div>
                <div className="seg" role="group" aria-label="Türe göre filtrele">
                  {[['all', 'Tümü'], ...Object.entries(BLOCK_TYPES)].map(([k, label]) => (
                    <button key={k} type="button" aria-pressed={typeFilter === k} onClick={() => setTypeFilter(k)}>
                      <span>{label}</span>
                      <span className="count">{typeCounts[k]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {visibleBlocks.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">Seçilen filtrede program bloğu yok</p>
                  <p className="empty-desc">Farklı bir ders veya tür seçebilir ya da filtreleri sıfırlayabilirsin.</p>
                  <button type="button" className="btn ghost" onClick={resetFilters}>
                    Filtreleri sıfırla
                  </button>
                </div>
              ) : (
                <div className="schedule-scroll">
                  <div className="schedule-grid">
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
                          {String(h).padStart(2, '0')}:00
                        </span>
                      ))}
                    </div>

                    {DAYS.map((d, idx) => (
                      <div key={d.idx} className="sched-col" style={{ height: GRID_H }}>
                        {hours.map((h) => (
                          <div key={h} className="hour-rule" style={{ top: (h - START_H) * HOUR_PX }} />
                        ))}
                        {d.isToday && <div className="now-rule" style={{ top: NOW_TOP }} title="Şu an: 11:15" />}
                        {dayColumns[idx].map((b) => {
                          const top = ((toMin(b.start) - START_H * 60) / 60) * HOUR_PX + 2;
                          const height = Math.max(36, ((toMin(b.end) - toMin(b.start)) / 60) * HOUR_PX - 4);
                          const widthPct = 100 / b.lanes;
                          const isSelected = selection?.kind === 'block' && selection.id === b.id;
                          return (
                            <button
                              key={b.id}
                              type="button"
                              className={`sched-block ${b.conflict ? 'is-conflict' : ''}`}
                              aria-selected={isSelected}
                              style={{
                                top,
                                height,
                                left: `calc(${b.lane * widthPct}% + 4px)`,
                                width: `calc(${widthPct}% - 8px)`,
                              }}
                              onClick={() => setSelection({ kind: 'block', id: b.id })}
                            >
                              <div className="block-top">
                                <span className="block-code">{b.course}</span>
                                {b.conflict ? (
                                  <span className="conflict-tag" title="Saat çakışması">
                                    <Icon name="alert" />
                                    {b.lanes === 1 && <span>Çakışma</span>}
                                  </span>
                                ) : (
                                  <span className="tile-meta">{BLOCK_TYPES[b.type]}</span>
                                )}
                              </div>
                              <div className="block-title">{b.title}</div>
                              {height >= 64 && (
                                <div className="block-foot">
                                  <span>
                                    {b.start}–{b.end}
                                  </span>
                                  {b.lanes === 1 ? <span>{b.place}</span> : <span className="conflict-tag">Çakışma</span>}
                                </div>
                              )}
                            </button>
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
                  <span className="panel-sub">Daireye basıp durumu ilerlet, satıra basıp detayları gör</span>
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
                  <button type="button" className="btn primary" onClick={() => setModalOpen(true)}>
                    <Icon name="plus" />
                    <span>Yeni teslim ekle</span>
                  </button>
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
                </div>

                {selectedBlock.conflict && (
                  <div className="conflict-box" role="alert">
                    <div className="conflict-box-title">
                      <Icon name="alert" />
                      <span>Saat çakışması tespit edildi</span>
                    </div>
                    <div className="conflict-box-body">
                      Çakışan etkinlik: {selectedBlock.conflictWith.join(', ')}
                    </div>
                  </div>
                )}

                <div className="meta-grid">
                  <div className="meta-cell">
                    <span className="meta-label">Yer</span>
                    <span className="meta-val">{selectedBlock.place}</span>
                  </div>
                  <div className="meta-cell">
                    <span className="meta-label">Saat</span>
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
                      <textarea
                        className="textarea"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        aria-label="Blok notu"
                      />
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
                      <textarea
                        className="textarea"
                        value={noteDraft}
                        onChange={(e) => setNoteDraft(e.target.value)}
                        aria-label="Teslim notu"
                      />
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

      {modalOpen && <NewTaskModal onClose={() => setModalOpen(false)} onCreate={addTask} />}
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
      nextErrors.estHours = 'Geçerli bir tahmini süre (saat) girin.';
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
            <label htmlFor="task-course">Ders veya topluluk</label>
            <select id="task-course" className="input" value={course} onChange={(e) => setCourse(e.target.value)}>
              {COURSES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="task-title">Başlık</label>
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
            {errors.title && <span className="error">{errors.title}</span>}
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="task-date">Son teslim tarihi</label>
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
              {errors.dueDate && <span className="error">{errors.dueDate}</span>}
            </div>
            <div className="field">
              <label htmlFor="task-time">Saat</label>
              <input id="task-time" type="time" className="input" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="task-hours">Tahmini süre (saat)</label>
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
            {errors.estHours && <span className="error">{errors.estHours}</span>}
          </div>

          <div className="field">
            <label htmlFor="task-note">Notlar (isteğe bağlı)</label>
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
          <button type="button" className="btn ghost" onClick={onClose}>
            Vazgeç
          </button>
          <button type="submit" form="new-task-form" className="btn primary">
            Teslimi kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
