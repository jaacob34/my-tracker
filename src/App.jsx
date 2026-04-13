import { useState, useEffect } from "react";

const STORAGE_KEYS = {
  days: "jacob-100day-days",
  measurements: "jacob-100day-measurements",
  modules: "jacob-100day-modules",
  startDate: "jacob-100day-startdate",
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
  { id: "neck", label: "Neck", unit: "in" },
  { id: "armFlex", label: "Arm (Flexed)", unit: "in" },
  { id: "armRelax", label: "Arm (Relaxed)", unit: "in" },
  { id: "vertJump", label: "Vertical Jump", unit: "in" },
  { id: "dash40", label: "40-Yard Dash", unit: "sec" },
];

const MODULES = Array.from({ length: 24 }, (_, i) => i + 1);

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

export default function App() {
  const [tab, setTab] = useState("daily");
  const [startDate, setStartDate] = useState(() => loadStorage(STORAGE_KEYS.startDate, null));
  const [days, setDays] = useState(() => loadStorage(STORAGE_KEYS.days, {}));
  const [measurements, setMeasurements] = useState(() => loadStorage(STORAGE_KEYS.measurements, {}));
  const [modules, setModules] = useState(() => loadStorage(STORAGE_KEYS.modules, Array(24).fill(false).map((_, i) => i < 11)));
  const [measureWeek, setMeasureWeek] = useState(1);
  const [measureForm, setMeasureForm] = useState({});
  const [showStartModal, setShowStartModal] = useState(!loadStorage(STORAGE_KEYS.startDate, null));

  const dayNumber = getDayNumber(startDate);
  const todayKey = getTodayKey();
  const todayBlocks = days[todayKey] || {};
  const completedToday = BLOCKS.filter(b => todayBlocks[b.id]).length;
  const completedModules = modules.filter(Boolean).length;
  const weekNumber = Math.ceil(dayNumber / 7);

  useEffect(() => { saveStorage(STORAGE_KEYS.days, days); }, [days]);
  useEffect(() => { saveStorage(STORAGE_KEYS.measurements, measurements); }, [measurements]);
  useEffect(() => { saveStorage(STORAGE_KEYS.modules, modules); }, [modules]);

  function handleStartDate() {
    const today = new Date().toISOString().split("T")[0];
    setStartDate(today);
    saveStorage(STORAGE_KEYS.startDate, today);
    setShowStartModal(false);
  }

  function toggleBlock(blockId) {
    setDays(prev => ({
      ...prev,
      [todayKey]: { ...prev[todayKey], [blockId]: !prev[todayKey]?.[blockId] }
    }));
  }

  function toggleModule(i) {
    setModules(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }

  function saveMeasurement() {
    const key = `week${measureWeek}`;
    setMeasurements(prev => ({ ...prev, [key]: { ...measureForm, week: measureWeek } }));
    setMeasureForm({});
  }

  const progressPct = (dayNumber / 100) * 100;
  const modulePct = (completedModules / 24) * 100;

  const tabs = [
    { id: "daily", label: "Daily", icon: "☀️" },
    { id: "measurements", label: "Measurements", icon: "📐" },
    { id: "modules", label: "Modules", icon: "💻" },
    { id: "overview", label: "Overview", icon: "📊" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0a0f",
      fontFamily: "'DM Mono', 'Fira Mono', monospace",
      color: "#e8e8f0",
      padding: "0",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0a0f; }
        ::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 2px; }
        .block-row { transition: background 0.15s, transform 0.1s; cursor: pointer; }
        .block-row:hover { background: #1a1a2a !important; transform: translateX(2px); }
        .tab-btn { transition: all 0.2s; cursor: pointer; border: none; }
        .tab-btn:hover { opacity: 0.85; }
        .mod-btn { transition: all 0.15s; cursor: pointer; border: none; }
        .mod-btn:hover { transform: scale(1.05); }
        input[type=number] { -moz-appearance: textfield; }
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }
        .glow { box-shadow: 0 0 20px rgba(99, 255, 180, 0.15); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>

      {/* START MODAL */}
      {showStartModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100
        }}>
          <div style={{
            background: "#12121c", border: "1px solid #2a2a3a", borderRadius: 16,
            padding: "40px", maxWidth: 400, width: "90%", textAlign: "center"
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, marginBottom: 8, color: "#63ffb4" }}>
              100 Days Starts Now
            </div>
            <div style={{ color: "#888", fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
              Today will be set as Day 1. Your progress saves automatically.
            </div>
            <button onClick={handleStartDate} style={{
              background: "#63ffb4", color: "#0a0a0f", border: "none",
              borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 700,
              fontFamily: "'Syne', sans-serif", cursor: "pointer", width: "100%"
            }}>
              Start My 100 Days
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{
        background: "#0e0e18", borderBottom: "1px solid #1e1e2e",
        padding: "20px 24px 0", position: "sticky", top: 0, zIndex: 50
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: "#63ffb4", letterSpacing: -0.5 }}>
                100-Day Tracker
              </div>
              <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                DAY {dayNumber} OF 100 &nbsp;·&nbsp; WEEK {weekNumber}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                {dayNumber}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>DAYS IN</div>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: "#1e1e2e", borderRadius: 2, marginBottom: 16, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPct}%`,
              background: "linear-gradient(90deg, #63ffb4, #63d4ff)",
              borderRadius: 2, transition: "width 0.5s ease"
            }} />
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", gap: 4 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn" style={{
                flex: 1, padding: "10px 4px", fontSize: 11, fontFamily: "'DM Mono', monospace",
                borderRadius: "8px 8px 0 0",
                background: tab === t.id ? "#12121c" : "transparent",
                color: tab === t.id ? "#63ffb4" : "#555",
                borderBottom: tab === t.id ? "2px solid #63ffb4" : "2px solid transparent",
              }}>
                <div style={{ fontSize: 16, marginBottom: 2 }}>{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px" }}>

        {/* DAILY TAB */}
        {tab === "daily" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>Today's Blocks</div>
              <div style={{
                background: completedToday === BLOCKS.length ? "#63ffb4" : "#1e1e2e",
                color: completedToday === BLOCKS.length ? "#0a0a0f" : "#888",
                borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 600,
                fontFamily: "'Syne', sans-serif"
              }}>
                {completedToday}/{BLOCKS.length}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {BLOCKS.map(block => {
                const done = !!todayBlocks[block.id];
                return (
                  <div key={block.id} className="block-row" onClick={() => toggleBlock(block.id)} style={{
                    display: "flex", alignItems: "center", gap: 16,
                    background: done ? "#0d1f17" : "#12121c",
                    border: `1px solid ${done ? "#63ffb4" : "#1e1e2e"}`,
                    borderRadius: 12, padding: "16px 20px",
                  }}>
                    <div style={{ fontSize: 24 }}>{block.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: done ? "#63ffb4" : "#e8e8f0", fontWeight: 500 }}>
                        {block.label}
                      </div>
                      <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>{block.duration}</div>
                    </div>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: done ? "#63ffb4" : "transparent",
                      border: `2px solid ${done ? "#63ffb4" : "#2a2a3a"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      {done && <span style={{ color: "#0a0a0f", fontSize: 13, fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {completedToday === BLOCKS.length && (
              <div style={{
                marginTop: 20, background: "#0d1f17", border: "1px solid #63ffb4",
                borderRadius: 12, padding: "16px 20px", textAlign: "center"
              }} className="glow">
                <div style={{ fontSize: 24, marginBottom: 4 }}>🔥</div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 800, color: "#63ffb4" }}>
                  Perfect Day
                </div>
                <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>All blocks completed. Stay consistent.</div>
              </div>
            )}
          </div>
        )}

        {/* MEASUREMENTS TAB */}
        {tab === "measurements" && (
          <div className="fade-in">
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              Weekly Measurements
            </div>

            {/* Week selector */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ fontSize: 12, color: "#555" }}>WEEK</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Array.from({ length: 14 }, (_, i) => i + 1).map(w => (
                  <button key={w} onClick={() => {
                    setMeasureWeek(w);
                    setMeasureForm(measurements[`week${w}`] || {});
                  }} className="mod-btn" style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 12,
                    background: measureWeek === w ? "#63ffb4" : measurements[`week${w}`] ? "#0d1f17" : "#12121c",
                    color: measureWeek === w ? "#0a0a0f" : measurements[`week${w}`] ? "#63ffb4" : "#555",
                    border: `1px solid ${measureWeek === w ? "#63ffb4" : measurements[`week${w}`] ? "#63ffb4" : "#1e1e2e"}`,
                    fontFamily: "'DM Mono', monospace"
                  }}>{w}</button>
                ))}
              </div>
            </div>

            {/* Input fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
              {MEASUREMENT_FIELDS.map(f => (
                <div key={f.id} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#12121c", border: "1px solid #1e1e2e", borderRadius: 10, padding: "14px 16px"
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "#e8e8f0" }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>{f.unit}</div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={measureForm[f.id] || ""}
                    onChange={e => setMeasureForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                    placeholder="—"
                    style={{
                      width: 80, background: "#1e1e2e", border: "1px solid #2a2a3a",
                      borderRadius: 6, padding: "8px 10px", color: "#63ffb4",
                      fontSize: 15, fontFamily: "'DM Mono', monospace", textAlign: "right"
                    }}
                  />
                </div>
              ))}

              {/* Jaw notes */}
              <div style={{ background: "#12121c", border: "1px solid #1e1e2e", borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, color: "#e8e8f0", marginBottom: 8 }}>🦷 Jaw Notes</div>
                <textarea
                  value={measureForm.jawNotes || ""}
                  onChange={e => setMeasureForm(prev => ({ ...prev, jawNotes: e.target.value }))}
                  placeholder="Any visible changes, soreness, observations..."
                  rows={3}
                  style={{
                    width: "100%", background: "#1e1e2e", border: "1px solid #2a2a3a",
                    borderRadius: 6, padding: "10px", color: "#e8e8f0",
                    fontSize: 12, fontFamily: "'DM Mono', monospace", resize: "none"
                  }}
                />
              </div>
            </div>

            <button onClick={saveMeasurement} style={{
              width: "100%", background: "#63ffb4", color: "#0a0a0f",
              border: "none", borderRadius: 10, padding: "14px",
              fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 800, cursor: "pointer"
            }}>
              Save Week {measureWeek} Measurements
            </button>

            {/* History */}
            {Object.keys(measurements).length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 12, color: "#555", marginBottom: 12, letterSpacing: 1 }}>LOGGED WEEKS</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {Object.entries(measurements).sort((a, b) => a[1].week - b[1].week).map(([key, data]) => (
                    <div key={key} style={{
                      background: "#12121c", border: "1px solid #1e1e2e",
                      borderRadius: 10, padding: "12px 16px"
                    }}>
                      <div style={{ fontSize: 12, color: "#63ffb4", fontFamily: "'Syne', sans-serif", fontWeight: 700, marginBottom: 8 }}>
                        WEEK {data.week}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px" }}>
                        {MEASUREMENT_FIELDS.map(f => data[f.id] && (
                          <div key={f.id} style={{ fontSize: 11, color: "#888" }}>
                            <span style={{ color: "#555" }}>{f.label}: </span>
                            <span style={{ color: "#e8e8f0" }}>{data[f.id]} {f.unit}</span>
                          </div>
                        ))}
                      </div>
                      {data.jawNotes && (
                        <div style={{ fontSize: 11, color: "#555", marginTop: 6, fontStyle: "italic" }}>
                          "{data.jawNotes}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULES TAB */}
        {tab === "modules" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800 }}>Coding Modules</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, color: "#63ffb4", fontWeight: 700 }}>
                {completedModules}/24
              </div>
            </div>

            {/* Module progress bar */}
            <div style={{ height: 6, background: "#1e1e2e", borderRadius: 3, marginBottom: 24, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${modulePct}%`,
                background: "linear-gradient(90deg, #63ffb4, #63d4ff)",
                borderRadius: 3, transition: "width 0.4s ease"
              }} />
            </div>

            {/* Phase labels */}
            {[
              { label: "Phase 1", range: [1, 12], note: "Days 1–50", color: "#63ffb4" },
              { label: "Phase 2", range: [13, 24], note: "Days 51–80", color: "#63d4ff" },
            ].map(phase => (
              <div key={phase.label} style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: phase.color }}>
                    {phase.label}
                  </div>
                  <div style={{ fontSize: 11, color: "#555" }}>{phase.note}</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
                  {MODULES.slice(phase.range[0] - 1, phase.range[1]).map(mod => {
                    const idx = mod - 1;
                    const done = modules[idx];
                    return (
                      <button key={mod} onClick={() => toggleModule(idx)} className="mod-btn" style={{
                        aspectRatio: "1", borderRadius: 10,
                        background: done ? phase.color : "#12121c",
                        border: `1px solid ${done ? phase.color : "#1e1e2e"}`,
                        color: done ? "#0a0a0f" : "#555",
                        fontSize: 13, fontFamily: "'Syne', sans-serif", fontWeight: 800,
                      }}>
                        {mod}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Job apps section */}
            <div style={{
              background: "#12121c", border: "1px solid #1e1e2e",
              borderRadius: 12, padding: "16px 20px", marginTop: 8
            }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                🎯 Day 80–100: Job Applications
              </div>
              <div style={{ fontSize: 12, color: "#555" }}>
                Finish all 24 modules → polish resume → start applying. Target: 5+ apps by Day 100.
              </div>
              {completedModules === 24 && (
                <div style={{ marginTop: 10, color: "#63ffb4", fontSize: 13, fontWeight: 600 }}>
                  ✓ All modules complete — time to apply!
                </div>
              )}
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="fade-in">
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, marginBottom: 20 }}>
              Overview
            </div>

            {/* Stats grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Day", value: `${dayNumber}/100`, color: "#63ffb4" },
                { label: "Week", value: `${weekNumber}/14`, color: "#63d4ff" },
                { label: "Modules Done", value: `${completedModules}/24`, color: "#ffb463" },
                { label: "Today's Blocks", value: `${completedToday}/${BLOCKS.length}`, color: "#ff6363" },
              ].map(s => (
                <div key={s.label} style={{
                  background: "#12121c", border: "1px solid #1e1e2e",
                  borderRadius: 12, padding: "20px 16px", textAlign: "center"
                }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: s.color }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 11, color: "#555", marginTop: 4 }}>{s.label.toUpperCase()}</div>
                </div>
              ))}
            </div>

            {/* Milestones */}
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 12, letterSpacing: 1 }}>
              MILESTONES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { day: 1, label: "Baseline logged for all categories" },
                { day: 25, label: "~3 modules done — first physical comparison" },
                { day: 50, label: "Halfway — 6 modules done, assess all metrics" },
                { day: 80, label: "Program complete — resume + portfolio ready" },
                { day: 100, label: "5+ job applications submitted" },
              ].map(m => {
                const passed = dayNumber >= m.day;
                const current = dayNumber < m.day && (m.day - dayNumber) <= 7;
                return (
                  <div key={m.day} style={{
                    display: "flex", gap: 14, alignItems: "flex-start",
                    background: passed ? "#0d1f17" : "#12121c",
                    border: `1px solid ${passed ? "#63ffb4" : current ? "#ffb463" : "#1e1e2e"}`,
                    borderRadius: 10, padding: "12px 16px"
                  }}>
                    <div style={{
                      fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 800,
                      color: passed ? "#63ffb4" : current ? "#ffb463" : "#555",
                      minWidth: 40, flexShrink: 0
                    }}>
                      D{m.day}
                    </div>
                    <div style={{ fontSize: 13, color: passed ? "#e8e8f0" : "#666", lineHeight: 1.4 }}>
                      {m.label}
                      {passed && <span style={{ marginLeft: 8, fontSize: 12 }}>✓</span>}
                      {current && <span style={{ marginLeft: 8, fontSize: 11, color: "#ffb463" }}>coming up</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 3 day types quick ref */}
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "#555", marginBottom: 12, letterSpacing: 1, marginTop: 24 }}>
              DAY TYPES
            </div>
            {[
              { type: "🟢 Free Day", desc: "All 6 blocks · Full 4h coding · 30m content", color: "#63ffb4" },
              { type: "🟡 Half Day", desc: "All 6 blocks · 4–6h unavailable · Skip AM routine", color: "#ffb463" },
              { type: "🔴 Full Day", desc: "All blocks · Content cut to 15min · Survival mode", color: "#ff6363" },
            ].map(d => (
              <div key={d.type} style={{
                background: "#12121c", border: "1px solid #1e1e2e",
                borderRadius: 10, padding: "12px 16px", marginBottom: 8
              }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: d.color, marginBottom: 4 }}>
                  {d.type}
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>{d.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
