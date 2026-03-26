<section class="hero-shell relative overflow-hidden rounded border border-andesite-lighter bg-andesite-light py-12 pl-6 pr-6 md:py-16 md:pl-10 md:pr-10">
	<div
		class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_70%_-20%,rgba(203,161,83,0.14),transparent_55%),linear-gradient(105deg,rgba(26,26,26,0.9)_0%,rgba(13,13,13,0.35)_45%,transparent_70%)]"
		aria-hidden="true"
	></div>
	<div
		class="pointer-events-none absolute -right-16 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full border border-gold/15 bg-gold/[0.03] blur-2xl"
		aria-hidden="true"
	></div>

	<div class="relative">
		<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Sangkan · Building the Source</p>
		<h1 class="mt-3 font-heading text-4xl font-semibold tracking-tight text-gold-bright md:text-6xl">
			Wiji <span class="text-[#e0e0e0]">—</span> time-ordered identifiers
		</h1>
		<p class="mt-3 text-2xl leading-loose text-[#e0e0e0]" style="font-family: 'Noto Sans Javanese', sans-serif">
			ꦮꦶꦗꦶ
		</p>
		<p class="mt-6 max-w-2xl font-mono text-sm leading-relaxed text-ash">
			128-bit identifier with <span class="text-[#e0e0e0]">microsecond timestamp</span>, monotonic sequence, and
			multi-format output (Base32 26-char, 16-byte binary, uuid-like, hex). Built for tidy ordering in databases
			and event streams.
		</p>

		<div class="mt-8 flex flex-wrap gap-3">
			<a
				href="/docs/getting-started"
				class="inline-flex border border-gold/60 bg-andesite px-5 py-2.5 font-heading text-sm font-medium text-gold-bright transition-colors hover:border-gold-bright hover:bg-andesite-light"
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

		<p class="mt-8 font-mono text-xs tracking-widest text-smoke uppercase">Packages</p>
		<div class="mt-3 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
			<a
				class="text-gold-dim underline-offset-2 transition-colors hover:text-gold-bright"
				href="https://www.npmjs.com/package/@sangkan/wiji"
			>
				npm<span class="text-ash"> — </span><code class="text-ash">@sangkan/wiji</code>
			</a>
			<a
				class="text-gold-dim underline-offset-2 transition-colors hover:text-gold-bright"
				href="https://packagist.org/packages/sangkan/wiji"
			>
				Packagist<span class="text-ash"> — </span><code class="text-ash">sangkan/wiji</code>
			</a>
			<a
				class="text-gold-dim underline-offset-2 transition-colors hover:text-gold-bright"
				href="https://github.com/sangkan-dev/wiji"
			>
				Source<span class="text-ash"> — </span>GitHub
			</a>
		</div>
	</div>
</section>

<section class="mt-14" aria-labelledby="bit-layout-heading">
	<h2 id="bit-layout-heading" class="font-heading text-lg font-medium text-gold-bright">128-bit layout</h2>
	<p class="mt-2 max-w-2xl font-mono text-xs leading-relaxed text-ash">
		Sortable by raw 16-byte comparison and by Crockford Base32 string. Version nibble separates future formats.
	</p>
	<div class="mt-4 overflow-x-auto rounded border border-andesite-lighter bg-andesite p-4 font-mono text-[11px] text-[#e0e0e0] md:text-xs">
		<svg viewBox="0 0 640 56" class="min-w-[520px] w-full" role="img" aria-label="Wiji 128-bit field layout diagram">
			<title>Wiji: 56-bit timestamp, 16-bit sequence, 4-bit version, 52-bit random</title>
			<rect x="0" y="8" width="280" height="28" rx="2" fill="rgba(203,161,83,0.25)" stroke="#cba153" />
			<rect x="284" y="8" width="80" height="28" rx="2" fill="rgba(203,161,83,0.12)" stroke="#a07d3a" />
			<rect x="368" y="8" width="24" height="28" rx="2" fill="rgba(160,160,160,0.15)" stroke="#666" />
			<rect x="396" y="8" width="244" height="28" rx="2" fill="rgba(102,102,102,0.2)" stroke="#555" />
			<text x="140" y="26" text-anchor="middle" fill="#e4be6a" font-family="inherit" font-size="11">
				timestamp µs (56)
			</text>
			<text x="324" y="26" text-anchor="middle" fill="#cba153" font-family="inherit" font-size="11">seq (16)</text>
			<text x="380" y="26" text-anchor="middle" fill="#a0a0a0" font-family="inherit" font-size="11">v (4)</text>
			<text x="518" y="26" text-anchor="middle" fill="#a0a0a0" font-family="inherit" font-size="11">
				random (52)
			</text>
			<text x="0" y="50" fill="#666" font-family="inherit" font-size="10">0 — bit 127 … bit 0 — MSB first in transport</text>
		</svg>
	</div>
</section>

<section class="mt-14 grid gap-4 md:grid-cols-3">
	<div class="rounded border border-andesite-lighter bg-andesite-light p-5 transition-colors hover:border-gold/25">
		<p class="font-heading text-sm font-medium text-[#e0e0e0]">Timestamp-first</p>
		<p class="mt-2 font-mono text-xs leading-relaxed text-smoke">
			56-bit microsecond timestamp (big-endian) for natural time order.
		</p>
	</div>
	<div class="rounded border border-andesite-lighter bg-andesite-light p-5 transition-colors hover:border-gold/25">
		<p class="font-heading text-sm font-medium text-[#e0e0e0]">Monotonic generator</p>
		<p class="mt-2 font-mono text-xs leading-relaxed text-smoke">
			16-bit sequence counter for bursts inside the same microsecond.
		</p>
	</div>
	<div class="rounded border border-andesite-lighter bg-andesite-light p-5 transition-colors hover:border-gold/25">
		<p class="font-heading text-sm font-medium text-[#e0e0e0]">Multi-format</p>
		<p class="mt-2 font-mono text-xs leading-relaxed text-smoke">
			Base32 (26), binary, uuid-like, and hex views of the same 16 bytes.
		</p>
	</div>
</section>

<section class="mt-14 rounded border border-andesite-lighter bg-andesite p-6">
	<h2 class="font-mono text-xs tracking-widest text-gold-dim uppercase">When Wiji fits</h2>
	<ul class="mt-4 list-inside list-disc space-y-2 font-mono text-sm text-ash marker:text-gold-dim">
		<li>Primary keys and event IDs where <span class="text-[#e0e0e0]">time locality</span> helps indexing and debugging.</li>
		<li>
			Streams and logs where IDs must <span class="text-[#e0e0e0]">sort without decoding</span> (lexical Base32 or raw bytes).
		</li>
		<li>Systems that want one binary form and <span class="text-[#e0e0e0]">multiple string appearances</span> (e.g. ULID-style text + UUID wire).</li>
	</ul>
</section>

<section class="mt-14 rounded border border-andesite-lighter bg-andesite p-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Quickstart (JS/TS)</p>
	<pre
		class="mt-4 overflow-auto rounded bg-andesite-light p-4 text-xs text-[#e0e0e0]"><code>npm install @sangkan/wiji

import wiji from '@sangkan/wiji';

const id = wiji();          // Base32 (26)
const bin = wiji.binary();  // Uint8Array(16)
const p = wiji.parse(id);   // timestamp_us (bigint), sequence, version, random</code></pre>
</section>
