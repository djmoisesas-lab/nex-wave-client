import { useEffect, useRef } from 'react';
import { getAnalyser } from '../services/audio-bridge';

interface Props {
  url: string;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  duration?: number;
  currentTime?: number;
}

const BAR_COUNT = 200;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
const CANVAS_HEIGHT = 90;

function formatTime(t: number): string {
  if (isNaN(t)) return '0:00';
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function WaveformPlayer({ url, isPlaying, onSeek, duration = 0, currentTime = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>();
  const progressRef = useRef(0);
  const isPlayingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const prevFreqRef = useRef<number[]>([]);
  const lastBarsRef = useRef<number[]>([]);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  progressRef.current = duration > 0 ? (currentTime / duration) * 100 : 0;
  isPlayingRef.current = isPlaying;
  currentTimeRef.current = currentTime;

  const totalWidth = BAR_COUNT * (BAR_WIDTH + BAR_GAP) - BAR_GAP;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * 2;
        canvas.height = CANVAS_HEIGHT * 2;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${CANVAS_HEIGHT}px`;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const midY = h / 2;

      ctx.clearRect(0, 0, w, h);

      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, '#1e1028');
      grad.addColorStop(0.5, '#14081e');
      grad.addColorStop(1, '#0a0410');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const smooth: number[] = [];
      const analyser = getAnalyser();

      if (analyser && isPlayingRef.current) {
        if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
          dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
        const buf = dataArrayRef.current;
        analyser.getByteFrequencyData(buf);
        let sum = 0;
        for (let j = 0; j < buf.length; j++) sum += buf[j];
        if (sum > 500) {
          const prev = prevFreqRef.current;
          for (let i = 0; i < BAR_COUNT; i++) {
            const idx = Math.floor((i / BAR_COUNT) * buf.length);
            const raw = buf[idx] / 255;
            const p = prev[i] ?? raw;
            smooth[i] = p * 0.3 + raw * 0.7;
          }
        }
        if (smooth.length) lastBarsRef.current = smooth;
      }
      prevFreqRef.current = smooth;

      const step = (BAR_WIDTH + BAR_GAP) * (w / totalWidth);
      const offsetX = (w - step * BAR_COUNT + BAR_GAP * (w / totalWidth)) / 2;
      const progressX = (progressRef.current / 100) * w;

      if (progressX > 0) {
        const glowGrad = ctx.createRadialGradient(progressX, 0, 0, progressX, 0, h * 0.5);
        glowGrad.addColorStop(0, 'rgba(139,92,246,0.25)');
        glowGrad.addColorStop(0.5, 'rgba(139,92,246,0.08)');
        glowGrad.addColorStop(1, 'rgba(139,92,246,0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, progressX, h * 0.5);
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        const bars = smooth.length ? smooth : lastBarsRef.current;
        const amp = (bars[i] ?? 0) * 1.0 + 0.02;
        const barHeight = Math.max(2, amp * h * 0.38);
        const x = offsetX + i * step;
        const barW = BAR_WIDTH * (w / totalWidth);
        const barCenterX = x + barW / 2;

        const isPlayed = barCenterX <= progressX;

        ctx.fillStyle = isPlayed ? 'rgba(139,92,246,0.9)' : 'rgba(255,255,255,0.45)';
        ctx.fillRect(x, midY - barHeight, barW, barHeight);
        ctx.fillRect(x, midY, barW, barHeight);
      }

      ctx.strokeStyle = 'rgba(139,92,246,0.8)';
      ctx.lineWidth = 2 * (w / (canvas.clientWidth || 1));
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, h);
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(pct * duration);
  };

  return (
    <div style={{ position: 'relative', userSelect: 'none' }} onClick={handleClick}>
      <canvas ref={canvasRef} style={{ width: '100%', height: CANVAS_HEIGHT, borderRadius: 8, display: 'block' }} />
    </div>
  );
}
