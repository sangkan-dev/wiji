import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export const isAudioMuted = writable(false);

class CyberAudio {
	private ctx: AudioContext | null = null;
	private masterGain: GainNode | null = null;
	private initialized = false;
	private muted = false;

	constructor() {
		isAudioMuted.subscribe((value) => {
			this.muted = value;
		});
	}

	init() {
		if (!browser || this.initialized) return;
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
			this.ctx = new AudioContextClass();
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.value = 0.05;
			this.masterGain.connect(this.ctx.destination);
			this.initialized = true;
		} catch {
			console.warn('AudioContext not supported');
		}
	}

	playTick(pitchOffset = 1.0) {
		if (this.muted || !this.ctx || !this.masterGain) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'sine';
		osc.frequency.setValueAtTime(8000 * pitchOffset, this.ctx.currentTime);
		osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.05);

		gain.gain.setValueAtTime(1, this.ctx.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start();
		osc.stop(this.ctx.currentTime + 0.05);
	}

	playHum(duration = 0.5) {
		if (this.muted || !this.ctx || !this.masterGain) return;

		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();

		osc.type = 'triangle';
		osc.frequency.setValueAtTime(50, this.ctx.currentTime);

		gain.gain.setValueAtTime(0, this.ctx.currentTime);
		gain.gain.linearRampToValueAtTime(0.5, this.ctx.currentTime + 0.1);
		gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + duration);

		osc.connect(gain);
		gain.connect(this.masterGain);

		osc.start();
		osc.stop(this.ctx.currentTime + duration);
	}
}

export const cyberAudio = new CyberAudio();
