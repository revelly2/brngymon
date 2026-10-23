// Renders the diagram sources and captures the system screenshots (plates) with headless Chrome.
// Usage: node shoot.mjs [baseUrl]   (default http://localhost:3001; run `npm run dev` first)
// The sample residents below are fictional demo records used only for the screenshots.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..");
const BASE = process.argv[2] || "http://localhost:3001";
const CHROME = ["C:/Program Files/Google/Chrome/Application/chrome.exe",
                "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"].find(existsSync);
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ CDP plumbing
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, "--hide-scrollbars",
  `--user-data-dir=${mkdtempSync(join(tmpdir(), "bhsms-shots-"))}`, "--no-first-run", "about:blank"]);
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(300);
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find((t) => t.type === "page"); } catch {}
}
if (!target) throw new Error("Chrome did not start");
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0; const pending = new Map(); const waiters = [];
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); }
  else if (m.method) for (const w of [...waiters]) if (w.method === m.method) { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = (method) => new Promise((res) => waiters.push({ method, res }));
const js = async (expr) => (await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await send("Page.enable");
async function view(width, height, scale = 1) {
  await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: scale, mobile: false });
}
async function go(url, settle = 2500) {
  const loaded = once("Page.loadEventFired");
  await send("Page.navigate", { url });
  await Promise.race([loaded, sleep(60000)]);
  await sleep(settle);
  // hide the Next.js dev-mode badge
  await js(`(() => { const s = document.createElement('style'); s.textContent = 'nextjs-portal{display:none!important}'; document.head.appendChild(s); })()`);
}
async function shot(file, clip) {
  const { data } = await send("Page.captureScreenshot", { format: "png", ...(clip ? { clip, captureBeyondViewport: true } : {}) });
  writeFileSync(join(OUT, file), Buffer.from(data, "base64"));
  console.log("saved", file);
}
const waitFor = (cond, ms = 30000) => js(`new Promise((res) => { const t0 = Date.now(); (function poll() {
  if (${cond}) return res(true); if (Date.now() - t0 > ${ms}) return res(false); setTimeout(poll, 250); })(); })`);

// ------------------------------------------------------------------ figures
for (const name of ["figure2_prototype", "figure4_triage", "figure5_erd"]) {
  await view(1300, 1200, 2);
  await go(pathToFileURL(join(HERE, `${name}.html`)).href, 300);
  const box = await js(`(() => { const r = document.getElementById('fig').getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; })()`);
  await shot(`${name}.png`, { ...box, scale: 1 });
}

// ------------------------------------------------------------------ sample data (fictional)
function soundex(name) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, ""); if (!clean) return "0000";
  const map = { B: 1, F: 1, P: 1, V: 1, C: 2, G: 2, J: 2, K: 2, Q: 2, S: 2, X: 2, Z: 2, D: 3, T: 3, L: 4, M: 5, N: 5, R: 6 };
  let code = clean[0], prev = String(map[clean[0]] || 0);
  for (const ch of clean.slice(1)) {
    const cur = String(map[ch] || 0);
    if (cur !== "0" && cur !== prev) { code += cur; prev = cur; } else if (cur === "0") prev = "0";
    if (code.length === 4) break;
  }
  return (code + "0000").slice(0, 4);
}
const NOW = "2026-10-09T08:00:00.000Z";
const PFX = { PALAQUIO: "PAL", TABIOG: "TAB", BABANGCAG: "BAB" };
const people = [
  ["Juan", "Reyes", "Bagani", "1968-11-02", "male", "married", "PALAQUIO", "Purok 1", false],
  ["Maria", "Santos", "Dela Cruz", "1990-05-14", "female", "married", "TABIOG", "Purok 2", true],
  ["Pedro", "Lagman", "Castillo", "1955-07-30", "male", "widowed", "BABANGCAG", "Purok 4", false],
  ["Ernesto", "Mina", "Valdez", "1979-01-17", "male", "married", "TABIOG", "Purok 1", false],
  ["Lorna", "Agustin", "Balbin", "1999-03-21", "female", "single", "PALAQUIO", "Purok 3", false],
  ["Angel", "Bersamin", "Ramos", "2009-02-10", "female", "single", "BABANGCAG", "Purok 2", true],
  ["Rosa", "Turqueza", "Ignacio", "1984-09-09", "female", "married", "TABIOG", "Purok 3", true],
  ["Liza", "Santos", "Dela Cruz", "2026-04-01", "female", "single", "TABIOG", "Purok 2", false],
  ["Mark", "Reyes", "Bagani", "2026-06-15", "male", "single", "PALAQUIO", "Purok 1", false],
];
const count = {};
const residents = people.map(([first, middle, last, dob, sex, civil, brgy, purok, preg], i) => {
  count[brgy] = (count[brgy] || 0) + 1;
  return {
    id: `5a1e0000-0000-4000-8000-00000000000${i + 1}`, upi: `BHS-${PFX[brgy]}-2026-${String(count[brgy]).padStart(4, "0")}`,
    household_id: null, first_name: first, middle_name: middle, last_name: last, suffix: null, alias: null,
    date_of_birth: dob, biological_sex: sex, civil_status: civil, barangay: brgy, purok,
    contact_number: "09XX-XXX-XXXX", philhealth_id: null, is_pregnant: preg,
    soundex_key: `${soundex(last)}-${first.toUpperCase().slice(0, 3)}-${dob}`,
    created_by: "a0000000-0000-0000-0000-000000000004", created_at: NOW, updated_at: NOW,
  };
});
const R = Object.fromEntries(residents.map((r) => [r.first_name, r.id]));
function evaluate(sbp, dbp, temp, kg, cm) {
  let sev = "NORMAL", flags = [], ref = false;
  if (sbp >= 180 || dbp >= 120) { sev = "CRITICAL"; flags = ["HYPERTENSIVE_CRISIS_EMERGENCY"]; ref = true; }
  else if (sbp >= 140 || dbp >= 90) { sev = "HIGH"; flags = ["STAGE_2_HYPERTENSION"]; }
  else if (sbp >= 120 || dbp >= 80) { sev = "ELEVATED"; flags = ["PRE_HYPERTENSION"]; }
  if (temp >= 38) { flags.push("FEBRILE_ILLNESS_ALERT"); if (sev === "NORMAL") sev = "ELEVATED"; }
  const bmi = Math.round((kg / (cm / 100) ** 2) * 10) / 10;
  if (bmi < 18.5) flags.push("BMI_UNDERWEIGHT"); else if (bmi >= 30) flags.push("BMI_OBESE_2"); else if (bmi >= 25) flags.push("BMI_OBESE_1");
  return { severity: sev, clinical_flags: flags, referral_recommended: ref, bmi };
}
const vitalsIn = [
  ["Juan", 182, 118, 92, 20, 36.8, 72, 165, "Severe headache and dizziness since morning.", "2026-10-08T09:10:00.000Z"],
  ["Pedro", 148, 92, 84, 18, 36.6, 61, 160, "Known hypertensive; ran out of maintenance medicine.", "2026-10-07T10:30:00.000Z"],
  ["Ernesto", 128, 82, 102, 22, 38.6, 68, 168, "Fever for 3 days with petechiae on both arms.", "2026-10-08T14:00:00.000Z"],
  ["Maria", 116, 74, 80, 18, 36.7, 58, 152, "Routine prenatal check.", "2026-10-06T08:45:00.000Z"],
  ["Lorna", 124, 78, 76, 16, 36.5, 49, 155, null, "2026-10-05T11:20:00.000Z"],
  ["Angel", 108, 68, 78, 18, 36.6, 45, 150, "First prenatal visit.", "2026-10-04T09:00:00.000Z"],
];
const vitals = vitalsIn.map(([who, sbp, dbp, hr, rr, t, kg, cm, notes, at], i) => ({
  id: `5a1e0001-0000-4000-8000-00000000000${i + 1}`, resident_id: R[who], recorded_by_user_id: "a0000000-0000-0000-0000-000000000003",
  systolic_bp: sbp, diastolic_bp: dbp, heart_rate_bpm: hr, respiratory_rate_cpm: rr, temperature_celsius: t,
  weight_kg: kg, height_cm: cm, ...evaluate(sbp, dbp, t, kg, cm), notes, recorded_at: at,
}));
function naegele(lmp) { const d = new Date(lmp + "T00:00:00Z"); d.setUTCFullYear(d.getUTCFullYear() + 1); d.setUTCMonth(d.getUTCMonth() - 3); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); }
const maternal = [
  ["Maria", 3, 2, 2, 0, 0, 2, "2026-04-20", []],
  ["Angel", 1, 0, 0, 0, 0, 0, "2026-06-01", ["ADOLESCENT_PREGNANCY"]],
  ["Rosa", 6, 5, 4, 1, 0, 5, "2026-03-10", ["ADVANCED_MATERNAL_AGE", "GRAND_MULTIPARITY"]],
].map(([who, g, p, ft, pt, ab, lc, lmp, flags], i) => ({
  id: `5a1e0002-0000-4000-8000-00000000000${i + 1}`, resident_id: R[who], gravida: g, para: p, full_term: ft, preterm: pt,
  abortion: ab, living_children: lc, lmp, edd: naegele(lmp), high_risk_flags: flags, is_active: true,
  recorded_by_user_id: "a0000000-0000-0000-0000-000000000003", created_at: NOW, updated_at: NOW,
}));
const visits = [
  [0, 1, 12, null, null, 112, 72, 55, "2026-07-13"], [0, 2, 20, 18, 144, 114, 74, 57, "2026-09-07"],
  [2, 1, 10, null, null, 120, 80, 63, "2026-05-19"], [2, 2, 18, 17, 148, 124, 82, 65, "2026-07-14"],
  [2, 3, 26, 25, 146, 126, 80, 67, "2026-09-08"], [2, 4, 30, 29, 142, 128, 84, 68, "2026-10-06"],
].map(([m, n, ga, fh, fht, s, d, w, date], i) => ({
  id: `5a1e0003-0000-4000-8000-00000000000${i + 1}`, maternal_record_id: maternal[m].id, visit_number: n,
  gestational_age_weeks: ga, fundic_height_cm: fh, fetal_heart_tone_bpm: fht, iron_folic_acid_distributed: true,
  systolic_bp: s, diastolic_bp: d, weight_kg: w, recorded_by_user_id: "a0000000-0000-0000-0000-000000000003",
  visit_date: date, notes: null, created_at: NOW,
}));
const doses = [["Liza", "BCG", "2026-04-01"], ["Liza", "HEP_B", "2026-04-01"], ["Liza", "PENTA_1", "2026-05-13"],
  ["Liza", "OPV_1", "2026-05-13"], ["Liza", "PCV_1", "2026-05-13"], ["Mark", "BCG", "2026-06-15"], ["Mark", "HEP_B", "2026-06-16"]];
const immunizations = doses.map(([who, code, date], i) => ({
  id: `5a1e0004-0000-4000-8000-0000000000${String(i + 1).padStart(2, "0")}`, resident_id: R[who], vaccine_code: code,
  dose_number: 1, status: "administered", scheduled_date: date, administered_date: date, batch_number: `LOT-${2600 + i}`,
  administered_by_user_id: "a0000000-0000-0000-0000-000000000004", notes: null, created_at: NOW,
}));
const encounters = [{
  id: "5a1e0005-0000-4000-8000-000000000001", residentId: R.Juan, encounterDate: "2026-10-08T09:40:00.000Z",
  providerName: "Dr. Arthur Alcantara, MHO", providerRole: "doctor", chiefComplaint: "Severe headache and dizziness",
  clinicalImpression: "Hypertensive crisis (BP 182/118 mmHg)", treatmentPlan: "Referred to Abra Provincial Hospital for blood pressure management; RF-1 issued.",
  createdAt: "2026-10-08T09:40:00.000Z",
}];
const SEED = { bhms_residents_cache: residents, bhms_vitals_cache: vitals, bhms_maternal_cache: maternal,
  bhms_visits_cache: visits, bhms_immunization_cache: immunizations, bhsms_clinical_encounters_v1: encounters };

const ACCOUNTS = {
  admin: { id: "a0000000-0000-0000-0000-000000000001", email: "admin.it@bucay.gov.ph", name: "LGU System Administrator", role: "admin", barangay: "PALAQUIO", employeeId: "EMP-ADM-005", stationName: "Bucay IT & Health Ops Center", modules: [] },
  nurse: { id: "a0000000-0000-0000-0000-000000000003", email: "midwife.rhus@bucay.gov.ph", name: "Corazon Valdez, RM (Midwife)", role: "nurse", barangay: "TABIOG", employeeId: "EMP-RHM-002", stationName: "Barangay Tabiog BHS / RHU", modules: [] },
  doctor: { id: "a0000000-0000-0000-0000-000000000002", email: "mho.doctor@bucay.gov.ph", name: "Dr. Arthur Alcantara, MHO", role: "doctor", barangay: "BABANGCAG", employeeId: "EMP-MHO-003", stationName: "Bucay Municipal Health Office", modules: [] },
};
const as = (role) => js(role ? `localStorage.setItem('bhsms_auth_session', ${JSON.stringify(JSON.stringify(ACCOUNTS[role]))})`
                             : `localStorage.removeItem('bhsms_auth_session')`);
const setInput = (selector, value) => js(`(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (!el) return false;
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
const clickText = (tag, label) => js(`(() => { const el = [...document.querySelectorAll(${JSON.stringify(tag)})].find((b) => b.textContent.trim() === ${JSON.stringify(label)}); if (el) el.click(); return !!el; })()`);

// ------------------------------------------------------------------ plates
await view(1440, 900, 1);
await go(`${BASE}/login`, 4000);
await js(`(() => { const s = ${JSON.stringify(SEED)}; for (const k in s) localStorage.setItem(k, JSON.stringify(s[k])); })()`);
await js(`localStorage.setItem("bhsms_theme", "light")`);

const plates = [
  ["plate01_signin.png", null, "/login"],
  ["plate02_dashboard.png", "nurse", "/"],
  ["plate03_registry.png", "admin", "/residents"],
  ["plate04_intake.png", "admin", "/residents/register", async () => {
    await setInput('input[placeholder="e.g. Maria"]', "Maria");
    await setInput('input[placeholder="e.g. Dela Cruz"]', "De la Cruz");
    await setInput('input[type="date"]', "1990-05-14");
    await sleep(1200);
  }],
  ["plate05_vitals.png", "nurse", "/vitals", async () => {
    const sel = await js(`(() => { const s = document.querySelector('select'); return s ? [...s.options].map(o => o.value) : []; })()`);
    if (sel.includes(R.Juan)) await setInput("select", R.Juan);
    const nums = await js(`[...document.querySelectorAll('input[type="number"]')].length`);
    const vals = ["182", "118", "92", "20", "36.8", "72", "165"];
    for (let i = 0; i < Math.min(nums, vals.length); i++)
      await js(`(() => { const el = document.querySelectorAll('input[type="number"]')[${i}];
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${vals[i]}');
        el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); })()`);
    await sleep(800);
  }],
  ["plate06_chart.png", "doctor", "/residents", async () => { await clickText("button", "Chart"); await sleep(1500); }],
  ["plate07_maternal.png", "nurse", "/maternal"],
  ["plate08_epi.png", "nurse", "/immunizations"],
  ["plate09_referral.png", "nurse", "/reports/referral"],
  ["plate10_analytics.png", "doctor", "/analytics"],
  ["plate11_operations.png", "admin", "/operations"],
  ["plate12_users.png", "admin", "/users"],
];
for (const [file, role, path, action] of plates) {
  await as(role);
  await go(`${BASE}${path}`, 3500);
  await waitFor(`document.readyState === 'complete' && !document.body.innerText.includes('Loading')`, 20000);
  if (action) await action();
  await shot(file);
}
ws.close(); chrome.kill();
