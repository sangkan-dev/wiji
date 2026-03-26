<script lang="ts">
	type Row = { label: string; idsPerSec: number; tone: 'wiji' | 'peer' | 'slow' };

	const rows: Row[] = [
		{ label: 'Wiji (Base32 string)', idsPerSec: 650_000, tone: 'wiji' },
		{ label: 'Wiji (binary)', idsPerSec: 1_570_000, tone: 'wiji' },
		{ label: 'UUID v4 (random)', idsPerSec: 3_900_000, tone: 'peer' },
		{ label: 'ULID (reference lib)', idsPerSec: 29_000, tone: 'slow' }
	];

	const maxLog = Math.max(...rows.map((r) => Math.log10(r.idsPerSec)));

	function barPct(v: number): number {
		return (Math.log10(v) / maxLog) * 100;
	}

	function fill(tone: Row['tone']): string {
		switch (tone) {
			case 'wiji':
				return '#cba153';
			case 'peer':
				return '#a0a0a0';
			default:
				return '#666666';
		}
	}

	function formatNum(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
		return String(n);
	}
</script>

<div class="mt-6 rounded border border-andesite-lighter bg-andesite-light p-5">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Sample throughput</p>
	<p class="mt-1 font-mono text-xs text-smoke">
		Log-scaled bar length (longer = higher). Numbers from docs; rerun <code class="text-ash">npm run bench</code> locally.
	</p>

	<svg
		class="mt-4 w-full overflow-visible"
		role="img"
		aria-label="Benchmark comparison: IDs per second, log-scaled bars"
		viewBox="0 0 520 168"
	>
		<title>Benchmark comparison: IDs per second (sample, log-scaled)</title>
		{#each rows as row, i}
			{@const y = 8 + i * 40}
			{@const w = (440 * barPct(row.idsPerSec)) / 100}
			<text x="0" y={y + 14} class="fill-[#a0a0a0]" font-family="JetBrains Mono, monospace" font-size="11">
				{row.label}
			</text>
			<rect
				x="0"
				y={y + 18}
				width="440"
				height="14"
				rx="2"
				class="fill-[#1a1a1a]"
				stroke="#2a2a2a"
				stroke-width="1"
			/>
			<rect x="0" y={y + 18} width={w} height="14" rx="2" fill={fill(row.tone)} />
			<text
				x="448"
				y={y + 29}
				class="fill-[#e0e0e0]"
				font-family="JetBrains Mono, monospace"
				font-size="11"
			>
				{formatNum(row.idsPerSec)}/s
			</text>
		{/each}
	</svg>
</div>
