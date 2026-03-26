# Wiji Specification — Version 1.0.0

> **Wiji** (ꦮꦶꦗꦶ) — *benih* dalam bahasa Jawa.
> Setiap entitas dimulai dari sebuah benih. Setiap record dimulai dari Wiji.
>
> A product of [Sangkan](https://sangkan.dev) — Building the Source.

---

## 1. Overview

Wiji is a 128-bit, timestamp-first, monotonic unique identifier designed for:

- Optimal B+ tree performance in relational and NoSQL databases
- Microsecond-precision time extraction
- Guaranteed monotonicity within a generator instance
- Safe operation across distributed processes without coordination
- Deterministic encoding across all language implementations

---

## 2. Bit Layout

```
 127                                                              0
  ┌──────────────────────────┬────────────────┬────┬─────────────────────────────────┐
  │       timestamp_us       │    sequence    │ver │            random               │
  │         56 bits          │    16 bits     │ 4b │            52 bits              │
  └──────────────────────────┴────────────────┴────┴─────────────────────────────────┘
  bit 127                 bit 72           bit 56  bit 55 bit 52               bit 0
```

Total: **128 bits = 16 bytes**

---

## 3. Field Definitions

### 3.1 `timestamp_us` — bits [127..72] — 56 bits

- **Unit**: Microseconds since Unix epoch (January 1, 1970 00:00:00.000000 UTC)
- **Encoding**: Big-endian unsigned integer, MSB first
- **Range**: 0 to 72,057,594,037,927,935 µs — valid until **year 4253**
- **Source**: Platform high-resolution clock
  - Node.js: `process.hrtime.bigint()` anchored to Unix epoch
  - Browser/Deno/Bun: `BigInt(Date.now()) * 1000n + BigInt(Math.floor(performance.now() % 1 * 1000))`
  - PHP: `(int)(microtime(true) * 1_000_000)` or `hrtime(true) / 1000` (PHP 7.3+)
  - Python: `time.time_ns() // 1000`
  - Go: `time.Now().UnixMicro()`
  - Rust: `SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_micros()`

> **Clock drift rule**: If the platform clock moves backward, the generator MUST NOT
> decrease the timestamp. Continue with `last_timestamp_us` and increment sequence.
> If sequence overflows during drift, spin-wait until the real clock advances past
> `last_timestamp_us`.

### 3.2 `sequence` — bits [71..56] — 16 bits

- **Range**: 0 to 65,535
- **Encoding**: Big-endian unsigned integer
- **Behavior**:
  1. `current_us > last_us` → reset sequence to `0`, set `last_us = current_us`
  2. `current_us == last_us` → increment sequence by `1`
  3. sequence overflows (`> 65535`) → spin-wait until `current_us > last_us`, reset to `0`
- **Scope**: Per generator instance. Independent instances may share (timestamp, sequence)
  pairs — this is safe because their `random` fields differ.

### 3.3 `version` — bits [55..52] — 4 bits

- **Value**: Always `0x1` for Wiji v1
- **Encoding**: Stored in the high nibble of byte 9
- **Purpose**: Enables forward-compatible format evolution. A parser detecting an unknown
  version SHOULD surface an error rather than silently misinterpret the ID.
- **Reserved**: `0x2`–`0xF` are reserved for future Wiji versions.

### 3.4 `random` — bits [51..0] — 52 bits

- **Source**: Cryptographically secure random number generator (CSPRNG)
  - JavaScript: `crypto.getRandomValues()`
  - PHP: `random_bytes(7)` (use lower 52 bits)
  - Python: `secrets.token_bytes(7)`
  - Go: `crypto/rand.Read()`
  - Rust: `rand::rngs::OsRng`
- **Generation**: Generated **once per generator instance** at init time, reused for all
  IDs from that instance. Provides process/machine isolation without coordination.

---

## 4. Byte Layout (16 bytes, big-endian)

```
Byte  Content
----  -----------------------------------------------
  0   timestamp_us bits [55..48]   — high byte
  1   timestamp_us bits [47..40]
  2   timestamp_us bits [39..32]
  3   timestamp_us bits [31..24]
  4   timestamp_us bits [23..16]
  5   timestamp_us bits [15..8]
  6   timestamp_us bits [7..0]     — low byte
  7   sequence bits [15..8]        — high byte
  8   sequence bits [7..0]         — low byte
  9   version bits [3..0] (high nibble)  |  random bits [51..48] (low nibble)
 10   random bits [47..40]
 11   random bits [39..32]
 12   random bits [31..24]
 13   random bits [23..16]
 14   random bits [15..8]
 15   random bits [7..0]           — low byte
```

---

## 5. String Encoding

### 5.1 Primary: Base32 Crockford (26 characters)

Alphabet: `0123456789ABCDEFGHJKMNPQRSTVWXYZ`

The 128-bit value is encoded as 26 × 5-bit groups (130 bits total; 2 leading zero bits
are prepended before encoding, and the first character is always `0` or `1`).

- Generated as **uppercase**
- Parsers MUST accept both uppercase and lowercase
- Human-input substitutions: `I`→`1`, `L`→`1`, `O`→`0`, `U`→`V`

Example: `01JKM5WXR9P003K1F4Q8XTBZN2`

### 5.2 UUID-compatible (36 characters)

Format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (lowercase hex, groups: 8-4-4-4-12)

The 16 raw bytes are hex-encoded and split with hyphens at the standard UUID positions.
This is NOT a valid UUID by RFC 4122 but is accepted by most UUID storage columns.

Example: `019d2257-972f-1a4e-36ea-81d64ed08dfc`

### 5.3 Hex (32 characters)

32 lowercase hex characters, no separators.

Example: `019d2257972f1a4e36ea81d64ed08dfc`

---

## 6. Binary

Raw 16 bytes in the layout from Section 4. Recommended for:
- MySQL `BINARY(16)` columns
- PostgreSQL `bytea` or `uuid` columns
- Binary protocols (gRPC, MessagePack, Protocol Buffers)

---

## 7. Sorting Guarantee

Wiji IDs sort correctly using standard byte-wise (big-endian) comparison on both:
- The raw 16-byte binary representation
- The Base32 Crockford string representation

This holds because the timestamp occupies the most significant bits, followed by the
sequence counter, making every Wiji monotonically ordered within a generator instance.

---

## 8. Validation Rules

**String (26 chars)**:
1. Length == 26
2. All characters in Base32 Crockford alphabet (case-insensitive, with substitutions)
3. First character is `0` or `1` (timestamp high bits = 0)

**Binary (16 bytes)**:
1. Length == 16
2. High nibble of byte 9 is `0x1` (for v1)

---

## 9. Required API (all implementations)

Every conforming implementation MUST expose:

```
wiji()           → string (26-char Base32 Crockford)
wiji.binary()    → bytes (16 raw bytes)
wiji.uuid()      → string (36-char UUID-compatible)
wiji.hex()       → string (32-char lowercase hex)
wiji.parse(id)   → { timestamp_us, timestamp_ms, date, sequence, version, random }
wiji.isValid(id) → boolean
wiji.compare(a, b) → -1 | 0 | 1
wiji.factory()   → new isolated generator instance (own random node + sequence)
```

---

## 10. Reference Comparison (Informative)

This table is **informative only**. Wiji is specified as a deterministic, timestamp-first,
monotonic identifier format; it does not attempt to “replace” any existing standard.

| Property            | UUID v4 | UUID v7 | ULID    | KSUID  | Snowflake | **Wiji v1** |
|---------------------|---------|---------|---------|--------|-----------|-------------|
| Total bits          | 128     | 128     | 128     | 160    | 64        | **128**     |
| Timestamp precision | —       | 1 ms    | 1 ms    | 1 s    | 1 ms      | **1 µs**    |
| Timestamp bits      | 0       | 48      | 48      | 32     | 41        | **56**      |
| Sequence bits       | 0       | 12      | 0       | 0      | 12        | **16**      |
| Random bits         | 122     | 62      | 80      | 128    | 0         | **52**      |
| B+ tree friendly    | No      | Yes     | Yes     | Yes    | Yes       | **Yes**     |
| Monotonic           | No      | Partial | Partial | No     | Yes*      | **Yes**     |
| Version field       | Yes 4b  | Yes 4b  | No      | No     | No        | **Yes 4b**  |
| Binary output       | Yes     | Yes     | No      | No     | No        | **Yes**     |
| Zero deps           | No      | No      | No      | No     | No        | **Yes**     |
| Valid until         | —       | 10889   | 10889   | 2106   | 2079      | **4253**    |
| String length       | 36      | 36      | 26      | 27     | varies    | **26**      |

*Snowflake requires machine ID coordination.

---

## 11. Reference Test Vectors

All implementations MUST produce identical output for these inputs:

```
Vector 1 — minimum (all-zero fields, version=1):
  timestamp_us : 0
  sequence     : 0
  version      : 1
  random       : 0
  bytes (hex)  : 00 00 00 00 00 00 00 00 00 10 00 00 00 00 00 00
  base32       : 0000000000000000100000000000  (note: byte 9 high nibble = 0x1)

Vector 2 — known timestamp:
  timestamp_us : 1_774_397_000_000 (2026-03-25T00:03:20.000000Z)
  sequence     : 42
  version      : 1
  random       : 0xABCDEF012345
  bytes (hex)  : 00 06 52 4D E0 00 00 00 2A 1A BC DE F0 12 34 50
                 (note: byte 9 = ver(0x1) << 4 | rnd_high(0xA) = 0x1A)
  base32       : (implementations compute and cross-verify)
```

---

## 12. License

This specification is released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).
Anyone may implement Wiji without restriction or attribution.

*Forged at [Sangkan](https://sangkan.dev) — Building the Source.*
