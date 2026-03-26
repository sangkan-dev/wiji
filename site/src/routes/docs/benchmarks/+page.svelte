<section class="py-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Docs</p>
	<h1 class="mt-3 font-heading text-3xl font-semibold text-gold-bright">Benchmarks</h1>

	<div class="prose prose-invert mt-8 max-w-none font-mono text-sm text-ash">
		<h2>Run</h2>
		<pre><code>cd js
npm test
npm run bench</code></pre>

		<h2>Sample (Node 24)</h2>
		<pre><code>Wiji (string): ~650k IDs/sec
Wiji (binary): ~1.57M IDs/sec
UUID v4      : ~3.9M IDs/sec
ULID (lib)   : ~29k IDs/sec</code></pre>

		<p>
			Angka akan berubah tergantung CPU, Node version, dan implementasi library pembanding. Fokus utama Wiji adalah
			<strong>ordering</strong> (time-ordered + monotonic per generator) dan format yang deterministik, bukan sekadar throughput murni.
		</p>
	</div>
</section>

