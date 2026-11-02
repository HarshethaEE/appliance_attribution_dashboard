// =============================================================================
// consumerData.js
// All consumer output lives here, separate from the dashboard component.
// No seed/example data - every consumer below is real pipeline output.
// =============================================================================

// ---------------------------------------------------------------------------
// Compact internal slot shape:
//   { t: "HH:MM", k: totalKw,
//     i?: {a, tr, c}          induction  (a = attributed kW, tr = trend, c = confidence)
//     e?: {a, tr, c}          EV
//     o?: { ac: {a, n, c} }   equipment the MODEL named, keyed by name (n = units running)
//     b?: { key: kW, ... }    the pipeline's full appliance balance for this slot
//                             (induction, ev, ac, fridge, fan, lighting:Tube light,
//                              other:Television, ...) - every surveyed appliance
//     u?: number              kW the meter read beyond everything in `b` (unexplained)
//     r?: reasoning text,
//     fl?: [flag strings] }
// ---------------------------------------------------------------------------

const SEED_CONSUMERS = {};

// ---------------------------------------------------------------------------
// Real consumer names and equipment counts from the survey (not part of the
// raw pipeline slot JSON, so kept here and attached in normalizeConsumer).
// equipment: [{ label, qty }] - one row per surveyed appliance type.
// ---------------------------------------------------------------------------
const CONSUMER_NAMES = {
  "1122051212397660": "MYTRI INFRA",
  "1122051212406289": "APPALA RAJA VARMA",
  "1122051209192170": "N SRINIVASA RAO",
  "1122051212272407": "SHILPA",
  "112206A806395345": "NAVYA INFRACON PROJECTS PVT LTD",
  "1122051212397669": "RAJANI",
  "1122051212327361": "ROLLAND",
  "1122051218330035": "RAJEEV KUMAR",
  "1122051218330036": "SANDEEP",
  "1122051326074341": "SMT A AMMAJI",
  "1163242186000850": "ST.ANNS SCHOOL",
  "11132600VS006288": "BHAGAVANT GOUD",
  "116616T008008383": "ASWANI",
  "1124130000258700": "SUNITHA",
  "112413A042258827": "M SHAH",
  "112208B608180139": "RAJESH KUMAR",
  "112208B608325058": "ANIL KUMAR JOSHI",
  "112208B608326172": "SUVARNAMALA GUPTA",
  "112208B208295930": "NIHALCHANDCHATRANIMOHAN",
  "112208B608158428": "SRINIVASA RAO",
  "1164932276000530": "D JAGJEEVAN",
  "1131310801033010": "SURYA KUMARI",
  "1122051326272810": "LEHARY",
  "1122051326059846": "V.K. REDDY",
  "1122051218272307": "DEVI GOYAL",
  "1122051326056493": "DR.K.RAMAMURTHY",
  "1122051326299096": "SATISH",
  "1122051222135212": "DHARMA CHAYA REDDY",
  "1122050000074447": "LAKSHMIDEVI",
  "1122051212272201": "RAMESH",
  "1122051212004877": "V VENKAT RAO",
  "1122051326147288": "S.S.SETTI",
  "1122051326053643": "B.LAKSHMI",
  "1111173838125332": "YADLA SATISHKUMAR",
  "1111173839343700": "RAMANI",
  "1111281754155480": "VENKATARATNAM",
  "1111281754313287": "ESWARA RAO",
  "121101K074024338": "RAJA",
  "1165820505001193": "VENKATESWARA PRASAD",
  "112419M023047470": "P.V.C.P.RAO",
  "1163272153002873": "ESWARA RAO",
  "1163272159003635": "SEETARAM",
  "112206B706081767": "G V R RAO",
  "116597M024003053": "LAKSHMI PRASANNA",
  "112413A023369976": "ANUPAMA",
  "112206A806395213": "REVATI",
  "116582Y005009164": "SWAMINATHAN",
  "1171791107003367": "M LAKSHMIKANTHAM",
  "116582R009003492": "KRANTI KIRAN",
  "116583M022002068": "SOUJANYA",
  "1424631110003414": "BURUGUPALLI APPARAO",
};

const CONSUMER_EQUIPMENT = {
  "1122051212397660": [
    { label: "Induction Stove", qty: 1 }, { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 },
    { label: "Tube light", qty: 10 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051212406289": [
    { label: "Induction Stove", qty: 1 }, { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 },
    { label: "Fan", qty: 1 }, { label: "Television", qty: 1 }, { label: "Mixer", qty: 1 },
  ],
  "1122051209192170": [
    { label: "Micro Oven", qty: 1 }, { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 },
    { label: "Tube light", qty: 3 }, { label: "Bulb", qty: 3 }, { label: "Fan", qty: 5 },
    { label: "Television", qty: 1 }, { label: "Mixer", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "1122051212272407": [
    { label: "Induction Stove", qty: 1 }, { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 },
    { label: "Tube light", qty: 6 }, { label: "Fan", qty: 4 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "112206A806395345": [
    { label: "Induction cooktop", qty: 1 }, { label: "AC", qty: 3 }, { label: "Fridge", qty: 2 },
    { label: "Tube light", qty: 2 }, { label: "Bulb", qty: 20 }, { label: "Fan", qty: 6 },
    { label: "Television", qty: 2 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051212397669": [
    { label: "Micro Oven", qty: 1 }, { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 },
    { label: "Tube light", qty: 10 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051212327361": [
    { label: "Micro Oven", qty: 1 }, { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 },
    { label: "Television", qty: 1 }, { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "1122051218330035": [
    { label: "Induction Stove", qty: 1 }, { label: "AC", qty: 5 }, { label: "Fridge", qty: 2 },
    { label: "Tube light", qty: 10 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 3 },
    { label: "Mixer", qty: 1 },
  ],
  "1122051218330036": [
    { label: "Induction Stove", qty: 1 }, { label: "AC", qty: 5 }, { label: "Fridge", qty: 1 },
    { label: "Tube light", qty: 10 }, { label: "Fan", qty: 8 }, { label: "Television", qty: 3 },
    { label: "Mixer", qty: 1 }, { label: "Grinder", qty: 1 }, { label: "Motor", qty: 2 },
  ],
  "1122051326074341": [
    { label: "Induction Stove", qty: 1 }, { label: "AC", qty: 6 }, { label: "Fridge", qty: 2 },
    { label: "Tube light", qty: 20 }, { label: "Fan", qty: 18 }, { label: "Mixer", qty: 2 },
    { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1163242186000850": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 4 },
    { label: "Bulb", qty: 1 }, { label: "Fan", qty: 3 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "11132600VS006288": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 4 },
    { label: "Bulb", qty: 6 }, { label: "Fan", qty: 3 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "116616T008008383": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 8 },
    { label: "Bulb", qty: 20 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "1124130000258700": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 4 },
    { label: "Bulb", qty: 1 }, { label: "Fan", qty: 4 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "112413A042258827": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 2 },
    { label: "Bulb", qty: 2 }, { label: "Fan", qty: 3 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "112208B608180139": [
    { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 15 },
    { label: "Bulb", qty: 10 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "112208B608325058": [
    { label: "AC", qty: 6 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 6 }, { label: "Fan", qty: 4 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "112208B608326172": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 6 },
    { label: "Bulb", qty: 15 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "112208B208295930": [
    { label: "AC", qty: 5 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 4 },
    { label: "Bulb", qty: 4 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "112208B608158428": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 1 }, { label: "Fan", qty: 4 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1164932276000530": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 4 },
    { label: "Bulb", qty: 2 }, { label: "Fan", qty: 3 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "1131310801033010": [
    { label: "AC", qty: 4 }, { label: "Fridge", qty: 2 }, { label: "Tube light", qty: 8 },
    { label: "Bulb", qty: 4 }, { label: "Fan", qty: 8 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051326272810": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 20 }, { label: "Fan", qty: 7 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "1122051326059846": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 6 },
    { label: "Bulb", qty: 4 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1122051218272307": [
    { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 10 },
    { label: "Bulb", qty: 10 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1122051326056493": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 3 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1122051326299096": [
    { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 2 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051222135212": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 5 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "1122050000074447": [
    { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 4 }, { label: "Fan", qty: 3 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051212272201": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 3 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 3 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1122051212004877": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 10 },
    { label: "Bulb", qty: 10 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "1122051326147288": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 3 }, { label: "Fan", qty: 4 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "1122051326053643": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 3 },
    { label: "Bulb", qty: 3 }, { label: "Fan", qty: 3 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "1111173838125332": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 7 },
    { label: "Bulb", qty: 7 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1111173839343700": [
    { label: "AC", qty: 6 }, { label: "Fridge", qty: 2 }, { label: "Tube light", qty: 2 },
    { label: "Bulb", qty: 4 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "1111281754155480": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 10 },
    { label: "Bulb", qty: 5 }, { label: "Fan", qty: 2 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1111281754313287": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 7 },
    { label: "Bulb", qty: 1 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "121101K074024338": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 9 },
    { label: "Bulb", qty: 15 }, { label: "Fan", qty: 9 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "1165820505001193": [
    { label: "AC", qty: 9 }, { label: "Fridge", qty: 2 }, { label: "Tube light", qty: 10 },
    { label: "Bulb", qty: 60 }, { label: "Fan", qty: 12 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "112419M023047470": [
    { label: "AC", qty: 4 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 14 },
    { label: "Bulb", qty: 1 }, { label: "Fan", qty: 8 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1163272153002873": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 3 }, { label: "Tube light", qty: 10 },
    { label: "Bulb", qty: 15 }, { label: "Fan", qty: 10 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "1163272159003635": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 6 },
    { label: "Bulb", qty: 15 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 3 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "112206B706081767": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 6 },
    { label: "Bulb", qty: 5 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "116597M024003053": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 8 },
    { label: "Bulb", qty: 3 }, { label: "Television", qty: 3 }, { label: "Mixer", qty: 1 },
    { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 }, { label: "Motor", qty: 1 },
  ],
  "112413A023369976": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 6 },
    { label: "Bulb", qty: 16 }, { label: "Fan", qty: 6 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
  "112206A806395213": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 16 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 },
  ],
  "116582Y005009164": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 2 },
    { label: "Bulb", qty: 15 }, { label: "Fan", qty: 4 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1171791107003367": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 6 },
    { label: "Bulb", qty: 5 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "116582R009003492": [
    { label: "AC", qty: 3 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 50 },
    { label: "Bulb", qty: 2 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "116583M022002068": [
    { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 }, { label: "Tube light", qty: 5 },
    { label: "Bulb", qty: 10 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 2 },
    { label: "Mixer", qty: 1 }, { label: "Washing machine", qty: 1 }, { label: "Grinder", qty: 1 },
    { label: "Motor", qty: 1 },
  ],
  "1424631110003414": [
    { label: "Micro Oven", qty: 1 }, { label: "AC", qty: 2 }, { label: "Fridge", qty: 1 },
    { label: "Tube light", qty: 5 }, { label: "Fan", qty: 5 }, { label: "Television", qty: 1 },
    { label: "Mixer", qty: 1 }, { label: "Grinder", qty: 1 },
  ],
};

// =============================================================================
// PASTE NEW CONSUMER OUTPUT HERE
// -----------------------------------------------------------------------------
// Drop raw pipeline output straight in, exactly as you get it. Each entry is one
// { "scno": "...", "days": { "YYYY-MM-DD": { "slots": [...] } } } object
// (a results/<scno>.json file from batch_predict.py works as-is).
// Slots may carry "actual_kw" or "_actual_kw"; if neither is present, kW is
// parsed from the reasoning text. A matching scno merges its days in.
// If a slot has "balance" (every appliance's kW) and "unexplained_kw", the
// dashboard shows ALL appliances and their share of the day. Otherwise it falls
// back to induction / EV / any other equipment key shaped like
//   { "active": true, "attributed_kw": 7.2, "units_running": 4 }
// Days that failed (e.g. { "error": "..." }) are skipped.
// (The app's file picker does the same thing at runtime.)
// =============================================================================
// The raw pipeline output is NOT bundled here. It lives in one file per consumer, fetched on demand:
//   public/data/v1/<scno>.json   Version 1 + 2
//   public/data/v1b/<scno>.json  Version 1.b
//   public/data/v3/<scno>.json   Version 3
// index.json in each folder lists scno -> dates.

// Keys on a raw slot that are NOT equipment.
const NON_EQUIPMENT_KEYS = new Set([
  "time", "induction", "ev", "reasoning", "actual_kw", "_actual_kw", "flags",
  "balance", "unexplained_kw"
]);

// Phrases where the reasoning EXPLICITLY rules AC out. Checked before the
// "+AC" / "plus AC" inference below fires, so a slot whose text says the
// opposite of what it's about to infer never gets AC assumed onto it - the
// text is the strongest signal available when there's no structured ac
// block to read directly. Every slot from the current pipeline already
// carries a real ac field (read below regardless of this guard), so this
// mainly protects older / hand-typed data with no such field.
const _NO_AC_RE = /\bno\s+ac\b|\bac\s+(?:unlikely|off|not\s+needed|not\s+active|not\s+present)\b|\bwithout\s+ac\b|\bnot\s+ac\b/i;

// ---------------------------------------------------------------------------
// Turns one raw slot-attribution JSON object into the compact internal shape.
// Exported so the file picker in the component can reuse the same logic.
// ---------------------------------------------------------------------------
export function normalizeConsumer(parsed) {
  const days = {};
  const daysV2 = {};   // optional second reading of each day (version2.py)
  const v2Info = {};   // per day: the runs it reconsidered, its notes and its stats
  const dayWarnings = {};
  Object.entries(parsed.days || {}).forEach(([date, dayObj]) => {
    const rawSlots = (dayObj && dayObj.slots) || [];
    if (!rawSlots.length) return; // a failed / empty day ({"error": ...}) has nothing to show
    dayWarnings[date] = Array.isArray(dayObj.day_warnings) ? dayObj.day_warnings : [];
    const normalizeSlot = (s) => {
      let k = typeof s.actual_kw === "number" ? s.actual_kw
            : typeof s._actual_kw === "number" ? s._actual_kw
            : null;
      if (k === null) {
        const m = /kw\s*=\s*([\d.]+)/.exec(s.reasoning || "");
        k = m ? parseFloat(m[1]) : 0;
      }
      const slot = { t: s.time, k };
      if (s.induction && s.induction.active) {
        slot.i = { a: s.induction.attributed_kw, tr: s.induction.trend, c: s.induction.confidence };
      }
      if (s.ev && s.ev.active) {
        slot.e = { a: s.ev.attributed_kw, tr: s.ev.trend, c: s.ev.confidence };
      }
      // any other equipment object (ac, geyser, ...) that is switched on -
      // this reads the REAL structured field when one exists (every slot
      // from the current pipeline has one, even when inactive), so a
      // slot's own ac.active=false is always respected here regardless of
      // what the reasoning text says.
      Object.keys(s).forEach((key) => {
        if (NON_EQUIPMENT_KEYS.has(key)) return;
        const v = s[key];
        if (v && typeof v === "object" && typeof v.active === "boolean" && typeof v.attributed_kw === "number") {
          if (v.active) {
            slot.o = slot.o || {};
            slot.o[key] = { a: v.attributed_kw, n: v.units_running, c: v.confidence };
          }
        }
      });
      // The pipeline's full appliance balance: kW for EVERY surveyed appliance in
      // this slot, plus whatever the meter read beyond all of them.
      if (s.balance && typeof s.balance === "object") {
        slot.b = {};
        Object.entries(s.balance).forEach(([key, v]) => {
          if (typeof v === "number" && isFinite(v)) slot.b[key] = v;
        });
        const matched = Object.values(slot.b).reduce((x, y) => x + y, 0);
        slot.u = typeof s.unexplained_kw === "number" ? s.unexplained_kw : Math.max(0, k - matched);
      }
      // Older output has no structured "ac" object - it only says "... + AC" in the
      // reasoning text (e.g. "Matches ev class + AC"). When that happens and the slot
      // already has an induction/EV attribution, treat whatever is left of the reading
      // as AC and mark it `inferred` so the UI can say the kW wasn't stated by the model.
      // Never infer this when the SAME text explicitly rules AC out (_NO_AC_RE).
      if (!slot.b && !(slot.o && slot.o.ac) && !_NO_AC_RE.test(s.reasoning || "")
          && /(?:\+|\bplus\b)\s*AC\b/i.test(s.reasoning || "") && (slot.i || slot.e)) {
        const rest = k - (slot.i ? slot.i.a : 0) - (slot.e ? slot.e.a : 0);
        if (rest > 0.05) {
          slot.o = slot.o || {};
          slot.o.ac = { a: rest, inferred: true };
        }
      }
      slot.r = s.reasoning || "";
      if (Array.isArray(s.flags) && s.flags.length) slot.fl = s.flags;
      return slot;
    };
    days[date] = rawSlots.map(normalizeSlot);
    // Version 2: same slot shape; reasoning and flags fall back to Version 1's when not repeated
    const v2 = dayObj.v2;
    if (v2 && Array.isArray(v2.slots) && v2.slots.length === rawSlots.length) {
      daysV2[date] = v2.slots.map((s, i) => normalizeSlot({ ...rawSlots[i], ...s }));
      v2Info[date] = { runs: v2.runs || [], notes: v2.notes || [], stats: v2.stats || null };
    }
  });
  const name = CONSUMER_NAMES[parsed.scno] || ("Consumer " + parsed.scno);
  const equipment = CONSUMER_EQUIPMENT[parsed.scno] || [];
  return { name, scno: parsed.scno, equipment, days, daysV2, v2Info, dayWarnings, daysV1b: {}, v1bWarnings: {}, v1bEnergy: {}, daysV3: {}, v3Warnings: {}, v3Energy: {} };
}

export function mergeConsumer(consumers, raw) {
  if (!raw || !raw.scno || !raw.days) {
    throw new Error('JSON must have a "scno" field and a "days" object.');
  }
  const normalized = normalizeConsumer(raw);
  if (!Object.keys(normalized.days).length) {
    throw new Error(`No usable days for ${raw.scno} - every day in the file is empty or failed.`);
  }
  const existing = consumers[raw.scno];
  return {
    ...consumers,
    [raw.scno]: existing
      ? {
          ...existing, // keep dashboard-side fields (date lists, loaded flags)
          name: existing.name,
          scno: existing.scno || raw.scno,
          equipment: existing.equipment && existing.equipment.length ? existing.equipment : normalized.equipment,
          days: { ...existing.days, ...normalized.days },
          daysV2: { ...(existing.daysV2 || {}), ...normalized.daysV2 },
          v2Info: { ...(existing.v2Info || {}), ...normalized.v2Info },
          dayWarnings: { ...(existing.dayWarnings || {}), ...normalized.dayWarnings },
          daysV1b: existing.daysV1b || {},
          v1bWarnings: existing.v1bWarnings || {},
          v1bEnergy: existing.v1bEnergy || {},
          daysV3: existing.daysV3 || {},
          v3Warnings: existing.v3Warnings || {},
          v3Energy: existing.v3Energy || {}
        }
      : normalized
  };
}

// Two extra runs of the pipeline sit beside Version 1/2, each with the same compact slot shape as `days`,
// its day warnings and its per-day energy split:
//   Version 1.b  (a separate run over its own 14 days)    -> daysV1b, v1bWarnings, v1bEnergy
//   Version 3    (the newer single-day runs)              -> daysV3,  v3Warnings,  v3Energy
// A consumer that only has one of these gets empty Version 1/2 days.
function mergeRun(consumers, raw, daysKey, warnKey, energyKey) {
  if (!raw || !raw.scno || !raw.days) return consumers;
  const n = normalizeConsumer(raw);
  if (!Object.keys(n.days).length) return consumers;
  const energy = {};
  Object.entries(raw.days).forEach(([date, dayObj]) => {
    if (dayObj && dayObj.day_energy_kwh) energy[date] = dayObj.day_energy_kwh;
  });
  const existing = consumers[raw.scno]
    || { name: n.name, scno: raw.scno, equipment: n.equipment, days: {}, daysV2: {}, v2Info: {}, dayWarnings: {} };
  return {
    ...consumers,
    [raw.scno]: {
      ...existing,
      [daysKey]: { ...(existing[daysKey] || {}), ...n.days },
      [warnKey]: { ...(existing[warnKey] || {}), ...n.dayWarnings },
      [energyKey]: { ...(existing[energyKey] || {}), ...energy }
    }
  };
}

export function mergeConsumerV1b(consumers, raw) {
  return mergeRun(consumers, raw, "daysV1b", "v1bWarnings", "v1bEnergy");
}

export function mergeConsumerV3(consumers, raw) {
  return mergeRun(consumers, raw, "daysV3", "v3Warnings", "v3Energy");
}

// An empty consumer record (name and equipment from the survey tables above). The dashboard uses it for a
// consumer that has no Version 1/2 data, and for every consumer until its files have been loaded.
export function stubConsumer(scno) {
  return {
    name: CONSUMER_NAMES[scno] || ("Consumer " + scno),
    scno,
    equipment: CONSUMER_EQUIPMENT[scno] || [],
    days: {}, daysV2: {}, v2Info: {}, dayWarnings: {},
    daysV1b: {}, v1bWarnings: {}, v1bEnergy: {},
    daysV3: {}, v3Warnings: {}, v3Energy: {}
  };
}

// Consumers listed here are shown first in the dashboard, in this order.
const FIRST_CONSUMERS = ["112206A806395345"]; // NAVYA INFRACON PROJECTS PVT LTD

// One empty record per surveyed consumer (name + equipment). Readings are filled in by the dashboard
// from public/data/v1 and public/data/v3 as each consumer is opened.
function buildConsumers() {
  const consumers = { ...SEED_CONSUMERS };
  Object.keys(CONSUMER_NAMES).forEach((scno) => { consumers[scno] = stubConsumer(scno); });
  const ordered = {};
  FIRST_CONSUMERS.forEach((scno) => { if (consumers[scno]) ordered[scno] = consumers[scno]; });
  Object.keys(consumers).forEach((scno) => { if (!ordered[scno]) ordered[scno] = consumers[scno]; });
  return ordered;
}

export const INITIAL_CONSUMERS = buildConsumers();