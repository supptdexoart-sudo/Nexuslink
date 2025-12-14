
// Web Audio API & Haptics Service
// Generuje zvuky v reálném čase bez nutnosti externích souborů.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;

const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3; // Master volume
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return { ctx: audioCtx, master: masterGain };
};

export const vibrate = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

type SoundType = 'click' | 'scan' | 'error' | 'success' | 'heal' | 'damage' | 'message' | 'open';

export const playSound = (type: SoundType) => {
  try {
    const { ctx, master } = initAudio();
    if (!ctx || !master) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(master);

    const now = ctx.currentTime;

    switch (type) {
      case 'click': // Jemné UI kliknutí
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;

      case 'scan': // Sci-fi chirp pro skener
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(2500, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
        break;

      case 'error': // Hluboký bzučák
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.linearRampToValueAtTime(100, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;

      case 'success': // Pozitivní akord (Arpeggio)
        playTone(ctx, master, 523.25, now, 0.1, 'sine'); // C5
        playTone(ctx, master, 659.25, now + 0.1, 0.1, 'sine'); // E5
        playTone(ctx, master, 783.99, now + 0.2, 0.2, 'sine'); // G5
        break;

      case 'heal': // Rostoucí harmonický zvuk
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.linearRampToValueAtTime(600, now + 1);
        
        // Tremolo efekt
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 10;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 500;
        lfo.connect(lfoGain.gain);
        
        gain.gain.setValueAtTime(0.0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
        gain.gain.linearRampToValueAtTime(0.0, now + 1);
        
        osc.start(now);
        osc.stop(now + 1);
        break;

      case 'damage': // Klesající drsný zvuk
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        
        // Noise simulace (rychlá modulace)
        const noiseLfo = ctx.createOscillator();
        noiseLfo.type = 'square';
        noiseLfo.frequency.value = 50;
        noiseLfo.connect(gain.gain);
        noiseLfo.start(now);
        noiseLfo.stop(now + 0.5);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'message': // Jemné cinknutí
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
        break;

      case 'open': // High-tech "whoosh"
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + 0.1);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
    }
  } catch (e) {
    console.error("Audio Playback Failed", e);
  }
};

// Helper pro success akord
const playTone = (ctx: AudioContext, master: GainNode, freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(gain);
    gain.connect(master);
    gain.gain.setValueAtTime(0.05, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
};
