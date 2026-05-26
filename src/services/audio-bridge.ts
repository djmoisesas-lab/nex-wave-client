let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let sourceNode: MediaElementAudioSourceNode | null = null;

export function getAnalyser() {
  return analyser;
}

export function initAudioBridge(audio: HTMLAudioElement) {
  if (sourceNode) return;
  try {
    const ctx = new AudioContext();
    const a = ctx.createAnalyser();
    a.fftSize = 256;
    const src = ctx.createMediaElementSource(audio);
    src.connect(a);
    a.connect(ctx.destination);
    audioCtx = ctx;
    analyser = a;
    sourceNode = src;
  } catch (e) {
    console.warn('Audio bridge init failed (cross-origin?), visualization disabled:', e);
  }
}

export function resumeAudioContext() {
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}
