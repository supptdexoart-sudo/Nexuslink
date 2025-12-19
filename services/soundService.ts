
// Web Audio API & Haptics Service
// Advanced Procedural Sound Generation for Cyberpunk Aesthetic

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;

// Settings State
let isSoundEnabled = localStorage.getItem('nexus_sound_enabled') !== 'false'; // Default true
let isVibrationEnabled = localStorage.getItem('nexus_vibration_enabled') !== 'false'; // Default true

export const getSoundStatus = () => isSoundEnabled;
export const getVibrationStatus = () => isVibrationEnabled;

export const toggleSoundSystem = (enabled: boolean) => {
    isSoundEnabled = enabled;
    localStorage.setItem('nexus_sound_enabled', String(enabled));
    // If turning on, play a test sound
    if (enabled) playSound('click');
};

export const toggleVibrationSystem = (enabled: boolean) => {
    isVibrationEnabled = enabled;
    localStorage.setItem('nexus_vibration_enabled', String(enabled));
    // If turning on, vibrate
    if (enabled) vibrate(50);
};

// Inicializace audio kontextu
const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.4; // Master volume
    masterGain.connect(audioCtx.destination);
    
    // Vygenerovat bílý šum pro efekty (explosions, hits)
    const bufferSize = audioCtx.sampleRate * 2; // 2 sekundy šumu
    noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return { ctx: audioCtx, master: masterGain, noise: noiseBuffer };
};

export const vibrate = (pattern: number | number[]) => {
  if (!isVibrationEnabled) return;
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

type SoundType = 'click' | 'scan' | 'error' | 'success' | 'heal' | 'damage' | 'message' | 'open' | 'siren' | 'gift';

export const playSound = (type: SoundType) => {
  if (!isSoundEnabled) return;
  try {
    const { ctx, master, noise } = initAudio();
    if (!ctx || !master) return;

    const now = ctx.currentTime;

    switch (type) {
      case 'click': 
        // High-tech "tick"
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(master);
            
            osc.frequency.setValueAtTime(1200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
            
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            
            osc.start(now);
            osc.stop(now + 0.05);
        }
        break;

      case 'open':
        // Sci-fi UI Open Swish
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(master);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.15, now + 0.1);
            gain.gain.linearRampToValueAtTime(0, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.3);
        }
        break;

      case 'scan': 
        // Data processing sound (computational chirps)
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(master);

            // Rychlá modulace frekvence
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.setValueAtTime(1200, now + 0.05);
            osc.frequency.setValueAtTime(600, now + 0.1);
            osc.frequency.setValueAtTime(1500, now + 0.15);

            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.start(now);
            osc.stop(now + 0.2);
        }
        break;

      case 'error': 
        // Access Denied / Critical Low Tone
        {
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc1.type = 'sawtooth';
            osc2.type = 'square';
            
            osc1.frequency.value = 150;
            osc2.frequency.value = 145; // Dissonance

            osc1.connect(gain);
            osc2.connect(gain);
            gain.connect(master);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + 0.4);
            osc2.stop(now + 0.4);
        }
        break;

      case 'success': 
      case 'gift':
        // Positive Chord (Major Triad) with glissando
        {
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                
                osc.connect(gain);
                gain.connect(master);
                
                const startTime = now + (i * 0.05);
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
                
                osc.start(startTime);
                osc.stop(startTime + 0.5);
            });
        }
        break;

      case 'heal': 
        // Angelic Synth Swell
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();

            osc.type = 'sine';
            filter.type = 'lowpass';
            filter.frequency.value = 1000;

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(master);

            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(880, now + 1.5); // Rising pitch

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.5);
            gain.gain.linearRampToValueAtTime(0, now + 1.5);

            osc.start(now);
            osc.stop(now + 1.5);
        }
        break;

      case 'damage': 
        // Heavy Impact (Noise + Low Thud)
        {
            // 1. Noise Burst (The Hit)
            if (noise) {
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = noise;
                const noiseFilter = ctx.createBiquadFilter();
                const noiseGain = ctx.createGain();

                noiseFilter.type = 'lowpass';
                noiseFilter.frequency.setValueAtTime(1000, now);
                noiseFilter.frequency.exponentialRampToValueAtTime(100, now + 0.2);

                noiseSource.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(master);

                noiseGain.gain.setValueAtTime(0.5, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

                noiseSource.start(now);
                noiseSource.stop(now + 0.3);
            }

            // 2. Low Frequency Thud (The Body)
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.connect(gain);
            gain.connect(master);

            osc.frequency.setValueAtTime(100, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.3);
        }
        break;

      case 'message': 
        // Notification Ping
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.connect(gain);
            gain.connect(master);

            osc.frequency.setValueAtTime(880, now);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.3);
        }
        break;

      case 'siren': 
        // Red Alert Alarm
        {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            
            // LFO for pitch modulation
            const lfo = ctx.createOscillator();
            lfo.type = 'triangle';
            lfo.frequency.value = 4; // 4Hz modulation
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 200; // Modulation depth

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            osc.connect(gain);
            gain.connect(master);

            osc.frequency.value = 600; // Base frequency

            // Envelope
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
            gain.gain.linearRampToValueAtTime(0.3, now + 1.2);
            gain.gain.linearRampToValueAtTime(0, now + 1.5);

            osc.start(now);
            lfo.start(now);
            osc.stop(now + 1.5);
            lfo.stop(now + 1.5);
        }
        break;
    }
  } catch (e) {
    console.error("Audio Playback Failed", e);
  }
};
