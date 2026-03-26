<section class="py-6">
	<p class="font-mono text-xs tracking-widest text-gold-dim uppercase">Docs</p>
	<h1 class="mt-3 font-heading text-3xl font-semibold text-gold-bright">FAQ</h1>

	<div class="prose prose-invert mt-8 max-w-none font-mono text-sm text-ash">
		<h2>Apakah Wiji “menggantikan” UUID/ULID?</h2>
		<p>
			Tidak. Wiji adalah opsi untuk use-case tertentu: time-ordered IDs dengan monotonic generator dan
			extractable timestamp.
		</p>

		<h2>Kenapa UUID v4 lebih cepat?</h2>
		<p>
			UUID v4 pada dasarnya random + formatting. Wiji melakukan packing timestamp + sequence + random node dan
			encoding (Base32/hex/uuid-like) — ada overhead tambahan.
		</p>

		<h2>Kenapa ULID bisa tidak “naturally sortable” di benchmark?</h2>
		<p>
			ULID time-sortable, tapi tidak selalu monotonic ketat dalam satu millisecond kecuali memakai monotonic ULID implementation.
		</p>

		<h2>Kenapa timestamp_us di JS adalah bigint?</h2>
		<p>
			Agar akurat untuk 56-bit microsecond timestamp. Jika butuh JSON, konversi ke string atau gunakan timestamp_ms.
		</p>
	</div>
</section>

