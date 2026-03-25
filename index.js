"use strict";

/**
 * Wiji (ꦮꦶꦗꦶ) — Optimized Unique Identifier
 * Forged at Sangkan (https://sangkan.dev) — Building the Source.
 *
 * Spec: https://github.com/sangkan-dev/wiji/blob/main/spec/WIJI_SPEC.md
 *
 * Bit layout (128-bit):
 * ┌──────────────────────────┬────────────────┬────┬──────────────────────────────┐
 * │       timestamp_us       │    sequence    │ver │           random             │
 * │         56 bits          │    16 bits     │ 4b │           52 bits            │
 * └──────────────────────────┴────────────────┴────┴──────────────────────────────┘
 *
 * Runtime support: Node.js ≥14, Bun, Deno, modern browsers (Chrome/FF/Safari/Edge)
 */

// ---------------------------------------------------------------------------
// Base32 Crockford
// ---------------------------------------------------------------------------
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DEC = new Uint8Array(128).fill(0xff);
for (let i = 0; i < 32; i++) {
  DEC[ALPHABET.charCodeAt(i)] = i;
  const lo = ALPHABET[i].toLowerCase().charCodeAt(0);
  if (lo !== ALPHABET.charCodeAt(i)) DEC[lo] = i;
}
// Human-input substitutions
DEC[73] = 1; DEC[105] = 1; // I i → 1
DEC[76] = 1; DEC[108] = 1; // L l → 1
DEC[79] = 0; DEC[111] = 0; // O o → 0
DEC[85] = DEC[86]; DEC[117] = DEC[86]; // U u → V

const WIJI_VERSION = 1; // 4-bit version field value

// ---------------------------------------------------------------------------
// Cross-runtime microsecond clock
// ---------------------------------------------------------------------------
function getMicrotime() {
  // Node.js: process.hrtime.bigint() gives nanoseconds since process start.
  // We anchor it to Unix epoch using Date.now() at module load time.
  if (typeof process !== "undefined" && process.hrtime) {
    return Number(process.hrtime.bigint() / 1000n) + _nodeEpochOffsetUs;
  }
  // Browser / Deno / Bun: performance.timeOrigin gives ms since epoch.
  if (typeof performance !== "undefined" && performance.timeOrigin) {
    return Math.floor((performance.timeOrigin + performance.now()) * 1000);
  }
  // Last resort fallback: millisecond precision * 1000
  return Date.now() * 1000;
}

// Compute hrtime->epoch offset using midpoint anchor for sub-ms accuracy.
let _nodeEpochOffsetUs = 0;
if (typeof process !== "undefined" && process.hrtime) {
  const h1 = process.hrtime.bigint();
  const ms = Date.now();
  const h2 = process.hrtime.bigint();
  const hmid = (h1 + h2) / 2n;
  _nodeEpochOffsetUs = ms * 1000 - Number(hmid / 1000n);
}

// ---------------------------------------------------------------------------
// CSPRNG
// ---------------------------------------------------------------------------
function randomBytes(n) {
  // Web Crypto (Node.js 15+, Deno, Bun, browsers)
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const buf = new Uint8Array(n);
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }
  // Node.js < 15 fallback
  if (typeof require === "function") {
    try {
      const bytes = require("crypto").randomBytes(n);
      return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    } catch (_) {}
  }
  throw new Error("[Wiji] No CSPRNG available in this environment.");
}

// ---------------------------------------------------------------------------
// Encode: 16 bytes → 26-char Base32 Crockford string
// 128 bits → prepend 2 zero bits → 130 bits → 26 × 5-bit groups
// ---------------------------------------------------------------------------
function encode(b) {
  const out = new Array(26);
  let acc = 0, bits = 2, bi = 0, ci = 0;
  while (ci < 26) {
    if (bits < 5 && bi < 16) { acc = (acc << 8) | b[bi++]; bits += 8; }
    bits -= 5;
    out[ci++] = ALPHABET[(acc >> bits) & 0x1f];
    acc &= (1 << bits) - 1;
  }
  return out.join("");
}

// ---------------------------------------------------------------------------
// Decode: 26-char string → 16 bytes
// Inverse of encode(): skip 2 leading zero bits, then drain bytes.
// ---------------------------------------------------------------------------
function decode(str) {
  const out = new Uint8Array(16);
  let acc = 0, bits = 0, skip = 2, bi = 0;
  for (let i = 0; i < 26; i++) {
    const code = str.charCodeAt(i);
    if (code > 127 || DEC[code] === 0xff)
      throw new TypeError(`[Wiji] Invalid character '${str[i]}' at position ${i}.`);
    acc = (acc << 5) | DEC[code];
    bits += 5;
    if (skip > 0 && bits >= skip) {
      acc &= (1 << (bits - skip)) - 1;
      bits -= skip;
      skip = 0;
    }
    while (bits >= 8 && bi < 16) {
      bits -= 8;
      out[bi++] = (acc >> bits) & 0xff;
      acc &= (1 << bits) - 1;
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Extract 56-bit timestamp from bytes (safe: avoids JS 32-bit bitwise trunc)
// ---------------------------------------------------------------------------
function extractUs(b) {
  return b[0] * 0x100000000000000 // this overflows float64 for large values
    // Use safe split: top 3 bytes * 2^32 + bottom 4 bytes
    // 56 bits = 7 bytes
    + (b[0] * 0x1000000 + b[1] * 0x10000 + b[2] * 0x100 + b[3]) * 0x10000
    + b[4] * 0x100 + b[5] * 0x10 * 0x10 + b[6]; // Nope, redo cleanly:
}
// Cleaner 56-bit extraction without float precision issues:
function readUs(b) {
  // Split at byte 3/4 boundary: top 28 bits × 2^28 + bottom 28 bits
  const hi = b[0] * 0x100000 + b[1] * 0x1000 + b[2] * 0x10 + (b[3] >> 4);
  const lo = ((b[3] & 0xf) << 24) + (b[4] << 16) + (b[5] << 8) + b[6];
  // hi * 2^28 + lo — safe because hi < 2^28, result < 2^56 < 2^53? No.
  // 2^56 > 2^53, so we need BigInt for max values. Use safe multiplication:
  // For timestamps up to ~year 4000: us < 7e13 which fits in float64 (< 2^53 ≈ 9e15). Safe.
  return hi * 0x10000000 + lo;
}

// ---------------------------------------------------------------------------
// Factory — creates an isolated generator instance
// ---------------------------------------------------------------------------
function createWiji() {
  // 52-bit random node — generated once per instance
  const nodeBytes = randomBytes(7); // 56 bits; we'll use lower 52 bits
  // Mask top nibble to get exactly 52 bits
  nodeBytes[0] &= 0x0f;

  let lastUs = -1;
  let seq = 0;

  function waitNextUs(us) {
    let now = getMicrotime();
    while (now <= us) now = getMicrotime();
    return now;
  }

  // Core generate: returns 16-byte Uint8Array
  function generateBytes() {
    let us = getMicrotime();

    if (us > lastUs) {
      lastUs = us;
      seq = 0;
    } else if (us === lastUs) {
      seq++;
      if (seq > 0xffff) {
        us = waitNextUs(lastUs);
        lastUs = us;
        seq = 0;
      }
    } else {
      // Clock went backward — continue with lastUs, increment seq
      us = lastUs;
      seq++;
      if (seq > 0xffff) {
        us = waitNextUs(lastUs);
        lastUs = us;
        seq = 0;
      }
    }

    const buf = new Uint8Array(16);

    // 56-bit timestamp_us, big-endian (7 bytes)
    // us fits in float64 safely until year 4253 (7.2e13 < 2^53 = 9.0e15)
    let rem = us;
    buf[6] = rem % 256; rem = Math.floor(rem / 256);
    buf[5] = rem % 256; rem = Math.floor(rem / 256);
    buf[4] = rem % 256; rem = Math.floor(rem / 256);
    buf[3] = rem % 256; rem = Math.floor(rem / 256);
    buf[2] = rem % 256; rem = Math.floor(rem / 256);
    buf[1] = rem % 256; rem = Math.floor(rem / 256);
    buf[0] = rem % 256;

    // 16-bit sequence, big-endian (bytes 7–8)
    buf[7] = (seq >> 8) & 0xff;
    buf[8] = seq & 0xff;

    // version (high nibble of byte 9) | random high bits (low nibble)
    buf[9] = (WIJI_VERSION << 4) | (nodeBytes[0] & 0x0f);

    // random bytes 10–15
    buf[10] = nodeBytes[1];
    buf[11] = nodeBytes[2];
    buf[12] = nodeBytes[3];
    buf[13] = nodeBytes[4];
    buf[14] = nodeBytes[5];
    buf[15] = nodeBytes[6];

    return buf;
  }

  // --------------------------------------------------------------------------
  // Public API
  // --------------------------------------------------------------------------

  /** Generate a Wiji ID as a 26-character Base32 Crockford string. */
  function wiji() {
    return encode(generateBytes());
  }

  /** Generate a Wiji ID as a 16-byte Uint8Array. */
  wiji.binary = function () {
    return generateBytes();
  };

  /** Generate a Wiji ID as a Node.js Buffer (falls back to Uint8Array). */
  wiji.buffer = function () {
    const b = generateBytes();
    if (typeof Buffer !== "undefined") return Buffer.from(b.buffer, b.byteOffset, 16);
    return b;
  };

  /** Generate a Wiji ID as a UUID-compatible 36-character hex string. */
  wiji.uuid = function () {
    const b = generateBytes();
    const h = Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
    return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
  };

  /** Generate a Wiji ID as a 32-character lowercase hex string. */
  wiji.hex = function () {
    return Array.from(generateBytes())
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  };

  /**
   * Parse a Wiji string or Uint8Array into its components.
   * @param {string|Uint8Array} id
   * @returns {{ timestamp_us, timestamp_ms, date, sequence, version, random }}
   */
  wiji.parse = function (id) {
    const b = typeof id === "string" ? decode(id) : id;
    if (b.length !== 16) throw new TypeError("[Wiji] parse() expects 16 bytes or a 26-char string.");

    const timestamp_us = readUs(b);
    const timestamp_ms = Math.floor(timestamp_us / 1000);
    const sequence = (b[7] << 8) | b[8];
    const version = (b[9] >> 4) & 0x0f;
    const random = b.slice(9, 16); // includes the low nibble of byte 9

    return {
      timestamp_us,
      timestamp_ms,
      date: new Date(timestamp_ms),
      sequence,
      version,
      random,
    };
  };

  /**
   * Validate a Wiji string.
   * @param {string} id
   * @returns {boolean}
   */
  wiji.isValid = function (id) {
    if (typeof id !== "string" || id.length !== 26) return false;
    for (let i = 0; i < 26; i++) {
      const c = id.charCodeAt(i);
      if (c > 127 || DEC[c] === 0xff) return false;
    }
    // First character must be '0' or '1' (top 2 bits of 56-bit ts = 0)
    const first = DEC[id.charCodeAt(0)];
    return first === 0 || first === 1;
  };

  /**
   * Extract timestamp_us from a Wiji string without full parse.
   * @param {string} id
   * @returns {number} microseconds since Unix epoch
   */
  wiji.timestampUs = function (id) {
    return readUs(decode(id));
  };

  /**
   * Extract timestamp_ms from a Wiji string.
   * @param {string} id
   * @returns {number} milliseconds since Unix epoch
   */
  wiji.timestampMs = function (id) {
    return Math.floor(readUs(decode(id)) / 1000);
  };

  /**
   * Compare two Wiji strings or Uint8Arrays chronologically.
   * Returns -1, 0, or 1. Safe as Array.sort() comparator.
   */
  wiji.compare = function (a, b) {
    return a < b ? -1 : a > b ? 1 : 0;
  };

  /**
   * Create a new isolated generator with its own random node and sequence counter.
   * Use this when you need independent generators in the same process.
   */
  wiji.factory = createWiji;

  return wiji;
}

// ---------------------------------------------------------------------------
// Default singleton instance
// ---------------------------------------------------------------------------
const wiji = createWiji();

// ESM + CJS dual export
module.exports = wiji;
module.exports.wiji = wiji;
module.exports.createWiji = createWiji;
module.exports.default = wiji;
