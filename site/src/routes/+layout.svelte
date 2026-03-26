<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>ꦮꦶꦗꦶ Wiji — time-ordered identifiers</title>
	<meta
		name="description"
		content="Wiji (ꦮꦶꦗꦶ) — 128-bit time-ordered identifier: µs timestamp, monotonic sequence, multi-format (Base32/binary/uuid-like/hex)."
	/>
	<meta property="og:title" content="Wiji — time-ordered identifiers" />
	<meta
		property="og:description"
		content="Timestamp-first, monotonic within a generator, DB-friendly ordering, and deterministic encoding."
	/>
</svelte:head>

<div class="min-h-screen">
	<header class="sticky top-0 z-50 border-b border-andesite-lighter bg-andesite/80 backdrop-blur">
		<nav class="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
			<a href="/" class="flex items-baseline gap-3">
				<span class="font-heading text-lg font-semibold text-gold-bright">Wiji</span>
				<span class="font-mono text-xs tracking-widest text-gold-dim">ꦮꦶꦗꦶ</span>
			</a>
			<div class="flex items-center gap-6 font-mono text-sm text-ash">
				<a class="hover:text-gold-bright" href="/docs">Docs</a>
				<a class="hover:text-gold-bright" href="/docs/spec">Spec</a>
				<a class="hover:text-gold-bright" href="/docs/benchmarks">Bench</a>
				<a class="hover:text-gold-bright" href="https://github.com/sangkan-dev/wiji">GitHub</a>
			</div>
		</nav>
	</header>

	<main class="mx-auto max-w-5xl px-6 py-12">{@render children()}</main>

	<footer class="border-t border-andesite-lighter py-10">
		<div class="mx-auto max-w-5xl px-6 font-mono text-xs text-smoke">
			Forged at <a class="text-ash hover:text-gold-bright" href="https://sangkan.dev">Sangkan</a>.
		</div>
	</footer>
</div>
