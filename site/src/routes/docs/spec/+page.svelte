<section class="py-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Docs</p>
	<h1 class="mt-3 font-heading text-3xl font-semibold text-gold-bright">Specification</h1>

	<div class="prose prose-invert mt-8 max-w-none font-mono text-sm text-ash">
		<p>
			Spec lengkap ada di repo: <a href="https://github.com/sangkan-dev/wiji/blob/main/WIJI_SPEC.md">WIJI_SPEC.md</a>.
		</p>

		<h2>Bit layout (128-bit)</h2>
		<pre><code>timestamp_us (56) | sequence (16) | version (4) | random (52)</code></pre>

		<h2>Sorting guarantee</h2>
		<p>
			Wiji dibuat supaya sortable secara natural lewat perbandingan byte-wise pada 16-byte raw, dan
			juga lewat string Base32 Crockford.
		</p>

		<h2>Test vectors</h2>
		<p>
			Lihat bagian <em>Reference Test Vectors</em> di spec untuk cross-language determinism.
		</p>
	</div>
</section>

