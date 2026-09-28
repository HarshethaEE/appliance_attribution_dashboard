// =============================================================================
// consumerData.js
// All consumer output lives here, separate from the dashboard component.
// =============================================================================

// ---------------------------------------------------------------------------
// Pre-loaded consumers, already normalized into the compact internal shape:
// each slot is {t: "HH:MM", k: totalKw, i?: {a, tr}, e?: {a, tr}, r?: reasoning, fl?: true}
// ---------------------------------------------------------------------------
const SEED_CONSUMERS = {
"1122051212397660": {
  name: "Consumer 1122051212397660",
  days: {
"2026-06-04":[
{t:"00:00",k:13.076,fl:true,r:"kw=13.076 vs typical=2.433. Excess ~10.6kW exceeds AC ceiling (7.2kW). Starts high, continues to 23:30 (12.33kW). Matches ev class (6.3-7.6kW) plus AC. Active=true."},
{t:"00:30",k:11.676,e:{a:6.5,tr:"recurring"},r:"kw=11.676 vs typical=2.16. Excess ~9.5kW. Continues from 23:30. Matches ev class + AC. Active=true."},
{t:"01:00",k:10.424,e:{a:6.5,tr:"recurring"},r:"kw=10.424 vs typical=2.208. Excess ~8.2kW. Continues from 00:30. Matches ev class + AC. Active=true."},
{t:"01:30",k:10.67,e:{a:6.5,tr:"recurring"},r:"kw=10.67 vs typical=2.148. Excess ~8.5kW. Continues from 01:00. Matches ev class + AC. Active=true."},
{t:"02:00",k:10.696,e:{a:6.5,tr:"recurring"},r:"kw=10.696 vs typical=2.065. Excess ~8.6kW. Continues from 01:30. Matches ev class + AC. Active=true."},
{t:"02:30",k:10.424,e:{a:6.5,tr:"recurring"},r:"kw=10.424 vs typical=1.938. Excess ~8.5kW. Continues from 02:00. Matches ev class + AC. Active=true."},
{t:"03:00",k:10.12,e:{a:6.5,tr:"recurring"},r:"kw=10.12 vs typical=1.928. Excess ~8.2kW. Continues from 02:30. Matches ev class + AC. Active=true."},
{t:"03:30",k:9.876,e:{a:6.5,tr:"recurring"},r:"kw=9.876 vs typical=1.911. Excess ~8.0kW. Continues from 03:00. Matches ev class + AC. Active=true."},
{t:"04:00",k:4.288,r:"kw=4.288 vs typical=1.876. Excess ~2.4kW. Below ev class. No cook window. Active=false."},
{t:"04:30",k:3.068,r:"kw=3.068 vs typical=1.859. Excess ~1.2kW. Below ev class. No cook window. Active=false."},
{t:"05:00",k:2.996,r:"kw=2.996 vs typical=1.888. Excess ~1.1kW. Below ev class. No cook window. Active=false."},
{t:"05:30",k:3.092,r:"kw=3.092 vs typical=1.847. Excess ~1.2kW. Below ev class. No cook window. Active=false."},
{t:"06:00",k:2.982,r:"kw=2.982 vs typical=1.759. Excess ~1.2kW. Below ev class. Outside cook window start. Active=false."},
{t:"06:30",k:3.43,r:"kw=3.43 vs typical=1.751. Excess ~1.7kW. Below ev class. Outside cook window. Active=false."},
{t:"07:00",k:3.18,r:"kw=3.18 vs typical=1.783. Excess ~1.4kW. Below ev class. Outside cook window. Active=false."},
{t:"07:30",k:2.506,r:"kw=2.506 vs typical=1.738. Excess ~0.8kW. Below ev class. Outside cook window. Active=false."},
{t:"08:00",k:2.218,r:"kw=2.218 vs typical=1.635. Excess ~0.6kW. Below ev class. Outside cook window. Active=false."},
{t:"08:30",k:2.24,r:"kw=2.24 vs typical=1.517. Excess ~0.7kW. Below ev class. Outside cook window. Active=false."},
{t:"09:00",k:2.308,r:"kw=2.308 vs typical=1.523. Excess ~0.8kW. Below ev class. Outside cook window. Active=false."},
{t:"09:30",k:2.398,r:"kw=2.398 vs typical=1.475. Excess ~0.9kW. Below ev class. Outside cook window. Active=false."},
{t:"10:00",k:4.302,r:"kw=4.302 vs typical=1.459. Excess ~2.8kW. Below ev class. Outside cook window. Active=false."},
{t:"10:30",k:2.668,r:"kw=2.668 vs typical=1.348. Excess ~1.3kW. Below ev class. Outside cook window. Active=false."},
{t:"11:00",k:3.656,i:{a:2.0,tr:"recurring"},r:"kw=3.656 vs typical=1.389. Excess ~2.3kW. Inside cook window 11:00-15:00. Matches induction rating. Active=true."},
{t:"11:30",k:2.526,r:"kw=2.526 vs typical=1.072. Excess ~1.5kW. Below ev class. Outside cook window. Active=false."},
{t:"12:00",k:2.482,r:"kw=2.482 vs typical=1.119. Excess ~1.4kW. Below ev class. Outside cook window. Active=false."},
{t:"12:30",k:0.908,r:"kw=0.908 vs typical=0.969. Near typical. No excess. Active=false."},
{t:"13:00",k:0.862,r:"kw=0.862 vs typical=1.05. Below typical. No excess. Active=false."},
{t:"13:30",k:1.956,r:"kw=1.956 vs typical=1.102. Excess ~0.8kW. Below ev class. Outside cook window. Active=false."},
{t:"14:00",k:1.478,r:"kw=1.478 vs typical=1.104. Excess ~0.4kW. Below ev class. Outside cook window. Active=false."},
{t:"14:30",k:3.682,r:"kw=3.682 vs typical=1.261. Excess ~2.4kW. Below ev class. Outside cook window. Active=false."},
{t:"15:00",k:10.364,r:"kw=10.364 vs typical=1.439. Excess ~8.9kW. Matches ev class + AC. Active=true."},
{t:"15:30",k:11.008,e:{a:6.5,tr:"recurring"},fl:true,r:"kw=11.008 vs typical=1.595. Excess ~9.4kW. Matches ev class + AC. Active=true."},
{t:"16:00",k:9.812,e:{a:6.5,tr:"recurring"},fl:true,r:"kw=9.812 vs typical=1.401. Excess ~8.4kW. Matches ev class + AC. Active=true."},
{t:"16:30",k:10.868,e:{a:6.5,tr:"recurring"},fl:true,r:"kw=10.868 vs typical=1.391. Excess ~9.5kW. Matches ev class + AC. Active=true."},
{t:"17:00",k:9.816,i:{a:2.0,tr:"recurring"},r:"kw=9.816 vs typical=1.621. Excess ~8.2kW. Inside cook window 17:00-22:00. Matches ev class + AC. Active=true (ev check: 8.2kW > 4 slots? No, single slot. Induction fits)."},
{t:"17:30",k:10.084,r:"kw=10.084 vs typical=1.336. Excess ~8.7kW. Matches ev class + AC. Active=true."},
{t:"18:00",k:10.328,e:{a:6.5,tr:"recurring"},fl:true,r:"kw=10.328 vs typical=1.395. Excess ~8.9kW. Matches ev class + AC. Active=true."},
{t:"18:30",k:10.456,e:{a:6.5,tr:"recurring"},fl:true,r:"kw=10.456 vs typical=1.297. Excess ~9.2kW. Matches ev class + AC. Active=true."},
{t:"19:00",k:9.894,e:{a:6.5,tr:"recurring"},fl:true,r:"kw=9.894 vs typical=1.409. Excess ~8.5kW. Matches ev class + AC. Active=true."},
{t:"19:30",k:7.166,r:"kw=7.166 vs typical=1.556. Excess ~5.6kW. Below ev class. Outside cook window. Active=false."},
{t:"20:00",k:2.938,r:"kw=2.938 vs typical=1.489. Excess ~1.4kW. Below ev class. Outside cook window. Active=false."},
{t:"20:30",k:1.184,r:"kw=1.184 vs typical=1.593. Below typical. No excess. Active=false."},
{t:"21:00",k:2.914,r:"kw=2.914 vs typical=1.57. Excess ~1.3kW. Below ev class. Outside cook window. Active=false."},
{t:"21:30",k:3.34,r:"kw=3.34 vs typical=1.845. Excess ~1.5kW. Below ev class. Outside cook window. Active=false."},
{t:"22:00",k:2.514,r:"kw=2.514 vs typical=2.229. Near typical. No excess. Active=false."},
{t:"22:30",k:4.2,r:"kw=4.2 vs typical=2.282. Excess ~2kW. Below ev class. Outside cook window. Active=false."},
{t:"23:00",k:6.624,r:"kw=6.624 vs typical=2.458. Excess ~4.2kW. Below ev class. Outside cook window. Active=false."},
{t:"23:30",k:7.048,r:"kw=7.048 vs typical=2.628. Excess ~4.4kW. Below ev class. Outside cook window. Active=false."}
]
  }
},
"1122051212406289": {
  name: "Consumer 1122051212406289",
  days: {
"2026-06-23":[
{t:"00:00",k:0.296,r:"kw=0.296 vs typical=0.369, low magnitude, no surge."},
{t:"00:30",k:0.294,r:"kw=0.294 vs typical=0.355, low magnitude, no surge."},
{t:"01:00",k:0.336,r:"kw=0.336 vs typical=0.338, low magnitude, no surge."},
{t:"01:30",k:0.294,r:"kw=0.294 vs typical=0.362, low magnitude, no surge."},
{t:"02:00",k:0.236,r:"kw=0.236 vs typical=0.347, low magnitude, no surge."},
{t:"02:30",k:0.306,r:"kw=0.306 vs typical=0.369, low magnitude, no surge."},
{t:"03:00",k:0.25,r:"kw=0.25 vs typical=0.346, low magnitude, no surge."},
{t:"03:30",k:0.25,r:"kw=0.25 vs typical=0.324, low magnitude, no surge."},
{t:"04:00",k:0.246,r:"kw=0.246 vs typical=0.341, low magnitude, no surge."},
{t:"04:30",k:0.252,r:"kw=0.252 vs typical=0.348, low magnitude, no surge."},
{t:"05:00",k:0.278,r:"kw=0.278 vs typical=0.321, low magnitude, no surge."},
{t:"05:30",k:0.29,r:"kw=0.29 vs typical=0.325, low magnitude, no surge."},
{t:"06:00",k:0.252,r:"kw=0.252 vs typical=0.341, low magnitude, no surge."},
{t:"06:30",k:0.27,r:"kw=0.27 vs typical=0.323, low magnitude, no surge."},
{t:"07:00",k:0.278,r:"kw=0.278 vs typical=0.325, low magnitude, no surge."},
{t:"07:30",k:0.256,r:"kw=0.256 vs typical=0.326, low magnitude, no surge."},
{t:"08:00",k:0.24,r:"kw=0.24 vs typical=0.316, low magnitude, no surge."},
{t:"08:30",k:0.292,r:"kw=0.292 vs typical=0.304, low magnitude, no surge."},
{t:"09:00",k:0.262,r:"kw=0.262 vs typical=0.311, low magnitude, no surge."},
{t:"09:30",k:0.244,r:"kw=0.244 vs typical=0.317, low magnitude, no surge."},
{t:"10:00",k:0.224,r:"kw=0.224 vs typical=0.312, low magnitude, no surge."},
{t:"10:30",k:0.35,r:"kw=0.35 vs typical=0.345, low magnitude, no surge."},
{t:"11:00",k:4.558,i:{a:1.8,tr:"recurring"},r:"kw=4.558 vs typical=0.455, inside 11:00-15:00 window, induction active."},
{t:"11:30",k:1.006,r:"kw=1.006 vs typical=2.082, low magnitude, no surge."},
{t:"12:00",k:1.62,r:"kw=1.62 vs typical=1.682, low magnitude, no surge."},
{t:"12:30",k:0.586,r:"kw=0.586 vs typical=0.887, low magnitude, no surge."},
{t:"13:00",k:0.348,r:"kw=0.348 vs typical=0.472, low magnitude, no surge."},
{t:"13:30",k:0.384,r:"kw=0.384 vs typical=0.456, low magnitude, no surge."},
{t:"14:00",k:0.394,r:"kw=0.394 vs typical=0.458, low magnitude, no surge."},
{t:"14:30",k:0.332,r:"kw=0.332 vs typical=0.384, low magnitude, no surge."},
{t:"15:00",k:0.29,r:"kw=0.29 vs typical=0.408, low magnitude, no surge."},
{t:"15:30",k:2.368,r:"kw=2.368 vs typical=0.376, low magnitude, no surge."},
{t:"16:00",k:0.314,r:"kw=0.314 vs typical=0.375, low magnitude, no surge."},
{t:"16:30",k:1.664,r:"kw=1.664 vs typical=0.427, low magnitude, no surge."},
{t:"17:00",k:0.388,r:"kw=0.388 vs typical=0.492, low magnitude, no surge."},
{t:"17:30",k:0.426,r:"kw=0.426 vs typical=0.479, low magnitude, no surge."},
{t:"18:00",k:0.624,r:"kw=0.624 vs typical=0.433, low magnitude, no surge."},
{t:"18:30",k:0.87,r:"kw=0.87 vs typical=0.372, low magnitude, no surge."},
{t:"19:00",k:0.186,r:"kw=0.186 vs typical=0.332, low magnitude, no surge."},
{t:"19:30",k:0.16,r:"kw=0.16 vs typical=0.324, low magnitude, no surge."},
{t:"20:00",k:0.204,r:"kw=0.204 vs typical=0.335, low magnitude, no surge."},
{t:"20:30",k:0.178,r:"kw=0.178 vs typical=0.328, low magnitude, no surge."},
{t:"21:00",k:0.158,r:"kw=0.158 vs typical=0.314, low magnitude, no surge."},
{t:"21:30",k:0.208,r:"kw=0.208 vs typical=0.304, low magnitude, no surge."},
{t:"22:00",k:0.132,r:"kw=0.132 vs typical=0.317, low magnitude, no surge."},
{t:"22:30",k:0.192,r:"kw=0.192 vs typical=0.318, low magnitude, no surge."},
{t:"23:00",k:0.212,r:"kw=0.212 vs typical=0.325, low magnitude, no surge."},
{t:"23:30",k:0.18,r:"kw=0.18 vs typical=0.33, low magnitude, no surge."}
]
  }
}
};

// =============================================================================
// PASTE NEW CONSUMER OUTPUT HERE
// -----------------------------------------------------------------------------
// Drop raw pipeline output straight in, exactly as you get it. Each entry is one
// { "scno": "...", "days": { "YYYY-MM-DD": { "slots": [...] } } } object.
// Slots may carry "actual_kw" or "_actual_kw"; if neither is present, kW is
// parsed from the reasoning text. A matching scno merges its days in.
// (The app's file picker does the same thing at runtime.)
// =============================================================================
const RAW_NEW_CONSUMERS = [
  // <-- paste new consumer JSON objects here, separated by commas
];

// ---------------------------------------------------------------------------
// Turns one raw slot-attribution JSON object into the compact internal shape.
// Exported so the file picker in the component can reuse the same logic.
// ---------------------------------------------------------------------------
export function normalizeConsumer(parsed) {
  const days = {};
  Object.entries(parsed.days || {}).forEach(([date, dayObj]) => {
    const rawSlots = (dayObj && dayObj.slots) || [];
    days[date] = rawSlots.map((s) => {
      let k = typeof s.actual_kw === "number" ? s.actual_kw
            : typeof s._actual_kw === "number" ? s._actual_kw
            : null;
      if (k === null) {
        const m = /kw\s*=\s*([\d.]+)/.exec(s.reasoning || "");
        k = m ? parseFloat(m[1]) : 0;
      }
      const slot = { t: s.time, k };
      const indOn = s.induction && s.induction.active;
      const evOn = s.ev && s.ev.active;
      if (indOn) slot.i = { a: s.induction.attributed_kw, tr: s.induction.trend };
      if (evOn) slot.e = { a: s.ev.attributed_kw, tr: s.ev.trend };
      slot.r = s.reasoning || "";
      if (s.flags && s.flags.length) slot.fl = true;
      return slot;
    });
  });
  return { name: "Consumer " + parsed.scno, days };
}

export function mergeConsumer(consumers, raw) {
  if (!raw || !raw.scno || !raw.days) {
    throw new Error('JSON must have a "scno" field and a "days" object.');
  }
  const normalized = normalizeConsumer(raw);
  const existing = consumers[raw.scno];
  return {
    ...consumers,
    [raw.scno]: existing
      ? { name: existing.name, days: { ...existing.days, ...normalized.days } }
      : normalized
  };
}

function buildConsumers() {
  let consumers = { ...SEED_CONSUMERS };
  RAW_NEW_CONSUMERS.forEach((raw) => {
    if (!raw || !raw.scno || !raw.days) return;
    consumers = mergeConsumer(consumers, raw);
  });
  return consumers;
}

export const INITIAL_CONSUMERS = buildConsumers();