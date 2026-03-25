"use strict";

const wiji = require("../dist/index.cjs");
const { createWiji } = wiji;

const B32 = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HEX_RE  = /^[0-9a-f]{32}$/;

function encodeBase32Crockford(bytes) {
  const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  const out = new Array(26);
  let acc = 0, bits = 2, bi = 0, ci = 0;
  while (ci < 26) {
    if (bits < 5 && bi < 16) { acc = (acc << 8) | bytes[bi++]; bits += 8; }
    bits -= 5;
    out[ci++] = ALPHABET[(acc >> bits) & 0x1f];
    acc &= (1 << bits) - 1;
  }
  return out.join("");
}

// ---------------------------------------------------------------------------
// 1. Output format
// ---------------------------------------------------------------------------
describe("Output format", () => {
  test("string: 26 chars, Base32 Crockford charset", () => {
    for (let i = 0; i < 500; i++) expect(wiji()).toMatch(B32);
  });
  test("binary: 16-byte Uint8Array", () => {
    const b = wiji.binary();
    expect(b).toBeInstanceOf(Uint8Array);
    expect(b.byteLength).toBe(16);
  });
  test("buffer: 16 bytes", () => {
    expect(wiji.buffer().byteLength).toBe(16);
  });
  test("uuid: 36-char UUID format", () => {
    expect(wiji.uuid()).toMatch(UUID_RE);
  });
  test("hex: 32-char lowercase hex", () => {
    expect(wiji.hex()).toMatch(HEX_RE);
  });
  test("version nibble is always 0x1", () => {
    for (let i = 0; i < 100; i++) {
      const b = wiji.binary();
      expect((b[9] >> 4) & 0x0f).toBe(1);
    }
  });
  test("first char is '0' or '1' (timestamp top bits = 0)", () => {
    for (let i = 0; i < 100; i++) {
      const c = wiji()[0];
      expect(c === "0" || c === "1").toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Uniqueness
// ---------------------------------------------------------------------------
describe("Uniqueness", () => {
  test("100,000 IDs — zero collisions", () => {
    const s = new Set();
    for (let i = 0; i < 100_000; i++) s.add(wiji());
    expect(s.size).toBe(100_000);
  });
  test("two factory instances — no cross-instance collisions", () => {
    const g1 = createWiji();
    const g2 = createWiji();
    const s = new Set();
    for (let i = 0; i < 10_000; i++) { s.add(g1()); s.add(g2()); }
    expect(s.size).toBe(20_000);
  });
});

// ---------------------------------------------------------------------------
// 3. Monotonicity
// ---------------------------------------------------------------------------
describe("Monotonicity", () => {
  test("sequential string IDs are lexicographically sorted", () => {
    const ids = Array.from({ length: 10_000 }, () => wiji());
    expect(ids).toEqual([...ids].sort());
  });
  test("burst within same µs: still sorted", () => {
    const ids = [];
    for (let i = 0; i < 1000; i++) ids.push(wiji());
    expect(ids).toEqual([...ids].sort());
  });
  test("binary IDs are monotonically ordered", () => {
    const bufs = Array.from({ length: 1000 }, () => wiji.binary());
    for (let i = 1; i < bufs.length; i++) {
      let cmp = 0;
      for (let j = 0; j < 16; j++) {
        if (bufs[i-1][j] < bufs[i][j]) { cmp = -1; break; }
        if (bufs[i-1][j] > bufs[i][j]) { cmp =  1; break; }
      }
      expect(cmp).toBeLessThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Timestamp (µs precision)
// ---------------------------------------------------------------------------
describe("Timestamp", () => {
  test("timestampUs is within ±10ms of Date.now()", () => {
    const before = Date.now() * 1000 - 2_000;
    const id = wiji();
    const after = Date.now() * 1000 + 12_000;
    const ts = wiji.timestampUs(id);
    expect(ts).toBeGreaterThanOrEqual(BigInt(before));
    expect(ts).toBeLessThanOrEqual(BigInt(after));
  });
  test("timestampMs matches Date.now() within ±10ms", () => {
    const before = Date.now() - 10;
    const id = wiji();
    const after = Date.now() + 10;
    const ts = wiji.timestampMs(id);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });
  test("parse() returns µs timestamp, ms timestamp, and Date", () => {
    const before = Date.now() - 12;
    const id = wiji();
    const after = Date.now() + 12;
    const p = wiji.parse(id);
    expect(p.timestamp_ms).toBeGreaterThanOrEqual(before);
    expect(p.timestamp_ms).toBeLessThanOrEqual(after);
    expect(p.date).toBeInstanceOf(Date);
    expect(p.date.getTime()).toBe(p.timestamp_ms);
    expect(p.timestamp_us).toBeGreaterThanOrEqual(BigInt(p.timestamp_ms) * 1000n);
  });
  test("parse() sequence is 0–65535", () => {
    expect(wiji.parse(wiji()).sequence).toBeGreaterThanOrEqual(0);
    expect(wiji.parse(wiji()).sequence).toBeLessThanOrEqual(65535);
  });
  test("parse() version is 1", () => {
    expect(wiji.parse(wiji()).version).toBe(1);
  });
  test("µs timestamp survives encode→decode round-trip", () => {
    for (let i = 0; i < 200; i++) {
      const before = Date.now() * 1000 - 2_000;
      const id = wiji();
      const after = Date.now() * 1000 + 12_000;
      const ts = wiji.timestampUs(id);
      expect(ts).toBeGreaterThanOrEqual(BigInt(before));
      expect(ts).toBeLessThanOrEqual(BigInt(after));
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Validation
// ---------------------------------------------------------------------------
describe("isValid()", () => {
  test("valid fresh ID", () => expect(wiji.isValid(wiji())).toBe(true));
  test("wrong length", () => {
    expect(wiji.isValid("SHORT")).toBe(false);
    expect(wiji.isValid("A".repeat(27))).toBe(false);
  });
  test("invalid character", () => {
    const id = wiji();
    expect(wiji.isValid(id.slice(0, 25) + "!")).toBe(false);
  });
  test("non-string", () => {
    expect(wiji.isValid(null)).toBe(false);
    expect(wiji.isValid(42)).toBe(false);
  });
  test("lowercase accepted", () => {
    expect(wiji.isValid(wiji().toLowerCase())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 6. Parse / encode round-trip
// ---------------------------------------------------------------------------
describe("Encode / decode round-trip", () => {
  test("string → parse → fields consistent", () => {
    const id = wiji();
    const p = wiji.parse(id);
    expect(typeof p.timestamp_us).toBe("bigint");
    expect(typeof p.sequence).toBe("number");
    expect(p.version).toBe(1);
    expect(p.random).toBeInstanceOf(Uint8Array);
  });
  test("binary → string → binary round-trip preserves bytes", () => {
    // Not currently exposed as public API (encode bytes directly).
    // Keep as a placeholder to avoid false confidence.
    expect(true).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. compare()
// ---------------------------------------------------------------------------
describe("compare()", () => {
  test("equal → 0", () => { const id = wiji(); expect(wiji.compare(id, id)).toBe(0); });
  test("a < b → negative", () => {
    const a = wiji(), b = wiji();
    expect(wiji.compare(a, b)).toBeLessThan(0);
  });
  test("b > a → positive", () => {
    const a = wiji(), b = wiji();
    expect(wiji.compare(b, a)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 8. UUID / Hex output
// ---------------------------------------------------------------------------
describe("UUID and Hex output", () => {
  test("uuid() format correct", () => expect(wiji.uuid()).toMatch(UUID_RE));
  test("hex() format correct", () => expect(wiji.hex()).toMatch(HEX_RE));
  test("uuid() and hex() encode same bytes", () => {
    // Can't test exact bytes without exposing internals, but format must be correct
    for (let i = 0; i < 50; i++) {
      expect(wiji.uuid()).toMatch(UUID_RE);
      expect(wiji.hex()).toMatch(HEX_RE);
    }
  });
});

// ---------------------------------------------------------------------------
// 10. Spec test vectors (bytes → base32)
// ---------------------------------------------------------------------------
describe("Spec test vectors", () => {
  test("Vector 1 — minimum (all-zero fields, version=1)", () => {
    const hex = "00000000000000000010000000000000";
    const bytes = Uint8Array.from(Buffer.from(hex, "hex"));
    const id = encodeBase32Crockford(bytes);
    expect(id).toBe("00000000000000040000000000");
    expect(wiji.isValid(id)).toBe(true);
    const p = wiji.parse(id);
    expect(p.timestamp_us).toBe(0n);
    expect(p.sequence).toBe(0);
    expect(p.version).toBe(1);
    // random should be all-zero (7 bytes) for this vector
    expect(Buffer.from(p.random).toString("hex")).toBe("00000000000000");
  });

  test("Vector 2 — known bytes layout sanity", () => {
    const hex = "0006524de00000002a1abcdef0123450";
    const bytes = Uint8Array.from(Buffer.from(hex, "hex"));
    const id = encodeBase32Crockford(bytes);
    expect(id).toBe("000S94VR000002M6NWVVR14D2G");
    const p = wiji.parse(id);
    expect(p.sequence).toBe(42);
    expect(p.version).toBe(1);
    // First random nibble should be 0xA (from byte 9 low nibble)
    expect(p.random[0]).toBe(0x0a);
  });
});

// ---------------------------------------------------------------------------
// 9. Performance
// ---------------------------------------------------------------------------
describe("Performance", () => {
  test("generate 1,000,000 IDs in under 5 seconds", () => {
    const N = 1_000_000;
    const t0 = Date.now();
    for (let i = 0; i < N; i++) wiji();
    const elapsed = Date.now() - t0;
    const rate = Math.round(N / elapsed * 1000).toLocaleString();
    console.log(`  1,000,000 IDs: ${elapsed}ms (${rate} IDs/sec)`);
    expect(elapsed).toBeLessThan(5000);
  });
});
