// Zero-file Web Audio API sound synthesizer + Web Speech API voice helper

let audioCtx: AudioContext | null = null;
let globalSoundEnabled = true;

export function setSoundEnabled(enabled: boolean): void {
  globalSoundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return globalSoundEnabled;
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !globalSoundEnabled) {
    return null;
  }
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  if (!audioCtx) {
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playTone(
  freqStart: number,
  freqEnd: number,
  durationSec: number,
  type: OscillatorType = 'sine',
  gainPeak = 0.14,
  delaySec = 0,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime + delaySec;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, now);
  if (freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, freqEnd),
      now + durationSec,
    );
  }

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(gainPeak, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + durationSec + 0.02);
}

export function playPopSound(): void {
  playTone(480, 760, 0.09, 'sine', 0.12);
}

export function playExplodeSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Deep sci-fi boom
  playTone(160, 42, 0.35, 'sawtooth', 0.16, 0);
  playTone(110, 35, 0.3, 'triangle', 0.14, 0.02);

  // Sparkle arpeggio
  const sparkleNotes = [523.25, 659.25, 783.99, 1046.5];
  sparkleNotes.forEach((freq, idx) => {
    playTone(freq, freq * 1.04, 0.14, 'triangle', 0.1, 0.12 + idx * 0.055);
  });
}

export function playSnapSound(): void {
  playTone(620, 440, 0.06, 'triangle', 0.11);
}

export function playRocketJumpSound(): void {
  playTone(220, 880, 0.24, 'triangle', 0.13);
  playTone(330, 1100, 0.2, 'sine', 0.08, 0.04);
}

export function playCorrectChime(): void {
  playTone(523.25, 523.25, 0.14, 'triangle', 0.13, 0);
  playTone(659.25, 659.25, 0.14, 'triangle', 0.13, 0.09);
  playTone(783.99, 783.99, 0.24, 'triangle', 0.15, 0.18);
}

export function playGentleTryAgain(): void {
  playTone(340, 290, 0.18, 'sine', 0.09, 0);
  playTone(290, 260, 0.2, 'sine', 0.08, 0.14);
}

export function playCelebrationFanfare(): void {
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
  notes.forEach((freq, i) => {
    playTone(freq, freq, 0.22, 'triangle', 0.14, i * 0.09);
  });
}

export function stopSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore speech synthesis errors in restricted environments
  }
}

export function speakText(text: string, enabled = true): void {
  if (!enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.08;
    utterance.rate = 0.98;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith('en-US') &&
            (v.name.includes('Natural') ||
              v.name.includes('Google') ||
              v.name.includes('Samantha') ||
              v.name.includes('Aria')),
        ) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en'));

      if (preferred) {
        utterance.voice = preferred;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully no-op if speech synthesis is blocked
  }
}
