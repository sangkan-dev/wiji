<?php

declare(strict_types=1);

namespace Sangkan\Wiji;

/**
 * Wiji (ꦮꦶꦗꦶ) — Optimized Unique Identifier
 * Forged at Sangkan (https://sangkan.dev) — Building the Source.
 *
 * Spec: https://github.com/sangkan-dev/wiji/blob/main/spec/WIJI_SPEC.md
 *
 * Bit layout (128-bit / 16 bytes):
 *   [0-6]  56-bit microsecond timestamp (big-endian)
 *   [7-8]  16-bit sequence counter (big-endian)
 *   [9]    version (high nibble=0x1) | random high nibble
 *   [10-15] random low 6 bytes
 *
 * Requirements: PHP 7.3+ (uses hrtime), PHP 8.0+ recommended
 */
final class Wiji
{
    // Base32 Crockford alphabet
    private const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    private const VERSION  = 1;

    /** @var int 52-bit random node (stored as two parts to avoid int overflow on 32-bit PHP) */
    private int $randomHiNibble; // 4-bit: bits [51..48]
    /** @var string 6 raw bytes: bits [47..0] */
    private string $randomLowBytes;

    private int $lastUs  = -1;
    private int $seq     = 0;

    /** Decoding table (lazy-built once per process) */
    private static ?array $decoding = null;

    public function __construct()
    {
        // Generate 52-bit random node (7 bytes, mask top nibble)
        $rnd = random_bytes(7);
        $this->randomHiNibble = (ord($rnd[0]) & 0x0f); // 4-bit high part
        $this->randomLowBytes  = substr($rnd, 1, 6);    // 6-byte low part
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    /**
     * Generate a Wiji ID as a 26-character Base32 Crockford string.
     */
    public function generate(): string
    {
        return self::encode($this->generateBytes());
    }

    /**
     * Generate a Wiji ID as a 16-byte binary string.
     */
    public function generateBinary(): string
    {
        return $this->generateBytes();
    }

    /**
     * Generate a Wiji ID as a UUID-compatible 36-character hex string.
     */
    public function generateUuid(): string
    {
        $hex = bin2hex($this->generateBytes());
        return sprintf(
            '%s-%s-%s-%s-%s',
            substr($hex, 0,  8),
            substr($hex, 8,  4),
            substr($hex, 12, 4),
            substr($hex, 16, 4),
            substr($hex, 20, 12)
        );
    }

    /**
     * Generate a Wiji ID as a 32-character lowercase hex string.
     */
    public function generateHex(): string
    {
        return bin2hex($this->generateBytes());
    }

    // -------------------------------------------------------------------------
    // Static helpers (can be called without an instance)
    // -------------------------------------------------------------------------

    /**
     * Parse a Wiji string into its components.
     *
     * @param  string $id  26-char Wiji string
     * @return array{timestamp_us:int, timestamp_ms:int, datetime:\DateTimeImmutable, sequence:int, version:int, random:string}
     * @throws \InvalidArgumentException
     */
    public static function parse(string $id): array
    {
        $bytes = self::decode($id);
        return self::parseBytes($bytes);
    }

    /**
     * Parse raw 16-byte binary into components.
     *
     * @param  string $bytes  16 raw bytes
     * @return array{timestamp_us:int, timestamp_ms:int, datetime:\DateTimeImmutable, sequence:int, version:int, random:string}
     */
    public static function parseBytes(string $bytes): array
    {
        if (strlen($bytes) !== 16) {
            throw new \InvalidArgumentException('[Wiji] parseBytes() expects exactly 16 bytes.');
        }

        $timestamp_us = self::readUs($bytes);
        $timestamp_ms = intdiv($timestamp_us, 1000);
        $sequence     = (ord($bytes[7]) << 8) | ord($bytes[8]);
        $version      = (ord($bytes[9]) >> 4) & 0x0f;
        $random       = substr($bytes, 9, 7); // includes nibble from byte 9

        $dt = \DateTimeImmutable::createFromFormat(
            'U.u',
            sprintf('%d.%06d', intdiv($timestamp_us, 1_000_000), $timestamp_us % 1_000_000)
        )->setTimezone(new \DateTimeZone('UTC'));

        return [
            'timestamp_us' => $timestamp_us,
            'timestamp_ms' => $timestamp_ms,
            'datetime'     => $dt,
            'sequence'     => $sequence,
            'version'      => $version,
            'random'       => $random,
        ];
    }

    /**
     * Validate a Wiji string.
     */
    public static function isValid(string $id): bool
    {
        if (strlen($id) !== 26) {
            return false;
        }
        self::buildDecoding();
        $upper = strtoupper($id);
        for ($i = 0; $i < 26; $i++) {
            if (!isset(self::$decoding[$upper[$i]])) {
                return false;
            }
        }
        // First char must be '0' or '1'
        return $upper[0] === '0' || $upper[0] === '1';
    }

    /**
     * Extract microsecond timestamp from a Wiji string.
     */
    public static function timestampUs(string $id): int
    {
        return self::readUs(self::decode($id));
    }

    /**
     * Extract millisecond timestamp from a Wiji string.
     */
    public static function timestampMs(string $id): int
    {
        return intdiv(self::readUs(self::decode($id)), 1000);
    }

    /**
     * Compare two Wiji strings chronologically.
     * Returns -1, 0, or 1. Compatible with usort().
     */
    public static function compare(string $a, string $b): int
    {
        return strcmp($a, $b) <=> 0;
    }

    // -------------------------------------------------------------------------
    // Core: generate bytes
    // -------------------------------------------------------------------------

    private function generateBytes(): string
    {
        $us = self::getMicrotime();

        if ($us > $this->lastUs) {
            $this->lastUs = $us;
            $this->seq    = 0;
        } elseif ($us === $this->lastUs) {
            $this->seq++;
            if ($this->seq > 0xffff) {
                $us = $this->waitNextUs($this->lastUs);
                $this->lastUs = $us;
                $this->seq    = 0;
            }
        } else {
            // Clock went backward — continue with lastUs
            $us = $this->lastUs;
            $this->seq++;
            if ($this->seq > 0xffff) {
                $us = $this->waitNextUs($this->lastUs);
                $this->lastUs = $us;
                $this->seq    = 0;
            }
        }

        // Build 16 bytes
        $buf = str_repeat("\x00", 16);

        // 56-bit timestamp, big-endian (bytes 0–6)
        // PHP integers are 64-bit signed on 64-bit systems; safe up to year 4253
        $buf[0] = chr(($us >> 48) & 0xff);
        $buf[1] = chr(($us >> 40) & 0xff);
        $buf[2] = chr(($us >> 32) & 0xff);
        $buf[3] = chr(($us >> 24) & 0xff);
        $buf[4] = chr(($us >> 16) & 0xff);
        $buf[5] = chr(($us >>  8) & 0xff);
        $buf[6] = chr( $us        & 0xff);

        // 16-bit sequence, big-endian (bytes 7–8)
        $buf[7] = chr(($this->seq >> 8) & 0xff);
        $buf[8] = chr( $this->seq       & 0xff);

        // version (high nibble) | random high nibble (byte 9)
        $buf[9] = chr((self::VERSION << 4) | $this->randomHiNibble);

        // random low 6 bytes (bytes 10–15)
        for ($i = 0; $i < 6; $i++) {
            $buf[10 + $i] = $this->randomLowBytes[$i];
        }

        return $buf;
    }

    // -------------------------------------------------------------------------
    // Encode / Decode (Base32 Crockford)
    // -------------------------------------------------------------------------

    /**
     * Encode 16 raw bytes → 26-char Base32 Crockford string.
     * Prepend 2 zero bits → 130 bits → 26 × 5-bit groups.
     */
    private static function encode(string $bytes): string
    {
        $out   = '';
        $acc   = 0;
        $bits  = 2; // 2 pre-loaded leading zero bits
        $bi    = 0;

        for ($ci = 0; $ci < 26; $ci++) {
            if ($bits < 5 && $bi < 16) {
                $acc  = ($acc << 8) | ord($bytes[$bi++]);
                $bits += 8;
            }
            $bits -= 5;
            $out  .= self::ALPHABET[($acc >> $bits) & 0x1f];
            $acc  &= (1 << $bits) - 1;
        }

        return $out;
    }

    /**
     * Decode 26-char Base32 Crockford string → 16 raw bytes.
     */
    private static function decode(string $str): string
    {
        if (strlen($str) !== 26) {
            throw new \InvalidArgumentException(
                sprintf('[Wiji] Expected 26-char string, got %d chars.', strlen($str))
            );
        }

        self::buildDecoding();

        $upper = strtoupper($str);
        // Apply substitutions
        $upper = strtr($upper, ['I' => '1', 'L' => '1', 'O' => '0', 'U' => 'V']);

        $bytes    = str_repeat("\x00", 16);
        $acc      = 0;
        $bitsInAcc = 0;
        $toSkip   = 2;
        $bi       = 0;

        for ($i = 0; $i < 26; $i++) {
            $ch = $upper[$i];
            if (!isset(self::$decoding[$ch])) {
                throw new \InvalidArgumentException(
                    sprintf("[Wiji] Invalid character '%s' at position %d.", $str[$i], $i)
                );
            }
            $acc       = ($acc << 5) | self::$decoding[$ch];
            $bitsInAcc += 5;

            if ($toSkip > 0 && $bitsInAcc >= $toSkip) {
                $acc       &= (1 << ($bitsInAcc - $toSkip)) - 1;
                $bitsInAcc -= $toSkip;
                $toSkip     = 0;
            }

            while ($bitsInAcc >= 8 && $bi < 16) {
                $bitsInAcc -= 8;
                $bytes[$bi++] = chr(($acc >> $bitsInAcc) & 0xff);
                $acc          &= (1 << $bitsInAcc) - 1;
            }
        }

        return $bytes;
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /** Read 56-bit timestamp from bytes 0–6 as a 64-bit PHP integer. */
    private static function readUs(string $bytes): int
    {
        return (ord($bytes[0]) << 48)
             | (ord($bytes[1]) << 40)
             | (ord($bytes[2]) << 32)
             | (ord($bytes[3]) << 24)
             | (ord($bytes[4]) << 16)
             | (ord($bytes[5]) <<  8)
             |  ord($bytes[6]);
    }

    /**
     * Get current Unix timestamp in microseconds.
     * Uses hrtime() for monotonic precision (PHP 7.3+), falls back to microtime().
     */
    private static function getMicrotime(): int
    {
        // hrtime(true) returns nanoseconds as int (monotonic, PHP 7.3+)
        // We need epoch-anchored µs, so combine with microtime for the epoch offset.
        static $epochOffsetUs = null;
        if ($epochOffsetUs === null) {
            // Anchor: compute offset between hrtime and microtime once.
            $h1    = hrtime(true);
            $mt    = (int)(microtime(true) * 1_000_000);
            $h2    = hrtime(true);
            $hmid  = intdiv($h1 + $h2, 2);
            $epochOffsetUs = $mt - intdiv($hmid, 1000);
        }
        return intdiv(hrtime(true), 1000) + $epochOffsetUs;
    }

    /** Spin-wait until µs clock advances past $us. */
    private function waitNextUs(int $us): int
    {
        $now = self::getMicrotime();
        while ($now <= $us) {
            $now = self::getMicrotime();
        }
        return $now;
    }

    /** Build the Base32 Crockford decoding table once. */
    private static function buildDecoding(): void
    {
        if (self::$decoding !== null) {
            return;
        }
        self::$decoding = [];
        for ($i = 0; $i < 32; $i++) {
            self::$decoding[self::ALPHABET[$i]] = $i;
        }
    }
}
