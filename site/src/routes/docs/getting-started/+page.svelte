<section class="py-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Docs</p>
	<h1 class="mt-3 font-heading text-3xl font-semibold text-gold-bright">Getting started</h1>

	<div class="prose prose-invert mt-8 max-w-none font-mono text-sm text-ash">
		<h2>Install</h2>
		<pre><code>npm install @sangkan/wiji
composer require sangkan/wiji</code></pre>

		<h2>Generate (JS/TS)</h2>
		<pre><code>import wiji from '@sangkan/wiji';

const id = wiji();          // Base32 (26)
const bin = wiji.binary();  // Uint8Array(16)
const uuid = wiji.uuid();   // uuid-like string (36)
const hex = wiji.hex();     // hex (32)</code></pre>

		<h2>Parse</h2>
		<pre><code>const p = wiji.parse(id);
// p.timestamp_us: bigint
// p.timestamp_ms: number
// p.date: Date
// p.sequence: number (0–65535)
// p.version: number (v1 = 1)
// p.random: Uint8Array(7)</code></pre>

		<h2>Database</h2>
		<ul>
			<li><strong>Default</strong>: simpan sebagai string Base32 (26) untuk simplicity.</li>
			<li><strong>High-throughput</strong>: simpan sebagai binary 16-byte untuk index yang lebih compact.</li>
		</ul>
	</div>
</section>

