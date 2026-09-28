import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { INITIAL_CONSUMERS, mergeConsumer } from "./consumerData";

// ---------------------------------------------------------------------------
// Colors (light theme)
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#F7F5F0", panel: "#FFFFFF", border: "#E2DDCF",
  text: "#26241E", muted: "#8A8473",
  teal: "#1E8A7A", amber: "#C77A2B", blue: "#3E6FA8", misc: "#C9C4B4"
};

// ---------------------------------------------------------------------------
// Slot-array analysis: energy split, power range, candidates, reasoning notes
// ---------------------------------------------------------------------------
function analyze(slots) {
  let miscKwh = 0, indKwh = 0, evKwh = 0;
  let minK = Infinity, maxK = -Infinity;
  let indPeak = null, evPeak = null;
  const notes = [];
  slots.forEach((s) => {
    minK = Math.min(minK, s.k);
    maxK = Math.max(maxK, s.k);
    const ia = s.i ? s.i.a : 0, ea = s.e ? s.e.a : 0;
    miscKwh += Math.max(0, s.k - ia - ea) * 0.5;
    indKwh += ia * 0.5;
    evKwh += ea * 0.5;
    if (s.i && (!indPeak || s.i.a > indPeak.i.a)) indPeak = s;
    if (s.e && (!evPeak || s.e.a > evPeak.e.a)) evPeak = s;
    if (s.fl) notes.push(s);
  });
  return { miscKwh, indKwh, evKwh, minK, maxK, indPeak, evPeak, notes };
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------
function StatRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "7px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: COLORS.muted }}>{k}</span>
      <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontWeight: 600 }}>{v}</span>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      {title && <h2 style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.muted, margin: "0 0 12px 0", fontWeight: 600 }}>{title}</h2>}
      {children}
    </div>
  );
}

function CandidateCard({ peak, kind }) {
  if (!peak) return <div style={{ fontSize: 12, color: COLORS.muted, padding: "8px 0" }}>No {kind} activity detected in this view.</div>;
  const d = kind === "induction" ? peak.i : peak.e;
  const tagColor = kind === "induction" ? COLORS.amber : COLORS.blue;
  return (
    <details style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 10 }}>
      <summary style={{ cursor: "pointer", listStyle: "none" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {peak.t} · {d.a.toFixed(2)}kW attributed
          <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, padding: "2px 7px", borderRadius: 5, color: "#fff", background: tagColor, marginLeft: 6 }}>
            {kind.toUpperCase()}
          </span>
        </span>
        <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.muted, marginTop: 4 }}>trend: {d.tr}</div>
      </summary>
      <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 8 }}>
        {peak.r || "No reasoning recorded for this slot."}
      </div>
    </details>
  );
}

function NoteCard({ slot }) {
  return (
    <details style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 8 }}>
      <summary style={{ cursor: "pointer", listStyle: "none" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {slot.t} · total {slot.k.toFixed(2)}kW
          <span style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 10, padding: "2px 7px", borderRadius: 5, color: "#fff", background: COLORS.amber, marginLeft: 6 }}>
            INDUCTION
          </span>
        </span>
      </summary>
      <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 8 }}>
        {slot.r || "No reasoning recorded."}
      </div>
    </details>
  );
}

function LoadBarTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{
      background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 8,
      padding: "10px 12px", maxWidth: 320, boxShadow: "0 2px 8px rgba(0,0,0,.08)"
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
        Miscellaneous {row.Miscellaneous.toFixed(2)}kW · Induction {row.Induction.toFixed(2)}kW · EV {row.EV.toFixed(2)}kW
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 6 }}>
        {row.reasoning}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ApplianceAttributionDashboard() {
  const [consumers, setConsumers] = useState(INITIAL_CONSUMERS);
  const [scno, setScno] = useState(Object.keys(INITIAL_CONSUMERS)[0]);
  const [day, setDay] = useState(Object.keys(INITIAL_CONSUMERS[Object.keys(INITIAL_CONSUMERS)[0]].days)[0]);
  const [fileError, setFileError] = useState(null);

  const dayOptions = Object.keys(consumers[scno].days);

  function handleFiles(fileList) {
    setFileError(null);
    const files = Array.from(fileList || []);
    if (!files.length) return;
    Promise.all(files.map((file) => file.text()))
      .then((texts) => {
        let next = consumers;
        let lastScno = null;
        const errors = [];
        texts.forEach((text, idx) => {
          try {
            const parsed = JSON.parse(text);
            next = mergeConsumer(next, parsed);
            lastScno = parsed.scno;
          } catch (err) {
            errors.push(`${files[idx].name}: ${err.message}`);
          }
        });
        setConsumers(next);
        if (lastScno) {
          setScno(lastScno);
          setDay(Object.keys(next[lastScno].days)[0]);
        }
        if (errors.length) setFileError(errors.join(" · "));
      })
      .catch((err) => setFileError(err.message || "Could not read the selected file(s)."));
  }

  const slots = useMemo(() => {
    if (day === "__all__") return Object.values(consumers[scno].days).flat();
    return consumers[scno].days[day] || [];
  }, [consumers, scno, day]);

  const a = useMemo(() => analyze(slots), [slots]);

  const donutData = [
    { name: "Miscellaneous", value: a.miscKwh, color: COLORS.misc },
    { name: "Induction", value: a.indKwh, color: COLORS.amber },
    { name: "EV", value: a.evKwh, color: COLORS.blue }
  ];

  const barData = slots.map((s) => ({
    t: s.t,
    Miscellaneous: Math.max(0, s.k - (s.i ? s.i.a : 0) - (s.e ? s.e.a : 0)),
    Induction: s.i ? s.i.a : 0,
    EV: s.e ? s.e.a : 0,
    reasoning: s.r || "No reasoning recorded for this slot."
  }));

  const equipParts = [{ n: "Induction", v: a.indKwh }, { n: "EV", v: a.evKwh }];
  const largest = equipParts.reduce((x, y) => (y.v > x.v ? y : x));
  const bandsActive = ["Miscellaneous", ...(a.indKwh > 0 ? ["Induction"] : []), ...(a.evKwh > 0 ? ["EV"] : [])];

  function handleSelectConsumer(newScno) {
    setScno(newScno);
    setDay(Object.keys(consumers[newScno].days)[0]);
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20 }}>

        <header style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, letterSpacing: "0.16em", color: COLORS.teal, textTransform: "uppercase", marginBottom: 6 }}>
            Load Signature Console · Attribution Mode
          </div>
          <h1 style={{ fontSize: 22, margin: 0, fontWeight: 700 }}>Appliance Attribution Dashboard</h1>
          <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
            Half-hourly power readings classified against each consumer's own baseline, with induction-cooking and EV-charging load carved out.
          </div>
        </header>

        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label
            htmlFor="consumer-file-input"
            style={{
              background: COLORS.teal, color: "#fff", borderRadius: 8, padding: "8px 16px",
              fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap"
            }}
          >
            Add consumer JSON file(s)
          </label>
          <input
            id="consumer-file-input"
            type="file"
            accept="application/json,.json"
            multiple
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
            style={{ display: "none" }}
          />
          <span style={{ fontSize: 12, color: COLORS.muted }}>
            Drop in one or more <code>*_manual_filled_days.json</code> files — each is parsed and added by its own <code>scno</code>, no code editing needed.
          </span>
          {fileError && <span style={{ fontSize: 12, color: "#B84C4C" }}>{fileError}</span>}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "16px 0", alignItems: "center" }}>
          <label style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", marginRight: 6 }}>Consumer</label>
          <select value={scno} onChange={(e) => handleSelectConsumer(e.target.value)} style={selectStyle}>
            {Object.keys(consumers).map((id) => (
              <option key={id} value={id}>{consumers[id].name} ({id})</option>
            ))}
          </select>
          <label style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11, color: COLORS.muted, textTransform: "uppercase", marginRight: 6 }}>Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={selectStyle}>
            {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            {dayOptions.length > 1 && <option value="__all__">All days (combined)</option>}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
          <div>
            <Panel title="Energy split — miscellaneous vs. attributed loads">
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => v.toFixed(2) + " kWh"} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="Half-hourly load — stacked by attribution">
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke="#EFEBE0" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: COLORS.muted }} interval={5} />
                    <YAxis tick={{ fontSize: 10, fill: COLORS.muted }} label={{ value: "kW", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                    <Tooltip content={<LoadBarTooltip />} />
                    <Legend />
                    <Bar dataKey="Miscellaneous" stackId="s" fill={COLORS.misc} radius={[1, 1, 0, 0]} />
                    <Bar dataKey="Induction" stackId="s" fill={COLORS.amber} radius={[1, 1, 0, 0]} />
                    <Bar dataKey="EV" stackId="s" fill={COLORS.blue} radius={[1, 1, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title={`Induction usage — Reasoning (${a.notes.length})`}>
              {a.notes.length === 0
                ? <div style={{ fontSize: 12, color: COLORS.muted }}>No notes in this view.</div>
                : a.notes.map((s) => <NoteCard key={s.t} slot={s} />)}
            </Panel>
          </div>

          <div>
            <Panel title="Day summary">
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ fontFamily: "ui-monospace, Menlo, monospace", fontSize: 30, fontWeight: 700, color: COLORS.teal }}>
                  {(a.miscKwh + a.indKwh + a.evKwh).toFixed(2)}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>Total kWh, this day</div>
              </div>
              <StatRow k="Readings sampled" v={`${slots.length} half-hour slots`} />
              <StatRow k="Power range" v={`${a.minK.toFixed(2)}–${a.maxK.toFixed(2)} kW`} />
              <StatRow k="Bands detected" v={`${bandsActive.length} (${bandsActive.join(", ")})`} />
              <StatRow k="Largest band" v={`${largest.n} (${largest.v.toFixed(2)} kWh)`} />
              <StatRow k="Induction usage notes" v={a.notes.length} />
            </Panel>

            <Panel title="Induction candidate">
              <CandidateCard peak={a.indPeak} kind="induction" />
            </Panel>

            <Panel title="EV candidate">
              <CandidateCard peak={a.evPeak} kind="ev" />
            </Panel>

            <Panel>
              <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
                <b style={{ color: COLORS.text }}>Reading these numbers:</b> "attributed kW" is the portion of a slot's total draw the model assigns to induction cooking or EV charging. Miscellaneous is whatever's left after subtracting attribution — it is not a separate measured circuit.
                <br /><br />
                <b style={{ color: COLORS.text }}>Induction usage — Reasoning:</b> some induction slots come with extra reasoning worth a second look. Click a candidate or a listed slot to expand its reasoning.
              </div>
            </Panel>
          </div>
        </div>

        <footer style={{ marginTop: 24, color: COLORS.muted, fontSize: 11, textAlign: "center", fontFamily: "ui-monospace, Menlo, monospace" }}>
          LOAD SIGNATURE CONSOLE · ATTRIBUTION MODE
        </footer>
      </div>
    </div>
  );
}

const selectStyle = {
  background: COLORS.panel, border: `1px solid ${COLORS.border}`, color: COLORS.text,
  borderRadius: 8, padding: "8px 10px", fontSize: 13, minWidth: 200
};
