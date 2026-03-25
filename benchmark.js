"use strict";
const wiji = require("./src/index");
let uuidv4, ulid;
try { uuidv4 = require("uuid").v4; } catch(_) {}
try { ulid = require("ulid").ulid; } catch(_) {}

function bench(label, fn, N = 1_000_000) {
  for (let i = 0; i < 1000; i++) fn(); // warmup
  const t = process.hrtime.bigint();
  for (let i = 0; i < N; i++) fn();
  const ms = Number(process.hrtime.bigint() - t) / 1e6;
  return { label, ms: ms.toFixed(1), idsPerSec: Math.round(N / ms * 1000), nsPerID: (Number(process.hrtime.bigint() - t) / N).toFixed(1) };
}

function sortQuality(label, fn, N = 10_000) {
  const ids = Array.from({ length: N }, () => fn());
  const sorted = [...ids].sort();
  return { label, sortable: ids.every((id, i) => id === sorted[i]) };
}

const col  = (s, w) => String(s).padEnd(w);
const colR = (s, w) => String(s).padStart(w);

console.log("\n╔═══════════════════════════════════════════════════════════╗");
console.log("║              Wiji v1 — Performance Benchmark              ║");
console.log("║              Forged at Sangkan (sangkan.dev)               ║");
console.log("╚═══════════════════════════════════════════════════════════╝\n");

const results = [
  bench("Wiji  (string)",  () => wiji()),
  bench("Wiji  (binary)",  () => wiji.binary()),
  bench("Wiji  (uuid)",    () => wiji.uuid()),
  bench("Wiji  (hex)",     () => wiji.hex()),
];
if (uuidv4) results.push(bench("UUID v4", () => uuidv4()));
if (ulid)   results.push(bench("ULID",    () => ulid()));

console.log(col("Generator", 22) + colR("Time (ms)", 12) + colR("IDs/sec", 16) + colR("ns/ID", 10));
console.log("─".repeat(62));
for (const r of results) {
  console.log(col(r.label, 22) + colR(r.ms, 12) + colR(r.idsPerSec.toLocaleString(), 16) + colR(r.nsPerID, 10));
}

console.log("\n── Sort / B+ Tree quality ───────────────────────────────────");
const tests = [sortQuality("Wiji", () => wiji())];
if (uuidv4) tests.push(sortQuality("UUID v4", () => uuidv4()));
if (ulid)   tests.push(sortQuality("ULID",    () => ulid()));
for (const s of tests) console.log(`  ${s.sortable ? "✅" : "❌"}  ${s.label}: naturally sortable = ${s.sortable}`);

console.log("\n── Uniqueness (1,000,000 IDs) ───────────────────────────────");
const set = new Set();
for (let i = 0; i < 1_000_000; i++) set.add(wiji());
console.log(`  Wiji: ${set.size.toLocaleString()} unique / 1,000,000 — collisions: ${1_000_000 - set.size}`);

console.log("\n── Microsecond precision check ──────────────────────────────");
const ids = Array.from({ length: 100 }, () => wiji());
const timestamps = ids.map(id => wiji.timestampUs(id));
const uniqueTs = new Set(timestamps);
const subMsVariants = timestamps.filter((ts, i) => i > 0 && ts - timestamps[i-1] < 1000 && ts > timestamps[i-1]);
console.log(`  Unique µs timestamps in 100 IDs: ${uniqueTs.size}`);
console.log(`  Sub-millisecond increments observed: ${subMsVariants.length}`);

console.log("\n── Sample output ────────────────────────────────────────────");
const sample = wiji();
const parsed = wiji.parse(sample);
console.log(`  String  : ${sample}`);
console.log(`  Binary  : ${Buffer.from(wiji.binary()).toString('hex')}`);
console.log(`  UUID    : ${wiji.uuid()}`);
console.log(`  Hex     : ${wiji.hex()}`);
console.log(`  ts (µs) : ${parsed.timestamp_us}`);
console.log(`  ts (ms) : ${parsed.timestamp_ms}`);
console.log(`  date    : ${parsed.date.toISOString()}`);
console.log(`  sequence: ${parsed.sequence}`);
console.log(`  version : ${parsed.version}`);
console.log(`  random  : ${Buffer.from(parsed.random).toString('hex')}`);
console.log("");
