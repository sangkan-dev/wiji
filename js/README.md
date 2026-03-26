# ꦮꦶꦗꦶ Wiji

This package lives in a monorepo. For the website docs, see `wiji.sangkan.dev`.

# ꦮꦶꦗꦶ Wiji

> *Benih* — dalam bahasa Jawa, wiji adalah benih, asal-usul dari segala sesuatu.
> Setiap record dalam sistemmu dimulai dari sebuah Wiji.

**Wiji** adalah 128-bit **time-ordered identifier** (timestamp-first) untuk sistem yang butuh:
- insert locality yang baik untuk index database (B+ tree / B-tree),
- urutan yang **monotonic** dalam satu generator,
- ekstraksi waktu (timestamp) dengan presisi **microsecond (µs)**,
- output multi-format: Base32 (26), binary (16 bytes), uuid-like, dan hex.

Forged at [Sangkan](https://sangkan.dev) — Building the Source.

---

## Mengapa Wiji?

| Properti (ringkas) | UUID v4 | UUID v7 | ULID | KSUID | **Wiji v1** |
|---|---|---|---|---|---|
| Presisi timestamp | — | 1 ms | 1 ms | 1 detik | **1 µs** |
| B+ tree friendly | ❌ | ✅ | ✅ | ✅ | ✅ |
| Monotonic | ❌ | Sebagian | Sebagian | ❌ | ✅ |
| Version field | ✅ | ✅ | ❌ | ❌ | ✅ |
| Binary output | ✅ | ✅ | ❌ | ❌ | ✅ |
| Zero dependencies | ❌ | ❌ | ❌ | ❌ | ✅ |
| String length | 36 | 36 | 26 | 27 | **26** |
| Valid hingga | — | 10889 | 10889 | 2106 | **4253** |

Catatan: tabel ini hanya memberi konteks trade-off. Wiji tidak mencoba “menggantikan” standar yang sudah ada; Wiji fokus pada sifat **time-order + monotonic + multi-format**.

---

## Bit Layout

```
 127                                                              0
  ┌──────────────────────────┬────────────────┬────┬─────────────────────────────────┐
  │       timestamp_us       │    sequence    │ver │            random               │
  │         56 bits          │    16 bits     │ 4b │            52 bits              │
  └──────────────────────────┴────────────────┴────┴─────────────────────────────────┘
```

- **56-bit timestamp µs** — microseconds sejak Unix epoch. Valid hingga tahun 4253.
- **16-bit sequence** — counter monotonic per µs, 0–65535. Overflow → tunggu µs berikutnya.
- **4-bit version** — selalu `0x1` untuk Wiji v1. Future-proof untuk evolusi spec.
- **52-bit random** — CSPRNG, di-generate sekali per generator instance. Isolasi antar proses.

---

## Quick Start

### JavaScript / Node.js / Bun / Deno

```bash
npm install @sangkan/wiji
```

```js
import wiji from '@sangkan/wiji';
// atau: const wiji = require('@sangkan/wiji');

// Generate
wiji()              // → '01JKM5WXR9P003K1F4Q8XTBZN2'
wiji.binary()       // → Uint8Array(16)
wiji.uuid()         // → '019d2257-972f-1a4e-36ea-81d64ed08dfc'
wiji.hex()          // → '019d2257972f1a4e36ea81d64ed08dfc'

// Parse
wiji.parse('01JKM5WXR9P003K1F4Q8XTBZN2')
// → { timestamp_us: 1774397000000000n, timestamp_ms: 1774397000000,
//     date: Date, sequence: 42, version: 1, random: Uint8Array(7) }

// Utilities
wiji.isValid('01JKM5WXR9P003K1F4Q8XTBZN2') // → true
wiji.timestampUs('01JKM5WXR9P003K1F4Q8XTBZN2') // → microseconds (bigint)
wiji.compare(a, b)  // → -1 | 0 | 1
wiji.factory()      // → isolated generator instance
```

### PHP / Laravel

```bash
composer require sangkan/wiji
```

```php
use Sangkan\Wiji\Wiji;

$wiji = new Wiji();

// Generate
$wiji->generate();        // → '01JKM5WXR9P003K1F4Q8XTBZN2'
$wiji->generateBinary();  // → 16 raw bytes (string)
$wiji->generateUuid();    // → '019d2257-972f-1a4e-36ea-81d64ed08dfc'
$wiji->generateHex();     // → '019d2257972f1a4e36ea81d64ed08dfc'

// Parse
Wiji::parse('01JKM5WXR9P003K1F4Q8XTBZN2');
// → ['timestamp_us' => ..., 'timestamp_ms' => ..., 'datetime' => DateTimeImmutable, ...]

// Utilities
Wiji::isValid('01JKM5WXR9P003K1F4Q8XTBZN2'); // → true
Wiji::timestampUs($id);   // → int (microseconds)
Wiji::compare($a, $b);    // → -1 | 0 | 1
```

#### Laravel — Eloquent integration

```php
// database/migrations/xxxx_create_posts_table.php
Schema::create('posts', function (Blueprint $table) {
    $table->string('id', 26)->primary();
    // atau binary:
    // $table->binary('id', 16)->primary();
    $table->string('title');
    $table->timestamps();
});

// app/Models/Post.php
use Sangkan\Wiji\Wiji;

class Post extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function (self $model) {
            if (empty($model->{$model->getKeyName()})) {
                $wiji = new Wiji();
                $model->{$model->getKeyName()} = $wiji->generate();
            }
        });
    }
}
```

---

## Database Storage

| Database | Column type | Notes |
|---|---|---|
| MySQL / MariaDB | `VARCHAR(26)` | Primary, natural sort |
| MySQL / MariaDB | `BINARY(16)` | Compact, fastest index |
| PostgreSQL | `CHAR(26)` atau `UUID` | UUID format via `generateUuid()` |
| SQLite | `TEXT` | Default |
| MongoDB | Store as string | Natural sort preserved |

---

## Performance

Measured on Node.js 22, PHP 8.3 (single core):

| | IDs/sec |
|---|---|
| Wiji JS (string) | ~800k |
| Wiji JS (binary) | ~3.5M |
| Wiji PHP (string) | ~290k |
| UUID v4 (JS) | ~1.7M |
| ULID (JS npm) | ~4k |

> Wiji binary output adalah yang tercepat untuk pipeline yang pakai binary storage.

---

## Implementasi

| Bahasa | Package | Status |
|---|---|---|
| JavaScript / TypeScript | `@sangkan/wiji` | ✅ Stable |
| PHP | `sangkan/wiji` | ✅ Stable |
| Python | `sangkan-wiji` | 🔜 Coming soon |
| Go | `github.com/sangkan-dev/wiji-go` | 🔜 Coming soon |
| Rust | `wiji` (crates.io) | 🔜 Coming soon |

---

## Specification

Lihat [`spec/WIJI_SPEC.md`](spec/WIJI_SPEC.md) untuk spesifikasi lengkap, termasuk bit layout, byte layout, test vectors, dan panduan implementasi di bahasa lain.

Spec dirilis di bawah [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) — public domain. Siapapun boleh mengimplementasikan Wiji tanpa batasan.

---

## License

MIT — lihat [LICENSE](LICENSE)

---

*Forged at [Sangkan](https://sangkan.dev) — Building the Source.*
*Inspired by "Sangkan Paraning Dumadi" — memahami asal dan tujuan dari segala ciptaan.*
