/**
 * Wiji (ꦮꦶꦗꦶ) — Optimized Unique Identifier
 * TypeScript type definitions
 * https://github.com/sangkan-dev/wiji
 */

export interface WijiParsed {
  /** Microseconds since Unix epoch */
  timestamp_us: number;
  /** Milliseconds since Unix epoch */
  timestamp_ms: number;
  /** JavaScript Date object (millisecond precision) */
  date: Date;
  /** 16-bit monotonic sequence counter (0–65535) */
  sequence: number;
  /** Version field — always 1 for Wiji v1 */
  version: number;
  /** 7 bytes containing version nibble + 52-bit random node */
  random: Uint8Array;
}

export interface WijiGenerator {
  /** Generate a Wiji ID as a 26-character Base32 Crockford string */
  (): string;

  /** Generate a Wiji ID as a 16-byte Uint8Array */
  binary(): Uint8Array;

  /** Generate a Wiji ID as a Node.js Buffer (falls back to Uint8Array in non-Node envs) */
  buffer(): Buffer | Uint8Array;

  /** Generate a Wiji ID as a UUID-compatible 36-character string */
  uuid(): string;

  /** Generate a Wiji ID as a 32-character lowercase hex string */
  hex(): string;

  /**
   * Parse a Wiji string or binary into its components.
   * @throws {TypeError} if input is not a valid 26-char string or 16-byte Uint8Array
   */
  parse(id: string | Uint8Array): WijiParsed;

  /**
   * Validate a Wiji string.
   * Returns true if the string is a valid 26-character Wiji ID.
   */
  isValid(id: unknown): id is string;

  /** Extract microsecond timestamp from a Wiji string */
  timestampUs(id: string): number;

  /** Extract millisecond timestamp from a Wiji string */
  timestampMs(id: string): number;

  /**
   * Compare two Wiji strings chronologically.
   * Returns -1, 0, or 1. Safe as Array.sort() comparator.
   */
  compare(a: string, b: string): -1 | 0 | 1;

  /**
   * Create a new isolated generator instance with its own random node
   * and independent sequence counter. Use when you need multiple
   * independent generators in the same process.
   */
  factory(): WijiGenerator;
}

declare const wiji: WijiGenerator;
export default wiji;
export { wiji };
export { wiji as createWiji };
