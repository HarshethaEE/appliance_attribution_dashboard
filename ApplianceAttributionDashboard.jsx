import React, { useState, useMemo } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { INITIAL_CONSUMERS, mergeConsumer } from "./consumerData";

// ---------------------------------------------------------------------------
// Colors (light theme) - matches the companion Consumer Load Analyzer app
// ---------------------------------------------------------------------------
const COLORS = {
  bg: "#FFFFFF", panel: "#FFFFFF", border: "#E6E3DA", soft: "#F7F6F2",
  text: "#26241E", muted: "#8A8473",
  teal: "#1E8A7A", amber: "#C77A2B", blue: "#3E6FA8", misc: "#C9C4B4"
};
const SANS = "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const NUM = { fontVariantNumeric: "tabular-nums" };

const MISC_LABEL = "Unexplained";
const MISC_KEY = "__unexplained";
const ON_KW = 0.01; // an appliance counts as "on" in a slot above this

// Which consumer / day opens first (falls back to the first consumer / day if not present)
const DEFAULT_SCNO = "112206A806395345"; // NAVYA INFRACON PROJECTS PVT LTD
const DEFAULT_DAY = "2026-07-02";
const START_SCNO = INITIAL_CONSUMERS[DEFAULT_SCNO] ? DEFAULT_SCNO : Object.keys(INITIAL_CONSUMERS)[0];
const START_DAYS = Object.keys(INITIAL_CONSUMERS[START_SCNO].days).sort();
const START_DAY = START_DAYS.includes(DEFAULT_DAY) ? DEFAULT_DAY : START_DAYS[0];

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
  let peakT = null;
  let hasBalance = false;
  let flaggedCount = 0;

  const othKwh = {}, othCount = {}, othPeak = {}, othPeakKw = {}, othInferred = {};

  slots.forEach((s) => {
    const sp = splitSlot(s);
    if (s.b) hasBalance = true;
    if (hasFlags(s)) flaggedCount += 1;

    minK = Math.min(minK, s.k);
    if (s.k > maxK) { maxK = s.k; peakT = s.t; }
    totalKwh += s.k * 0.5;
    miscKwh += sp.misc * 0.5;
    indKwh += sp.ind * 0.5;
    evKwh += sp.ev * 0.5;
    if (sp.capped) cappedCount += 1;

    if (sp.ind > ON_KW) { indCount += 1; if (!indFirst || s.t < indFirst) indFirst = s.t; if (!indLast || s.t > indLast) indLast = s.t; }
    if (sp.ev > ON_KW) { evCount += 1; if (!evFirst || s.t < evFirst) evFirst = s.t; if (!evLast || s.t > evLast) evLast = s.t; }
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
    miscKwh, indKwh, evKwh, totalKwh, cappedCount, minK, maxK, peakT,
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
// Styles shared by the pieces below
// ---------------------------------------------------------------------------
const CSS = `
.asd-root, .asd-root * { box-sizing: border-box; }
.asd-root { font-family: ${SANS}; color: ${COLORS.text}; background: ${COLORS.bg}; min-height: 100vh; }
.asd-wrap { max-width: 1320px; margin: 0 auto; padding: 24px 28px 40px; }
.asd-kpis { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 16px; }
.asd-grid { display: grid; grid-template-columns: minmax(0, 1fr) 372px; gap: 16px; align-items: start; }
.asd-select { height: 40px; min-width: 260px; padding: 0 36px 0 12px; border: 1px solid ${COLORS.border}; border-radius: 8px;
  background: #fff url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1.5l5 5 5-5' fill='none' stroke='%238A8473' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/></svg>") no-repeat right 12px center;
  color: ${COLORS.text}; font: 500 14px ${SANS}; appearance: none; -webkit-appearance: none; cursor: pointer; }
.asd-select:hover { border-color: #CFC9B8; }
.asd-select:focus { outline: 2px solid ${COLORS.teal}33; border-color: ${COLORS.teal}; }
.asd-btn { height: 40px; padding: 0 16px; border: 0; border-radius: 8px; background: ${COLORS.teal}; color: #fff; font: 600 13px ${SANS};
  display: inline-flex; align-items: center; cursor: pointer; white-space: nowrap; }
.asd-btn:hover { filter: brightness(0.94); }
.asd-chip { display: inline-flex; align-items: center; gap: 7px; padding: 5px 12px; border-radius: 999px; border: 1px solid ${COLORS.border};
  background: #fff; color: ${COLORS.text}; font: 500 12px ${SANS}; cursor: pointer; transition: opacity .12s, background .12s, border-color .12s; }
.asd-chip:hover { background: ${COLORS.soft}; border-color: #CFC9B8; }
.asd-chip:focus-visible { outline: 2px solid ${COLORS.teal}; outline-offset: 2px; }
.asd-link { border: 0; background: none; color: ${COLORS.teal}; font: 600 12px ${SANS}; cursor: pointer; padding: 5px 4px; }
.asd-link:hover { text-decoration: underline; }
.asd-details > summary { list-style: none; cursor: pointer; }
.asd-details > summary::-webkit-details-marker { display: none; }
@media (max-width: 1060px) { .asd-grid { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 860px) { .asd-kpis { grid-template-columns: repeat(2, minmax(0, 1fr)); } .asd-wrap { padding: 16px; } }
.asd-ctx { margin-left: auto; text-align: right; }
@media (max-width: 640px) {
  .asd-row { grid-template-columns: minmax(0, 1fr) 58px 54px !important; min-width: 0 !important; column-gap: 10px !important; }
  .asd-row > :nth-child(n+4) { display: none !important; }
}
.asd-donut { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
@media (max-width: 860px) { .asd-ctx { margin-left: 0; text-align: left; width: 100%; } }
@media (max-width: 480px) { .asd-field, .asd-field .asd-select { width: 100% !important; min-width: 0 !important; } }
`;

const fieldLabel = {
  display: "block", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
  textTransform: "uppercase", color: COLORS.muted, marginBottom: 6
};

// ---------------------------------------------------------------------------
// Small presentational pieces
// ---------------------------------------------------------------------------
function StatRow({ k, v, last }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16,
      fontSize: 13, padding: "9px 0", borderBottom: last ? "none" : `1px solid ${COLORS.border}`
    }}>
      <span style={{ color: COLORS.muted }}>{k}</span>
      <span style={{ fontWeight: 600, textAlign: "right", ...NUM }}>{v}</span>
    </div>
  );
}

function Panel({ title, subtitle, children, style }) {
  return (
    <section style={{
      background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "18px 20px", marginBottom: 16, boxShadow: "0 1px 3px rgba(38,36,30,0.07)", ...style
    }}>
      {title && (
        <header style={{ marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 650, letterSpacing: "-0.005em", color: COLORS.text }}>{title}</h2>
          {subtitle && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3, lineHeight: 1.5 }}>{subtitle}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

function KpiCard({ label, value, unit, sub, accent }) {
  return (
    <div style={{
      position: "relative", overflow: "hidden", background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12,
      padding: "18px 20px 16px", boxShadow: "0 1px 3px rgba(38,36,30,0.07)"
    }}>
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: accent }} />
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: COLORS.muted }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", ...NUM }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 500 }}>{unit}</span>}
      </div>
      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 6, minHeight: 16 }}>{sub}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ALL appliances and how much of the day each makes up
// ---------------------------------------------------------------------------
const ROW_GRID = {
  display: "grid",
  gridTemplateColumns: "minmax(150px, 1.4fr) 64px 56px minmax(80px, 1.4fr) 64px 112px",
  columnGap: 14,
  alignItems: "center",
  minWidth: 560
};

function BreakdownPanel({ rows, hasBalance }) {
  const head = { fontSize: 11, fontWeight: 600, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.07em" };
  const right = { textAlign: "right", ...NUM };
  return (
    <Panel title="Appliance breakdown" subtitle="How much of the day's energy each appliance accounts for">
      <div style={{ overflowX: "auto" }}>
        <div className="asd-row" style={{ ...ROW_GRID, padding: "0 0 10px", borderBottom: `1px solid ${COLORS.border}` }}>
          <span style={head}>Appliance</span>
          <span style={{ ...head, ...right }}>kWh</span>
          <span style={{ ...head, ...right }}>Share</span>
          <span style={head} />
          <span style={{ ...head, ...right }}>Hours</span>
          <span style={{ ...head, ...right }}>Peak</span>
        </div>

        {rows.map((r, i) => {
          const idle = r.kwh < 0.005;
          return (
            <div key={r.key} className="asd-row" style={{
              ...ROW_GRID, padding: "11px 0", opacity: idle ? 0.45 : 1,
              borderBottom: i === rows.length - 1 ? "none" : `1px solid ${COLORS.border}`
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, minWidth: 0 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: r.color, flex: "0 0 auto" }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
                {r.kind === "estimated" && (
                  <span style={{ fontSize: 10, fontWeight: 500, color: COLORS.muted, background: COLORS.soft, border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "1px 5px" }}>est.</span>
                )}
              </span>
              <span style={{ fontSize: 13, ...right }}>{r.kwh.toFixed(2)}</span>
              <span style={{ fontSize: 13, fontWeight: 700, ...right }}>
                {(r.share * 100).toFixed(r.share > 0 && r.share < 0.1 ? 1 : 0)}%
              </span>
              <span style={{ background: "#EFEBDF", borderRadius: 4, height: 8, overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", background: r.color, borderRadius: 4, width: `${Math.max(r.share * 100, r.kwh > 0.005 ? 1.5 : 0)}%` }} />
              </span>
              <span style={{ fontSize: 12, color: COLORS.muted, ...right }}>
                {r.count == null ? "—" : `${(r.count * 0.5).toFixed(1)} h`}
              </span>
              <span style={{ fontSize: 12, color: COLORS.muted, ...right }}>
                {r.peakSlot && r.peakKw > 0 ? `${r.peakKw.toFixed(2)} kW · ${r.peakSlot.t}` : "—"}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
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
    <details className="asd-details" style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "11px 14px", marginTop: 10, opacity: idle ? 0.6 : 1, background: COLORS.soft }}>
      <summary>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: row.color, flex: "0 0 auto" }} />
          <span style={{ flex: 1, minWidth: 0 }}>{row.label}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.muted }}>{row.count} slot{row.count === 1 ? "" : "s"}</span>
        </div>
        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 5, lineHeight: 1.5, ...NUM }}>
          {idle ? "Not on at any point in this view" : `Peak ${row.peakKw.toFixed(2)} kW at ${slot.t}`}
          {d && d.n != null ? ` · ${d.n} unit${d.n === 1 ? "" : "s"}` : ""}
          {d && d.c != null ? ` · confidence ${d.c}` : ""}
          {` · ${row.kwh.toFixed(2)} kWh (${(row.share * 100).toFixed(1)}%)`}
        </div>
      </summary>
      <div style={{ fontSize: 12, lineHeight: 1.6, marginTop: 10, borderTop: `1px dashed ${COLORS.border}`, paddingTop: 10, color: COLORS.text }}>
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
        <div key={i} style={{
          fontSize: 12, lineHeight: 1.6, color: "#8F3A3A", background: "#FBEFEE", border: "1px solid #F0D3D0",
          borderRadius: 8, padding: "8px 10px", marginTop: i ? 8 : 0
        }}>
          {w.date ? <b style={NUM}>{w.date} · </b> : null}
          {w.text.replace(/^DAY-LEVEL FLAG:\s*/, "")}
        </div>
      ))}
    </Panel>
  );
}

// Clickable legend: click to show only that appliance, click more to add them,
// click a selected one to remove it, "Show all" to reset.
function ChartLegend({ series, selected, onToggle, onClear }) {
  const anySel = selected.length > 0;
  return (
    <div role="group" aria-label="Filter chart by appliance" style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", paddingTop: 14 }}>
      {series.map((s) => {
        const isSel = selected.includes(s.name);
        return (
          <button key={s.name} type="button" className="asd-chip" aria-pressed={isSel} onClick={() => onToggle(s.name)}
            style={{
              opacity: anySel && !isSel ? 0.45 : 1,
              borderColor: isSel ? s.color : undefined,
              background: isSel ? `${s.color}1F` : undefined,
              fontWeight: isSel ? 650 : 500
            }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: s.color, flex: "0 0 auto" }} />
            {s.name}
          </button>
        );
      })}
      {anySel && <button type="button" className="asd-link" onClick={onClear}>Show all</button>}
    </div>
  );
}

function LoadBarTooltip({ active, payload, label, series }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;

  const parts = (series || [])
    .map((s) => ({ name: s.name, color: s.color, v: row[s.name] || 0 }))
    .filter((p) => p.v > 0.004)
    .sort((x, y) => y.v - x.v);

  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", width: 320, boxShadow: "0 6px 20px rgba(38,36,30,.12)", fontFamily: SANS }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
        <span>{label}</span>
        <span style={NUM}>{row.actual.toFixed(2)} kW</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto", rowGap: 3, columnGap: 12, fontSize: 12 }}>
        {parts.map((p) => (
          <React.Fragment key={p.name}>
            <span style={{ display: "flex", alignItems: "center", gap: 7, color: COLORS.text }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />{p.name}
            </span>
            <span style={{ textAlign: "right", color: COLORS.muted, ...NUM }}>{p.v.toFixed(2)} kW</span>
          </React.Fragment>
        ))}
      </div>
      {row.inferred && row.inferred.length > 0 && (
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>
          {row.inferred.join(", ")} kW inferred from the reasoning text ("+ {row.inferred[0]}"), not stated by the model.
        </div>
      )}
      {row.capped && (
        <div style={{ fontSize: 11, color: "#8F3A3A", marginTop: 8 }}>
          Model claimed {row.claimed.toFixed(2)} kW in total — more than the meter read, so the bar is scaled to the reading.
        </div>
      )}
      {row.flagged && <div style={{ fontSize: 11, color: "#8F3A3A", marginTop: 8 }}>⚑ This slot has a model check flag</div>}
      <div style={{ fontSize: 12, lineHeight: 1.5, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8, marginTop: 10, color: COLORS.muted }}>{row.reasoning}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ApplianceAttributionDashboard() {
  const [consumers, setConsumers] = useState(INITIAL_CONSUMERS);
  const [scno, setScno] = useState(START_SCNO);
  const [day, setDay] = useState(START_DAY);
  const [fileError, setFileError] = useState(null);
  const [picked, setPicked] = useState([]); // appliance names isolated in the chart legend

  const dayOptions = Object.keys(consumers[scno].days).sort();
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
          setPicked([]);
          setScno(lastScno);
          setDay(Object.keys(next[lastScno].days).sort()[0]);
        }
        if (errors.length) setFileError(errors.join(" · "));
      })
      .catch((err) => setFileError(err.message || "Could not read the selected file(s)."));
  }

  const slots = useMemo(() => {
    if (day === "__all__") { const dd = consumers[scno].days; return Object.keys(dd).sort().flatMap((d) => dd[d]); }
    return consumers[scno].days[day] || [];
  }, [consumers, scno, day]);

  const slotDates = useMemo(() => {
    if (day === "__all__") { const dd = consumers[scno].days; return Object.keys(dd).sort().flatMap((d) => dd[d].map(() => d)); }
    return slots.map(() => day);
  }, [consumers, scno, day, slots]);

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

  // keep only picks that exist in this view; none picked (or none valid) = show everything
  const seriesNames = series.map((x) => x.name);
  const selected = picked.filter((n) => seriesNames.includes(n));
  const visibleSeries = selected.length ? series.filter((x) => selected.includes(x.name)) : series;
  const togglePick = (name) => setPicked((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));

  const donutData = rows.filter((r) => r.kwh > 0.004).map((r) => ({ name: r.label, value: r.kwh, color: r.color }));

  const barData = slots.map((s, i) => {
    const sp = splitSlot(s);
    const row = {
      t: s.t,
      x: day === "__all__" ? `${slotDates[i]} ${s.t}` : s.t,
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

  // round y-axis ticks from the tallest FULL stack, so the scale stays fixed when the legend filters
  const stackMax = Math.max(0.1, ...barData.map((r) => series.reduce((t, x) => t + (r[x.name] || 0), 0)));
  const yStep = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 50].find((st) => stackMax / st <= 6) || 100;
  const yTicks = Array.from({ length: Math.ceil(stackMax / yStep - 1e-9) + 1 }, (_, i) => +(i * yStep).toFixed(2));

  const applianceRows = rows.filter((r) => r.key !== MISC_KEY);
  const largest = applianceRows.reduce((x, y) => (y.kwh > x.kwh ? y : x), applianceRows[0]);
  const activeCount = applianceRows.filter((r) => r.kwh > 0.004).length;
  const miscRow = rows.find((r) => r.key === MISC_KEY);
  const otherRows = rows.filter((r) => r.key !== "induction" && r.key !== "ev" && r.key !== MISC_KEY);
  const indTime = timeLabel(a.indFirst, a.indLast);
  const evTime = timeLabel(a.evFirst, a.evLast);
  const dayLabel = day === "__all__" ? "All days combined" : day;
  const peakIdx = slots.findIndex((s) => s.k === a.maxK);
  const peakWhen = peakIdx < 0 ? "—" : day === "__all__" ? `${slotDates[peakIdx].slice(5)} ${slots[peakIdx].t}` : slots[peakIdx].t;
  const allDayTicks = barData.filter((r) => r.t === "00:00").map((r) => r.x);

  function handleSelectConsumer(newScno) {
    setPicked([]); // appliances differ between consumers, so start unfiltered
    setScno(newScno);
    setDay(Object.keys(consumers[newScno].days).sort()[0]);
  }

  return (
    <div className="asd-root">
      <style>{CSS}</style>
      <div className="asd-wrap">
        {/* ------------------------------------------------ header */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20, flexWrap: "wrap", paddingBottom: 18, borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: COLORS.teal, marginBottom: 6 }}>Load Signature Console</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>Appliance Attribution Dashboard</h1>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: COLORS.muted, maxWidth: 720, lineHeight: 1.55 }}>
              Half-hourly meter readings split across every appliance in the consumer's survey, with whatever the meter read beyond them shown as unexplained.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
            <label htmlFor="consumer-file-input" className="asd-btn">Add consumer JSON</label>
            <input id="consumer-file-input" type="file" accept="application/json,.json" multiple
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} style={{ display: "none" }} />
            <span style={{ fontSize: 11, color: COLORS.muted }}>Accepts <code>results/&lt;scno&gt;.json</code> files</span>
          </div>
        </header>
        {fileError && (
          <div style={{ fontSize: 13, color: "#8F3A3A", background: "#FBEFEE", border: "1px solid #F0D3D0", borderRadius: 8, padding: "9px 12px", marginBottom: 16 }}>{fileError}</div>
        )}

        {/* ------------------------------------------------ selectors */}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 18 }}>
          <div className="asd-field">
            <label htmlFor="consumer-select" style={fieldLabel}>Consumer</label>
            <select id="consumer-select" className="asd-select" value={scno} onChange={(e) => handleSelectConsumer(e.target.value)} style={{ minWidth: 340 }}>
              {Object.keys(consumers).sort((x, y) => (x === DEFAULT_SCNO ? -1 : y === DEFAULT_SCNO ? 1 : 0)).map((id) => (
                <option key={id} value={id}>{consumers[id].name}</option>
              ))}
            </select>
          </div>
          <div className="asd-field">
            <label htmlFor="day-select" style={fieldLabel}>Day</label>
            <select id="day-select" className="asd-select" value={day} onChange={(e) => setDay(e.target.value)}>
              {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
              {dayOptions.length > 1 && <option value="__all__">All days (combined)</option>}
            </select>
          </div>
          <div className="asd-ctx" style={{ paddingBottom: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 650 }}>{consumers[scno].name}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, ...NUM }}>Service no. {scno} · {dayLabel}</div>
          </div>
        </div>

        {/* ------------------------------------------------ KPI row */}
        <div className="asd-kpis">
          <KpiCard label="Total energy" value={a.totalKwh.toFixed(1)} unit="kWh" accent={COLORS.teal}
            sub={`${slots.length} half-hour readings`} />
          <KpiCard label="Peak demand" value={a.maxK.toFixed(2)} unit="kW" accent="#8A8473"
            sub={`at ${peakWhen} · low ${a.minK.toFixed(2)} kW`} />
          <KpiCard label="Induction" value={a.indKwh.toFixed(2)} unit="kWh" accent={COLORS.amber}
            sub={indTime ? `${a.indCount} slot${a.indCount === 1 ? "" : "s"} · ${indTime}` : "No activity detected"} />
          <KpiCard label="EV charging" value={a.evKwh.toFixed(2)} unit="kWh" accent={COLORS.blue}
            sub={evTime ? `${a.evCount} slot${a.evCount === 1 ? "" : "s"} · ${evTime}` : "No activity detected"} />
        </div>

        {/* ------------------------------------------------ main grid */}
        <div className="asd-grid">
          <div style={{ minWidth: 0 }}>
            <Panel title="Half-hourly load" subtitle={selected.length ? `Showing only ${selected.join(", ")} · click a legend item to add or remove it` : "Each bar is one half-hour of the meter reading, stacked by appliance · click a legend item to isolate it"}>
              <div style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#EFEBE0" vertical={false} />
                    <XAxis dataKey="x" tick={{ fontSize: 11, fill: COLORS.muted }} {...(day === "__all__" ? { ticks: allDayTicks, interval: 0, tickFormatter: (v) => v.slice(5, 10) } : { ticks: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"], interval: 0 })} tickLine={false} axisLine={{ stroke: COLORS.border }} />
                    <YAxis ticks={yTicks} domain={[0, yTicks[yTicks.length - 1]]} allowDecimals tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} axisLine={false} width={44}
                      label={{ value: "kW", angle: -90, position: "insideLeft", fill: COLORS.muted, fontSize: 11, offset: 12 }} />
                    <Tooltip content={<LoadBarTooltip series={visibleSeries} />} cursor={{ fill: "rgba(38,36,30,0.04)" }} />
                    {visibleSeries.map((s) => <Bar key={s.name} dataKey={s.name} stackId="s" fill={s.color} isAnimationActive={false} />)}
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartLegend series={series} selected={selected} onToggle={togglePick} onClear={() => setPicked([])} />
            </Panel>

            <BreakdownPanel rows={rows} hasBalance={a.hasBalance} />

            <Panel title="Energy split" subtitle="Share of the day's kWh by appliance">
              <div className="asd-donut">
                <div style={{ position: "relative", width: 250, height: 250, flex: "0 0 auto", margin: "0 auto" }}>
                  <PieChart width={250} height={250}>
                    <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={78} outerRadius={115}
                      paddingAngle={2} stroke="#fff" isAnimationActive={false}>
                      {donutData.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => v.toFixed(2) + " kWh"} />
                  </PieChart>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", ...NUM }}>{a.totalKwh.toFixed(1)}</span>
                    <span style={{ fontSize: 12, color: COLORS.muted }}>kWh total</span>
                  </div>
                </div>
                <div style={{ flex: "1 1 220px", minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", columnGap: 24, rowGap: 2 }}>
                  {donutData.map((d) => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13, padding: "6px 0" }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flex: "0 0 auto" }} />
                      <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</span>
                      <span style={{ fontWeight: 600, ...NUM }}>{a.totalKwh > 0 ? ((d.value / a.totalKwh) * 100).toFixed(d.value / a.totalKwh < 0.1 ? 1 : 0) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </Panel>
          </div>

          <div style={{ minWidth: 0 }}>
            <Panel title="Day summary">
              <StatRow k="Readings sampled" v={`${slots.length} slots`} />
              <StatRow k="Power range" v={`${a.minK.toFixed(2)} – ${a.maxK.toFixed(2)} kW`} />
              <StatRow k="Appliances on" v={`${activeCount} of ${applianceRows.length}`} />
              <StatRow k="Largest appliance" v={`${largest.label} · ${largest.kwh.toFixed(2)} kWh`} />
              <StatRow k="Unexplained" v={`${miscRow.kwh.toFixed(2)} kWh (${(miscRow.share * 100).toFixed(0)}%)`} />
              <StatRow k="Induction events" v={a.indCount} />
              {indTime && <StatRow k="Induction time" v={indTime} />}
              {evTime && <StatRow k="EV time" v={evTime} />}
              {a.cappedCount > 0 && <StatRow k="Claims above meter reading" v={`${a.cappedCount} slots (scaled)`} />}
              <StatRow k="Slots with a model flag" v={a.flaggedCount} last />
            </Panel>

            {equipment.length > 0 && (
              <Panel title="Equipment on record" subtitle="From the household's equipment survey">
                <div>
                  {equipment.map((eq, i) => (
                    <div key={eq.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 13, padding: "9px 0",
                      borderBottom: i === equipment.length - 1 ? "none" : `1px solid ${COLORS.border}`
                    }}>
                      <span>{eq.label}</span>
                      <span style={{ fontWeight: 600, ...NUM }}>× {eq.qty}</span>
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            <DayWarningsPanel warnings={dayWarnings} />

            {otherRows.length > 0 && (
              <Panel title={`Other appliances (${otherRows.length})`} subtitle="Expand a row for detail">
                {otherRows.map((r) => (
                  <EquipCard key={r.key} row={r} hasBalance={a.hasBalance} inferredCount={a.othInferred[r.key] || 0} />
                ))}
              </Panel>
            )}

            <Panel title="Reading these numbers">
              <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.65 }}>
                Induction, EV and AC are detected from the readings; the rest are matched from each appliance's rating and usual hours.
                "Unexplained" is whatever the meter read beyond all of them — it is not a separate measured circuit.
                <br /><br />
                If a slot's claims add up to more than the meter read, its bar is scaled to the reading and the tooltip shows what was
                originally claimed. Slots the automatic checks flagged are marked in the tooltip.
              </div>
            </Panel>
          </div>
        </div>

        <footer style={{ marginTop: 28, paddingTop: 16, borderTop: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, textAlign: "center" }}>
          Load Signature Console
        </footer>
      </div>
    </div>
  );
}

// exported for testing
export { splitSlot, analyze, buildRows, applianceLabel, applianceColor };