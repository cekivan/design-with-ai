import React, { useEffect, useMemo, useRef, useState } from "react";

/* =========================================================================
   Dönem Planlayıcı — dersler, sınavlar ve ödev teslimleri tek yerde.
   Tek dosya: bileşenler + stiller. Veriler tarayıcıda (localStorage) saklanır.
   ========================================================================= */

const STORAGE_KEY = "donem-planlayici:v1";
const DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAYS_SHORT = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TYPES = {
  sinav: { label: "Sınav" },
  quiz: { label: "Quiz" },
  odev: { label: "Ödev" },
  proje: { label: "Proje" },
};
const PALETTE = ["#2563eb", "#e8590c", "#0d9488", "#7c3aed", "#db2777", "#ca8a04", "#16a34a", "#475569"];

/* ---------------------------- Tarih yardımcıları ---------------------------- */
const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
const mondayIndex = (d) => (d.getDay() + 6) % 7;
const toMin = (t) => {
  const [h, m] = (t || "0:0").split(":").map(Number);
  return h * 60 + m;
};
const fmtDate = (s) => {
  const d = parseYmd(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${DAYS_SHORT[mondayIndex(d)]}`;
};
const relLabel = (diff) => {
  if (diff < 0) return `${-diff} gün gecikti`;
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  return `${diff} gün kaldı`;
};
const urgency = (diff, done) => {
  if (done) return "done";
  if (diff < 0) return "late";
  if (diff <= 2) return "soon";
  if (diff <= 7) return "near";
  return "far";
};
const uid = () => Math.random().toString(36).slice(2, 10);
const sortItems = (a, b) => (a.date + a.time).localeCompare(b.date + b.time);

/* ------------------------------- Örnek veri -------------------------------- */
function seed() {
  const t = new Date();
  const d = (n) => ymd(addDays(t, n));
  const courses = [
    { id: "c1", code: "BIL201", name: "Veri Yapıları ve Algoritmalar", instructor: "Dr. Ayşe Kaya", room: "MB-204", color: "#2563eb", slots: [{ day: 0, start: "09:00", end: "10:50" }, { day: 2, start: "13:00", end: "14:50" }] },
    { id: "c2", code: "MAT203", name: "Lineer Cebir", instructor: "Doç. Dr. Mehmet Demir", room: "FEF-101", color: "#e8590c", slots: [{ day: 1, start: "10:00", end: "11:50" }, { day: 3, start: "10:00", end: "11:50" }] },
    { id: "c3", code: "FIZ102", name: "Fizik II", instructor: "Prof. Dr. Elif Şahin", room: "Lab-3", color: "#0d9488", slots: [{ day: 0, start: "13:00", end: "15:50" }, { day: 4, start: "09:00", end: "10:50" }] },
    { id: "c4", code: "ING202", name: "Akademik İngilizce", instructor: "Öğr. Gör. Zeynep Aydın", room: "YDB-12", color: "#7c3aed", slots: [{ day: 2, start: "09:00", end: "10:50" }] },
    { id: "c5", code: "IKT101", name: "İktisada Giriş", instructor: "Dr. Can Arslan", room: "İİBF-A2", color: "#db2777", slots: [{ day: 3, start: "14:00", end: "15:50" }, { day: 4, start: "13:00", end: "13:50" }] },
  ];
  const mk = (type, courseId, title, date, time, weight, extra = {}) => ({ id: uid(), type, courseId, title, date, time, weight, note: "", done: false, ...extra });
  const items = [
    mk("odev", "c1", "Bağlı liste uygulaması", d(-4), "23:59", 10, { done: true }),
    mk("odev", "c2", "Problem Seti 4", d(-2), "23:59", 5),
    mk("quiz", "c4", "Kelime quiz'i 3", d(0), "09:15", 5),
    mk("odev", "c3", "Lab raporu: RC devreleri", d(1), "17:00", 8),
    mk("sinav", "c2", "Ara sınav 2", d(3), "10:00", 25, { note: "Bölüm 4–6. Hesap makinesi serbest." }),
    mk("proje", "c1", "Dönem projesi ara raporu", d(6), "23:59", 15),
    mk("odev", "c5", "Makale özeti", d(8), "12:00", 5),
    mk("sinav", "c3", "Ara sınav", d(11), "13:30", 30, { note: "Elektrostatik ve devreler." }),
    mk("quiz", "c1", "Quiz 3: Ağaçlar", d(13), "09:00", 5),
    mk("sinav", "c5", "Ara sınav", d(16), "14:00", 35),
    mk("odev", "c4", "Argümantatif deneme", d(20), "23:59", 15),
    mk("sinav", "c1", "Final", d(38), "09:00", 40),
    mk("sinav", "c2", "Final", d(41), "10:00", 40),
  ];
  const plans = [
    { id: uid(), date: d(0), title: "BIL201 laboratuvar hazırlığı", start: "11:00", end: "12:30", color: "#2563eb", note: "Bağlı liste ve ağaç örneklerini tekrar et.", done: false },
    { id: uid(), date: d(0), title: "Kütüphanede problem seti çözümü", start: "16:30", end: "18:00", color: "#0d9488", note: "Sessiz çalışma katı", done: false },
    { id: uid(), date: d(1), title: "RC devreleri lab raporu yazımı", start: "14:00", end: "16:00", color: "#7c3aed", note: "Grafikleri PDF'e ekle.", done: false },
  ];
  const notes = [
    { id: uid(), date: d(0), title: "Hoca ofis saati", text: "Dr. Ayşe Kaya ile 15:00'te proje konusunu netleştir." },
    { id: uid(), date: d(1), title: "Lab malzemeleri", text: "Multimetre ve lab föyünü çantaya koymayı unutma." },
  ];
  return { semester: "2026–2027 Güz Dönemi", courses, items, plans, notes };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.courses) || !Array.isArray(parsed.items)) return null;
    return {
      ...parsed,
      plans: Array.isArray(parsed.plans) ? parsed.plans : [],
      notes: Array.isArray(parsed.notes) ? parsed.notes : [],
    };
  } catch {
    return null;
  }
}

/* --------------------------------- İkonlar --------------------------------- */
const ICONS = {
  plus: "M12 5v14M5 12h14",
  check: "M5 12.5l4.5 4.5L19 7",
  x: "M6 6l12 12M18 6L6 18",
  left: "M15 6l-6 6 6 6",
  right: "M9 6l6 6-6 6",
  home: "M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  cal: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  book: "M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2zM4 20a2 2 0 0 0 2 1h13v-3",
  clock: "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  pin: "M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4",
  note: "M5 4h14v11l-5 5H5zM14 15h5M8 9h8M8 13h4",
};
function Icon({ name, size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/* ================================== Uygulama ================================== */
export default function App() {
  const [data, setData] = useState(() => loadData() ?? seed());
  const [view, setView] = useState("overview");
  const [modal, setModal] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* depolama kullanılamıyorsa sessizce devam et */
    }
  }, [data]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const courseMap = useMemo(() => Object.fromEntries(data.courses.map((c) => [c.id, c])), [data.courses]);

  const saveItem = (item) =>
    setData((d) => ({
      ...d,
      items: d.items.some((i) => i.id === item.id) ? d.items.map((i) => (i.id === item.id ? item : i)) : [...d.items, item],
    }));
  const deleteItem = (id) => setData((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));
  const toggleItem = (id) => setData((d) => ({ ...d, items: d.items.map((i) => (i.id === id ? { ...i, done: !i.done } : i)) }));
  const saveCourse = (course) =>
    setData((d) => ({
      ...d,
      courses: d.courses.some((c) => c.id === course.id) ? d.courses.map((c) => (c.id === course.id ? course : c)) : [...d.courses, course],
    }));
  const deleteCourse = (id) =>
    setData((d) => ({ ...d, courses: d.courses.filter((c) => c.id !== id), items: d.items.filter((i) => i.courseId !== id) }));
  const updateSlot = (courseId, idx, patch) =>
    setData((d) => ({
      ...d,
      courses: d.courses.map((c) => (c.id === courseId ? { ...c, slots: c.slots.map((s, i) => (i === idx ? { ...s, ...patch } : s)) } : c)),
    }));
  const setCourses = (courses) => setData((d) => ({ ...d, courses }));
  const savePlan = (plan) =>
    setData((d) => {
      const plans = d.plans || [];
      return { ...d, plans: plans.some((p) => p.id === plan.id) ? plans.map((p) => (p.id === plan.id ? plan : p)) : [...plans, plan] };
    });
  const deletePlan = (id) => setData((d) => ({ ...d, plans: (d.plans || []).filter((p) => p.id !== id) }));
  const togglePlan = (id) => setData((d) => ({ ...d, plans: (d.plans || []).map((p) => (p.id === id ? { ...p, done: !p.done } : p)) }));
  const updatePlan = (id, patch) => setData((d) => ({ ...d, plans: (d.plans || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const restoreSchedule = (snap) => setData((d) => ({ ...d, courses: snap.courses, plans: snap.plans }));
  const saveNote = (note) =>
    setData((d) => {
      const notes = d.notes || [];
      return { ...d, notes: notes.some((n) => n.id === note.id) ? notes.map((n) => (n.id === note.id ? note : n)) : [...notes, note] };
    });
  const deleteNote = (id) => setData((d) => ({ ...d, notes: (d.notes || []).filter((n) => n.id !== id) }));

  const openItem = (item = null, preset = {}) => setModal({ kind: "item", item, preset });
  const openCourse = (course = null) => setModal({ kind: "course", course });
  const openPlan = (plan = null, preset = {}, onSaved = null) => setModal({ kind: "plan", plan, preset, onSaved });
  const openNote = (note = null, preset = {}, onSaved = null) => setModal({ kind: "note", note, preset, onSaved });
  const closeModal = () => setModal(null);

  const shared = {
    data,
    courseMap,
    now,
    onToggle: toggleItem,
    onEditItem: (i) => openItem(i),
    onAddItem: (p) => openItem(null, p),
    onEditCourse: openCourse,
    onUpdateSlot: updateSlot,
    onSetCourses: setCourses,
    onAddPlan: (p, cb) => openPlan(null, p, cb),
    onEditPlan: (p, cb) => openPlan(p, {}, cb),
    onTogglePlan: togglePlan,
    onUpdatePlan: updatePlan,
    onDeletePlan: deletePlan,
    onRestoreSchedule: restoreSchedule,
    onAddNote: (p, cb) => openNote(null, p, cb),
    onEditNote: (n, cb) => openNote(n, {}, cb),
    onDeleteNote: deleteNote,
  };

  const NAV = [
    { id: "overview", label: "Genel Bakış", icon: "home" },
    { id: "week", label: "Haftalık Program", icon: "grid" },
    { id: "month", label: "Takvim", icon: "cal" },
    { id: "courses", label: "Dersler", icon: "book" },
  ];

  return (
    <div className="dp">
      <style>{CSS}</style>
      <aside className="side">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            <Icon name="cal" size={18} />
          </span>
          <div className="brand-text">
            <strong>Dönem Planlayıcı</strong>
            <input
              className="semester"
              value={data.semester}
              onChange={(e) => setData((d) => ({ ...d, semester: e.target.value }))}
              aria-label="Dönem adı"
            />
          </div>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <button key={n.id} className={`nav-btn ${view === n.id ? "active" : ""}`} onClick={() => setView(n.id)}>
              <Icon name={n.icon} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="side-actions">
          <button className="btn primary block" onClick={() => openItem()}>
            <Icon name="plus" /> Teslim / Sınav ekle
          </button>
          <button className="btn block" onClick={() => openCourse()}>
            <Icon name="book" /> Ders ekle
          </button>
        </div>
        <div className="side-foot">
          <button
            className="link"
            onClick={() => {
              if (window.confirm("Mevcut veriler silinip örnek dönem yüklensin mi?")) setData(seed());
            }}
          >
            Örnek verileri yükle
          </button>
          <button
            className="link"
            onClick={() => {
              if (window.confirm("Tüm dersler, teslimler, planlar ve notlar silinsin mi? Bu işlem geri alınamaz."))
                setData((d) => ({ ...d, courses: [], items: [], plans: [], notes: [] }));
            }}
          >
            Tümünü temizle
          </button>
        </div>
      </aside>

      <main className="main">
        {view === "overview" && <Overview {...shared} />}
        {view === "week" && <WeekView {...shared} />}
        {view === "month" && <MonthView {...shared} />}
        {view === "courses" && <CoursesView {...shared} onAddCourse={() => openCourse()} />}
      </main>

      {modal?.kind === "item" && (
        <ItemModal
          item={modal.item}
          preset={modal.preset}
          courses={data.courses}
          onSave={saveItem}
          onDelete={deleteItem}
          onClose={closeModal}
          onNeedCourse={() => setModal({ kind: "course", course: null })}
        />
      )}
      {modal?.kind === "course" && <CourseModal course={modal.course} onSave={saveCourse} onDelete={deleteCourse} onClose={closeModal} />}
      {modal?.kind === "plan" && (
        <PlanModal
          plan={modal.plan}
          preset={modal.preset}
          onSave={(p) => {
            savePlan(p);
            modal.onSaved?.(p);
          }}
          onDelete={deletePlan}
          onClose={closeModal}
        />
      )}
      {modal?.kind === "note" && (
        <NoteModal
          note={modal.note}
          preset={modal.preset}
          onSave={(n) => {
            saveNote(n);
            modal.onSaved?.(n);
          }}
          onDelete={deleteNote}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

/* ================================ Genel Bakış ================================ */
function Overview({ data, courseMap, now, onToggle, onEditItem, onAddItem }) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [showDone, setShowDone] = useState(false);
  const today = startOfDay(now);
  const todayIdx = mondayIndex(today);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const withDiff = data.items.map((i) => ({ ...i, diff: daysBetween(today, parseYmd(i.date)) }));
  const pending = withDiff.filter((i) => !i.done);
  const dueThisWeek = pending.filter((i) => i.diff >= 0 && i.diff <= 6).length;
  const overdue = pending.filter((i) => i.diff < 0).length;
  const doneCount = data.items.filter((i) => i.done).length;
  const progress = data.items.length ? Math.round((doneCount / data.items.length) * 100) : 0;
  const nextExam = pending.filter((i) => i.type === "sinav" && i.diff >= 0).sort(sortItems)[0];
  const examsIn30 = pending.filter((i) => i.type === "sinav" && i.diff >= 0 && i.diff <= 30).length;

  const todayClasses = data.courses
    .flatMap((c) => c.slots.filter((s) => s.day === todayIdx).map((s) => ({ ...s, course: c })))
    .sort((a, b) => toMin(a.start) - toMin(b.start));
  const todayDue = pending.filter((i) => i.diff === 0).length;

  const filtered = withDiff
    .filter((i) => (showDone ? true : !i.done))
    .filter((i) => typeFilter === "all" || i.type === typeFilter)
    .filter((i) => courseFilter === "all" || i.courseId === courseFilter)
    .sort(sortItems);

  const groups = [
    { key: "late", label: "Gecikenler", items: filtered.filter((i) => i.diff < 0 && !i.done) },
    { key: "today", label: "Bugün", items: filtered.filter((i) => i.diff === 0) },
    { key: "tomorrow", label: "Yarın", items: filtered.filter((i) => i.diff === 1) },
    { key: "week", label: "Bu hafta", items: filtered.filter((i) => i.diff >= 2 && i.diff <= 7) },
    { key: "later", label: "Daha sonra", items: filtered.filter((i) => i.diff > 7) },
    { key: "past", label: "Geçmiş (tamamlanan)", items: filtered.filter((i) => i.diff < 0 && i.done) },
  ];

  const load = data.courses
    .map((c) => ({ c, n: pending.filter((i) => i.courseId === c.id && i.diff >= 0 && i.diff <= 14).length }))
    .sort((a, b) => b.n - a.n);
  const maxLoad = Math.max(1, ...load.map((l) => l.n));

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            {DAYS[todayIdx]}, {today.getDate()} {MONTHS[today.getMonth()]}
          </p>
          <h1>Genel Bakış</h1>
          <p className="sub">
            Bugün {todayClasses.length ? `${todayClasses.length} dersin` : "dersin yok"}
            {todayDue ? ` ve ${todayDue} teslimin var.` : todayClasses.length ? " var, teslim yok." : ", teslim de yok."}
          </p>
        </div>
      </header>

      <section className="stats">
        <Stat label="Bu hafta teslim" value={dueThisWeek} hint="önümüzdeki 7 gün" />
        <Stat label="Geciken" value={overdue} hint={overdue ? "hemen ilgilen" : "harika, yok"} tone={overdue ? "danger" : ""} />
        <Stat label="Yaklaşan sınav" value={examsIn30} hint="önümüzdeki 30 gün" />
        <div className="stat">
          <span className="stat-label">Dönem ilerlemesi</span>
          <span className="stat-value">%{progress}</span>
          <div className="bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="stat-hint">
            {doneCount}/{data.items.length} tamamlandı
          </span>
        </div>
      </section>

      <div className="ov-grid">
        <section className="panel">
          <div className="panel-head">
            <h2>Yaklaşanlar</h2>
            <button className="btn small" onClick={() => onAddItem({})}>
              <Icon name="plus" size={16} /> Ekle
            </button>
          </div>
          <div className="filters">
            <div className="chips" role="group" aria-label="Türe göre filtrele">
              {[["all", "Tümü"], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])].map(([k, l]) => (
                <button key={k} className={`chip ${typeFilter === k ? "on" : ""}`} onClick={() => setTypeFilter(k)}>
                  {l}
                </button>
              ))}
            </div>
            <div className="filters-right">
              <select className="select" value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)} aria-label="Derse göre filtrele">
                <option value="all">Tüm dersler</option>
                {data.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} · {c.name}
                  </option>
                ))}
              </select>
              <label className="toggle">
                <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
                <span>Tamamlananlar</span>
              </label>
            </div>
          </div>

          {filtered.length === 0 ? (
            <Empty
              title={data.items.length ? "Bu filtreyle eşleşen kayıt yok" : "Henüz teslim ya da sınav eklenmedi"}
              text={data.items.length ? "Filtreleri değiştirmeyi dene." : "İlk ödevini veya sınavını ekleyerek başla."}
              action={!data.items.length && <button className="btn primary" onClick={() => onAddItem({})}><Icon name="plus" /> Ekle</button>}
            />
          ) : (
            groups.map(
              (g) =>
                g.items.length > 0 && (
                  <div key={g.key} className={`group g-${g.key}`}>
                    <h3>
                      {g.label} <span className="count">{g.items.length}</span>
                    </h3>
                    <ul className="items">
                      {g.items.map((i) => (
                        <ItemRow key={i.id} item={i} course={courseMap[i.courseId]} today={today} onToggle={onToggle} onEdit={onEditItem} />
                      ))}
                    </ul>
                  </div>
                )
            )
          )}
        </section>

        <aside className="ov-side">
          <section className="panel exam-card" style={{ "--c": nextExam ? courseMap[nextExam.courseId]?.color : "var(--accent)" }}>
            <p className="eyebrow">Sıradaki sınav</p>
            {nextExam ? (
              <button className="exam-body" onClick={() => onEditItem(nextExam)}>
                <div className="exam-count">
                  <span className="num">{nextExam.diff}</span>
                  <span className="unit">{nextExam.diff === 0 ? "bugün!" : "gün"}</span>
                </div>
                <div className="exam-info">
                  <strong>
                    {courseMap[nextExam.courseId]?.code} · {nextExam.title}
                  </strong>
                  <span>{courseMap[nextExam.courseId]?.name}</span>
                  <span className="muted">
                    {fmtDate(nextExam.date)} · {nextExam.time}
                    {nextExam.weight ? ` · %${nextExam.weight}` : ""}
                  </span>
                  {nextExam.note && <span className="exam-note">{nextExam.note}</span>}
                </div>
              </button>
            ) : (
              <p className="muted">Planlanmış sınav yok.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Bugünkü dersler</h2>
            </div>
            {todayClasses.length === 0 ? (
              <p className="muted">Bugün ders yok. Biraz nefes al.</p>
            ) : (
              <ul className="today-list">
                {todayClasses.map((s, idx) => {
                  const live = nowMin >= toMin(s.start) && nowMin < toMin(s.end);
                  const past = nowMin >= toMin(s.end);
                  return (
                    <li key={idx} className={`${live ? "live" : ""} ${past ? "past" : ""}`} style={{ "--c": s.course.color }}>
                      <span className="t">
                        {s.start}
                        <small>{s.end}</small>
                      </span>
                      <span className="d">
                        <strong>{s.course.code}</strong> {s.course.name}
                        {s.course.room && (
                          <small>
                            <Icon name="pin" size={13} /> {s.course.room}
                          </small>
                        )}
                      </span>
                      {live && <span className="live-tag">Şimdi</span>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>İş yükü</h2>
              <span className="muted small">önümüzdeki 14 gün</span>
            </div>
            {load.length === 0 ? (
              <p className="muted">Ders eklenmedi.</p>
            ) : (
              <ul className="load">
                {load.map(({ c, n }) => (
                  <li key={c.id} style={{ "--c": c.color }}>
                    <span className="load-code">{c.code}</span>
                    <span className="load-bar">
                      <span style={{ width: `${(n / maxLoad) * 100}%` }} />
                    </span>
                    <span className="load-n">{n}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, hint, tone }) {
  return (
    <div className={`stat ${tone || ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      <span className="stat-hint">{hint}</span>
    </div>
  );
}

function ItemRow({ item, course, today, onToggle, onEdit }) {
  const diff = daysBetween(today, parseYmd(item.date));
  const u = urgency(diff, item.done);
  return (
    <li className={`item ${item.done ? "is-done" : ""}`} style={{ "--c": course?.color || "#888" }}>
      <button className="check" onClick={() => onToggle(item.id)} aria-label={item.done ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"} aria-pressed={item.done}>
        {item.done && <Icon name="check" size={14} />}
      </button>
      <button className="item-main" onClick={() => onEdit(item)}>
        <span className="item-title">{item.title}</span>
        <span className="item-meta">
          <span className="code">{course?.code || "—"}</span>
          <span className={`badge t-${item.type}`}>{TYPES[item.type]?.label}</span>
          <span>
            {fmtDate(item.date)} · {item.time}
          </span>
          {item.weight ? <span className="muted">%{item.weight}</span> : null}
        </span>
      </button>
      <span className={`due u-${u}`}>{item.done ? "Tamamlandı" : relLabel(diff)}</span>
    </li>
  );
}

function Empty({ title, text, action }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}

/* ============================== Haftalık Program ============================== */
const SNAP = 5; // sürüklerken dakikalar 5'in katına yuvarlanır
const MIN_DURATION = 15;
const snapMin = (m) => Math.round(m / SNAP) * SNAP;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const overlaps = (a, b) => toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);

/* Aynı gündeki çakışan dersleri yan yana şeritlere yerleştirir. */
function layoutDay(slots) {
  const sorted = [...slots].sort((a, b) => toMin(a.start) - toMin(b.start) || toMin(b.end) - toMin(a.end));
  const out = [];
  let cluster = [];
  let laneEnds = [];
  let clusterEnd = -1;
  const flush = () => {
    cluster.forEach((o) => (o.lanes = laneEnds.length));
    cluster = [];
    laneEnds = [];
  };
  for (const s of sorted) {
    const st = toMin(s.start);
    const en = toMin(s.end);
    if (st >= clusterEnd) {
      flush();
      clusterEnd = -1;
    }
    let lane = laneEnds.findIndex((e) => e <= st);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(en);
    } else laneEnds[lane] = en;
    const o = { ...s, lane, lanes: 1 };
    cluster.push(o);
    out.push(o);
    clusterEnd = Math.max(clusterEnd, en);
  }
  flush();
  out.forEach((o) => (o.conflict = out.some((p) => p !== o && overlaps(o, p))));
  return out;
}

function WeekView({ data, courseMap, now, onEditItem, onEditCourse, onUpdateSlot, onSetCourses }) {
  const [offset, setOffset] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [drag, setDrag] = useState(null); // { key, day, start, end, origDay, origStart, origEnd, color }
  const [history, setHistory] = useState([]);
  const gridRef = useRef(null);

  const today = startOfDay(now);
  const monday = addDays(today, -mondayIndex(today) + offset * 7);
  const allSlots = data.courses.flatMap((c) => c.slots);
  let dayCount = allSlots.some((s) => s.day === 6) ? 7 : allSlots.some((s) => s.day === 5) ? 6 : 5;
  if (editMode) dayCount = Math.max(dayCount, 6); // düzenlerken cumartesiye de taşınabilsin
  const days = Array.from({ length: dayCount }, (_, i) => addDays(monday, i));
  const sunday = addDays(monday, 6);

  let minH = 8;
  let maxH = 18;
  allSlots.forEach((s) => {
    minH = Math.min(minH, Math.floor(toMin(s.start) / 60));
    maxH = Math.max(maxH, Math.ceil(toMin(s.end) / 60));
  });
  if (editMode) maxH = Math.max(maxH, 20); // düzenlerken akşama doğru uzatmak için boşluk
  const HOUR = 56;
  const LO = minH * 60;
  const HI = maxH * 60;
  const total = (maxH - minH) * HOUR;
  const hours = Array.from({ length: maxH - minH }, (_, i) => minH + i);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const weekItems = data.items.filter((i) => {
    const d = parseYmd(i.date);
    return d >= monday && d <= sunday;
  });
  const weeklyHours = allSlots.reduce((sum, s) => sum + (toMin(s.end) - toMin(s.start)), 0) / 60;

  /* Sütunlara dağıtılmış dersler (sürüklenen ders önizleme konumunda). */
  const columns = days.map((_, i) => {
    const list = [];
    data.courses.forEach((c) =>
      c.slots.forEach((s, idx) => {
        const key = `${c.id}:${idx}`;
        if (drag && key === drag.key) {
          if (drag.day === i) list.push({ day: i, start: fromMin(drag.start), end: fromMin(drag.end), course: c, idx, key, dragging: true });
        } else if (s.day === i) list.push({ ...s, course: c, idx, key });
      })
    );
    return layoutDay(list);
  });
  const conflictPairs = columns.reduce((sum, col) => {
    let n = 0;
    col.forEach((a, i) => col.slice(i + 1).forEach((b) => overlaps(a, b) && n++));
    return sum + n;
  }, 0);

  /* ---- Düzenleme işlemleri ---- */
  const pushHistory = () => setHistory((h) => [...h.slice(-29), data.courses]);
  const commit = (s, next) => {
    if (next.day === s.day && fromMin(next.start) === s.start && fromMin(next.end) === s.end) return;
    pushHistory();
    onUpdateSlot(s.course.id, s.idx, { day: next.day, start: fromMin(next.start), end: fromMin(next.end) });
  };
  const removeSlot = (s) => {
    pushHistory();
    onSetCourses(data.courses.map((c) => (c.id === s.course.id ? { ...c, slots: c.slots.filter((_, j) => j !== s.idx) } : c)));
  };
  const undo = () => {
    if (!history.length) return;
    onSetCourses(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  useEffect(() => {
    if (!editMode) return undefined;
    const h = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape" && !document.querySelector(".overlay")) setEditMode(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* Fareyle / dokunarak taşıma ve uzatma. mode: "move" | "start" | "end" */
  const begin = (e, s, mode) => {
    if (!editMode || e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.closest(".wk-block")?.focus({ preventScroll: true });
    const st0 = toMin(s.start);
    const en0 = toMin(s.end);
    const dur = en0 - st0;
    const cols = [...gridRef.current.querySelectorAll(".wk-col")].map((el) => el.getBoundingClientRect());
    const x0 = e.clientX;
    const y0 = e.clientY;
    let moved = false;
    let last = { day: s.day, start: st0, end: en0 };
    const base = { key: s.key, origDay: s.day, origStart: st0, origEnd: en0, color: s.course.color };
    document.body.style.cursor = mode === "move" ? "grabbing" : "ns-resize";
    document.body.style.userSelect = "none";

    const move = (ev) => {
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      moved = true;
      const raw = (dy / HOUR) * 60;
      let { day } = s;
      let start = st0;
      let end = en0;
      if (mode === "move") {
        const ci = cols.findIndex((r) => ev.clientX >= r.left && ev.clientX < r.right);
        day = ci >= 0 ? ci : ev.clientX < cols[0].left ? 0 : cols.length - 1;
        start = clamp(snapMin(st0 + raw), LO, HI - dur);
        end = start + dur;
      } else if (mode === "end") {
        end = clamp(snapMin(en0 + raw), st0 + MIN_DURATION, HI);
      } else {
        start = clamp(snapMin(st0 + raw), LO, en0 - MIN_DURATION);
      }
      last = { day, start, end };
      setDrag({ ...base, ...last });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setDrag(null);
      if (!moved) {
        if (mode === "move") onEditCourse(s.course);
        return;
      }
      commit(s, last);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* Klavyeyle düzenleme: oklar taşır, Shift+↑/↓ uzatır/kısaltır, Delete kaldırır. */
  const onBlockKey = (e, s) => {
    if (e.key === "Enter" || (!editMode && e.key === " ")) {
      e.preventDefault();
      onEditCourse(s.course);
      return;
    }
    if (!editMode) return;
    const st = toMin(s.start);
    const en = toMin(s.end);
    const step = e.altKey ? SNAP : 15;
    let next = null;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const d = e.key === "ArrowUp" ? -step : step;
      next = e.shiftKey
        ? { day: s.day, start: st, end: clamp(en + d, st + MIN_DURATION, HI) }
        : { day: s.day, start: clamp(st + d, LO, HI - (en - st)), end: clamp(st + d, LO, HI - (en - st)) + (en - st) };
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      next = { day: clamp(s.day + (e.key === "ArrowLeft" ? -1 : 1), 0, dayCount - 1), start: st, end: en };
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeSlot(s);
      return;
    }
    if (next) {
      e.preventDefault();
      commit(s, next);
      // Ders başka sütuna geçince yeniden oluşturulur; odağı yeni konumda geri ver.
      requestAnimationFrame(() => gridRef.current?.querySelector(`[data-key="${s.key}"]`)?.focus({ preventScroll: true }));
    }
  };

  const label =
    monday.getMonth() === sunday.getMonth()
      ? `${monday.getDate()}–${sunday.getDate()} ${MONTHS[monday.getMonth()]} ${monday.getFullYear()}`
      : `${monday.getDate()} ${MONTHS[monday.getMonth()].slice(0, 3)} – ${sunday.getDate()} ${MONTHS[sunday.getMonth()].slice(0, 3)} ${sunday.getFullYear()}`;

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{label}</p>
          <h1>Haftalık Program</h1>
          <p className="sub">
            Haftada {Math.round(weeklyHours * 10) / 10} saat ders · bu hafta {weekItems.filter((i) => !i.done).length} bekleyen teslim/sınav
            {conflictPairs > 0 && <span className="sub-warn"> · {conflictPairs} saat çakışması</span>}
          </p>
        </div>
        <div className="head-actions">
          {data.courses.length > 0 && (
            <button className={`btn small ${editMode ? "primary" : ""}`} onClick={() => setEditMode((m) => !m)} aria-pressed={editMode}>
              <Icon name={editMode ? "check" : "edit"} size={16} /> {editMode ? "Düzenlemeyi bitir" : "Programı düzenle"}
            </button>
          )}
          <Pager onPrev={() => setOffset((o) => o - 1)} onNext={() => setOffset((o) => o + 1)} onToday={() => setOffset(0)} todayLabel="Bu hafta" isCurrent={offset === 0} />
        </div>
      </header>

      {editMode && (
        <div className="edit-bar" role="status">
          <span className="edit-dot" aria-hidden="true" />
          <span className="edit-text">
            <strong>Düzenleme modu.</strong> Dersi sürükleyerek taşı, üst ya da alt kenarından çekerek kısalt/uzat. Klavyede oklar taşır, Shift+↑/↓ uzatır, Delete kaldırır.
          </span>
          {conflictPairs > 0 && <span className="edit-conflict">{conflictPairs} çakışma</span>}
          <button className="btn small" onClick={undo} disabled={!history.length} title="Geri al (Ctrl+Z)">
            Geri al
          </button>
          <button className="btn small primary" onClick={() => setEditMode(false)}>
            Bitti
          </button>
        </div>
      )}

      {data.courses.length === 0 ? (
        <section className="panel">
          <Empty title="Programın boş" text="Ders ekleyip haftalık saatlerini girdiğinde burada görünecek." />
        </section>
      ) : (
        <section className="panel week-panel">
          <div className="week-scroll">
            <div ref={gridRef} className={`week ${editMode ? "editing" : ""}`} style={{ gridTemplateColumns: `52px repeat(${dayCount}, minmax(118px, 1fr))` }}>
              <div className="wk-corner" />
              {days.map((d, i) => {
                const isToday = ymd(d) === ymd(today);
                const dayItems = weekItems.filter((it) => it.date === ymd(d)).sort(sortItems);
                return (
                  <div key={i} className={`wk-head ${isToday ? "today" : ""}`}>
                    <div className="wk-day">
                      <span>{DAYS_SHORT[i]}</span>
                      <strong>{d.getDate()}</strong>
                    </div>
                    <div className="wk-due">
                      {dayItems.map((it) => {
                        const c = courseMap[it.courseId];
                        return (
                          <button key={it.id} className={`due-chip t-${it.type} ${it.done ? "is-done" : ""}`} style={{ "--c": c?.color }} onClick={() => onEditItem(it)} title={`${c?.code} · ${it.title} · ${it.time}`}>
                            <b>{TYPES[it.type].label}</b> {c?.code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="wk-times" style={{ height: total }}>
                {hours.map((h) => (
                  <span key={h} style={{ top: (h - minH) * HOUR }}>
                    {pad(h)}:00
                  </span>
                ))}
              </div>
              {days.map((d, i) => {
                const isToday = ymd(d) === ymd(today);
                return (
                  <div
                    key={i}
                    className={`wk-col ${isToday ? "today" : ""} ${drag && drag.day === i ? "drop" : ""}`}
                    style={{ height: total, backgroundSize: editMode ? `100% ${HOUR}px, 100% ${HOUR / 2}px` : `100% ${HOUR}px` }}
                  >
                    {drag && drag.origDay === i && (
                      <div
                        className="wk-ghost"
                        aria-hidden="true"
                        style={{ top: ((drag.origStart - LO) / 60) * HOUR, height: ((drag.origEnd - drag.origStart) / 60) * HOUR - 3, "--c": drag.color }}
                      />
                    )}
                    {columns[i].map((s) => {
                      const top = ((toMin(s.start) - LO) / 60) * HOUR;
                      const h = Math.max(22, ((toMin(s.end) - toMin(s.start)) / 60) * HOUR - 3);
                      const w = 100 / s.lanes;
                      const cls = ["wk-block", editMode && "editable", s.dragging && "dragging", s.conflict && "conflict"].filter(Boolean).join(" ");
                      return (
                        <div
                          key={s.key}
                          data-key={s.key}
                          role="button"
                          tabIndex={0}
                          className={cls}
                          style={{ top, height: h, left: `calc(${s.lane * w}% + 3px)`, width: `calc(${w}% - 6px)`, "--c": s.course.color }}
                          onClick={editMode ? undefined : () => onEditCourse(s.course)}
                          onPointerDown={editMode ? (e) => begin(e, s, "move") : undefined}
                          onKeyDown={(e) => onBlockKey(e, s)}
                          title={`${s.course.code} ${s.course.name}${s.conflict ? " — başka bir dersle çakışıyor" : ""}`}
                          aria-label={`${s.course.code} ${s.course.name}, ${DAYS[s.day]} ${s.start}–${s.end}${s.conflict ? ", çakışma var" : ""}`}
                        >
                          {editMode && <span className="wk-handle top" aria-hidden="true" onPointerDown={(e) => begin(e, s, "start")} />}
                          <strong>{s.course.code}</strong>
                          {h > 40 && <span className="block-name">{s.course.name}</span>}
                          {h > 64 && (
                            <span className="block-meta">
                              {s.start}–{s.end}
                              {s.course.room ? ` · ${s.course.room}` : ""}
                            </span>
                          )}
                          {s.dragging && (
                            <span className="wk-tip">
                              {DAYS_SHORT[s.day]} {s.start}–{s.end}
                            </span>
                          )}
                          {s.conflict && !s.dragging && (
                            <span className="wk-warn" aria-hidden="true">
                              !
                            </span>
                          )}
                          {editMode && !s.dragging && (
                            <button
                              className="wk-remove"
                              aria-label={`${s.course.code} ${DAYS[s.day]} ${s.start} saatini kaldır`}
                              title="Bu saati kaldır"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSlot(s);
                              }}
                            >
                              <Icon name="x" size={12} />
                            </button>
                          )}
                          {editMode && <span className="wk-handle bottom" aria-hidden="true" onPointerDown={(e) => begin(e, s, "end")} />}
                        </div>
                      );
                    })}
                    {isToday && nowMin >= LO && nowMin <= HI && <div className="now-line" style={{ top: ((nowMin - LO) / 60) * HOUR }} />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Pager({ onPrev, onNext, onToday, todayLabel, isCurrent }) {
  return (
    <div className="pager">
      <button className="icon-btn" onClick={onPrev} aria-label="Önceki">
        <Icon name="left" />
      </button>
      <button className="btn small" onClick={onToday} disabled={isCurrent}>
        {todayLabel}
      </button>
      <button className="icon-btn" onClick={onNext} aria-label="Sonraki">
        <Icon name="right" />
      </button>
    </div>
  );
}

/* ================================== Takvim ================================== */
function MonthView({
  data,
  courseMap,
  now,
  onToggle,
  onEditItem,
  onAddItem,
  onEditCourse,
  onUpdateSlot,
  onSetCourses,
  onAddPlan,
  onEditPlan,
  onTogglePlan,
  onUpdatePlan,
  onDeletePlan,
  onRestoreSchedule,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) {
  const [offset, setOffset] = useState(0);
  const today = startOfDay(now);
  const [selected, setSelected] = useState(() => ymd(today));
  const base = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  const start = addDays(base, -mondayIndex(base));
  const cells = Array.from({ length: 42 }, (_, i) => addDays(start, i));

  const plans = data.plans || [];
  const notes = data.notes || [];

  const jumpToDate = (dateStr) => {
    if (!dateStr) return;
    const d = parseYmd(dateStr);
    const monthDiff = (d.getFullYear() - today.getFullYear()) * 12 + (d.getMonth() - today.getMonth());
    setOffset(monthDiff);
    setSelected(dateStr);
  };

  const byDate = useMemo(() => {
    const m = {};
    data.items.forEach((i) => (m[i.date] = m[i.date] || []).push(i));
    Object.values(m).forEach((arr) => arr.sort(sortItems));
    return m;
  }, [data.items]);

  const plansByDate = useMemo(() => {
    const m = {};
    plans.forEach((p) => (m[p.date] = m[p.date] || []).push(p));
    Object.values(m).forEach((arr) => arr.sort((a, b) => toMin(a.start) - toMin(b.start)));
    return m;
  }, [plans]);

  const notesByDate = useMemo(() => {
    const m = {};
    notes.forEach((n) => (m[n.date] = m[n.date] || []).push(n));
    return m;
  }, [notes]);

  const monthItems = data.items.filter((i) => {
    const d = parseYmd(i.date);
    return d.getMonth() === base.getMonth() && d.getFullYear() === base.getFullYear();
  });
  const monthNotesCount = notes.filter((n) => {
    const d = parseYmd(n.date);
    return d.getMonth() === base.getMonth() && d.getFullYear() === base.getFullYear();
  }).length;
  const selItems = byDate[selected] || [];
  const selPlans = plansByDate[selected] || [];
  const selNotes = notesByDate[selected] || [];
  const selDate = parseYmd(selected);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            {monthItems.filter((i) => i.type === "sinav").length} sınav · {monthItems.filter((i) => i.type !== "sinav").length} teslim
            {monthNotesCount > 0 ? ` · ${monthNotesCount} not` : ""}
          </p>
          <h1>
            {MONTHS[base.getMonth()]} {base.getFullYear()}
          </h1>
          <p className="sub">Bir güne tıkla: o günün ders programını, detaylı planını ve notlarını gör veya düzenle.</p>
        </div>
        <div className="head-actions">
          <button className="btn primary small" onClick={() => onAddNote({ date: selected }, (saved) => jumpToDate(saved.date))}>
            <Icon name="note" size={16} /> Not ekle
          </button>
          <Pager
            onPrev={() => setOffset((o) => o - 1)}
            onNext={() => setOffset((o) => o + 1)}
            onToday={() => {
              setOffset(0);
              setSelected(ymd(today));
            }}
            todayLabel="Bugün"
            isCurrent={offset === 0}
          />
        </div>
      </header>

      <div className="month-wrap">
        <section className="panel month-panel">
          <div className="month">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="m-dow">
                {d}
              </div>
            ))}
            {cells.map((d) => {
              const key = ymd(d);
              const items = byDate[key] || [];
              const dayPlans = plansByDate[key] || [];
              const dayNotes = notesByDate[key] || [];
              const out = d.getMonth() !== base.getMonth();
              const isToday = key === ymd(today);
              return (
                <div
                  key={key}
                  role="button"
                  tabIndex={0}
                  className={`m-cell ${out ? "out" : ""} ${isToday ? "today" : ""} ${selected === key ? "sel" : ""}`}
                  onClick={() => setSelected(key)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setSelected(key))}
                  aria-label={`${d.getDate()} ${MONTHS[d.getMonth()]}, ${items.length} kayıt, ${dayPlans.length} plan, ${dayNotes.length} not`}
                >
                  <div className="m-cell-top">
                    <span className="m-num">{d.getDate()}</span>
                    {(dayPlans.length > 0 || dayNotes.length > 0) && (
                      <span className="m-badges">
                        {dayPlans.length > 0 && (
                          <span className="m-badge plan" title={`${dayPlans.length} plan`}>
                            <Icon name="clock" size={11} />
                            {dayPlans.length}
                          </span>
                        )}
                        {dayNotes.length > 0 && (
                          <span className="m-badge note" title={`${dayNotes.length} not`}>
                            <Icon name="note" size={11} />
                            {dayNotes.length}
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="m-items">
                    {items.slice(0, 2).map((it) => {
                      const c = courseMap[it.courseId];
                      return (
                        <button
                          key={it.id}
                          className={`m-chip t-${it.type} ${it.done ? "is-done" : ""}`}
                          style={{ "--c": c?.color }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditItem(it);
                          }}
                          title={`${c?.code} · ${it.title}`}
                        >
                          <span className="m-chip-text">
                            {c?.code} {it.title}
                          </span>
                        </button>
                      );
                    })}
                    {items.length < 2 &&
                      dayPlans.slice(0, 2 - items.length).map((pl) => (
                        <button
                          key={pl.id}
                          className={`m-chip m-plan-chip ${pl.done ? "is-done" : ""}`}
                          style={{ "--tc": pl.color || "var(--accent)" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPlan(pl, (saved) => jumpToDate(saved.date));
                          }}
                          title={`${pl.start}–${pl.end} · ${pl.title}`}
                        >
                          <span className="m-chip-text">
                            {pl.start} {pl.title}
                          </span>
                        </button>
                      ))}
                    {items.length + dayPlans.length > 2 && <span className="m-more">+{items.length + dayPlans.length - 2} daha</span>}
                  </div>
                  <div className="m-dots" aria-hidden="true">
                    {items.slice(0, 3).map((it) => (
                      <i key={it.id} className={`t-${it.type}`} style={{ "--c": courseMap[it.courseId]?.color }} />
                    ))}
                    {dayPlans.length > 0 && <i className="dot-plan" />}
                    {dayNotes.length > 0 && <i className="dot-note" />}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="legend">
            {Object.entries(TYPES).map(([k, v]) => (
              <span key={k}>
                <i className={`legend-dot t-${k}`} /> {v.label}
              </span>
            ))}
            <span>
              <i className="legend-dot dot-plan" /> Günlük plan
            </span>
            <span>
              <i className="legend-dot dot-note" /> Not
            </span>
          </div>
        </section>

        <DayDetailPanel
          selected={selected}
          selDate={selDate}
          today={today}
          now={now}
          data={data}
          courseMap={courseMap}
          selItems={selItems}
          selPlans={selPlans}
          selNotes={selNotes}
          onToggleItem={onToggle}
          onEditItem={onEditItem}
          onAddItem={onAddItem}
          onEditCourse={onEditCourse}
          onUpdateSlot={onUpdateSlot}
          onSetCourses={onSetCourses}
          onAddPlan={(preset) => onAddPlan(preset, (saved) => jumpToDate(saved.date))}
          onEditPlan={(plan) => onEditPlan(plan, (saved) => jumpToDate(saved.date))}
          onTogglePlan={onTogglePlan}
          onUpdatePlan={onUpdatePlan}
          onDeletePlan={onDeletePlan}
          onRestoreSchedule={onRestoreSchedule}
          onAddNote={(preset) => onAddNote(preset, (saved) => jumpToDate(saved.date))}
          onEditNote={(note) => onEditNote(note, (saved) => jumpToDate(saved.date))}
          onDeleteNote={onDeleteNote}
        />
      </div>
    </div>
  );
}

function DayDetailPanel({
  selected,
  selDate,
  today,
  now,
  data,
  courseMap,
  selItems,
  selPlans,
  selNotes,
  onToggleItem,
  onEditItem,
  onAddItem,
  onEditCourse,
  onUpdateSlot,
  onSetCourses,
  onAddPlan,
  onEditPlan,
  onTogglePlan,
  onUpdatePlan,
  onDeletePlan,
  onRestoreSchedule,
  onAddNote,
  onEditNote,
  onDeleteNote,
}) {
  const [editMode, setEditMode] = useState(false);
  const [drag, setDrag] = useState(null);
  const [history, setHistory] = useState([]);
  const colRef = useRef(null);

  const dayIdx = mondayIndex(selDate);
  const isToday = selected === ymd(today);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const rawBlocks = useMemo(() => {
    const list = [];
    data.courses.forEach((c) =>
      c.slots.forEach((s, idx) => {
        if (s.day === dayIdx) {
          list.push({
            kind: "course",
            key: `c:${c.id}:${idx}`,
            course: c,
            idx,
            start: s.start,
            end: s.end,
            color: c.color,
            title: c.name,
            code: c.code,
            room: c.room,
          });
        }
      })
    );
    selPlans.forEach((p) => {
      list.push({
        kind: "plan",
        key: `p:${p.id}`,
        plan: p,
        start: p.start,
        end: p.end,
        color: p.color || "#2d5bd0",
        title: p.title,
        note: p.note,
        done: p.done,
      });
    });
    return list;
  }, [data.courses, selPlans, dayIdx]);

  const blocks = useMemo(() => {
    const list = rawBlocks.map((b) =>
      drag && drag.key === b.key ? { ...b, start: fromMin(drag.start), end: fromMin(drag.end), dragging: true } : b
    );
    return layoutDay(list);
  }, [rawBlocks, drag]);

  const conflictPairs = useMemo(() => {
    let n = 0;
    blocks.forEach((a, i) => blocks.slice(i + 1).forEach((b) => overlaps(a, b) && n++));
    return n;
  }, [blocks]);

  let minH = 8;
  let maxH = 20;
  blocks.forEach((b) => {
    minH = Math.min(minH, Math.floor(toMin(b.start) / 60));
    maxH = Math.max(maxH, Math.ceil(toMin(b.end) / 60));
  });
  if (editMode) maxH = Math.max(maxH, 22);
  const HOUR = 46;
  const LO = minH * 60;
  const HI = maxH * 60;
  const total = (maxH - minH) * HOUR;
  const hours = Array.from({ length: maxH - minH }, (_, i) => minH + i);

  const pushHistory = () => setHistory((h) => [...h.slice(-29), { courses: data.courses, plans: data.plans || [] }]);
  const undo = () => {
    if (!history.length) return;
    onRestoreSchedule(history[history.length - 1]);
    setHistory(history.slice(0, -1));
  };

  const commitBlock = (b, nextStart, nextEnd) => {
    const st = fromMin(nextStart);
    const en = fromMin(nextEnd);
    if (st === b.start && en === b.end) return;
    pushHistory();
    if (b.kind === "course") {
      onUpdateSlot(b.course.id, b.idx, { start: st, end: en });
    } else {
      onUpdatePlan(b.plan.id, { start: st, end: en });
    }
  };

  const removeBlock = (b) => {
    pushHistory();
    if (b.kind === "course") {
      onSetCourses(data.courses.map((c) => (c.id === b.course.id ? { ...c, slots: c.slots.filter((_, j) => j !== b.idx) } : c)));
    } else {
      onDeletePlan(b.plan.id);
    }
  };

  useEffect(() => {
    if (!editMode) return undefined;
    const h = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key === "Escape" && !document.querySelector(".overlay")) setEditMode(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const begin = (e, b, mode) => {
    if (!editMode || e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.closest(".wk-block")?.focus({ preventScroll: true });
    const st0 = toMin(b.start);
    const en0 = toMin(b.end);
    const dur = en0 - st0;
    const y0 = e.clientY;
    let moved = false;
    let last = { start: st0, end: en0 };
    const base = { key: b.key, origStart: st0, origEnd: en0, color: b.color };
    document.body.style.cursor = mode === "move" ? "grabbing" : "ns-resize";
    document.body.style.userSelect = "none";

    const move = (ev) => {
      const dy = ev.clientY - y0;
      if (!moved && Math.abs(dy) < 4) return;
      moved = true;
      const raw = (dy / HOUR) * 60;
      let start = st0;
      let end = en0;
      if (mode === "move") {
        start = clamp(snapMin(st0 + raw), LO, HI - dur);
        end = start + dur;
      } else if (mode === "end") {
        end = clamp(snapMin(en0 + raw), st0 + MIN_DURATION, HI);
      } else {
        start = clamp(snapMin(st0 + raw), LO, en0 - MIN_DURATION);
      }
      last = { start, end };
      setDrag({ ...base, ...last });
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setDrag(null);
      if (!moved) {
        if (mode === "move") {
          if (b.kind === "course") onEditCourse(b.course);
          else onEditPlan(b.plan);
        }
        return;
      }
      commitBlock(b, last.start, last.end);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const onBlockKey = (e, b) => {
    if (e.key === "Enter" || (!editMode && e.key === " ")) {
      e.preventDefault();
      if (b.kind === "course") onEditCourse(b.course);
      else onEditPlan(b.plan);
      return;
    }
    if (!editMode) return;
    const st = toMin(b.start);
    const en = toMin(b.end);
    const step = e.altKey ? SNAP : 15;
    let next = null;
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      const d = e.key === "ArrowUp" ? -step : step;
      if (e.shiftKey) {
        next = { start: st, end: clamp(en + d, st + MIN_DURATION, HI) };
      } else {
        const ns = clamp(st + d, LO, HI - (en - st));
        next = { start: ns, end: ns + (en - st) };
      }
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      removeBlock(b);
      return;
    }
    if (next) {
      e.preventDefault();
      commitBlock(b, next.start, next.end);
    }
  };

  const onEmptyClick = (e) => {
    if (e.target !== colRef.current) return;
    const rect = colRef.current.getBoundingClientRect();
    const clickMin = LO + ((e.clientY - rect.top) / HOUR) * 60;
    const snapped = clamp(Math.floor(clickMin / 30) * 30, LO, HI - 60);
    onAddPlan({ date: selected, start: fromMin(snapped), end: fromMin(Math.min(HI, snapped + 60)) });
  };

  const courseCount = rawBlocks.filter((b) => b.kind === "course").length;

  return (
    <section className="panel day-panel">
      <div className="panel-head day-head">
        <div>
          <p className="eyebrow">
            {DAYS[dayIdx]} · {courseCount} ders · {selPlans.length} plan
          </p>
          <h2>
            {selDate.getDate()} {MONTHS[selDate.getMonth()]} {selDate.getFullYear()}
          </h2>
        </div>
        <div className="day-head-actions">
          <button className={`btn small ${editMode ? "primary" : ""}`} onClick={() => setEditMode((m) => !m)} aria-pressed={editMode}>
            <Icon name={editMode ? "check" : "edit"} size={15} /> {editMode ? "Bitti" : "Düzenle"}
          </button>
          <button className="btn small" onClick={() => onAddPlan({ date: selected })}>
            <Icon name="plus" size={15} /> Plan
          </button>
        </div>
      </div>

      {editMode && (
        <div className="edit-bar day-edit-bar" role="status">
          <span className="edit-dot" aria-hidden="true" />
          <span className="edit-text">
            <strong>Gün düzenleme modu.</strong> Ders veya plan bloğunu sürükleyip saatini değiştir, kenarlarından uzat/kısalt.
          </span>
          {conflictPairs > 0 && <span className="edit-conflict">{conflictPairs} çakışma</span>}
          <button className="btn small" onClick={undo} disabled={!history.length} title="Geri al (Ctrl+Z)">
            Geri al
          </button>
        </div>
      )}

      <div className="day-section">
        <div className="day-sec-head">
          <h3>Ders programı &amp; günlük plan</h3>
          <span className="muted small">{editMode ? "Sürükle / boyutlandır" : "Boş saate tıklayıp plan ekle"}</span>
        </div>
        <div className={`day-timeline ${editMode ? "editing" : ""}`}>
          <div className="wk-times" style={{ height: total }}>
            {hours.map((h) => (
              <span key={h} style={{ top: (h - minH) * HOUR }}>
                {pad(h)}:00
              </span>
            ))}
          </div>
          <div
            ref={colRef}
            className={`wk-col day-col ${isToday ? "today" : ""}`}
            style={{ height: total, backgroundSize: editMode ? `100% ${HOUR}px, 100% ${HOUR / 2}px` : `100% ${HOUR}px` }}
            onClick={onEmptyClick}
            title="Bu saate yeni plan eklemek için tıkla"
          >
            {drag && (
              <div
                className="wk-ghost"
                aria-hidden="true"
                style={{ top: ((drag.origStart - LO) / 60) * HOUR, height: ((drag.origEnd - drag.origStart) / 60) * HOUR - 3, "--c": drag.color }}
              />
            )}
            {blocks.map((b) => {
              const top = ((toMin(b.start) - LO) / 60) * HOUR;
              const h = Math.max(24, ((toMin(b.end) - toMin(b.start)) / 60) * HOUR - 3);
              const w = 100 / b.lanes;
              const cls = [
                "wk-block",
                b.kind === "plan" ? "is-plan" : "is-course",
                b.done && "is-done-block",
                editMode && "editable",
                b.dragging && "dragging",
                b.conflict && "conflict",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div
                  key={b.key}
                  role="button"
                  tabIndex={0}
                  className={cls}
                  style={{ top, height: h, left: `calc(${b.lane * w}% + 3px)`, width: `calc(${w}% - 6px)`, "--c": b.color }}
                  onClick={
                    editMode
                      ? (e) => e.stopPropagation()
                      : (e) => {
                          e.stopPropagation();
                          if (b.kind === "course") onEditCourse(b.course);
                          else onEditPlan(b.plan);
                        }
                  }
                  onPointerDown={editMode ? (e) => begin(e, b, "move") : undefined}
                  onKeyDown={(e) => onBlockKey(e, b)}
                  title={`${b.kind === "course" ? b.code + " " : "Plan: "}${b.title} (${b.start}–${b.end})${b.conflict ? " — çakışma var" : ""}`}
                >
                  {editMode && <span className="wk-handle top" aria-hidden="true" onPointerDown={(e) => begin(e, b, "start")} />}
                  <div className="day-block-top">
                    {b.kind === "plan" ? (
                      <>
                        {!editMode && (
                          <button
                            className={`plan-check ${b.done ? "checked" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePlan(b.plan.id);
                            }}
                            aria-label={b.done ? "Planı tamamlanmadı yap" : "Planı tamamlandı yap"}
                          >
                            {b.done && <Icon name="check" size={11} />}
                          </button>
                        )}
                        <span className="plan-pill">Plan</span>
                        <strong className="day-block-title">{b.title}</strong>
                      </>
                    ) : (
                      <>
                        <strong>{b.code}</strong>
                        <span className="day-block-inline-name">{b.title}</span>
                      </>
                    )}
                  </div>
                  {h > 36 && (
                    <span className="block-meta">
                      {b.start}–{b.end}
                      {b.room ? ` · ${b.room}` : b.note ? ` · ${b.note}` : ""}
                    </span>
                  )}
                  {b.dragging && (
                    <span className="wk-tip">
                      {b.start}–{b.end}
                    </span>
                  )}
                  {b.conflict && !b.dragging && (
                    <span className="wk-warn" aria-hidden="true">
                      !
                    </span>
                  )}
                  {editMode && !b.dragging && (
                    <button
                      className="wk-remove"
                      aria-label={b.kind === "course" ? `${b.code} saatini kaldır` : `${b.title} planını sil`}
                      title={b.kind === "course" ? "Bu ders saatini kaldır" : "Bu planı sil"}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBlock(b);
                      }}
                    >
                      <Icon name="x" size={12} />
                    </button>
                  )}
                  {editMode && <span className="wk-handle bottom" aria-hidden="true" onPointerDown={(e) => begin(e, b, "end")} />}
                </div>
              );
            })}
            {isToday && nowMin >= LO && nowMin <= HI && <div className="now-line" style={{ top: ((nowMin - LO) / 60) * HOUR }} />}
          </div>
        </div>
      </div>

      <div className="day-section">
        <div className="day-sec-head">
          <h3>Günün notları ({selNotes.length})</h3>
          <button className="link" onClick={() => onAddNote({ date: selected })}>
            + Not ekle
          </button>
        </div>
        {selNotes.length === 0 ? (
          <p className="muted small">Bu gün için not yok.</p>
        ) : (
          <ul className="day-notes">
            {selNotes.map((n) => (
              <li key={n.id} className="note-card">
                <button className="note-body" onClick={() => onEditNote(n)}>
                  {n.title && <strong>{n.title}</strong>}
                  {n.text && <span>{n.text}</span>}
                </button>
                <button
                  className="icon-btn"
                  aria-label="Notu sil"
                  title="Notu sil"
                  onClick={() => {
                    if (window.confirm("Bu not silinsin mi?")) onDeleteNote(n.id);
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="day-section">
        <div className="day-sec-head">
          <h3>Teslim &amp; sınavlar ({selItems.length})</h3>
          <button className="link" onClick={() => onAddItem({ date: selected })}>
            + Teslim ekle
          </button>
        </div>
        {selItems.length === 0 ? (
          <p className="muted small">Bu gün için teslim veya sınav yok.</p>
        ) : (
          <ul className="items">
            {selItems.map((i) => (
              <ItemRow key={i.id} item={i} course={courseMap[i.courseId]} today={today} onToggle={onToggleItem} onEdit={onEditItem} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

/* ================================== Dersler ================================== */
function CoursesView({ data, now, onEditCourse, onAddCourse, onAddItem }) {
  const today = startOfDay(now);
  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{data.courses.length} ders</p>
          <h1>Dersler</h1>
          <p className="sub">Her dersin saatleri, hocası, sınıfı ve bekleyen işleri.</p>
        </div>
        <button className="btn primary" onClick={onAddCourse}>
          <Icon name="plus" /> Ders ekle
        </button>
      </header>

      <div className="course-grid">
        {data.courses.map((c) => {
          const items = data.items.filter((i) => i.courseId === c.id);
          const pending = items.filter((i) => !i.done).sort(sortItems);
          const next = pending.find((i) => daysBetween(today, parseYmd(i.date)) >= 0);
          const weightSum = items.reduce((s, i) => s + (Number(i.weight) || 0), 0);
          const doneWeight = items.filter((i) => i.done).reduce((s, i) => s + (Number(i.weight) || 0), 0);
          return (
            <article key={c.id} className="course" style={{ "--c": c.color }}>
              <div className="course-top">
                <span className="course-code">{c.code}</span>
                <button className="icon-btn" onClick={() => onEditCourse(c)} aria-label={`${c.code} dersini düzenle`}>
                  <Icon name="edit" size={16} />
                </button>
              </div>
              <h3>{c.name}</h3>
              <ul className="course-meta">
                {c.instructor && (
                  <li>
                    <Icon name="user" size={15} /> {c.instructor}
                  </li>
                )}
                {c.room && (
                  <li>
                    <Icon name="pin" size={15} /> {c.room}
                  </li>
                )}
                {c.slots.length > 0 && (
                  <li>
                    <Icon name="clock" size={15} />
                    <span>{c.slots.map((s) => `${DAYS_SHORT[s.day]} ${s.start}–${s.end}`).join(" · ")}</span>
                  </li>
                )}
              </ul>
              <div className="course-stats">
                <div>
                  <span className="muted small">Bekleyen</span>
                  <strong>{pending.length}</strong>
                </div>
                <div>
                  <span className="muted small">Not ağırlığı</span>
                  <strong>
                    %{doneWeight}
                    <small className="muted"> / %{weightSum}</small>
                  </strong>
                </div>
              </div>
              <div className="course-next">
                {next ? (
                  <>
                    <span className="muted small">Sıradaki</span>
                    <span>
                      <span className={`badge t-${next.type}`}>{TYPES[next.type].label}</span> {next.title}
                    </span>
                    <span className="muted small">
                      {fmtDate(next.date)} · {relLabel(daysBetween(today, parseYmd(next.date)))}
                    </span>
                  </>
                ) : (
                  <span className="muted small">Yaklaşan iş yok</span>
                )}
              </div>
              <button className="btn small ghost" onClick={() => onAddItem({ courseId: c.id })}>
                <Icon name="plus" size={16} /> Bu derse ekle
              </button>
            </article>
          );
        })}
        <button className="course add" onClick={onAddCourse}>
          <Icon name="plus" size={22} />
          <span>Yeni ders</span>
        </button>
      </div>
    </div>
  );
}

/* ================================== Modallar ================================== */
function Modal({ title, onClose, children, footer }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Kapat">
            <Icon name="x" />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}

function ItemModal({ item, preset = {}, courses, onSave, onDelete, onClose, onNeedCourse }) {
  const isNew = !item;
  const [f, setF] = useState(() =>
    item
      ? { ...item, weight: item.weight ?? "", note: item.note || "" }
      : {
          id: uid(),
          type: preset.type || "odev",
          courseId: preset.courseId || courses[0]?.id || "",
          title: "",
          date: preset.date || ymd(new Date()),
          time: "23:59",
          weight: "",
          note: "",
          done: false,
        }
  );
  const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  if (!courses.length) {
    return (
      <Modal title="Önce bir ders ekle" onClose={onClose}>
        <p className="muted">Teslim ve sınavlar bir derse bağlı. Önce dersini oluştur, sonra kayıt ekleyebilirsin.</p>
        <div className="modal-inline-actions">
          <button className="btn primary" onClick={onNeedCourse}>
            <Icon name="book" /> Ders ekle
          </button>
        </div>
      </Modal>
    );
  }

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return setErr("Başlık gerekli.");
    if (!f.courseId) return setErr("Bir ders seç.");
    if (!f.date) return setErr("Tarih gerekli.");
    onSave({
      ...f,
      title: f.title.trim(),
      weight: f.weight === "" || f.weight === null ? null : Math.max(0, Math.min(100, Number(f.weight))),
    });
    onClose();
  };

  return (
    <Modal
      title={isNew ? "Yeni kayıt" : "Kaydı düzenle"}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn danger-ghost"
              onClick={() => {
                if (window.confirm(`"${item.title}" silinsin mi?`)) {
                  onDelete(item.id);
                  onClose();
                }
              }}
            >
              <Icon name="trash" size={16} /> Sil
            </button>
          )}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn primary" type="submit" form="item-form">
            Kaydet
          </button>
        </>
      }
    >
      <form id="item-form" className="form" onSubmit={submit}>
        <div className="seg" role="radiogroup" aria-label="Tür">
          {Object.entries(TYPES).map(([k, v]) => (
            <button
              type="button"
              key={k}
              role="radio"
              aria-checked={f.type === k}
              className={`seg-btn t-${k} ${f.type === k ? "on" : ""}`}
              onClick={() => {
                set("type", k);
                if (isNew) set("time", k === "odev" || k === "proje" ? "23:59" : "09:00");
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Başlık</span>
          <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder={f.type === "sinav" ? "ör. Ara sınav 1" : "ör. Problem Seti 3"} />
        </label>
        <label className="field">
          <span>Ders</span>
          <select value={f.courseId} onChange={(e) => set("courseId", e.target.value)}>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="row">
          <label className="field">
            <span>{f.type === "sinav" || f.type === "quiz" ? "Tarih" : "Son teslim tarihi"}</span>
            <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
          </label>
          <label className="field">
            <span>Saat</span>
            <input type="time" value={f.time} onChange={(e) => set("time", e.target.value)} />
          </label>
          <label className="field narrow">
            <span>Ağırlık %</span>
            <input type="number" min="0" max="100" value={f.weight ?? ""} onChange={(e) => set("weight", e.target.value)} placeholder="—" />
          </label>
        </div>
        <label className="field">
          <span>Not</span>
          <textarea rows={3} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Konular, teslim yeri, hatırlatmalar…" />
        </label>
        {!isNew && (
          <label className="toggle">
            <input type="checkbox" checked={f.done} onChange={(e) => set("done", e.target.checked)} />
            <span>Tamamlandı</span>
          </label>
        )}
        {err && <p className="err">{err}</p>}
      </form>
    </Modal>
  );
}

function CourseModal({ course, onSave, onDelete, onClose }) {
  const isNew = !course;
  const [f, setF] = useState(() =>
    course
      ? { ...course, slots: course.slots.map((s) => ({ ...s })) }
      : { id: uid(), code: "", name: "", instructor: "", room: "", color: PALETTE[Math.floor(Math.random() * PALETTE.length)], slots: [{ day: 0, start: "09:00", end: "10:50" }] }
  );
  const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setSlot = (i, k, v) => setF((p) => ({ ...p, slots: p.slots.map((s, j) => (j === i ? { ...s, [k]: v } : s)) }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.code.trim() && !f.name.trim()) return setErr("Ders kodu veya adı gerekli.");
    if (f.slots.some((s) => toMin(s.end) <= toMin(s.start))) return setErr("Ders saatlerinde bitiş, başlangıçtan sonra olmalı.");
    onSave({ ...f, code: f.code.trim().toUpperCase() || f.name.trim().slice(0, 6).toUpperCase(), name: f.name.trim() || f.code.trim() });
    onClose();
  };

  return (
    <Modal
      title={isNew ? "Yeni ders" : "Dersi düzenle"}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn danger-ghost"
              onClick={() => {
                if (window.confirm(`${course.code} dersi ve bu derse ait tüm teslim/sınavlar silinsin mi?`)) {
                  onDelete(course.id);
                  onClose();
                }
              }}
            >
              <Icon name="trash" size={16} /> Dersi sil
            </button>
          )}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn primary" type="submit" form="course-form">
            Kaydet
          </button>
        </>
      }
    >
      <form id="course-form" className="form" onSubmit={submit}>
        <div className="row">
          <label className="field narrow-2">
            <span>Kod</span>
            <input autoFocus value={f.code} onChange={(e) => set("code", e.target.value)} placeholder="BIL201" />
          </label>
          <label className="field">
            <span>Ders adı</span>
            <input value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Veri Yapıları" />
          </label>
        </div>
        <div className="row">
          <label className="field">
            <span>Öğretim üyesi</span>
            <input value={f.instructor} onChange={(e) => set("instructor", e.target.value)} placeholder="Dr. …" />
          </label>
          <label className="field narrow-2">
            <span>Derslik</span>
            <input value={f.room} onChange={(e) => set("room", e.target.value)} placeholder="MB-204" />
          </label>
        </div>
        <div className="field">
          <span>Renk</span>
          <div className="swatches" role="radiogroup" aria-label="Ders rengi">
            {PALETTE.map((c) => (
              <button type="button" key={c} role="radio" aria-checked={f.color === c} aria-label={c} className={`swatch ${f.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />
            ))}
          </div>
        </div>
        <div className="field">
          <span>Haftalık ders saatleri</span>
          <div className="slots">
            {f.slots.map((s, i) => (
              <div key={i} className="slot">
                <select value={s.day} onChange={(e) => setSlot(i, "day", Number(e.target.value))} aria-label="Gün">
                  {DAYS.map((d, k) => (
                    <option key={k} value={k}>
                      {d}
                    </option>
                  ))}
                </select>
                <input type="time" value={s.start} onChange={(e) => setSlot(i, "start", e.target.value)} aria-label="Başlangıç" />
                <span className="muted">–</span>
                <input type="time" value={s.end} onChange={(e) => setSlot(i, "end", e.target.value)} aria-label="Bitiş" />
                <button type="button" className="icon-btn" onClick={() => setF((p) => ({ ...p, slots: p.slots.filter((_, j) => j !== i) }))} aria-label="Saati kaldır">
                  <Icon name="x" size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn small ghost"
              onClick={() => setF((p) => ({ ...p, slots: [...p.slots, { day: p.slots.length ? Math.min(6, p.slots[p.slots.length - 1].day + 2) : 0, start: "09:00", end: "10:50" }] }))}
            >
              <Icon name="plus" size={16} /> Saat ekle
            </button>
          </div>
        </div>
        {err && <p className="err">{err}</p>}
      </form>
    </Modal>
  );
}

function PlanModal({ plan, preset = {}, onSave, onDelete, onClose }) {
  const isNew = !plan;
  const [f, setF] = useState(() =>
    plan
      ? { ...plan, note: plan.note || "" }
      : {
          id: uid(),
          date: preset.date || ymd(new Date()),
          title: "",
          start: preset.start || "14:00",
          end: preset.end || "15:30",
          color: preset.color || PALETTE[2],
          note: "",
          done: false,
        }
  );
  const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return setErr("Plan başlığı gerekli.");
    if (!f.date) return setErr("Tarih gerekli.");
    if (toMin(f.end) <= toMin(f.start)) return setErr("Bitiş saati başlangıçtan sonra olmalı.");
    onSave({ ...f, title: f.title.trim(), note: f.note.trim() });
    onClose();
  };

  return (
    <Modal
      title={isNew ? "Günlük plan ekle" : "Planı düzenle"}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn danger-ghost"
              onClick={() => {
                if (window.confirm(`"${plan.title}" planı silinsin mi?`)) {
                  onDelete(plan.id);
                  onClose();
                }
              }}
            >
              <Icon name="trash" size={16} /> Sil
            </button>
          )}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn primary" type="submit" form="plan-form">
            Kaydet
          </button>
        </>
      }
    >
      <form id="plan-form" className="form" onSubmit={submit}>
        <label className="field">
          <span>Plan başlığı</span>
          <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="ör. Kütüphane çalışma seansı, Kulüp toplantısı" />
        </label>
        <div className="row">
          <label className="field">
            <span>Tarih</span>
            <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
          </label>
          <label className="field narrow-2">
            <span>Başlangıç</span>
            <input type="time" value={f.start} onChange={(e) => set("start", e.target.value)} />
          </label>
          <label className="field narrow-2">
            <span>Bitiş</span>
            <input type="time" value={f.end} onChange={(e) => set("end", e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span>Renk</span>
          <div className="swatches" role="radiogroup" aria-label="Plan rengi">
            {PALETTE.map((c) => (
              <button type="button" key={c} role="radio" aria-checked={f.color === c} aria-label={c} className={`swatch ${f.color === c ? "on" : ""}`} style={{ background: c }} onClick={() => set("color", c)} />
            ))}
          </div>
        </div>
        <label className="field">
          <span>Detay / Not</span>
          <textarea rows={3} value={f.note} onChange={(e) => set("note", e.target.value)} placeholder="Konum, yapılacak adımlar, hatırlatmalar…" />
        </label>
        {!isNew && (
          <label className="toggle">
            <input type="checkbox" checked={f.done} onChange={(e) => set("done", e.target.checked)} />
            <span>Tamamlandı</span>
          </label>
        )}
        {err && <p className="err">{err}</p>}
      </form>
    </Modal>
  );
}

function NoteModal({ note, preset = {}, onSave, onDelete, onClose }) {
  const isNew = !note;
  const [f, setF] = useState(() =>
    note
      ? { ...note }
      : {
          id: uid(),
          date: preset.date || ymd(new Date()),
          title: "",
          text: "",
        }
  );
  const [err, setErr] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    if (!f.date) return setErr("Not için bir gün seç.");
    if (!f.title.trim() && !f.text.trim()) return setErr("Başlık veya not içeriği yaz.");
    onSave({ ...f, title: f.title.trim(), text: f.text.trim() });
    onClose();
  };

  return (
    <Modal
      title={isNew ? "Güne not ekle" : "Notu düzenle"}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="btn danger-ghost"
              onClick={() => {
                if (window.confirm("Bu not silinsin mi?")) {
                  onDelete(note.id);
                  onClose();
                }
              }}
            >
              <Icon name="trash" size={16} /> Sil
            </button>
          )}
          <span className="spacer" />
          <button className="btn" onClick={onClose}>
            Vazgeç
          </button>
          <button className="btn primary" type="submit" form="note-form">
            Kaydet
          </button>
        </>
      }
    >
      <form id="note-form" className="form" onSubmit={submit}>
        <label className="field">
          <span>Gün seç</span>
          <input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
        </label>
        <label className="field">
          <span>Başlık (isteğe bağlı)</span>
          <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="ör. Hoca ofis saati, Hatırlatma" />
        </label>
        <label className="field">
          <span>Not</span>
          <textarea rows={4} value={f.text} onChange={(e) => set("text", e.target.value)} placeholder="O gün için aklında tutmak istediğin her şey…" />
        </label>
        {err && <p className="err">{err}</p>}
      </form>
    </Modal>
  );
}

/* =================================== Stiller =================================== */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

.dp {
  --bg: #f5f4f0;
  --surface: #ffffff;
  --surface-2: #efede7;
  --border: #e2dfd6;
  --text: #1d1c1a;
  --muted: #6d695f;
  --accent: #2d5bd0;
  --accent-ink: #ffffff;
  --danger: #c92a2a;
  --warn: #c86a00;
  --ok: #2b8a3e;
  --t-sinav: #d6336c;
  --t-quiz: #e67700;
  --t-odev: #1c7ed6;
  --t-proje: #2b8a3e;
  --shadow: 0 1px 2px rgba(30, 25, 15, .05), 0 4px 16px rgba(30, 25, 15, .05);
  --radius: 14px;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) {
  .dp {
    --bg: #131312;
    --surface: #1c1b19;
    --surface-2: #262522;
    --border: #33312d;
    --text: #edebe4;
    --muted: #a09b90;
    --accent: #6d93f2;
    --accent-ink: #0f1424;
    --danger: #ff6b6b;
    --warn: #ffa94d;
    --ok: #69db7c;
    --t-sinav: #f06595;
    --t-quiz: #ffa94d;
    --t-odev: #4dabf7;
    --t-proje: #69db7c;
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 6px 20px rgba(0,0,0,.25);
    color-scheme: dark;
  }
}

.dp, .dp * { box-sizing: border-box; }
.dp {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 248px minmax(0, 1fr);
  background: var(--bg);
  color: var(--text);
  font-family: Manrope, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14.5px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}
.dp button { font: inherit; color: inherit; cursor: pointer; }
.dp input, .dp select, .dp textarea { font: inherit; color: inherit; }
.dp h1, .dp h2, .dp h3 { margin: 0; letter-spacing: -0.01em; }
.dp :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

/* ---------- Kenar çubuğu ---------- */
.side {
  position: sticky; top: 0; height: 100vh;
  display: flex; flex-direction: column; gap: 22px;
  padding: 22px 16px;
  border-right: 1px solid var(--border);
  background: var(--surface);
}
.brand { display: flex; gap: 10px; align-items: center; padding: 0 6px; }
.brand-mark {
  width: 36px; height: 36px; border-radius: 10px; flex: none;
  display: grid; place-items: center;
  background: var(--accent); color: var(--accent-ink);
}
.brand-text { display: flex; flex-direction: column; min-width: 0; }
.brand-text strong { font-size: 15px; font-weight: 800; }
.semester {
  border: 0; background: transparent; padding: 1px 4px; margin-left: -4px;
  color: var(--muted); font-size: 12.5px; border-radius: 6px; width: 100%;
}
.semester:hover, .semester:focus { background: var(--surface-2); outline: none; }
.nav { display: flex; flex-direction: column; gap: 2px; }
.nav-btn {
  display: flex; align-items: center; gap: 11px;
  padding: 9px 12px; border: 0; border-radius: 10px;
  background: transparent; color: var(--muted); font-weight: 600; text-align: left;
}
.nav-btn:hover { background: var(--surface-2); color: var(--text); }
.nav-btn.active { background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
.side-actions { display: flex; flex-direction: column; gap: 8px; }
.side-foot { margin-top: auto; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 0 6px; }
.link { border: 0; background: none; padding: 2px 0; color: var(--muted); font-size: 12.5px; }
.link:hover { color: var(--text); text-decoration: underline; }

/* ---------- Düğmeler ---------- */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  height: 38px; padding: 0 14px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--surface);
  font-weight: 600; white-space: nowrap;
  transition: background .15s, border-color .15s, transform .05s;
}
.btn:hover { background: var(--surface-2); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .45; cursor: default; }
.btn.primary { background: var(--accent); color: var(--accent-ink); border-color: transparent; }
.btn.primary:hover { background: color-mix(in srgb, var(--accent) 88%, black); }
.btn.small { height: 32px; padding: 0 11px; font-size: 13px; }
.btn.ghost { background: transparent; border-style: dashed; }
.btn.block { width: 100%; }
.btn.danger-ghost { background: transparent; border-color: transparent; color: var(--danger); }
.btn.danger-ghost:hover { background: color-mix(in srgb, var(--danger) 10%, transparent); }
.icon-btn {
  width: 32px; height: 32px; display: inline-grid; place-items: center; flex: none;
  border: 1px solid transparent; border-radius: 9px; background: transparent; color: var(--muted);
}
.icon-btn:hover { background: var(--surface-2); color: var(--text); }

/* ---------- Sayfa ---------- */
.main { min-width: 0; }
.page { max-width: 1280px; margin: 0 auto; padding: 30px 32px 56px; }
.page-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
.page-head h1 { font-size: 28px; font-weight: 800; }
.eyebrow { margin: 0 0 2px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.sub { margin: 4px 0 0; color: var(--muted); }
.muted { color: var(--muted); }
.small { font-size: 12.5px; }
.panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 18px; box-shadow: var(--shadow); }
.panel-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.panel-head h2 { font-size: 16px; font-weight: 700; }
.pager { display: flex; align-items: center; gap: 6px; }

/* ---------- İstatistikler ---------- */
.stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
.stat {
  display: flex; flex-direction: column; gap: 2px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 15px 16px; box-shadow: var(--shadow);
}
.stat-label { font-size: 12.5px; color: var(--muted); font-weight: 600; }
.stat-value { font-size: 30px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.15; font-variant-numeric: tabular-nums; }
.stat-hint { font-size: 12px; color: var(--muted); }
.stat.danger .stat-value { color: var(--danger); }
.bar { height: 6px; border-radius: 99px; background: var(--surface-2); overflow: hidden; margin: 6px 0 4px; }
.bar span { display: block; height: 100%; border-radius: inherit; background: var(--ok); transition: width .4s; }

/* ---------- Genel bakış ızgarası ---------- */
.ov-grid { display: grid; grid-template-columns: minmax(0, 1fr) 330px; gap: 18px; align-items: start; }
.ov-side { display: flex; flex-direction: column; gap: 18px; }
.filters { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; }
.filters-right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.chips { display: flex; gap: 6px; flex-wrap: wrap; }
.chip {
  height: 30px; padding: 0 12px; border-radius: 99px;
  border: 1px solid var(--border); background: transparent; font-size: 13px; font-weight: 600; color: var(--muted);
}
.chip:hover { color: var(--text); }
.chip.on { background: var(--text); color: var(--surface); border-color: var(--text); }
.select {
  height: 30px; border-radius: 9px; border: 1px solid var(--border); background: var(--surface);
  padding: 0 8px; font-size: 13px; max-width: 220px;
}
.toggle { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--muted); cursor: pointer; user-select: none; }
.toggle input { accent-color: var(--accent); width: 15px; height: 15px; }

.group { margin-top: 14px; }
.group h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 700; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
.group.g-late h3 { color: var(--danger); }
.count { background: var(--surface-2); color: var(--muted); border-radius: 99px; padding: 0 7px; font-size: 11px; }
.items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }

.item {
  position: relative; display: flex; align-items: center; gap: 12px;
  padding: 10px 12px 10px 16px; border-radius: 11px;
  background: var(--surface); border: 1px solid var(--border);
  transition: border-color .15s, background .15s;
}
.item::before { content: ""; position: absolute; left: 0; top: 8px; bottom: 8px; width: 4px; border-radius: 0 4px 4px 0; background: var(--c); }
.item:hover { border-color: color-mix(in srgb, var(--c) 45%, var(--border)); }
.check {
  width: 22px; height: 22px; flex: none; border-radius: 7px;
  border: 1.8px solid color-mix(in srgb, var(--c) 60%, var(--border)); background: transparent;
  display: grid; place-items: center; color: #fff; padding: 0;
}
.check:hover { background: color-mix(in srgb, var(--c) 12%, transparent); }
.item.is-done .check { background: var(--c); border-color: var(--c); }
.item-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; border: 0; background: none; padding: 0; text-align: left; }
.item-title { font-weight: 650; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item.is-done .item-title { text-decoration: line-through; color: var(--muted); }
.item-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; font-size: 12.5px; color: var(--muted); }
.code { font-weight: 700; color: var(--c); }
.badge {
  --tc: var(--muted);
  display: inline-block; padding: 1px 7px; border-radius: 6px; font-size: 11.5px; font-weight: 700;
  color: var(--tc); background: color-mix(in srgb, var(--tc) 13%, transparent);
}
.t-sinav { --tc: var(--t-sinav); }
.t-quiz { --tc: var(--t-quiz); }
.t-odev { --tc: var(--t-odev); }
.t-proje { --tc: var(--t-proje); }
.due { flex: none; font-size: 12.5px; font-weight: 700; padding: 4px 9px; border-radius: 8px; white-space: nowrap; font-variant-numeric: tabular-nums; }
.u-late { color: var(--danger); background: color-mix(in srgb, var(--danger) 12%, transparent); }
.u-soon { color: var(--warn); background: color-mix(in srgb, var(--warn) 13%, transparent); }
.u-near { color: var(--text); background: var(--surface-2); }
.u-far { color: var(--muted); }
.u-done { color: var(--ok); }

.empty { text-align: center; padding: 36px 16px; color: var(--muted); display: flex; flex-direction: column; align-items: center; gap: 4px; }
.empty strong { color: var(--text); font-size: 15px; }
.empty p { margin: 0 0 10px; }

/* Sıradaki sınav */
.exam-card { border-top: 4px solid var(--c); }
.exam-body { display: flex; gap: 16px; align-items: flex-start; border: 0; background: none; padding: 6px 0 0; text-align: left; width: 100%; }
.exam-count {
  flex: none; width: 82px; height: 82px; border-radius: 16px;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--c) 13%, transparent); color: var(--c);
}
.exam-count .num { font-size: 34px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
.exam-count .unit { font-size: 12px; font-weight: 700; margin-top: 3px; }
.exam-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.exam-info strong { font-size: 15px; }
.exam-info span { font-size: 13px; }
.exam-note { margin-top: 6px; padding: 6px 9px; border-radius: 8px; background: var(--surface-2); color: var(--muted); font-size: 12.5px !important; }

/* Bugünkü dersler */
.today-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.today-list li {
  display: flex; gap: 12px; align-items: center; padding: 9px 11px; border-radius: 11px;
  background: color-mix(in srgb, var(--c) 9%, transparent); border-left: 3px solid var(--c);
}
.today-list li.past { opacity: .55; }
.today-list li.live { background: color-mix(in srgb, var(--c) 18%, transparent); }
.today-list .t { display: flex; flex-direction: column; font-weight: 700; font-variant-numeric: tabular-nums; font-size: 13px; min-width: 44px; }
.today-list .t small { color: var(--muted); font-weight: 600; }
.today-list .d { flex: 1; min-width: 0; display: flex; flex-direction: column; font-size: 13px; }
.today-list .d strong { color: var(--c); }
.today-list .d small { color: var(--muted); display: inline-flex; align-items: center; gap: 3px; }
.live-tag { font-size: 11px; font-weight: 800; color: #fff; background: var(--c); padding: 2px 7px; border-radius: 99px; }

/* İş yükü */
.load { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 9px; }
.load li { display: grid; grid-template-columns: 64px 1fr 22px; align-items: center; gap: 10px; font-size: 13px; }
.load-code { font-weight: 700; color: var(--c); }
.load-bar { height: 8px; background: var(--surface-2); border-radius: 99px; overflow: hidden; }
.load-bar span { display: block; height: 100%; background: var(--c); border-radius: inherit; min-width: 3px; }
.load-n { text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }

/* ---------- Haftalık program ---------- */
.week-panel { padding: 0; overflow: hidden; }
.week-scroll { overflow-x: auto; }
.week { display: grid; min-width: max-content; }
.wk-corner { border-bottom: 1px solid var(--border); }
.wk-head { padding: 12px 10px 10px; border-bottom: 1px solid var(--border); border-left: 1px solid var(--border); min-height: 92px; }
.wk-head.today { background: color-mix(in srgb, var(--accent) 7%, transparent); }
.wk-day { display: flex; align-items: baseline; gap: 6px; margin-bottom: 6px; }
.wk-day span { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
.wk-day strong { font-size: 20px; font-weight: 800; }
.wk-head.today .wk-day strong {
  background: var(--accent); color: var(--accent-ink); border-radius: 8px; padding: 0 7px; font-size: 17px;
}
.wk-due { display: flex; flex-direction: column; gap: 4px; }
.due-chip {
  display: block; text-align: left; font-size: 11.5px; padding: 3px 7px; border-radius: 6px;
  border: 0; border-left: 3px solid var(--tc); background: color-mix(in srgb, var(--tc) 12%, transparent);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.due-chip b { color: var(--tc); }
.due-chip.is-done { opacity: .5; text-decoration: line-through; }
.wk-times { position: relative; }
.wk-times span { position: absolute; right: 8px; transform: translateY(-50%); font-size: 11px; color: var(--muted); font-variant-numeric: tabular-nums; }
.wk-times span:first-child { transform: none; margin-top: 3px; }
.wk-col {
  position: relative; border-left: 1px solid var(--border);
  background-image: linear-gradient(to bottom, var(--border) 1px, transparent 1px);
}
.wk-col.today { background-color: color-mix(in srgb, var(--accent) 4%, transparent); }
.wk-block {
  position: absolute; left: 4px; right: 4px;
  display: flex; flex-direction: column; align-items: flex-start; gap: 1px; overflow: hidden;
  padding: 5px 8px; border-radius: 9px; text-align: left;
  border: 0; border-left: 3px solid var(--c);
  background: color-mix(in srgb, var(--c) 15%, var(--surface));
  font-size: 12px; line-height: 1.3;
  transition: transform .1s, box-shadow .1s;
}
.wk-block:hover { box-shadow: var(--shadow); transform: translateY(-1px); z-index: 2; }
.wk-block > * { flex: none; max-width: 100%; }
.wk-block strong { color: var(--c); font-size: 12.5px; }
.block-name { font-weight: 600; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.block-meta { color: var(--muted); font-size: 11.5px; }
.wk-block { cursor: pointer; }

/* Düzenleme modu */
.head-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.sub-warn { color: var(--danger); font-weight: 700; }
.edit-bar {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 10px 14px; margin-bottom: 14px; border-radius: 12px; font-size: 13px;
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--accent) 30%, var(--border));
}
.edit-text { flex: 1 1 320px; }
.edit-dot {
  width: 8px; height: 8px; border-radius: 50%; flex: none; background: var(--accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 22%, transparent);
}
.edit-conflict { color: var(--danger); font-weight: 700; }
.week.editing .wk-col {
  background-image:
    linear-gradient(to bottom, var(--border) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px);
}
.week.editing .wk-col.drop { background-color: color-mix(in srgb, var(--accent) 6%, transparent); }
.wk-block.editable { cursor: grab; touch-action: none; user-select: none; }
.wk-block.editable:hover { transform: none; box-shadow: 0 0 0 2px color-mix(in srgb, var(--c) 40%, transparent), var(--shadow); }
.wk-block.dragging {
  z-index: 6; cursor: grabbing; overflow: visible; transform: none;
  box-shadow: 0 0 0 2px var(--c), 0 12px 28px rgba(0, 0, 0, .18);
}
.wk-block.conflict { box-shadow: inset 0 0 0 1.5px var(--danger); }
.wk-ghost {
  position: absolute; left: 3px; right: 3px; pointer-events: none;
  border: 1.5px dashed var(--c); border-radius: 9px;
  background: color-mix(in srgb, var(--c) 6%, transparent);
}
.wk-handle { position: absolute; left: 0; right: 0; height: 9px; cursor: ns-resize; z-index: 2; touch-action: none; }
.wk-handle.top { top: 0; }
.wk-handle.bottom { bottom: 0; }
.wk-handle::after {
  content: ""; position: absolute; left: 50%; top: 50%; width: 22px; height: 3px; margin: -1.5px 0 0 -11px;
  border-radius: 2px; background: var(--c); opacity: 0; transition: opacity .15s;
}
.wk-block.editable:hover .wk-handle::after,
.wk-block.editable:focus-visible .wk-handle::after,
.wk-block.dragging .wk-handle::after { opacity: .75; }
.wk-remove {
  position: absolute; top: 4px; right: 4px; width: 18px; height: 18px; padding: 0;
  display: grid; place-items: center; border: 0; border-radius: 6px;
  background: var(--surface); color: var(--muted); opacity: 0; transition: opacity .15s; z-index: 3;
}
.wk-block.editable:hover .wk-remove, .wk-block.editable:focus-within .wk-remove { opacity: 1; }
.wk-remove:hover { color: var(--danger); }
.wk-warn {
  position: absolute; top: 4px; right: 4px; width: 16px; height: 16px; border-radius: 50%;
  display: grid; place-items: center; background: var(--danger); color: #fff; font-size: 11px; font-weight: 800;
}
.wk-block.editable .wk-warn { right: 26px; }
.wk-tip {
  position: absolute; left: 50%; bottom: calc(100% + 6px); transform: translateX(-50%);
  max-width: none !important; white-space: nowrap; pointer-events: none;
  padding: 3px 8px; border-radius: 7px; font-size: 11.5px; font-weight: 700; font-variant-numeric: tabular-nums;
  background: var(--text); color: var(--surface);
}
@media (hover: none) {
  .wk-block.editable .wk-handle::after { opacity: .6; }
  .wk-block.editable .wk-remove { opacity: 1; }
}
.now-line { position: absolute; left: 0; right: 0; height: 2px; background: var(--danger); z-index: 3; pointer-events: none; }
.now-line::before { content: ""; position: absolute; left: -4px; top: -3px; width: 8px; height: 8px; border-radius: 50%; background: var(--danger); }

/* ---------- Takvim ---------- */
.month-wrap { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(380px, 460px); gap: 18px; align-items: start; }
.month-panel { padding: 12px; }
.month { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; }
.m-dow { text-align: center; font-size: 12px; font-weight: 700; color: var(--muted); padding: 6px 0; text-transform: uppercase; letter-spacing: .05em; }
.m-cell {
  min-height: 108px; padding: 6px; border-radius: 10px; cursor: pointer;
  border: 1px solid transparent; background: var(--surface-2);
  display: flex; flex-direction: column; gap: 4px; min-width: 0;
  transition: border-color .15s;
}
.m-cell:hover { border-color: var(--border); }
.m-cell.out { background: transparent; opacity: .5; }
.m-cell.sel { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 6%, var(--surface)); }
.m-cell-top { display: flex; align-items: center; justify-content: space-between; gap: 4px; }
.m-num { font-size: 13px; font-weight: 700; width: 24px; height: 24px; display: grid; place-items: center; border-radius: 7px; flex: none; }
.m-cell.today .m-num { background: var(--accent); color: var(--accent-ink); }
.m-badges { display: inline-flex; gap: 3px; align-items: center; }
.m-badge {
  display: inline-flex; align-items: center; gap: 2px; font-size: 10.5px; font-weight: 700;
  padding: 1px 4px; border-radius: 5px; font-variant-numeric: tabular-nums;
}
.m-badge.plan { color: var(--accent); background: color-mix(in srgb, var(--accent) 13%, transparent); }
.m-badge.note { color: var(--warn); background: color-mix(in srgb, var(--warn) 15%, transparent); }
.m-items { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.m-chip {
  display: block; width: 100%; text-align: left; border: 0; padding: 2px 6px; border-radius: 5px;
  font-size: 11.5px; font-weight: 600; background: var(--surface); border-left: 3px solid var(--tc);
  min-width: 0;
}
.m-plan-chip { background: color-mix(in srgb, var(--tc) 10%, var(--surface)); border-left-style: dashed; }
.m-chip-text { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.m-chip.is-done { opacity: .5; text-decoration: line-through; }
.m-more { font-size: 11px; color: var(--muted); padding-left: 4px; }
.m-dots { display: none; gap: 3px; }
.m-dots i { width: 6px; height: 6px; border-radius: 50%; background: var(--tc); }
.m-dots i.dot-plan, .legend-dot.dot-plan { background: var(--accent); }
.m-dots i.dot-note, .legend-dot.dot-note { background: var(--warn); }
.legend { display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 6px 2px; font-size: 12.5px; color: var(--muted); }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.legend-dot { width: 10px; height: 10px; border-radius: 3px; background: var(--tc); display: inline-block; }

.day-panel { display: flex; flex-direction: column; gap: 16px; }
.day-head { margin-bottom: 0; align-items: flex-start; flex-wrap: wrap; }
.day-panel .panel-head h2 { font-size: 19px; }
.day-head-actions { display: flex; gap: 6px; align-items: center; }
.day-edit-bar { margin-bottom: 0; padding: 8px 12px; font-size: 12.5px; }
.day-section { display: flex; flex-direction: column; gap: 8px; }
.day-section + .day-section { padding-top: 14px; border-top: 1px solid var(--border); }
.day-sec-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.day-sec-head h3 { font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); font-weight: 700; }

.day-timeline {
  display: grid; grid-template-columns: 46px minmax(0, 1fr);
  border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
  background: var(--surface);
}
.day-timeline.editing .day-col {
  background-image:
    linear-gradient(to bottom, var(--border) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--border) 45%, transparent) 1px, transparent 1px);
}
.day-col { cursor: cell; }
.day-timeline.editing .day-col { cursor: default; }
.day-block-top { display: flex; align-items: center; gap: 5px; width: 100%; min-width: 0; }
.day-block-inline-name, .day-block-title {
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px;
}
.day-block-inline-name { font-weight: 600; color: var(--text); }
.wk-block.is-plan {
  border-left-style: dashed;
  background: color-mix(in srgb, var(--c) 11%, var(--surface));
}
.wk-block.is-done-block { opacity: .6; }
.wk-block.is-done-block .day-block-title { text-decoration: line-through; }
.plan-pill {
  flex: none; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em;
  padding: 1px 5px; border-radius: 4px;
  color: var(--c); background: color-mix(in srgb, var(--c) 18%, transparent);
}
.plan-check {
  width: 15px; height: 15px; flex: none; padding: 0; border-radius: 4px;
  border: 1.5px solid var(--c); background: transparent; color: #fff;
  display: grid; place-items: center;
}
.plan-check.checked { background: var(--c); }

.day-notes { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.note-card {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 9px 10px; border-radius: 10px;
  background: color-mix(in srgb, var(--warn) 8%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--warn) 26%, var(--border));
}
.note-body {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px;
  border: 0; background: none; padding: 0; text-align: left;
}
.note-body strong { font-size: 13.5px; color: var(--text); }
.note-body span { font-size: 12.5px; color: var(--muted); white-space: pre-wrap; word-break: break-word; }

/* ---------- Dersler ---------- */
.course-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 16px; }
.course {
  position: relative; display: flex; flex-direction: column; gap: 10px;
  background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
  padding: 18px; box-shadow: var(--shadow); overflow: hidden;
}
.course::before { content: ""; position: absolute; inset: 0 0 auto 0; height: 4px; background: var(--c); }
.course-top { display: flex; justify-content: space-between; align-items: center; }
.course-code {
  font-weight: 800; font-size: 12.5px; letter-spacing: .03em; color: var(--c);
  background: color-mix(in srgb, var(--c) 12%, transparent); padding: 3px 9px; border-radius: 7px;
}
.course h3 { font-size: 17px; font-weight: 750; }
.course-meta { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); }
.course-meta li { display: flex; gap: 7px; align-items: flex-start; }
.course-meta svg { flex: none; margin-top: 2px; }
.course-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 10px 0; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); }
.course-stats div { display: flex; flex-direction: column; }
.course-stats strong { font-size: 18px; font-weight: 800; font-variant-numeric: tabular-nums; }
.course-next { display: flex; flex-direction: column; gap: 3px; font-size: 13.5px; min-height: 58px; }
.course .btn { align-self: flex-start; }
.course.add {
  align-items: center; justify-content: center; min-height: 240px; border-style: dashed;
  background: transparent; box-shadow: none; color: var(--muted); font-weight: 700;
}
.course.add::before { display: none; }
.course.add:hover { color: var(--accent); border-color: var(--accent); }

/* ---------- Modal ---------- */
.overlay {
  position: fixed; inset: 0; z-index: 50;
  background: rgba(15, 14, 12, .45); backdrop-filter: blur(2px);
  display: grid; place-items: center; padding: 16px;
  animation: dp-fade .15s ease-out;
}
.modal {
  width: min(560px, 100%); max-height: calc(100vh - 32px); display: flex; flex-direction: column;
  background: var(--surface); border: 1px solid var(--border); border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  animation: dp-pop .18s ease-out;
}
.modal-head { display: flex; justify-content: space-between; align-items: center; padding: 16px 18px 6px; }
.modal-head h2 { font-size: 18px; font-weight: 800; }
.modal-body { padding: 10px 18px 16px; overflow-y: auto; }
.modal-foot { display: flex; gap: 8px; align-items: center; padding: 12px 18px; border-top: 1px solid var(--border); }
.modal-inline-actions { display: flex; justify-content: flex-end; margin-top: 12px; }
.spacer { flex: 1; }
@keyframes dp-fade { from { opacity: 0; } }
@keyframes dp-pop { from { opacity: 0; transform: translateY(8px) scale(.98); } }

.form { display: flex; flex-direction: column; gap: 14px; }
.row { display: flex; gap: 12px; }
.row .field { flex: 1; min-width: 0; }
.row .field.narrow { flex: 0 0 96px; }
.row .field.narrow-2 { flex: 0 0 140px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field > span { font-size: 12.5px; font-weight: 700; color: var(--muted); }
.field input, .field select, .field textarea, .slot select, .slot input {
  width: 100%; height: 40px; padding: 0 11px; border-radius: 10px;
  border: 1px solid var(--border); background: var(--surface);
  transition: border-color .15s, box-shadow .15s;
}
.field textarea { height: auto; padding: 9px 11px; resize: vertical; }
.field input:focus, .field select:focus, .field textarea:focus, .slot select:focus, .slot input:focus {
  outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent);
}
.seg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; padding: 4px; background: var(--surface-2); border-radius: 12px; }
.seg-btn { height: 34px; border: 0; border-radius: 9px; background: transparent; font-weight: 700; font-size: 13px; color: var(--muted); }
.seg-btn.on { background: var(--surface); color: var(--tc); box-shadow: var(--shadow); }
.swatches { display: flex; gap: 8px; flex-wrap: wrap; }
.swatch { width: 30px; height: 30px; border-radius: 50%; border: 3px solid var(--surface); box-shadow: 0 0 0 1px var(--border); padding: 0; }
.swatch.on { box-shadow: 0 0 0 2px var(--text); }
.slots { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
.slot { display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) auto minmax(0, 1fr) auto; gap: 8px; align-items: center; width: 100%; }
.err { margin: 0; color: var(--danger); font-weight: 600; font-size: 13px; }

/* ---------- Duyarlı ---------- */
@media (max-width: 1180px) {
  .ov-grid, .month-wrap { grid-template-columns: minmax(0, 1fr); }
  .ov-side { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 860px) {
  .dp { grid-template-columns: minmax(0, 1fr); }
  .side {
    position: sticky; top: 0; z-index: 20; height: auto;
    flex-direction: row; flex-wrap: wrap; align-items: center; gap: 10px;
    padding: 10px 16px; border-right: 0; border-bottom: 1px solid var(--border);
  }
  .brand { flex: 1; padding: 0; }
  .side-actions { flex-direction: row; }
  .side-actions .btn:last-child { display: none; }
  .side-actions .btn.block { width: auto; }
  .nav { order: 3; flex-direction: row; width: 100%; overflow-x: auto; margin: 0 -4px; }
  .nav-btn { flex: none; padding: 7px 11px; font-size: 13.5px; }
  .side-foot { display: none; }
  .page { padding: 20px 16px 48px; }
  .page-head h1 { font-size: 24px; }
}
@media (max-width: 600px) {
  .stats { gap: 10px; }
  .stat-value { font-size: 24px; }
  .side-actions .btn.primary { padding: 0 11px; font-size: 0; gap: 0; }
  .side-actions .btn.primary svg { width: 20px; height: 20px; }
  .item { flex-wrap: wrap; }
  .due { margin-left: 34px; }
  .m-cell { min-height: 56px; padding: 4px; }
  .m-items { display: none; }
  .m-dots { display: flex; flex-wrap: wrap; }
  .row { flex-wrap: wrap; }
  .row .field.narrow, .row .field.narrow-2 { flex: 1 1 100px; }
  .filters-right { width: 100%; }
  .select { flex: 1; max-width: none; }
}
`;
