import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../services/store';

interface Props {
  url: string;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  duration?: number;
  currentTime?: number;
}

const BAR_COUNT = 128;
const BAR_COLOR = 'rgba(139, 92, 246, 0.3)';
const BAR_ACTIVE_COLOR = 'rgba(139, 92, 246, 0.7)';

export default function Waveform({ url, isPlaying, onSeek, duration = 0, currentTime = 0 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const progressRef = useRef(0);
  const isPlayingRef = useRef(false);

  progressRef.current = duration > 0 ? (currentTime / duration) * 100 : 0;
  isPlayingRef.current = isPlaying;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let prevFreq: number[] = [];
    let smoothFreq: number[] = [];

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (rect) {
        canvas.width = rect.width * 2;
        canvas.height = 80 * 2;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = '80px';
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / BAR_COUNT;
      const progressX = (progressRef.current / 100) * canvas.width;

      const store = usePlayerStore.getState();
      const rawFreq = store.frequencyData;

      if (isPlayingRef.current && rawFreq.length === BAR_COUNT) {
        prevFreq = smoothFreq.length ? smoothFreq : rawFreq;
        smoothFreq = [];
        for (let i = 0; i < BAR_COUNT; i++) {
          smoothFreq[i] = prevFreq[i] * 0.3 + rawFreq[i] * 0.7;
        }
      } else {
        smoothFreq = [];
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        let amplitude: number;
        if (smoothFreq.length) {
          amplitude = smoothFreq[i] * 0.8 + 0.15;
        } else {
          amplitude = (Math.sin(i * 0.3) * 0.5 + 0.5) * 0.4 + 0.15;
        }

        const height = Math.max(4, amplitude * canvas.height * 0.7);
        const x = i * barWidth;
        const barX = x + barWidth / 2;
        const isActive = barX <= progressX;

        ctx.fillStyle = isActive ? BAR_ACTIVE_COLOR : BAR_COLOR;
        ctx.fillRect(x + 1, (canvas.height - height) / 2, barWidth - 2, height);
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    onSeek(pct * duration);
  };

  const progress = progressRef.current;

  return (
    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={handleClick as any}>
      <canvas ref={canvasRef} style={{ width: '100%', height: 80, borderRadius: 8, display: 'block' }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '100%',
        width: `${progress}%`, borderRadius: 8,
        background: 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0) 100%)',
        pointerEvents: 'none',
        transition: 'width 0.1s linear',
      }} />
      <div style={{
        position: 'absolute', top: 0, left: `${progress}%`, height: '100%',
        width: 2, background: 'var(--accent)',
        pointerEvents: 'none',
        transition: 'left 0.1s linear',
      }} />
    </div>
  );
}
