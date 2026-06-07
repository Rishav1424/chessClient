// Web Audio API Synthesizer for Chess Sound Effects
// Self-contained, zero-dependency, zero-network-latency

let audioCtx: AudioContext | null = null;

const getAudioContext = (): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    // Resume context if suspended (browser security autoplay policies)
    if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    return audioCtx;
};

// Play a short wood-block tick for standard moves
export const playMoveSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Quick drop in pitch simulating wood block impact
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
};

// Play a slightly higher, snappier tick for captures
export const playCaptureSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "triangle";
    osc1.frequency.setValueAtTime(320, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.06);

    osc2.type = "sine";
    osc2.frequency.setValueAtTime(600, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.02);

    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.06);
    osc2.stop(ctx.currentTime + 0.06);
};

// Play a warning chime for checks
export const playCheckSound = () => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (freq: number, startDelay: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "triangle";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + startDelay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
    };

    // Double chime warnings: F#4 then C#5
    playNote(370, 0, 0.18);
    playNote(554, 0.07, 0.25);
};

// Play game over chimes depending on outcome
export const playGameOverSound = (result: "win" | "lose" | "draw") => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playNote = (freq: number, startDelay: number, duration: number, volume: number = 0.25) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.value = freq;

        gain.gain.setValueAtTime(0, ctx.currentTime + startDelay);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + startDelay + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startDelay + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime + startDelay);
        osc.stop(ctx.currentTime + startDelay + duration);
    };

    if (result === "win") {
        // Bright ascending major chime fanfare: C5 -> E5 -> G5 -> C6
        playNote(523.25, 0, 0.2);
        playNote(659.25, 0.08, 0.2);
        playNote(783.99, 0.16, 0.2);
        playNote(1046.50, 0.24, 0.4, 0.3);
    } else if (result === "lose") {
        // Muted descending minor chime: G4 -> Eb4 -> C4
        playNote(392.00, 0, 0.3);
        playNote(311.13, 0.15, 0.3);
        playNote(261.63, 0.3, 0.6, 0.3);
    } else {
        // Neutral draw tone: C4 and G4 played in close succession
        playNote(261.63, 0, 0.4);
        playNote(392.00, 0.05, 0.5);
    }
};

// Auto-unlock Web Audio API context on first user interaction (click/keypress)
if (typeof window !== "undefined") {
    const unlock = () => {
        const ctx = getAudioContext();
        if (ctx) {
            ctx.resume().then(() => {
                window.removeEventListener("click", unlock);
                window.removeEventListener("keydown", unlock);
            });
        }
    };
    window.addEventListener("click", unlock, { capture: true, passive: true });
    window.addEventListener("keydown", unlock, { capture: true, passive: true });
}
