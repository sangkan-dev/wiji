<?php

declare(strict_types=1);

use Sangkan\Wiji\Wiji;

require_once __DIR__ . '/../src/Wiji.php';

// ---------------------------------------------------------------------------
// Minimal test runner (no PHPUnit dependency needed for standalone check)
// ---------------------------------------------------------------------------
$passed = 0;
$failed = 0;

function ok(string $name, bool $condition): void {
    global $passed, $failed;
    if ($condition) {
        echo "  ✓  $name\n";
        $passed++;
    } else {
        echo "  ✗  FAIL: $name\n";
        $failed++;
    }
}

function section(string $name): void {
    echo "\n$name\n" . str_repeat('─', strlen($name)) . "\n";
}

$wiji = new Wiji();

// ---------------------------------------------------------------------------
section('Output format');
// ---------------------------------------------------------------------------

$id = $wiji->generate();
ok('generate() returns string', is_string($id));
ok('generate() is 26 chars', strlen($id) === 26);
ok('generate() matches Base32 Crockford', (bool)preg_match('/^[0-9A-HJKMNP-TV-Z]{26}$/', $id));
ok('first char is 0 or 1', $id[0] === '0' || $id[0] === '1');

$bin = $wiji->generateBinary();
ok('generateBinary() is string of 16 bytes', is_string($bin) && strlen($bin) === 16);

$uuid = $wiji->generateUuid();
ok('generateUuid() matches UUID format', (bool)preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/', $uuid));

$hex = $wiji->generateHex();
ok('generateHex() is 32 lowercase hex chars', (bool)preg_match('/^[0-9a-f]{32}$/', $hex));

// version nibble check (100 IDs)
$versionOk = true;
for ($i = 0; $i < 100; $i++) {
    $b = $wiji->generateBinary();
    if (((ord($b[9]) >> 4) & 0x0f) !== 1) { $versionOk = false; break; }
}
ok('version nibble is always 0x1 (100 samples)', $versionOk);

// ---------------------------------------------------------------------------
section('Uniqueness');
// ---------------------------------------------------------------------------

$set = [];
for ($i = 0; $i < 100_000; $i++) $set[$wiji->generate()] = true;
ok('100,000 IDs — zero collisions', count($set) === 100_000);

$g1 = new Wiji(); $g2 = new Wiji(); $set2 = [];
for ($i = 0; $i < 5_000; $i++) { $set2[$g1->generate()] = true; $set2[$g2->generate()] = true; }
ok('two instances — no cross-instance collisions', count($set2) === 10_000);

// ---------------------------------------------------------------------------
section('Monotonicity');
// ---------------------------------------------------------------------------

$ids = [];
for ($i = 0; $i < 5_000; $i++) $ids[] = $wiji->generate();
$sorted = $ids; sort($sorted);
ok('sequential IDs are lexicographically sorted', $ids === $sorted);

$burst = [];
for ($i = 0; $i < 500; $i++) $burst[] = $wiji->generate();
$bsorted = $burst; sort($bsorted);
ok('burst IDs are sorted', $burst === $bsorted);

// ---------------------------------------------------------------------------
section('Timestamp (µs precision)');
// ---------------------------------------------------------------------------

$before = (int)(microtime(true) * 1_000_000) - 2_000;
$id     = $wiji->generate();
$after  = (int)(microtime(true) * 1_000_000) + 12_000;
$ts     = Wiji::timestampUs($id);
ok('timestampUs() within ±12ms of microtime', $ts >= $before && $ts <= $after);

$beforeMs = (int)(microtime(true) * 1000) - 12;
$id2      = $wiji->generate();
$afterMs  = (int)(microtime(true) * 1000) + 12;
$tsMs     = Wiji::timestampMs($id2);
ok('timestampMs() within ±12ms', $tsMs >= $beforeMs && $tsMs <= $afterMs);

$parsed = Wiji::parse($id);
ok('parse() returns timestamp_us', isset($parsed['timestamp_us']) && is_int($parsed['timestamp_us']));
ok('parse() returns timestamp_ms', isset($parsed['timestamp_ms']) && is_int($parsed['timestamp_ms']));
ok('parse() returns DateTimeImmutable', $parsed['datetime'] instanceof DateTimeImmutable);
ok('parse() timestamp_us >= timestamp_ms * 1000', $parsed['timestamp_us'] >= $parsed['timestamp_ms'] * 1000);
ok('parse() version = 1', $parsed['version'] === 1);
ok('parse() sequence 0–65535', $parsed['sequence'] >= 0 && $parsed['sequence'] <= 65535);

// µs precision: check sub-ms increments
$usTimestamps = [];
for ($i = 0; $i < 100; $i++) $usTimestamps[] = Wiji::timestampUs($wiji->generate());
$subMs = 0;
for ($i = 1; $i < count($usTimestamps); $i++) {
    if ($usTimestamps[$i] > $usTimestamps[$i-1] && $usTimestamps[$i] - $usTimestamps[$i-1] < 1000) $subMs++;
}
ok('sub-millisecond µs increments observed (>10 out of 99)', $subMs > 10);

// ---------------------------------------------------------------------------
section('Validation');
// ---------------------------------------------------------------------------

ok('isValid() fresh ID', Wiji::isValid($wiji->generate()));
ok('isValid() wrong length', !Wiji::isValid('SHORT'));
ok('isValid() invalid char', !Wiji::isValid(str_repeat('A', 25) . '!'));
ok('isValid() lowercase accepted', Wiji::isValid(strtolower($wiji->generate())));

// ---------------------------------------------------------------------------
section('Encode / Decode round-trip');
// ---------------------------------------------------------------------------

$roundTripOk = true;
for ($i = 0; $i < 200; $i++) {
    $before2 = (int)(microtime(true) * 1_000_000) - 2_000;
    $rid = $wiji->generate();
    $after2  = (int)(microtime(true) * 1_000_000) + 12_000;
    $rts = Wiji::timestampUs($rid);
    if ($rts < $before2 || $rts > $after2) { $roundTripOk = false; break; }
}
ok('timestamp survives 200× encode→decode round-trips', $roundTripOk);

// ---------------------------------------------------------------------------
section('compare()');
// ---------------------------------------------------------------------------

$a = $wiji->generate(); $b = $wiji->generate();
ok('compare(a, a) = 0', Wiji::compare($a, $a) === 0);
ok('compare(a, b) < 0 when a generated before b', Wiji::compare($a, $b) < 0);
ok('compare(b, a) > 0', Wiji::compare($b, $a) > 0);

// ---------------------------------------------------------------------------
section('Performance');
// ---------------------------------------------------------------------------

$N = 500_000;
$t0 = hrtime(true);
for ($i = 0; $i < $N; $i++) $wiji->generate();
$ms = (hrtime(true) - $t0) / 1_000_000;
$rate = number_format((int)($N / $ms * 1000));
echo "  500,000 IDs generated in {$ms}ms ({$rate} IDs/sec)\n";
ok("500,000 IDs in under 5 seconds", $ms < 5000);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
echo "\n" . str_repeat('═', 50) . "\n";
echo "  Tests: " . ($passed + $failed) . " | Passed: $passed | Failed: $failed\n";
echo str_repeat('═', 50) . "\n\n";
exit($failed > 0 ? 1 : 0);
