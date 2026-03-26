<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Specification | Wiji</title>
	<meta
		name="description"
		content="Wiji identifier specification: 128-bit layout, sorting, formats, and reference test vectors."
	/>
</svelte:head>

<section class="py-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Docs</p>
	<h1 class="mt-3 font-heading text-3xl font-semibold text-gold-bright">Specification</h1>
	<p class="mt-2 max-w-2xl font-mono text-sm text-ash">
		Source of truth is <code class="text-[#e0e0e0]">WIJI_SPEC.md</code> in the
		<a
			href="https://github.com/sangkan-dev/wiji/blob/main/WIJI_SPEC.md"
			class="text-gold-dim underline-offset-2 hover:text-gold-bright"
			>repo</a
		>. The full document is rendered below.
	</p>

	<div
		class="spec-markdown prose prose-invert mt-10 max-w-none font-mono text-sm text-ash prose-headings:font-heading prose-headings:text-gold-bright prose-a:text-gold-dim prose-a:underline-offset-2 hover:prose-a:text-gold-bright prose-pre:bg-andesite-light prose-pre:text-[#e0e0e0] prose-code:text-gold-dim prose-strong:text-[#e0e0e0]"
	>
		{@html data.html}
	</div>
</section>
