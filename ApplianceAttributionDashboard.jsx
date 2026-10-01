import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { INITIAL_CONSUMERS, mergeConsumer } from "./consumerData";

// ---------------------------------------------------------------------------
// Colors (light theme) - matches the companion Consumer Load Analyzer app
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#F7F5F0", panel: "#FFFFFF", border: "#E2DDCF",
  text: "#26241E", muted: "#8A8473",
  teal: "#1E8A7A", amber: "#C77A2B", blue: "#3E6FA8", misc: "#C9C4B4"
};
const MONO = "ui-monospace, Menlo, monospace";

const MISC_LABEL = "Unexplained";
const MISC_KEY = "__unexplained";
const ON_KW = 0.01; // an appliance counts as "on" in a slot above this

// ---------------------------------------------------------------------------
// Appliance names and colors. Keys come from the pipeline's `balance`
// ("ac", "fridge", "fan", "lighting:Tube light", "other:Television", ...) or, for
// older output, from any equipment object the model named.
// ---------------------------------------------------------------------------
const APPLIANCE_META = {
  induction:         { label: "Induction",       color: COLORS.amber },
  ev:                { label: "EV",              color: COLORS.blue },
  ac:                { label: "AC",              color: "#D64545" },
  fridge:            { label: "Fridge",          color: "#5DB7A0" },
  fan:               { label: "Fans",            color: "#4FB0C6" },
  "tube light":      { label: "Tube light",      color: "#E3B23C" },
  bulb:              { label: "Bulb",            color: "#EBCB6B" },
  lighting:          { label: "Lighting",        color: "#E3B23C" },
  television:        { label: "Television",      color: "#7B5EA7" },
  mixer:             { label: "Mixer",           color: "#5B9A4E" },
  grinder:           { label: "Grinder",         color: "#A8724E" },
  "washing machine": { label: "Washing machine", color: "#4E8FA8" },
  motor:             { label: "Motor / pump",    color: "#C7647A" }
};
const FALLBACK_PALETTE = ["#8A6B4E", "#6B8E23", "#B0598B", "#3D8B9E", "#A8902F", "#7A7FB5"];

// "other:Television" -> "television"; "lighting:Tube light" -> "tube light"; "other:Mixer#2" -> "mixer"
function normKey(key) {
  const sub = key.includes(":") ? key.split(":").slice(1).join(":") : key;
  return sub.replace(/#\d+$/, "").trim().toLowerCase();
}

function applianceLabel(key) {
  const meta = APPLIANCE_META[normKey(key)];
  const dup = /#(\d+)$/.exec(key);
  let base;
  if (meta) base = meta.label;
  else {
    const sub = key.includes(":") ? key.split(":").slice(1).join(":") : key;
    base = sub.replace(/#\d+$/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return dup ? `${base} (${dup[1]})` : base;
}

function applianceColor(key) {
  const meta = APPLIANCE_META[normKey(key)];
  if (meta) return meta.color;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACK_PALETTE[h % FALLBACK_PALETTE.length];
}

const sum = (arr) => arr.reduce((x, y) => x + y, 0);

// ---------------------------------------------------------------------------
// One slot's attribution, kept inside what the meter actually read.
// With the pipeline's `balance` every surveyed appliance is here; without it
// (older output) only induction / EV / what the model named.
// ---------------------------------------------------------------------------
function splitSlot(s) {
  let ind = 0, ev = 0;
  const oth = {};

  if (s.b) {
    ind = s.b.induction || 0;
    ev = s.b.ev || 0;
    Object.entries(s.b).forEach(([key, v]) => {
      if (key !== "induction" && key !== "ev") oth[key] = v;
    });
  } else {
    ind = s.i ? s.i.a : 0;
    ev = s.e ? s.e.a : 0;
    Object.entries(s.o || {}).forEach(([key, d]) => {
      oth[key] = d.a;
    });
  }

  const claimed = ind + ev + sum(Object.values(oth));
  const capped = claimed > s.k + 0.005 && claimed > 0;
  const scale = capped ? s.k / claimed : 1;

  const out = { ind: ind * scale, ev: ev * scale, oth: {}, claimed, capped };
  Object.entries(oth).forEach(([key, v]) => {
    out.oth[key] = v * scale;
  });
  out.misc = Math.max(0, s.k - (out.ind + out.ev + sum(Object.values(out.oth))));
  return out;
}

const hasFlags = (s) => Array.isArray(s.fl) && s.fl.length > 0;

// ---------------------------------------------------------------------------
// Slot-array analysis
// ---------------------------------------------------------------------------
function analyze(slots) {
  let miscKwh = 0, indKwh = 0, evKwh = 0, totalKwh = 0, cappedCount = 0;
  let indCount = 0, evCount = 0;
  let indPeakKw = 0, evPeakKw = 0;
  let minK = Infinity, maxK = -Infinity;
  let indPeak = null, evPeak = null, indFirst = null, indLast = null, evFirst = null, evLast = null;
  let hasBalance = false;
  let flaggedCount = 0;

  const othKwh = {}, othCount = {}, othPeak = {}, othPeakKw = {}, othInferred = {};

  slots.forEach((s) => {
    const sp = splitSlot(s);
    if (s.b) hasBalance = true;
    if (hasFlags(s)) flaggedCount += 1;

    minK = Math.min(minK, s.k);
    maxK = Math.max(maxK, s.k);
    totalKwh += s.k * 0.5;
    miscKwh += sp.misc * 0.5;
    indKwh += sp.ind * 0.5;
    evKwh += sp.ev * 0.5;
    if (sp.capped) cappedCount += 1;

    if (sp.ind > ON_KW) { indCount += 1; if (!indFirst) indFirst = s.t; indLast = s.t; }
    if (sp.ev > ON_KW) { evCount += 1; if (!evFirst) evFirst = s.t; evLast = s.t; }
    if (sp.ind > indPeakKw) { indPeakKw = sp.ind; indPeak = s; }
    if (sp.ev > evPeakKw) { evPeakKw = sp.ev; evPeak = s; }

    Object.entries(sp.oth).forEach(([key, v]) => {
      othKwh[key] = (othKwh[key] || 0) + v * 0.5;
      if (v > ON_KW) {
        othCount[key] = (othCount[key] || 0) + 1;
        if (s.o && s.o[key] && s.o[key].inferred) othInferred[key] = (othInferred[key] || 0) + 1;
      }
      if (v > (othPeakKw[key] || 0)) {
        othPeakKw[key] = v;
        othPeak[key] = s;
      }
    });
  });

  // biggest first, so the legend and the stack read the same way as the table
  const otherKeys = Object.keys(othKwh).sort((x, y) => othKwh[y] - othKwh[x] || x.localeCompare(y));

  return {
    miscKwh, indKwh, evKwh, totalKwh, cappedCount, minK, maxK,
    indPeak, evPeak, indCount, evCount, indPeakKw, evPeakKw, indFirst, indLast, evFirst, evLast,
    othKwh, othCount, othPeak, othPeakKw, othInferred, otherKeys,
    hasBalance, flaggedCount
  };
}

// One row per appliance (plus the unexplained remainder) for the share table.
function buildRows(a) {
  const share = (kwh) => (a.totalKwh > 0 ? kwh / a.totalKwh : 0);
  const kindOf = (key) => (key === "ac" || !a.hasBalance ? "detected" : "estimated");
  const rows = [
    {
      key: "induction", label: "Induction", color: COLORS.amber, kind: "detected",
      kwh: a.indKwh, count: a.indCount, peakKw: a.indPeakKw, peakSlot: a.indPeak
    },
    {
      key: "ev", label: "EV", color: COLORS.blue, kind: "detected",
      kwh: a.evKwh, count: a.evCount, peakKw: a.evPeakKw, peakSlot: a.evPeak
    },
    ...a.otherKeys.map((key) => ({
      key, label: applianceLabel(key), color: applianceColor(key), kind: kindOf(key),
      kwh: a.othKwh[key], count: a.othCount[key] || 0,
      peakKw: a.othPeakKw[key] || 0, peakSlot: a.othPeak[key] || null
    })),
    {
      key: MISC_KEY, label: MISC_LABEL, color: COLORS.misc, kind: "rest",
      kwh: a.miscKwh, count: null, peakKw: null, peakSlot: null
    }
  ];
  return rows
    .map((r) => ({ ...r, share: share(r.kwh) }))
    .sort((x, y) => y.kwh - x.kwh);
}

function timeLabel(first, last) {
  if (!first) return null;
  return first === last ? first : `${first} – ${last}`;
}

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------
function StatRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12, padding: "7px 0", borderBottom: `1px solid ${COLORS.border}` }}>
      <span style={{ color: COLORS.muted }}>{k}</span>
      <span style={{ fontFamily: MONO, fontWeight: 600, textAlign: "right" }}>{v}</span>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
      {title && (
        <h2 style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: COLORS.muted, margin: "0 0 12px 0", fontWeight: 600 }}>
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALL appliances and how much of the day each makes up
// ---------------------------------------------------------------------------
const ROW_GRID = {
  display: "grid",
  gridTemplateColumns: "minmax(140px, 1.5fr) 62px 52px minmax(90px, 1.6fr) 58px 92px",
  gap: 10,
  alignItems: "center"
};

function BreakdownPanel({ rows, hasBalance }) {
  const head = { fontFamily: MONO, fontSize: 10, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em" };
  return (
    <Panel title="All appliances — how much of the day each makes up">
      <div style={{ ...ROW_GRID, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}` }}>
        <span style={head}>Appliance</span>
        <span style={{ ...head, textAlign: "right" }}>kWh</span>
        <span style={{ ...head, textAlign: "right" }}>Share</span>
        <span style={head} />
        <span style={{ ...head, textAlign: "right" }}>Hours on</span>
        <span style={{ ...head, textAlign: "right" }}>Peak</span>
      </div>

      {rows.map((r) => {
        const idle = r.kwh < 0.005;
        return (
          <div key={r.key} style={{ ...ROW_GRID, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, opacity: idle ? 0.45 : 1 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flex: "0 0 auto" }} />
              {r.label}
              {r.kind === "estimated" && <span style={{ fontFamily: MONO, fontSize: 9, color: COLORS.muted, fontWeight: 400 }}>est.</span>}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 12, textAlign: "right" }}>{r.kwh.toFixed(2)}</span>
            <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, textAlign: "right" }}>
              {(r.share * 100).toFixed(r.share > 0 && r.share < 0.1 ? 1 : 0)}%
            </span>
            <span style={{ background: "#F0ECE0", borderRadius: 4, height: 8, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", background: r.color, width: `${Math.max(r.share * 100, r.kwh > 0.005 ? 1.5 : 0)}%` }} />
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: COLORS.muted, textAlign: "right" }}>
              {r.count == null ? "—" : `${(r.count * 0.5).toFixed(1)} h`}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: COLORS.muted, textAlign: "right" }}>
              {r.peakSlot && r.peakKw > 0 ? `${r.peakKw.toFixed(2)}kW ${r.peakSlot.t}` : "—"}
            </span>
          </div>
        );
      })}

      <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6, marginTop: 10 }}>
        {hasBalance
          ? "Induction, EV and AC are detected from the readings. Every other appliance (marked est.) is matched to what is left of the reading from its rating and its usual hours of the day - an estimate, not a measurement. Unexplained is whatever the meter read beyond everything matched."
          : "This output has no per-appliance balance, so only induction, EV and any equipment the model named are split out; Unexplained is everything else the meter read."}
      </div>
    </Panel>
  );
}

// One card per appliance other than induction / EV - reasoning folded in directly
function EquipCard({ row, hasBalance, inferredCount }) {
  const slot = row.peakSlot;
  const d = slot && slot.o ? slot.o[row.key] : null; // present when the MODEL named this equipment
  const idle = !slot || row.kwh < 0.005;
  return (
    <details style={{ border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", marginTop: 10, opacity: idle ? 0.55 : 1 }}>
      <summary style={{ cursor: "pointer", listStyle: "none" }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{row.label} · on in {row.count} slot{row.count === 1 ? "" : "s"}</span>
        <div style={{ fontFamily: MONO, fontSize: 11, color: COLORS.muted, marginTop: 4 }}>
          {idle ? "not on at any point in this view" : `peak ${slot.t} · ${row.peakKw.toFixed(2)}kW`}
          {d && d.n != null ? ` · ${d.n} unit${d.n === 1 ? "" : "s"}` : ""}
          {d && d.c != null ? ` · confidence ${d.c}` : ""}
          {` · ${row.kwh.toFixed(2)} kWh · ${(row.share * 100).toFixed(1)}% of the day`}
        </div>
      </summary>
      <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 8 }}>
        {d
          ? slot.r || "No reasoning recorded for this slot."
          : hasBalance
            ? "Matched from this appliance's rating and its usual hours of the day, after induction, EV and AC. An estimate, not a measurement."
            : "No detail recorded."}
        {inferredCount > 0 && (
          <div style={{ marginTop: 8, color: COLORS.muted }}>
            {inferredCount} of these slot{inferredCount === 1 ? "" : "s"} only say "+ {row.label}" in the reasoning text —
            the kW shown is the part of the reading left after induction/EV, not a figure the model stated.
          </div>
        )}
      </div>
    </details>
  );
}

// Day-level warnings from the pipeline (e.g. an over-matched day)
function DayWarningsPanel({ warnings }) {
  if (!warnings.length) return null;
  return (
    <Panel title={`Day-level warnings (${warnings.length})`}>
      {warnings.map((w, i) => (
        <div key={i} style={{ fontSize: 12, lineHeight: 1.6, color: "#B84C4C", marginBottom: 6 }}>
          ⚑ {w.date ? <b style={{ fontFamily: MONO }}>{w.date} </b> : null}
          {w.text.replace(/^DAY-LEVEL FLAG:\s*/, "")}
        </div>
      ))}
    </Panel>
  );
}

function LoadBarTooltip({ active, payload, label, series }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;

  const parts = (series || [])
    .map((s) => ({ name: s.name, v: row[s.name] || 0 }))
    .filter((p) => p.v > 0.004)
    .sort((x, y) => y.v - x.v)
    .map((p) => `${p.name} ${p.v.toFixed(2)}kW`)
    .join(" · ");

  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px", maxWidth: 340, boxShadow: "0 2px 8px rgba(0,0,0,.08)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{label} · meter {row.actual.toFixed(2)}kW</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: COLORS.muted, marginBottom: 6, lineHeight: 1.6 }}>{parts}</div>
      {row.inferred && row.inferred.length > 0 && (
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>
          {row.inferred.join(", ")} kW inferred from the reasoning text ("+ {row.inferred[0]}"), not stated by the model.
        </div>
      )}
      {row.capped && (
        <div style={{ fontSize: 11, color: "#B84C4C", marginBottom: 6 }}>
          Model claimed {row.claimed.toFixed(2)}kW in total — more than the meter read, so the bar is scaled to the reading.
        </div>
      )}
      {row.flagged && (
        <div style={{ fontSize: 11, color: "#B84C4C", marginBottom: 6 }}>⚑ this slot has a model check flag</div>
      )}
      <div style={{ fontSize: 12, lineHeight: 1.5, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 6 }}>{row.reasoning}</div>
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
  const equipment = consumers[scno].equipment || [];

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

  const dayWarnings = useMemo(() => {
    const dw = consumers[scno].dayWarnings || {};
    if (day === "__all__") {
      return Object.entries(dw).flatMap(([date, list]) => list.map((text) => ({ date, text })));
    }
    return (dw[day] || []).map((text) => ({ date: null, text }));
  }, [consumers, scno, day]);

  const a = useMemo(() => analyze(slots), [slots]);
  const rows = useMemo(() => buildRows(a), [a]);

  // stack order: Unexplained at the bottom, then appliances (biggest first), induction and EV on top
  const shown = (key) => (a.othKwh[key] || 0) > 0.004;
  const series = [
    { name: MISC_LABEL, color: COLORS.misc },
    ...a.otherKeys.filter(shown).map((key) => ({ name: applianceLabel(key), color: applianceColor(key) })),
    { name: "Induction", color: COLORS.amber },
    { name: "EV", color: COLORS.blue }
  ];

  const donutData = rows.filter((r) => r.kwh > 0.004).map((r) => ({ name: r.label, value: r.kwh, color: r.color }));

  const barData = slots.map((s) => {
    const sp = splitSlot(s);
    const row = {
      t: s.t,
      actual: s.k,
      claimed: sp.claimed,
      capped: sp.capped,
      flagged: hasFlags(s),
      inferred: Object.keys(s.o || {}).filter((key) => s.o[key].inferred).map(applianceLabel),
      [MISC_LABEL]: sp.misc,
      Induction: sp.ind,
      EV: sp.ev,
      reasoning: s.r || "No reasoning recorded for this slot."
    };
    a.otherKeys.forEach((key) => { row[applianceLabel(key)] = sp.oth[key] || 0; });
    return row;
  });

  const applianceRows = rows.filter((r) => r.key !== MISC_KEY);
  const largest = applianceRows.reduce((x, y) => (y.kwh > x.kwh ? y : x), applianceRows[0]);
  const activeCount = applianceRows.filter((r) => r.kwh > 0.004).length;
  const miscRow = rows.find((r) => r.key === MISC_KEY);
  const otherRows = rows.filter((r) => r.key !== "induction" && r.key !== "ev" && r.key !== MISC_KEY);

  function handleSelectConsumer(newScno) {
    setScno(newScno);
    setDay(Object.keys(consumers[newScno].days)[0]);
  }

  return (
    <div style={{ background: COLORS.bg, color: COLORS.text, fontFamily: "system-ui, -apple-system, sans-serif", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: 20 }}>
        <header style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16, marginBottom: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.16em", color: COLORS.teal, textTransform: "uppercase", marginBottom: 6 }}>
            Load Signature Console
          </div>
          <h1 style={{ fontSize: 22, margin: 0, fontWeight: 700 }}>Appliance Attribution Dashboard</h1>
          <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 6, maxWidth: 760, lineHeight: 1.6 }}>
            Half-hourly power readings split across every appliance in the consumer's survey — induction, EV, AC,
            tube lights, fans, fridge, TV and the rest — with whatever the meter read beyond them shown as unexplained.
          </div>
        </header>

        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label htmlFor="consumer-file-input" style={{ background: COLORS.teal, color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
            Add consumer JSON file(s)
          </label>
          <input id="consumer-file-input" type="file" accept="application/json,.json" multiple
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
          <span style={{ fontSize: 12, color: COLORS.muted }}>
            Drop in one or more <code>results/&lt;scno&gt;.json</code> or <code>*_manual_filled_days.json</code> files —
            each is parsed and added by its own <code>scno</code>, no code editing needed.
          </span>
          {fileError && <span style={{ fontSize: 12, color: "#B84C4C" }}>{fileError}</span>}
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
          {Object.keys(consumers).map((id) => {
            const active = id === scno;
            return (
              <button
                key={id}
                onClick={() => handleSelectConsumer(id)}
                style={{
                  fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.03em",
                  padding: "9px 16px", borderRadius: 8, cursor: "pointer",
                  border: `1px solid ${active ? COLORS.amber : COLORS.border}`,
                  background: active ? COLORS.amber : COLORS.panel,
                  color: active ? "#fff" : COLORS.text,
                  whiteSpace: "nowrap"
                }}
              >
                {consumers[id].name}
              </button>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", margin: "0 0 16px 0", alignItems: "center" }}>
          <label style={{ fontFamily: MONO, fontSize: 11, color: COLORS.muted, textTransform: "uppercase", marginRight: 6 }}>Day</label>
          <select value={day} onChange={(e) => setDay(e.target.value)} style={selectStyle}>
            {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            {dayOptions.length > 1 && <option value="__all__">All days (combined)</option>}
          </select>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, alignItems: "start" }}>
          <div>
            <BreakdownPanel rows={rows} hasBalance={a.hasBalance} />

            <Panel title="Energy split — every appliance vs. unexplained">
              <div style={{ height: 280 }}>
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

            <Panel title="Half-hourly load — stacked by appliance">
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    <CartesianGrid stroke="#EFEBE0" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: COLORS.muted }} interval={5} />
                    <YAxis tick={{ fontSize: 10, fill: COLORS.muted }} label={{ value: "kW", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                    <Tooltip content={<LoadBarTooltip series={series} />} />
                    <Legend />
                    {series.map((s) => <Bar key={s.name} dataKey={s.name} stackId="s" fill={s.color} radius={[1, 1, 0, 0]} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Panel>
          </div>

          <div>
            <Panel title="Day summary">
              <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
                <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: COLORS.teal }}>{a.totalKwh.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
                  Total kWh, {day === "__all__" ? "all days" : "this day"}
                </div>
              </div>
              <StatRow k="Readings sampled" v={`${slots.length} half-hour slots`} />
              <StatRow k="Power range" v={`${a.minK.toFixed(2)}–${a.maxK.toFixed(2)} kW`} />
              <StatRow k="Appliances on" v={`${activeCount} of ${applianceRows.length}`} />
              <StatRow k="Largest appliance" v={`${largest.label} (${largest.kwh.toFixed(2)} kWh)`} />
              <StatRow k="Unexplained" v={`${miscRow.kwh.toFixed(2)} kWh (${(miscRow.share * 100).toFixed(0)}%)`} />
              {a.cappedCount > 0 && <StatRow k="Claims above meter reading" v={`${a.cappedCount} slots (scaled down)`} />}
              {a.flaggedCount > 0 && <StatRow k="Slots with a model flag" v={a.flaggedCount} />}
              <StatRow k="Induction events" v={a.indCount} />
              {timeLabel(a.indFirst, a.indLast) && <StatRow k="Induction time" v={timeLabel(a.indFirst, a.indLast)} />}
              {timeLabel(a.evFirst, a.evLast) && <StatRow k="EV time" v={timeLabel(a.evFirst, a.evLast)} />}
            </Panel>

            {equipment.length > 0 && (
              <Panel title="Equipment on record">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {equipment.map((eq) => (
                    <span key={eq.label} style={{
                      fontFamily: MONO, fontSize: 11, background: "#F0ECE0", color: COLORS.text,
                      borderRadius: 6, padding: "4px 9px", border: `1px solid ${COLORS.border}`
                    }}>
                      {eq.label} <b>× {eq.qty}</b>
                    </span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.6, marginTop: 10 }}>
                  From the household's equipment survey — the basis for every ceiling and estimate on this page.
                </div>
              </Panel>
            )}

            <DayWarningsPanel warnings={dayWarnings} />

            {otherRows.length > 0 && (
              <Panel title={`Other appliances (${otherRows.length})`}>
                {otherRows.map((r) => (
                  <EquipCard key={r.key} row={r} hasBalance={a.hasBalance} inferredCount={a.othInferred[r.key] || 0} />
                ))}
              </Panel>
            )}

            <Panel>
              <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
                <b style={{ color: COLORS.text }}>Reading these numbers:</b> each bar is one half-hour of the meter reading, split
                across every appliance. Induction, EV and AC are detected from the readings; the rest are matched from each
                appliance's rating and usual hours. "Unexplained" is whatever the meter read beyond all of them — it is not a
                separate measured circuit.
                <br /><br />
                <b style={{ color: COLORS.text }}>Scaled bars:</b> if a slot's claims add up to more than the meter read, the bar is
                scaled to the reading and the tooltip shows what was originally claimed.
                <br /><br />
                <b style={{ color: COLORS.text }}>Flagged slots:</b> hover any bar in the chart above — a slot the automatic checks
                flagged is marked directly in its tooltip.
              </div>
            </Panel>
          </div>
        </div>

        <footer style={{ marginTop: 24, color: COLORS.muted, fontSize: 11, textAlign: "center", fontFamily: MONO }}>
          LOAD SIGNATURE CONSOLE
        </footer>
      </div>
    </div>
  );
}

// exported for testing
export { splitSlot, analyze, buildRows, applianceLabel, applianceColor };

const selectStyle = {
  background: COLORS.panel,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.text,
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  minWidth: 200
};