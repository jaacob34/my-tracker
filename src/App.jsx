import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  days: "jacob-100day-days",
  measurements: "jacob-100day-measurements",
  modules: "jacob-100day-modules",
  startDate: "jacob-100day-startdate",
  neetcode: "jacob-100day-neetcode",
  notes: "jacob-100day-notes",
};

const BLOCKS = [
  { id: "coding1", label: "Coding Session 1", duration: "2 hrs", icon: "💻" },
  { id: "coding2", label: "Coding Session 2", duration: "2 hrs", icon: "💻" },
  { id: "workout", label: "Workout", duration: "1.5 hrs", icon: "🏋️" },
  { id: "jaw", label: "Jaw Exercises", duration: "30 min", icon: "🦷" },
  { id: "content", label: "Content Creation", duration: "30 min", icon: "🎬" },
  { id: "sleep", label: "In Bed by 11:30 PM", duration: "nightly", icon: "😴" },
];

const MEASUREMENT_FIELDS = [
  { id: "bodyWeight", label: "Body Weight", unit: "lbs" },
  { id: "neck", label: "Neck", unit: "in" },
  { id: "armFlex", label: "Arm (Flexed)", unit: "in" },
  { id: "calves", label: "Calves", unit: "in" },
  { id: "broadJump", label: "Broad Jump", unit: "in" },
  { id: "dash40", label: "40-Yard Dash", unit: "sec" },
];

const NEETCODE_CATEGORIES = [
  { id: "arrays", label: "Arrays & Hashing", total: 9 },
  { id: "twopointers", label: "Two Pointers", total: 5 },
  { id: "slidingwindow", label: "Sliding Window", total: 6 },
  { id: "stack", label: "Stack", total: 7 },
  { id: "binarysearch", label: "Binary Search", total: 7 },
  { id: "linkedlist", label: "Linked List", total: 11 },
  { id: "trees", label: "Trees", total: 15 },
  { id: "tries", label: "Tries", total: 3 },
  { id: "heapqueue", label: "Heap / Priority Queue", total: 7 },
  { id: "backtracking", label: "Backtracking", total: 9 },
  { id: "graphs", label: "Graphs", total: 13 },
  { id: "advancedgraphs", label: "Advanced Graphs", total: 6 },
  { id: "dp1d", label: "1-D Dynamic Programming", total: 12 },
  { id: "dp2d", label: "2-D Dynamic Programming", total: 11 },
  { id: "greedy", label: "Greedy", total: 8 },
  { id: "intervals", label: "Intervals", total: 6 },
  { id: "mathandgeometry", label: "Math & Geometry", total: 8 },
  { id: "bitmanipulation", label: "Bit Manipulation", total: 7 },
];

const NOTE_TAGS = [
  { id: "general", label: "General", color: "#888" },
  { id: "coding", label: "Coding", color: "#63ffb4" },
  { id: "fitness", label: "Fitness", color: "#63d4ff" },
  { id: "mindset", label: "Mindset", color: "#ffb463" },
  { id: "content", label: "Content", color: "#ff6363" },
  { id: "job", label: "Job Prep", color: "#c463ff" },
];

const MODULES = Array.from({ length: 24 }, (_, i) => i + 1);
const WATER_GOAL = 8;
const ENERGY_LABELS = ["", "💀", "😴", "😐", "🙂", "🔥"];

function loadStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch { return fallback; }
}

function saveStorage(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function getDayNumber(startDate) {
  if (!startDate) return 1;
  const diff = Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000);
  return Math.min(Math.max(diff + 1, 1), 100);
}

function getTodayKey() {
  return new Date().toISOString().split("T")[0];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Returns the ISO date keys for the 7 days of a given week number
function getWeekDateKeys(weekNum, startDate) {
  if (!startDate) return [];
  const start = new Date(startDate);
  const keys = [];
  for (let d = (weekNum - 1) * 7; d < weekNum * 7; d++) {
    const date = new Date(start);
    date.setDate(start.getDate() + d);
    keys.push(date.toISOString().split("T")[0]);
  }
  return keys;
}

export default function App() {
  const [tab, setTab] = useState("daily");
  const [startDate, setStartDate] = useState(() => loadStorage(STORAGE_KEYS.startDate, null));
  const [days, setDays] = useState(() => loadStorage(STORAGE_KEYS.days, {}));
  const [measurements, setMeasurements] = useState(() => loadStorage(STORAGE_KEYS.measurements, {}));
  const [modules, setModules] = useState(() => loadStorage(STORAGE_KEYS.modules, Array(24).fill(false).map((_, i) => i < 11)));
  const [neetcode, setNeetcode] = useState(() => loadStorage(STORAGE_KEYS.neetcode, {}));
  const [notes, setNotes] = useState(() => loadStorage(STORAGE_KEYS.notes, []));

  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteTag, setNoteTag] = useState("general");
  const [noteSearch, setNoteSearch] = useState("");
  const [activeNoteTag, setActiveNoteTag] = useState("all");
  const [expandedNote, setExpandedNote] = useState(null);
  const [editingNote, setEditingNote] = useState(null);
  const [composing, setComposing] = useState(false);

  const [measureWeek, setMeasureWeek] = useState(1);
  const [measureForm, setMeasureForm] = useState({});
  const [showStartModal, setShowStartModal] = useState(!loadStorage(STORAGE_KEYS.startDate, null));
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dayNumber = getDayNumber(startDate);
  const todayKey = getTodayKey();
  const todayData = days[todayKey] || {};
  const completedToday = BLOCKS.filter(b => todayData[b.id]).length;
  const completedModules = modules.filter(Boolean).length;
  const weekNumber = Math.ceil(dayNumber / 7);
  const waterToday = todayData.water || 0;
  const energyToday = todayData.energy ?? null;
  const totalNeetcodeDone = NEETCODE_CATEGORIES.reduce((sum, cat) => sum + (neetcode[cat.id] || 0), 0);

  // Weekly coding hours
  const weeklyHours = (() => {
    if (!startDate) return 0;
    const keys = getWeekDateKeys(weekNumber, startDate);
    const total = keys.reduce((sum, k) => sum + parseFloat((days[k] || {}).codingHours || 0), 0);
    return Math.round(total * 10) / 10;
  })();

  // Sleep score: count nights in current week where sleep block was checked
  const weeklySleepScore = (() => {
    if (!startDate) return 0;
    const keys = getWeekDateKeys(weekNumber, startDate);
    return keys.filter(k => (days[k] || {}).sleep).length;
  })();

  const filteredNotes = notes
    .filter(n => activeNoteTag === "all" || n.tag === activeNoteTag)
    .filter(n => {
      if (!noteSearch) return true;
      const q = noteSearch.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => { saveStorage(STORAGE_KEYS.days, days); }, [days]);
  useEffect(() => { saveStorage(STORAGE_KEYS.measurements, measurements); }, [measurements]);
  useEffect(() => { saveStorage(STORAGE_KEYS.modules, modules); }, [modules]);
  useEffect(() => { saveStorage(STORAGE_KEYS.neetcode, neetcode); }, [neetcode]);
  useEffect(() => { saveStorage(STORAGE_KEYS.notes, notes); }, [notes]);

  function handleStartDate() {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    saveStorage(STORAGE_KEYS.startDate, today);
    setShowStartModal(false);
  }

  function toggleBlock(blockId) {
    setDays(prev => ({ ...prev, [todayKey]: { ...prev[todayKey], [blockId]: !prev[todayKey]?.[blockId] } }));
  }

  function setWater(val) {
    setDays(prev => ({ ...prev, [todayKey]: { ...prev[todayKey], water: Math.max(0, Math.min(12, val)) } }));
  }

  function setEnergy(val) {
    setDays(prev => ({ ...prev, [todayKey]: { ...prev[todayKey], energy: val } }));
  }

  function adjustCodingHours(delta) {
    const current = parseFloat(todayData.codingHours || 0);
    const next = Math.max(0, Math.round((current + delta) * 10) / 10);
    setDays(prev => ({ ...prev, [todayKey]: { ...prev[todayKey], codingHours: next.toString() } }));
  }

  function toggleModule(i) {
    setModules(prev => { const next = [...prev]; next[i] = !next[i]; return next; });
  }

  function setNeetcodeCount(catId, val) {
    const cat = NEETCODE_CATEGORIES.find(c => c.id === catId);
    setNeetcode(prev => ({ ...prev, [catId]: Math.max(0, Math.min(cat.total, parseInt(val) || 0)) }));
  }

  function saveMeasurement() {
    setMeasurements(prev => {
      const existing = prev[`week${measureWeek}`] || {};
      const merged = { ...existing, week: measureWeek };
      Object.entries(measureForm).forEach(([key, val]) => {
        if (val !== "" && val !== undefined && val !== null) {
          merged[key] = val;
        }
      });
      return { ...prev, [`week${measureWeek}`]: merged };
    });
    setMeasureForm({});
  }

  function saveNote() {
    if (!noteBody.trim()) return;
    if (editingNote !== null) {
      setNotes(prev => prev.map((n, i) => i === editingNote
        ? { ...n, title: noteTitle, body: noteBody, tag: noteTag, updatedAt: new Date().toISOString() }
        : n
      ));
      setEditingNote(null);
    } else {
      setNotes(prev => [{
        id: Date.now(), title: noteTitle || `Day ${dayNumber} note`,
        body: noteBody, tag: noteTag,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), dayNumber,
      }, ...prev]);
    }
    setNoteTitle(""); setNoteBody(""); setNoteTag("general"); setComposing(false);
  }

  function deleteNote(id) {
    setNotes(prev => prev.filter(n => n.id !== id));
    setExpandedNote(null);
  }

  function startEdit(note, idx) {
    setNoteTitle(note.title); setNoteBody(note.body); setNoteTag(note.tag);
    setEditingNote(idx); setExpandedNote(null); setComposing(true);
  }

  const progressPct = (dayNumber / 100) * 100;
  const modulePct = (completedModules / 24) * 100;
  const neetPct = (totalNeetcodeDone / 150) * 100;
  // How many days have elapsed so far this week (1 = just Monday, up to 7)
  const daysElapsedInWeek = (() => {
    if (!startDate) return 1;
    const keys = getWeekDateKeys(weekNumber, startDate);
    const todayIdx = keys.indexOf(todayKey);
    return todayIdx === -1 ? keys.length : todayIdx + 1;
  })();
  const sleepOnTrack = weeklySleepScore >= daysElapsedInWeek;
  const sleepMissed = daysElapsedInWeek - weeklySleepScore;
  const sleepColor = sleepOnTrack ? "#63ffb4" : sleepMissed <= 1 ? "#ffb463" : "#ff6363";
  const sleepStatus = (() => {
    if (sleepOnTrack && weeklySleepScore === 7) return "🔥 Perfect week — all 7 nights hit";
    if (sleepOnTrack) return "✅ On track — keep it up";
    if (sleepMissed === 1) return "⚡ 1 night missed — still recoverable";
    return `⚠️ ${sleepMissed} nights missed — prioritize sleep`;
  })();

  const tabs = [
    { id: "daily", label: "Daily", icon: "☀️" },
    { id: "measurements", label: "Measure", icon: "📐" },
    { id: "modules", label: "Modules", icon: "💻" },
    { id: "neetcode", label: "NeetCode", icon: "🧩" },
    { id: "notes", label: "Notes", icon: "📝" },
    { id: "overview", label: "Overview", icon: "📊" },
  ];

  const inputStyle = {
    width: "100%", background: "#1e1e2e", border: "1px solid #2a2a3a",
    borderRadius: 8, padding: "10px 12px", color: "#e8e8f0",
    fontSize: 13, fontFamily: "'DM Mono', monospace", outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'DM Mono','Fira Mono',monospace", color: "#e8e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#0a0a0f; }
        ::-webkit-scrollbar-thumb { background:#2a2a3a; border-radius:2px; }
        .blk { transition:background 0.15s,transform 0.1s; cursor:pointer; }
        .blk:hover { background:#1a1a2a !important; transform:translateX(2px); }
        .tbtn { transition:all 0.2s; cursor:pointer; border:none; }
        .tbtn:hover { opacity:0.85; }
        .mbtn { transition:all 0.15s; cursor:pointer; border:none; }
        .mbtn:hover { transform:scale(1.06); }
        .ebtn { transition:all 0.15s; cursor:pointer; border:none; }
        .ebtn:hover { transform:scale(1.1); }
        .ibtn { cursor:pointer; border:none; transition:all 0.1s; }
        .ibtn:hover { opacity:0.8; }
        .note-card { transition:all 0.15s; cursor:pointer; }
        .note-card:hover { border-color:#3a3a4a !important; transform:translateY(-1px); }
        .sleep-day { cursor:pointer; transition:all 0.15s; }
        .sleep-day:hover { transform:scale(1.05); }
        textarea:focus,input:focus { outline:none; border-color:#3a3a5a !important; }
        input[type=number] { -moz-appearance:textfield; }
        input::-webkit-outer-spin-button,input::-webkit-inner-spin-button { -webkit-appearance:none; }
        .glow { box-shadow:0 0 20px rgba(99,255,180,0.15); }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);} }
        .fi { animation:fadeIn 0.3s ease forwards; }
        .tag-pill { cursor:pointer; border:none; transition:all 0.15s; }
        .tag-pill:hover { opacity:0.85; }
      `}</style>

      {/* START MODAL */}
      {showStartModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100 }}>
          <div style={{ background:"#12121c",border:"1px solid #2a2a3a",borderRadius:16,padding:40,maxWidth:400,width:"90%",textAlign:"center" }}>
            <div style={{ fontSize:48,marginBottom:16 }}>🚀</div>
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:28,fontWeight:800,marginBottom:8,color:"#63ffb4" }}>100 Days Starts Now</div>
            <div style={{ color:"#888",fontSize:13,marginBottom:32,lineHeight:1.6 }}>Today will be set as Day 1. Your progress saves automatically.</div>
            <button onClick={handleStartDate} style={{ background:"#63ffb4",color:"#0a0a0f",border:"none",borderRadius:8,padding:"14px 32px",fontSize:15,fontWeight:700,fontFamily:"'Syne',sans-serif",cursor:"pointer",width:"100%" }}>
              Start My 100 Days
            </button>
          </div>
        </div>
      )}

      {/* EXPANDED NOTE MODAL */}
      {expandedNote !== null && (() => {
        const note = notes.find(n => n.id === expandedNote);
        if (!note) return null;
        const tag = NOTE_TAGS.find(t => t.id === note.tag) || NOTE_TAGS[0];
        const idx = notes.findIndex(n => n.id === expandedNote);
        return (
          <div onClick={() => setExpandedNote(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16 }}>
            <div onClick={e => e.stopPropagation()} style={{ background:"#12121c",border:"1px solid #2a2a3a",borderRadius:16,padding:28,maxWidth:500,width:"100%",maxHeight:"80vh",overflowY:"auto" }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:16 }}>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:6 }}>{note.title}</div>
                  <div style={{ display:"flex",gap:8,alignItems:"center" }}>
                    <span style={{ fontSize:11,background:tag.color+"22",color:tag.color,borderRadius:20,padding:"2px 10px" }}>{tag.label}</span>
                    <span style={{ fontSize:11,color:"#555" }}>Day {note.dayNumber} · {formatDate(note.createdAt)}</span>
                  </div>
                </div>
                <button onClick={() => setExpandedNote(null)} style={{ background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer",lineHeight:1 }}>✕</button>
              </div>
              <div style={{ fontSize:13,lineHeight:1.8,color:"#ccc",whiteSpace:"pre-wrap",marginBottom:20 }}>{note.body}</div>
              <div style={{ display:"flex",gap:8 }}>
                <button onClick={() => startEdit(note,idx)} style={{ flex:1,background:"#1e1e2e",border:"1px solid #2a2a3a",borderRadius:8,padding:10,color:"#e8e8f0",fontSize:12,cursor:"pointer",fontFamily:"'DM Mono',monospace" }}>✏️ Edit</button>
                <button onClick={() => deleteNote(note.id)} style={{ flex:1,background:"#1e0d0d",border:"1px solid #3a1e1e",borderRadius:8,padding:10,color:"#ff6363",fontSize:12,cursor:"pointer",fontFamily:"'DM Mono',monospace" }}>🗑 Delete</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HEADER */}
      <div style={{ background:"#0e0e18",borderBottom:"1px solid #1e1e2e",padding:"20px 24px 0",position:"sticky",top:0,zIndex:50 }}>
        <div style={{ maxWidth:640,margin:"0 auto" }}>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:"#63ffb4",letterSpacing:-0.5 }}>100-Day Tracker</div>
              <div style={{ fontSize:11,color:"#555",marginTop:2 }}>DAY {dayNumber} OF 100 · WEEK {weekNumber}</div>
              <div style={{ fontSize:11,color:"#444",marginTop:1 }}>{now.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})} · {now.toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit",second:"2-digit",hour12:true})}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:32,fontWeight:800,color:"#fff",lineHeight:1 }}>{dayNumber}</div>
              <div style={{ fontSize:10,color:"#555",marginTop:2 }}>DAYS IN</div>
            </div>
          </div>
          <div style={{ height:3,background:"#1e1e2e",borderRadius:2,marginBottom:16,overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${progressPct}%`,background:"linear-gradient(90deg,#63ffb4,#63d4ff)",borderRadius:2,transition:"width 0.5s ease" }} />
          </div>
          <div style={{ display:"flex",gap:2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="tbtn" style={{ flex:1,padding:"8px 1px",fontSize:8,fontFamily:"'DM Mono',monospace",borderRadius:"8px 8px 0 0",background:tab===t.id?"#12121c":"transparent",color:tab===t.id?"#63ffb4":"#555",borderBottom:tab===t.id?"2px solid #63ffb4":"2px solid transparent" }}>
                <div style={{ fontSize:13,marginBottom:2 }}>{t.icon}</div>{t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth:640,margin:"0 auto",padding:"24px 16px 80px" }}>

        {/* ── DAILY ── */}
        {tab === "daily" && (
          <div className="fi">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16 }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800 }}>Today's Blocks</div>
              <div style={{ background:completedToday===BLOCKS.length?"#63ffb4":"#1e1e2e",color:completedToday===BLOCKS.length?"#0a0a0f":"#888",borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:600,fontFamily:"'Syne',sans-serif" }}>
                {completedToday}/{BLOCKS.length}
              </div>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:20 }}>
              {BLOCKS.map(block => {
                const done = !!todayData[block.id];
                return (
                  <div key={block.id} className="blk" onClick={() => toggleBlock(block.id)} style={{ display:"flex",alignItems:"center",gap:16,background:done?"#0d1f17":"#12121c",border:`1px solid ${done?"#63ffb4":"#1e1e2e"}`,borderRadius:12,padding:"14px 18px" }}>
                    <div style={{ fontSize:20 }}>{block.icon}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,color:done?"#63ffb4":"#e8e8f0" }}>{block.label}</div>
                      <div style={{ fontSize:11,color:"#555",marginTop:2 }}>{block.duration}</div>
                    </div>
                    <div style={{ width:22,height:22,borderRadius:6,background:done?"#63ffb4":"transparent",border:`2px solid ${done?"#63ffb4":"#2a2a3a"}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      {done && <span style={{ color:"#0a0a0f",fontSize:12,fontWeight:700 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* SLEEP SCORE */}
            <div style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:"16px 20px",marginBottom:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14 }}>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700 }}>😴 Sleep Score</div>
                  <div style={{ fontSize:11,color:"#555",marginTop:2 }}>Nights in bed by 11:30 PM this week</div>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:26,fontWeight:800,color:sleepColor }}>
                  {weeklySleepScore}<span style={{ fontSize:13,color:"#555" }}>/7</span>
                </div>
              </div>
              {/* 7-day grid for current week */}
              <div style={{ display:"flex",gap:6 }}>
                {(() => {
                  const dayLabels = ["M","T","W","T","F","S","S"];
                  const weekKeys = getWeekDateKeys(weekNumber, startDate);
                  return weekKeys.map((key, i) => {
                    const hit = !!(days[key] || {}).sleep;
                    const isToday = key === todayKey;
                    return (
                      <div key={key} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4 }}>
                        <div style={{ fontSize:9,color:isToday?"#63ffb4":"#555" }}>{dayLabels[i]}</div>
                        <div style={{ width:"100%",aspectRatio:"1",borderRadius:6,background:hit?"#63ffb4":isToday?"#1e1e35":"#1e1e2e",border:`1px solid ${hit?"#63ffb4":isToday?"#3a3a5a":"#2a2a3a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12 }}>
                          {hit ? <span style={{ color:"#0a0a0f",fontWeight:700,fontSize:11 }}>✓</span> : isToday ? <span style={{ color:"#555",fontSize:9 }}>today</span> : null}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
              <div style={{ marginTop:10,fontSize:11,color:"#555",textAlign:"center" }}>
                {sleepStatus}
              </div>
            </div>

            {/* WATER */}
            <div style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:"16px 20px",marginBottom:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12 }}>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700 }}>💧 Water Intake</div>
                  <div style={{ fontSize:11,color:"#555",marginTop:2 }}>Goal: {WATER_GOAL} glasses</div>
                </div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:800,color:waterToday>=WATER_GOAL?"#63d4ff":"#e8e8f0" }}>
                  {waterToday}<span style={{ fontSize:12,color:"#555" }}>/{WATER_GOAL}</span>
                </div>
              </div>
              <div style={{ display:"flex",gap:5,marginBottom:10 }}>
                {Array.from({length:WATER_GOAL}).map((_,i) => (
                  <div key={i} onClick={() => setWater(i<waterToday?i:i+1)} style={{ flex:1,height:24,borderRadius:5,cursor:"pointer",background:i<waterToday?"#63d4ff":"#1e1e2e",border:`1px solid ${i<waterToday?"#63d4ff":"#2a2a3a"}`,transition:"all 0.15s" }} />
                ))}
              </div>
              <div style={{ display:"flex",gap:8 }}>
                <button className="ibtn" onClick={() => setWater(waterToday-1)} style={{ flex:1,background:"#1e1e2e",border:"1px solid #2a2a3a",borderRadius:8,padding:8,color:"#888",fontSize:18 }}>−</button>
                <button className="ibtn" onClick={() => setWater(waterToday+1)} style={{ flex:1,background:"#1e1e2e",border:"1px solid #2a2a3a",borderRadius:8,padding:8,color:"#63d4ff",fontSize:18 }}>+</button>
              </div>
            </div>

            {/* ENERGY */}
            <div style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:"16px 20px",marginBottom:12 }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,marginBottom:4 }}>⚡ Energy Level</div>
              <div style={{ fontSize:11,color:"#555",marginBottom:12 }}>How are you feeling today?</div>
              <div style={{ display:"flex",gap:8 }}>
                {[1,2,3,4,5].map(level => (
                  <button key={level} className="ebtn" onClick={() => setEnergy(level)} style={{ flex:1,aspectRatio:"1",borderRadius:10,fontSize:22,background:energyToday===level?"#1e1e35":"#1e1e2e",border:`2px solid ${energyToday===level?"#ffb463":"#2a2a3a"}`,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:3 }}>
                    <span>{ENERGY_LABELS[level]}</span>
                    <span style={{ fontSize:10,color:energyToday===level?"#ffb463":"#555",fontFamily:"'DM Mono',monospace" }}>{level}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CODING HOURS */}
            <div style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:"16px 20px",marginBottom:12 }}>
              <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700 }}>⏱ Coding Hours</div>
                  <div style={{ fontSize:11,color:"#555",marginTop:2 }}>Week total: <span style={{ color:"#63ffb4" }}>{weeklyHours}h</span> / 28h goal</div>
                </div>
                <div style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <button className="ibtn" onClick={() => adjustCodingHours(-0.5)} style={{ width:32,height:32,borderRadius:8,background:"#1e1e2e",border:"1px solid #2a2a3a",color:"#888",fontSize:18 }}>−</button>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:"#63ffb4",minWidth:44,textAlign:"center" }}>{parseFloat(todayData.codingHours||0)}h</div>
                  <button className="ibtn" onClick={() => adjustCodingHours(0.5)} style={{ width:32,height:32,borderRadius:8,background:"#1e1e2e",border:"1px solid #2a2a3a",color:"#63ffb4",fontSize:18 }}>+</button>
                </div>
              </div>
              <div style={{ height:4,background:"#1e1e2e",borderRadius:2,overflow:"hidden" }}>
                <div style={{ height:"100%",width:`${Math.min((weeklyHours/28)*100,100)}%`,background:"linear-gradient(90deg,#63ffb4,#63d4ff)",borderRadius:2,transition:"width 0.3s" }} />
              </div>
            </div>

            {completedToday === BLOCKS.length && (
              <div style={{ background:"#0d1f17",border:"1px solid #63ffb4",borderRadius:12,padding:"16px 20px",textAlign:"center" }} className="glow">
                <div style={{ fontSize:24,marginBottom:4 }}>🔥</div>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:800,color:"#63ffb4" }}>Perfect Day</div>
                <div style={{ fontSize:12,color:"#555",marginTop:4 }}>All blocks completed. Stay consistent.</div>
              </div>
            )}
          </div>
        )}

        {/* ── MEASUREMENTS ── */}
        {tab === "measurements" && (
          <div className="fi">
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:20 }}>Weekly Measurements</div>
            <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:24 }}>
              <div style={{ fontSize:12,color:"#555" }}>WEEK</div>
              <div style={{ display:"flex",gap:6,flexWrap:"wrap" }}>
                {Array.from({length:14},(_,i)=>i+1).map(w => (
                  <button key={w} onClick={() => { setMeasureWeek(w); setMeasureForm(measurements[`week${w}`]||{}); }} className="mbtn" style={{ width:36,height:36,borderRadius:8,fontSize:12,background:measureWeek===w?"#63ffb4":measurements[`week${w}`]?"#0d1f17":"#12121c",color:measureWeek===w?"#0a0a0f":measurements[`week${w}`]?"#63ffb4":"#555",border:`1px solid ${measureWeek===w?"#63ffb4":measurements[`week${w}`]?"#63ffb4":"#1e1e2e"}`,fontFamily:"'DM Mono',monospace" }}>{w}</button>
                ))}
              </div>
            </div>

            <div style={{ display:"flex",flexDirection:"column",gap:10,marginBottom:16 }}>
              {MEASUREMENT_FIELDS.map(f => (
                <div key={f.id} style={{ display:"flex",alignItems:"center",justifyContent:"space-between",background:"#12121c",border:"1px solid #1e1e2e",borderRadius:10,padding:"14px 16px" }}>
                  <div>
                    <div style={{ fontSize:13 }}>{f.label}</div>
                    <div style={{ fontSize:10,color:"#555",marginTop:2 }}>{f.unit}</div>
                  </div>
                  <input type="number" step="0.1" value={measureForm[f.id]||""} onChange={e => setMeasureForm(p=>({...p,[f.id]:e.target.value}))} placeholder="—"
                    style={{ width:80,background:"#1e1e2e",border:"1px solid #2a2a3a",borderRadius:6,padding:"8px 10px",color:"#63ffb4",fontSize:15,fontFamily:"'DM Mono',monospace",textAlign:"right" }} />
                </div>
              ))}
              <div style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:10,padding:"14px 16px" }}>
                <div style={{ fontSize:13,marginBottom:8 }}>🦷 Jaw Notes</div>
                <textarea value={measureForm.jawNotes||""} onChange={e => setMeasureForm(p=>({...p,jawNotes:e.target.value}))} placeholder="Any visible changes, soreness, observations..." rows={3}
                  style={{ width:"100%",background:"#1e1e2e",border:"1px solid #2a2a3a",borderRadius:6,padding:10,color:"#e8e8f0",fontSize:12,fontFamily:"'DM Mono',monospace",resize:"none" }} />
              </div>
            </div>

            <button onClick={saveMeasurement} style={{ width:"100%",background:"#63ffb4",color:"#0a0a0f",border:"none",borderRadius:10,padding:14,fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:800,cursor:"pointer" }}>
              Save Week {measureWeek} Measurements
            </button>

            {Object.keys(measurements).length > 0 && (
              <div style={{ marginTop:28 }}>
                <div style={{ fontSize:12,color:"#555",marginBottom:12,letterSpacing:1 }}>LOGGED WEEKS</div>
                {Object.entries(measurements).sort((a,b)=>a[1].week-b[1].week).map(([key,data]) => (
                  <div key={key} style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:10,padding:"12px 16px",marginBottom:8 }}>
                    <div style={{ fontSize:12,color:"#63ffb4",fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:8 }}>WEEK {data.week}</div>
                    <div style={{ display:"flex",flexWrap:"wrap",gap:"6px 16px" }}>
                      {MEASUREMENT_FIELDS.map(f => data[f.id] && (
                        <div key={f.id} style={{ fontSize:11,color:"#888" }}><span style={{ color:"#555" }}>{f.label}: </span><span style={{ color:"#e8e8f0" }}>{data[f.id]} {f.unit}</span></div>
                      ))}
                    </div>
                    {data.jawNotes && <div style={{ fontSize:11,color:"#555",marginTop:6,fontStyle:"italic" }}>"{data.jawNotes}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MODULES ── */}
        {tab === "modules" && (
          <div className="fi">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800 }}>Coding Modules</div>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,color:"#63ffb4",fontWeight:700 }}>{completedModules}/24</div>
            </div>
            <div style={{ height:6,background:"#1e1e2e",borderRadius:3,marginBottom:24,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${modulePct}%`,background:"linear-gradient(90deg,#63ffb4,#63d4ff)",borderRadius:3,transition:"width 0.4s" }} />
            </div>
            {[{label:"Phase 1",range:[1,12],note:"Days 1–50",color:"#63ffb4"},{label:"Phase 2",range:[13,24],note:"Days 51–80",color:"#63d4ff"}].map(phase => (
              <div key={phase.label} style={{ marginBottom:24 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:12 }}>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:phase.color }}>{phase.label}</div>
                  <div style={{ fontSize:11,color:"#555" }}>{phase.note}</div>
                </div>
                <div style={{ display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8 }}>
                  {MODULES.slice(phase.range[0]-1,phase.range[1]).map(mod => {
                    const idx=mod-1; const done=modules[idx];
                    return <button key={mod} onClick={() => toggleModule(idx)} className="mbtn" style={{ aspectRatio:"1",borderRadius:10,background:done?phase.color:"#12121c",border:`1px solid ${done?phase.color:"#1e1e2e"}`,color:done?"#0a0a0f":"#555",fontSize:13,fontFamily:"'Syne',sans-serif",fontWeight:800 }}>{mod}</button>;
                  })}
                </div>
              </div>
            ))}
            <div style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:"16px 20px" }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"#fff",marginBottom:4 }}>🎯 Day 80–100: Job Applications</div>
              <div style={{ fontSize:12,color:"#555" }}>Finish all 24 modules → polish resume → start applying. Target: 5+ apps by Day 100.</div>
              {completedModules===24 && <div style={{ marginTop:10,color:"#63ffb4",fontSize:13 }}>✓ All modules complete — time to apply!</div>}
            </div>
          </div>
        )}

        {/* ── NEETCODE ── */}
        {tab === "neetcode" && (
          <div className="fi">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8 }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800 }}>NeetCode 150</div>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,color:"#ffb463",fontWeight:700 }}>{totalNeetcodeDone}/150</div>
            </div>
            <div style={{ height:6,background:"#1e1e2e",borderRadius:3,marginBottom:6,overflow:"hidden" }}>
              <div style={{ height:"100%",width:`${neetPct}%`,background:"linear-gradient(90deg,#ffb463,#ff6363)",borderRadius:3,transition:"width 0.4s" }} />
            </div>
            <div style={{ fontSize:11,color:"#555",marginBottom:24 }}>{Math.round(neetPct)}% complete</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {NEETCODE_CATEGORIES.map(cat => {
                const done=neetcode[cat.id]||0; const pct=(done/cat.total)*100; const complete=done===cat.total;
                return (
                  <div key={cat.id} style={{ background:complete?"#1a1200":"#12121c",border:`1px solid ${complete?"#ffb463":"#1e1e2e"}`,borderRadius:12,padding:"14px 16px" }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
                      <div style={{ fontSize:13,color:complete?"#ffb463":"#e8e8f0" }}>{cat.label}</div>
                      <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                        <button className="ibtn" onClick={() => setNeetcodeCount(cat.id,done-1)} style={{ width:28,height:28,borderRadius:6,background:"#1e1e2e",border:"1px solid #2a2a3a",color:"#888",fontSize:16 }}>−</button>
                        <span style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:complete?"#ffb463":"#e8e8f0",minWidth:36,textAlign:"center" }}>{done}/{cat.total}</span>
                        <button className="ibtn" onClick={() => setNeetcodeCount(cat.id,done+1)} style={{ width:28,height:28,borderRadius:6,background:"#1e1e2e",border:"1px solid #2a2a3a",color:"#ffb463",fontSize:16 }}>+</button>
                      </div>
                    </div>
                    <div style={{ height:4,background:"#1e1e2e",borderRadius:2,overflow:"hidden" }}>
                      <div style={{ height:"100%",width:`${pct}%`,background:complete?"#ffb463":"linear-gradient(90deg,#ffb463,#ff6363)",borderRadius:2,transition:"width 0.3s" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── NOTES ── */}
        {tab === "notes" && (
          <div className="fi">
            <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
              <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800 }}>Notes</div>
              <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                <span style={{ fontSize:11,color:"#555" }}>{notes.length} notes</span>
                <button onClick={() => { setComposing(true); setEditingNote(null); setNoteTitle(""); setNoteBody(""); setNoteTag("general"); }} style={{ background:"#63ffb4",color:"#0a0a0f",border:"none",borderRadius:8,padding:"8px 14px",fontSize:12,fontWeight:700,fontFamily:"'Syne',sans-serif",cursor:"pointer" }}>+ New</button>
              </div>
            </div>

            {composing && (
              <div style={{ background:"#12121c",border:"1px solid #2a2a3a",borderRadius:14,padding:20,marginBottom:20 }}>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:"#63ffb4",marginBottom:14 }}>
                  {editingNote!==null?"✏️ Editing Note":"✏️ New Note"}
                </div>
                <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:12 }}>
                  {NOTE_TAGS.map(t => (
                    <button key={t.id} className="tag-pill" onClick={() => setNoteTag(t.id)} style={{ padding:"4px 12px",borderRadius:20,fontSize:11,background:noteTag===t.id?t.color+"33":"#1e1e2e",color:noteTag===t.id?t.color:"#555",border:`1px solid ${noteTag===t.id?t.color:"#2a2a3a"}` }}>{t.label}</button>
                  ))}
                </div>
                <input value={noteTitle} onChange={e=>setNoteTitle(e.target.value)} placeholder={`Title (optional — defaults to "Day ${dayNumber} note")`} style={{ ...inputStyle,marginBottom:10,background:"#1a1a2a",border:"1px solid #2a2a3a" }} />
                <textarea value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Write anything — thoughts, wins, struggles, ideas..." rows={6} style={{ ...inputStyle,resize:"vertical",lineHeight:1.7,marginBottom:12,background:"#1a1a2a",border:"1px solid #2a2a3a" }} />
                <div style={{ display:"flex",gap:8 }}>
                  <button onClick={saveNote} disabled={!noteBody.trim()} style={{ flex:1,background:noteBody.trim()?"#63ffb4":"#1e1e2e",color:noteBody.trim()?"#0a0a0f":"#555",border:"none",borderRadius:8,padding:12,fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:800,cursor:noteBody.trim()?"pointer":"default" }}>Save Note</button>
                  <button onClick={() => { setComposing(false); setEditingNote(null); }} style={{ background:"#1e1e2e",border:"1px solid #2a2a3a",borderRadius:8,padding:"12px 16px",color:"#888",fontSize:12,cursor:"pointer",fontFamily:"'DM Mono',monospace" }}>Cancel</button>
                </div>
              </div>
            )}

            {notes.length > 0 && <div style={{ marginBottom:14 }}><input value={noteSearch} onChange={e=>setNoteSearch(e.target.value)} placeholder="Search notes..." style={{ ...inputStyle,background:"#12121c",border:"1px solid #1e1e2e" }} /></div>}

            {notes.length > 0 && (
              <div style={{ display:"flex",gap:6,flexWrap:"wrap",marginBottom:16 }}>
                <button className="tag-pill" onClick={() => setActiveNoteTag("all")} style={{ padding:"4px 12px",borderRadius:20,fontSize:11,background:activeNoteTag==="all"?"#ffffff22":"#1e1e2e",color:activeNoteTag==="all"?"#fff":"#555",border:`1px solid ${activeNoteTag==="all"?"#444":"#2a2a3a"}` }}>All</button>
                {NOTE_TAGS.filter(t=>notes.some(n=>n.tag===t.id)).map(t => (
                  <button key={t.id} className="tag-pill" onClick={() => setActiveNoteTag(t.id)} style={{ padding:"4px 12px",borderRadius:20,fontSize:11,background:activeNoteTag===t.id?t.color+"33":"#1e1e2e",color:activeNoteTag===t.id?t.color:"#555",border:`1px solid ${activeNoteTag===t.id?t.color:"#2a2a3a"}` }}>{t.label}</button>
                ))}
              </div>
            )}

            {filteredNotes.length===0 && !composing && (
              <div style={{ textAlign:"center",padding:"48px 0",color:"#555" }}>
                <div style={{ fontSize:32,marginBottom:12 }}>📝</div>
                <div style={{ fontSize:14,marginBottom:6 }}>{notes.length===0?"No notes yet":"No notes match"}</div>
                <div style={{ fontSize:12 }}>{notes.length===0?"Hit + New to write your first one":"Try a different search or tag"}</div>
              </div>
            )}

            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {filteredNotes.map(note => {
                const tag=NOTE_TAGS.find(t=>t.id===note.tag)||NOTE_TAGS[0];
                const preview=note.body.length>120?note.body.slice(0,120)+"...":note.body;
                return (
                  <div key={note.id} className="note-card" onClick={() => setExpandedNote(note.id)} style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:"16px 18px" }}>
                    <div style={{ fontSize:14,fontFamily:"'Syne',sans-serif",fontWeight:700,marginBottom:4 }}>{note.title}</div>
                    <div style={{ fontSize:12,color:"#777",lineHeight:1.6,marginBottom:10 }}>{preview}</div>
                    <div style={{ display:"flex",alignItems:"center",gap:8 }}>
                      <span style={{ fontSize:10,background:tag.color+"22",color:tag.color,borderRadius:20,padding:"2px 8px" }}>{tag.label}</span>
                      <span style={{ fontSize:10,color:"#444" }}>Day {note.dayNumber}</span>
                      <span style={{ fontSize:10,color:"#444" }}>· {formatDate(note.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className="fi">
            <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,marginBottom:20 }}>Overview</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24 }}>
              {[
                { label:"Day", value:`${dayNumber}/100`, color:"#63ffb4" },
                { label:"Week", value:`${weekNumber}/14`, color:"#63d4ff" },
                { label:"Modules", value:`${completedModules}/24`, color:"#63ffb4" },
                { label:"NeetCode", value:`${totalNeetcodeDone}/150`, color:"#ffb463" },
                { label:"Today's Blocks", value:`${completedToday}/${BLOCKS.length}`, color:"#63d4ff" },
                { label:"Sleep This Week", value:`${weeklySleepScore}/7`, color:sleepColor },
                { label:"Water Today", value:`${waterToday}/${WATER_GOAL}`, color:"#63d4ff" },
                { label:"Energy Today", value:energyToday?`${ENERGY_LABELS[energyToday]} ${energyToday}/5`:"—", color:"#ffb463" },
                { label:"Coding This Week", value:`${weeklyHours}h`, color:"#63ffb4" },
                { label:"Notes Written", value:`${notes.length}`, color:"#c463ff" },
              ].map(s => (
                <div key={s.label} style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:12,padding:16,textAlign:"center" }}>
                  <div style={{ fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:800,color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:10,color:"#555",marginTop:4 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize:12,color:"#555",marginBottom:12,letterSpacing:1,fontFamily:"'Syne',sans-serif",fontWeight:700 }}>MILESTONES</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8,marginBottom:24 }}>
              {[
                { day:1, label:"Baseline logged for all categories" },
                { day:25, label:"~3 modules done — first physical comparison" },
                { day:50, label:"Halfway — 6 modules done, assess all metrics" },
                { day:80, label:"Program complete — resume + portfolio ready" },
                { day:100, label:"5+ job applications submitted" },
              ].map(m => {
                const passed=dayNumber>=m.day; const upcoming=!passed&&(m.day-dayNumber)<=7;
                return (
                  <div key={m.day} style={{ display:"flex",gap:14,alignItems:"center",background:passed?"#0d1f17":"#12121c",border:`1px solid ${passed?"#63ffb4":upcoming?"#ffb463":"#1e1e2e"}`,borderRadius:10,padding:"12px 16px" }}>
                    <div style={{ fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:800,color:passed?"#63ffb4":upcoming?"#ffb463":"#555",minWidth:36 }}>D{m.day}</div>
                    <div style={{ fontSize:12,color:passed?"#e8e8f0":"#666",flex:1 }}>
                      {m.label} {passed&&"✓"} {upcoming&&<span style={{ color:"#ffb463",fontSize:11 }}>coming up</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ fontSize:12,color:"#555",marginBottom:12,letterSpacing:1,fontFamily:"'Syne',sans-serif",fontWeight:700 }}>DAY TYPES</div>
            {[
              { type:"🟢 Free Day", desc:"All 6 blocks · Full 4h coding · 30m content", color:"#63ffb4" },
              { type:"🟡 Half Day", desc:"All 6 blocks · 4–6h unavailable · Skip AM routine", color:"#ffb463" },
              { type:"🔴 Full Day", desc:"All blocks · Content cut to 15min · Survival mode", color:"#ff6363" },
            ].map(d => (
              <div key={d.type} style={{ background:"#12121c",border:"1px solid #1e1e2e",borderRadius:10,padding:"12px 16px",marginBottom:8 }}>
                <div style={{ fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:d.color,marginBottom:4 }}>{d.type}</div>
                <div style={{ fontSize:12,color:"#555" }}>{d.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
