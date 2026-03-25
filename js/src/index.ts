/* eslint-disable @typescript-eslint/consistent-type-assertions */

/**
 * Wiji (ꦮꦶꦗꦶ) — Optimized Unique Identifier
 * Forged at Sangkan (https://sangkan.dev) — Building the Source.
 *
 * Spec: https://github.com/sangkan-dev/wiji/blob/main/spec/WIJI_SPEC.md
 *
 * Bit layout (128-bit):
 * ┌──────────────────────────┬────────────────┬────┬─────────────────────────────────┐
 * │       timestamp_us       │    sequence    │ver │            random               │
 * │         56 bits          │    16 bits     │ 4b │            52 bits              │
 * └──────────────────────────┴────────────────┴────┴─────────────────────────────────┘
 *
 * Runtime support: Node.js, Bun, Deno, modern browsers
 */

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const WIJI_VERSION = 1; // 4-bit version field value

const DEC = new Uint8Array(128).fill(0xff);
for (let i = 0; i < 32; i++) {
  const cp = ALPHABET.codePointAt(i);
  if (cp === undefined) continue;
  DEC[cp] = i;
  const lo = ALPHABET[i].toLowerCase().codePointAt(0);
  if (lo !== undefined && lo !== cp) DEC[lo] = i;
}
// Human-input substitutions
DEC[73] = 1; DEC[105] = 1; // I i → 1
DEC[76] = 1; DEC[108] = 1; // L l → 1
DEC[79] = 0; DEC[111] = 0; // O o → 0
DEC[85] = DEC[86]; DEC[117] = DEC[86]; // U u → V

type WijiParsed = {
  timestamp_us: bigint;
  timestamp_ms: number;
  date: Date;
  sequence: number;
  version: number;
  /** 7 bytes containing random-high-nibble (no version nibble) + 48-bit random tail */
  random: Uint8Array;
};

export type WijiGenerator = {
  (): string;
  binary(): Uint8Array;
  buffer(): Uint8Array;
  uuid(): string;
  hex(): string;
  parse(id: string | Uint8Array): WijiParsed;
  isValid(id: unknown): id is string;
  timestampUs(id: string): bigint;
  timestampMs(id: string): number;
  compare(a: string | Uint8Array, b: string | Uint8Array): -1 | 0 | 1;
  factory(): WijiGenerator;
};

function getMicrotimeUs(): bigint {
  // Node.js: epoch-anchored microseconds using hrtime anchored to Date.now() at init.
  if (typeof process !== "undefined" && typeof process.hrtime?.bigint === "function") {
    return process.hrtime.bigint() / 1000n + nodeEpochOffsetUs;
  }
  // Browser / Deno / Bun
  if (typeof performance !== "undefined" && typeof performance.timeOrigin === "number") {
    // timeOrigin/now are milliseconds; convert to microseconds
    const us = Math.floor((performance.timeOrigin + performance.now()) * 1000);
    return BigInt(us);
  }
  // Fallback: ms precision
  return BigInt(Date.now()) * 1000n;
}

let nodeEpochOffsetUs = 0n;
if (typeof process !== "undefined" && typeof process.hrtime?.bigint === "function") {
  const h1 = process.hrtime.bigint();
  const ms = Date.now();
  const h2 = process.hrtime.bigint();
  const hmid = (h1 + h2) / 2n;
  nodeEpochOffsetUs = BigInt(ms) * 1000n - (hmid / 1000n);
}

function randomBytes(n: number): Uint8Array {
  if (typeof globalThis !== "undefined" && globalThis.crypto?.getRandomValues) {
    const buf = new Uint8Array(n);
    globalThis.crypto.getRandomValues(buf);
    return buf;
  }
  // Node fallback (only available in Node / CJS context)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const nodeCrypto = require("node:crypto");
    const bytes = nodeCrypto.randomBytes(n);
    return new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  } catch {
    throw new Error("[Wiji] No CSPRNG available in this environment.");
  }
}

function encode(b: Uint8Array): string {
  // 128 bits → prepend 2 zero bits → 130 bits → 26 × 5-bit groups
  const out = new Array<string>(26);
  let acc = 0;
  let bits = 2;
  let bi = 0;
  let ci = 0;
  while (ci < 26) {
    if (bits < 5 && bi < 16) {
      acc = (acc << 8) | b[bi++];
      bits += 8;
    }
    bits -= 5;
    out[ci++] = ALPHABET[(acc >> bits) & 0x1f];
    acc &= (1 << bits) - 1;
  }
  return out.join("");
}

function decode(str: string): Uint8Array {
  if (str.length !== 26) throw new TypeError(`[Wiji] Expected 26-char string, got ${str.length}.`);
  const out = new Uint8Array(16);
  let acc = 0;
  let bits = 0;
  let skip = 2;
  let bi = 0;
  for (let i = 0; i < 26; i++) {
    const code = str.codePointAt(i) ?? 0;
    if (code > 127 || DEC[code] === 0xff) {
      throw new TypeError(`[Wiji] Invalid character '${str[i]}' at position ${i}.`);
    }
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

function readTimestampUs(b: Uint8Array): bigint {
  // 7 bytes big-endian
  let x = 0n;
  for (const byte of b.subarray(0, 7)) x = (x << 8n) | BigInt(byte);
  return x;
}

function writeTimestampUs(buf: Uint8Array, us: bigint): void {
  // Write 56-bit big-endian into bytes 0..6
  let x = us & ((1n << 56n) - 1n);
  for (let i = 6; i >= 0; i--) {
    buf[i] = Number(x & 0xffn);
    x >>= 8n;
  }
}

function bytesToHex(b: Uint8Array): string {
  let out = "";
  for (const byte of b) out += byte.toString(16).padStart(2, "0");
  return out;
}

function compareBytes16(a: Uint8Array, b: Uint8Array): -1 | 0 | 1 {
  for (let i = 0; i < 16; i++) {
    const av = a[i];
    const bv = b[i];
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

function waitNextUs(us: bigint): bigint {
  let now = getMicrotimeUs();
  while (now <= us) now = getMicrotimeUs();
  return now;
}

function createWiji(): WijiGenerator {
  // 52-bit random node — generated once per instance
  const node = randomBytes(7); // 56 bits; use lower 52 by masking top nibble
  node[0] &= 0x0f;

  let lastUs = -1n;
  let seq = 0;

  function generateBytes(): Uint8Array {
    let us = getMicrotimeUs();

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

    writeTimestampUs(buf, us);

    buf[7] = (seq >> 8) & 0xff;
    buf[8] = seq & 0xff;

    // version (high nibble of byte 9) | random high nibble (low nibble)
    buf[9] = (WIJI_VERSION << 4) | (node[0] & 0x0f);
    buf[10] = node[1];
    buf[11] = node[2];
    buf[12] = node[3];
    buf[13] = node[4];
    buf[14] = node[5];
    buf[15] = node[6];

    return buf;
  }

  const wijiFn = (() => encode(generateBytes())) as unknown as WijiGenerator;

  wijiFn.binary = () => generateBytes();

  wijiFn.buffer = () => {
    const b = generateBytes();
    return b;
  };

  wijiFn.uuid = () => {
    const h = bytesToHex(generateBytes());
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
  };

  wijiFn.hex = () => bytesToHex(generateBytes());

  wijiFn.parse = (id: string | Uint8Array) => {
    const b = typeof id === "string" ? decode(id) : id;
    if (!(b instanceof Uint8Array) || b.length !== 16) {
      throw new TypeError("[Wiji] parse() expects 16 bytes or a 26-char string.");
    }

    const timestamp_us = readTimestampUs(b);
    const timestamp_ms = Number(timestamp_us / 1000n);
    const sequence = (b[7] << 8) | b[8];
    const version = (b[9] >> 4) & 0x0f;

    // 52-bit random node as 7 bytes: first byte is random-high-nibble (no version nibble)
    const random = new Uint8Array(7);
    random[0] = b[9] & 0x0f;
    random.set(b.slice(10, 16), 1);

    return {
      timestamp_us,
      timestamp_ms,
      date: new Date(timestamp_ms),
      sequence,
      version,
      random,
    };
  };

  wijiFn.isValid = (id: unknown): id is string => {
    if (typeof id !== "string" || id.length !== 26) return false;
    for (let i = 0; i < 26; i++) {
      const c = id.codePointAt(i) ?? 0;
      if (c > 127 || DEC[c] === 0xff) return false;
    }
    const firstCode = id.codePointAt(0) ?? 0;
    const first = firstCode > 127 ? 0xff : DEC[firstCode];
    return first === 0 || first === 1;
  };

  wijiFn.timestampUs = (id: string) => readTimestampUs(decode(id));
  wijiFn.timestampMs = (id: string) => Number(readTimestampUs(decode(id)) / 1000n);

  wijiFn.compare = (a: string | Uint8Array, b: string | Uint8Array) => {
    if (typeof a === "string" && typeof b === "string") {
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    }
    const ab = typeof a === "string" ? decode(a) : a;
    const bb = typeof b === "string" ? decode(b) : b;
    if (ab.length !== 16 || bb.length !== 16) throw new TypeError("[Wiji] compare() expects Wiji strings or 16-byte arrays.");
    return compareBytes16(ab, bb);
  };

  wijiFn.factory = createWiji;

  return wijiFn;
}

const wiji = createWiji();

// CJS convenience: make `require('@sangkan/wiji')` return the callable generator.
// (In ESM builds, `module` is undefined and this is a no-op.)
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
  module.exports = Object.assign(wiji, { wiji, createWiji, default: wiji });
}

export default wiji;
export { wiji, createWiji };

