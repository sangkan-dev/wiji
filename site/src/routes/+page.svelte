<section class="py-10">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Sangkan · Building the Source</p>
	<h1 class="mt-3 font-heading text-4xl font-semibold tracking-tight text-gold-bright md:text-6xl">
		Wiji <span class="text-[#e0e0e0]">—</span> time-ordered identifiers
	</h1>
	<p class="mt-3 text-2xl leading-loose text-[#e0e0e0]" style="font-family: 'Noto Sans Javanese', sans-serif">
		ꦮꦶꦗꦶ
	</p>
	<p class="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-ash">
		128-bit identifier dengan <span class="text-[#e0e0e0]">timestamp µs</span>, sequence monotonic, dan output multi-format
		(Base32 26-char, binary 16-byte, uuid-like, hex). Dibuat untuk sistem yang butuh urutan yang rapi di database dan event streams.
	</p>

	<div class="mt-10 flex flex-wrap gap-3">
		<a
			href="/docs/getting-started"
			class="inline-flex border border-gold/60 bg-andesite-light px-5 py-2.5 font-heading text-sm font-medium text-gold transition-colors hover:border-gold-bright hover:bg-andesite-lighter hover:text-gold-bright"
		>
			Get started
		</a>
		<a
			href="/docs/api"
			class="inline-flex border border-andesite-lighter bg-andesite px-5 py-2.5 font-heading text-sm font-medium text-ash transition-colors hover:border-gold/40 hover:text-gold-bright"
		>
			API
		</a>
		<a
			href="/docs/spec"
			class="inline-flex border border-andesite-lighter bg-andesite px-5 py-2.5 font-heading text-sm font-medium text-ash transition-colors hover:border-gold/40 hover:text-gold-bright"
		>
			Spec
		</a>
	</div>
</section>

<section class="mt-14 grid gap-4 md:grid-cols-3">
	<div class="rounded border border-andesite-lighter bg-andesite-light p-5">
		<p class="font-heading text-sm font-medium text-[#e0e0e0]">Timestamp-first</p>
		<p class="mt-2 font-mono text-xs leading-relaxed text-smoke">56-bit microsecond timestamp (big-endian) untuk urutan alami.</p>
	</div>
	<div class="rounded border border-andesite-lighter bg-andesite-light p-5">
		<p class="font-heading text-sm font-medium text-[#e0e0e0]">Monotonic generator</p>
		<p class="mt-2 font-mono text-xs leading-relaxed text-smoke">16-bit sequence counter untuk burst IDs dalam satu µs.</p>
	</div>
	<div class="rounded border border-andesite-lighter bg-andesite-light p-5">
		<p class="font-heading text-sm font-medium text-[#e0e0e0]">Multi-format</p>
		<p class="mt-2 font-mono text-xs leading-relaxed text-smoke">Base32 (26), binary, uuid-like, dan hex dari bytes yang sama.</p>
	</div>
</section>

<section class="mt-14 rounded border border-andesite-lighter bg-andesite p-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Quickstart (JS/TS)</p>
	<pre class="mt-4 overflow-auto rounded bg-andesite-light p-4 text-xs text-[#e0e0e0]"><code>npm install @sangkan/wiji

import wiji from '@sangkan/wiji';

const id = wiji();          // Base32 (26)
const bin = wiji.binary();  // Uint8Array(16)
const p = wiji.parse(id);   // timestamp_us (bigint), sequence, version, random</code></pre>
</section>
