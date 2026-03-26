<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { SITE_ORIGIN } from '$lib/site';

	let { children } = $props();

	const title = 'ꦮꦶꦗꦶ Wiji — time-ordered identifiers';
	const description =
		'Wiji (ꦮꦶꦗꦶ) — 128-bit time-ordered identifier: µs timestamp, monotonic sequence, multi-format (Base32/binary/uuid-like/hex).';
	const ogDescription =
		'Timestamp-first, monotonic within a generator, DB-friendly ordering, and deterministic encoding.';
	const ogImageAlt = 'Wiji — time-ordered identifiers by Sangkan';

	const canonicalUrl = $derived(`${SITE_ORIGIN}${page.url.pathname}`);
	const ogImageUrl = `${SITE_ORIGIN}/og-wiji.png`;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="canonical" href={canonicalUrl} />
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:image" content={ogImageUrl} />
	<meta property="og:image:alt" content={ogImageAlt} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="twitter:image" content={ogImageUrl} />
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
