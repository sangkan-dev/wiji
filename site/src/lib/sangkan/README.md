# Sangkan optional: UI sonics

Procedural tick/hum sounds match the [Sangkan](https://sangkan.dev) “no silent interfaces” guideline.

## Wire-up

1. Import `cyberAudio` from `$lib/sangkan/audio`.
2. After first user gesture (required by browsers for `AudioContext`), call `cyberAudio.init()`:

```svelte
<script lang="ts">
	import { cyberAudio } from '$lib/sangkan/audio';
	import { onMount } from 'svelte';

	onMount(() => {
		const init = () => {
			cyberAudio.init();
			window.removeEventListener('pointerdown', init);
			window.removeEventListener('keydown', init);
		};
		window.addEventListener('pointerdown', init);
		window.addEventListener('keydown', init);
	});
</script>
```

3. Call `cyberAudio.playTick()` / `cyberAudio.playHum()` from handlers as needed.
4. Toggle mute via the `isAudioMuted` store if you add a control.

This module is **not** imported by the root layout so projects stay silent until you opt in.
