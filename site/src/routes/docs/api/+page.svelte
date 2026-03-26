<section class="py-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Docs</p>
	<h1 class="mt-3 font-heading text-3xl font-semibold text-gold-bright">API reference</h1>

	<div class="prose prose-invert mt-8 max-w-none font-mono text-sm text-ash">
		<h2>JavaScript / TypeScript</h2>
		<pre><code>import wiji from '@sangkan-dev/wiji';

wiji()              // string (26)
wiji.binary()       // Uint8Array(16)
wiji.uuid()         // string (36)
wiji.hex()          // string (32)
wiji.parse(id)      // object
wiji.isValid(id)    // boolean
wiji.compare(a, b)  // -1 | 0 | 1 (string or bytes)
wiji.factory()      // new isolated generator</code></pre>

		<h2>PHP</h2>
		<pre><code>use Sangkan\\Wiji\\Wiji;

$w = new Wiji();
$w->generate();        // string (26)
$w->generateBinary();  // string (16 bytes)
$w->generateUuid();    // string (36)
$w->generateHex();     // string (32)

Wiji::parse($id);       // array
Wiji::isValid($id);     // bool
Wiji::timestampUs($id); // int
Wiji::compare($a, $b);  // int (-1|0|1)</code></pre>
	</div>
</section>

