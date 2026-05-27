import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayerStore, useAuthStore } from '../services/store';
import { api } from '../services/api';
import { useMediaQuery } from '../services/useMediaQuery';
import { initAudioBridge, getAnalyser, resumeAudioContext } from '../services/audio-bridge';
import Tilt from './Tilt';
import { Play, Pause, SkipBack, SkipForward, VolumeX, Volume1, Volume2, X, Disc3 } from 'lucide-react';

const BAR_COUNT = 128;

export default function PlayerBar() {
  const { currentTrack, isPlaying, setPlaying, nextTrack, prevTrack, volume, setVolume, currentTime, duration, setCurrentTime: setStoreCurrentTime, setDuration: setStoreDuration, setFrequencyData, pendingSeek, seekTo, queue, removeFromQueue } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number>();
  const currentSrcRef = useRef('');
  const seekRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.crossOrigin = 'anonymous';
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => setStoreCurrentTime(audio.currentTime);
    const onDurationChange = () => setStoreDuration(audio.duration);
    const onEnded = () => nextTrack();
    const onError = () => {
      console.error('Audio error:', audio.error?.code, audio.error?.message);
      setPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack) {
      audio.pause();
      return;
    }

    const url = api.streamUrl(currentTrack.id);
    if (currentSrcRef.current !== url) {
      currentSrcRef.current = url;
      audio.src = url;
      audio.load();
      if (isPlaying) {
        const onCanPlay = () => {
          audio.play().catch(() => setPlaying(false));
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadedmetadata', onCanPlay);
        };
        audio.addEventListener('canplay', onCanPlay);
        audio.addEventListener('loadedmetadata', onCanPlay);
        return () => {
          audio.removeEventListener('canplay', onCanPlay);
          audio.removeEventListener('loadedmetadata', onCanPlay);
        };
      }
    } else if (isPlaying) {
      audio.play().catch(() => setPlaying(false));
    } else {
      audio.pause();
    }
  }, [currentTrack?.id, isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && pendingSeek !== null) {
      audio.currentTime = pendingSeek;
      setStoreCurrentTime(pendingSeek);
      seekTo(-1);
    }
  }, [pendingSeek]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      initAudioBridge(audio);
      resumeAudioContext();
      const dataArray = new Uint8Array(128);

      const tick = () => {
        const a = getAnalyser();
        if (a) {
          a.getByteFrequencyData(dataArray);
          const normalized: number[] = [];
          for (let i = 0; i < 128; i++) {
            normalized.push(dataArray[i] / 255);
          }
          setFrequencyData(normalized);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = undefined;
      }
    };
  }, [isPlaying, currentTrack?.id]);

  useEffect(() => {
    if (currentTrack && isPlaying) setDismissed(false);
  }, [currentTrack?.id, isPlaying]);

  useEffect(() => {
    if (!isAuthenticated && isPlaying) {
      setPlaying(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => {
      const trackId = usePlayerStore.getState().currentTrack?.id;
      if (trackId) {
        api.registerPlay(trackId).catch(() => {});
      }
    };
    audio.addEventListener('play', onPlay);
    return () => audio.removeEventListener('play', onPlay);
  }, []);

  const togglePlay = () => {
    if (currentTrack) setPlaying(!isPlaying);
  };

  const seekByPos = (clientX: number) => {
    if (!audioRef.current || !duration || !seekRef.current) return;
    const rect = seekRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const time = pct * duration;
    audioRef.current.currentTime = time;
    setStoreCurrentTime(time);
    return time;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const time = seekByPos(e.clientX);
    if (time !== undefined) {
      setDragTime(time);
      setIsDragging(true);
    }
  };

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      const time = seekByPos(e.clientX);
      if (time !== undefined) setDragTime(time);
    };
    const handleUp = () => {
      setIsDragging(false);
    };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, duration]);

  const formatTime = (t: number) => {
    if (isNaN(t)) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (dismissed) return null;

  if (!currentTrack) {
    return (
      <div className="glass player-glow" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '10px 12px' : '12px 20px', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>Selecciona un track para reproducir</span>
        <button
          onClick={() => { setPlaying(false); setDismissed(true); }}
          style={{
            background: 'none', border: 'none', color: 'var(--text2)',
            cursor: 'pointer', padding: '2px 6px', fontSize: 16, opacity: 0.5,
          }}
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass player-glow" style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      padding: isMobile ? '6px 8px' : '10px 20px', zIndex: 200,
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 12 }}>
        {!isMobile && (currentTrack.cover_url ? (
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: isPlaying ? 0 : 999 }}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              overflow: 'hidden',
              boxShadow: isPlaying ? '0 0 16px var(--accent-glow)' : 'none',
            }}
          >
            <img src={currentTrack.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </motion.div>
        ) : (
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: isPlaying ? 0 : 999 }}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: `conic-gradient(from 0deg, var(--accent), #6366f1, #a78bfa, var(--accent))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isPlaying ? '0 0 16px var(--accent-glow), 0 0 40px var(--accent-glow)' : 'none',
              transition: 'box-shadow 0.3s',
            }}
          >
            <div style={{
              width: 12, height: 12, borderRadius: '50%',
              background: 'var(--bg2)', border: '2px solid rgba(0,0,0,0.3)',
            }} />
          </motion.div>
        ))}

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 8, minWidth: isMobile ? 'auto' : 200 }}>
          <Tilt
            as="button"
            onClick={() => prevTrack()}
            className="play-btn play-btn-inactive"
            style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, fontSize: 14 }}
            tiltAmount={6}
          >
            <SkipBack size={isMobile ? 14 : 18} />
          </Tilt>
          <Tilt
            as="button"
            onClick={togglePlay}
            className="play-btn play-btn-active"
            style={{
              width: isMobile ? 34 : 40, height: isMobile ? 34 : 40,
              transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s',
              transform: isPlaying ? 'scale(1)' : 'scale(0.92)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            tiltAmount={8}
          >
            {isPlaying ? <Pause size={isMobile ? 16 : 20} /> : <Play size={isMobile ? 16 : 20} />}
          </Tilt>
          <Tilt
            as="button"
            onClick={() => nextTrack()}
            className="play-btn play-btn-inactive"
            style={{ width: isMobile ? 28 : 32, height: isMobile ? 28 : 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            tiltAmount={6}
          >
            <SkipForward size={isMobile ? 14 : 18} />
          </Tilt>
          <div style={{ minWidth: 0 }}>
            <Link to={`/track/${currentTrack.id}`} style={{
              color: 'var(--text)', fontSize: isMobile ? 12 : 14, fontWeight: 600,
              display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: isMobile ? 80 : 200,
            }}>
              {currentTrack.title}
            </Link>
            {!isMobile && (
              <span style={{ color: 'var(--text2)', fontSize: 12 }}>
                {currentTrack.artist || currentTrack.display_name || currentTrack.username}
              </span>
            )}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: isMobile ? 4 : 10, minWidth: 0 }}>
          <span style={{ fontSize: 10, color: 'var(--text2)', minWidth: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {formatTime(Math.max(0, currentTime))}
          </span>
          <div
            ref={seekRef}
            onMouseDown={handleMouseDown}
            style={{
              flex: 1, height: isMobile ? 3 : 4, background: 'var(--bg4)', borderRadius: 4,
              cursor: 'pointer', position: 'relative',
              transition: 'height 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.height = '6px'}
            onMouseLeave={(e) => e.currentTarget.style.height = isMobile ? '3px' : '4px'}
          >
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
              borderRadius: 4,
              width: `${isDragging ? (dragTime / duration) * 100 : progress}%`,
              transition: isDragging ? 'none' : 'width 0.15s linear',
            }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--text2)', minWidth: 24, fontVariantNumeric: 'tabular-nums' }}>
            -{formatTime(Math.max(0, duration - currentTime))}
          </span>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span
              onClick={() => usePlayerStore.getState().toggleMute()}
              style={{ color: 'var(--text2)', width: 20, textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {volume === 0 ? <VolumeX size={16} /> : volume < 0.5 ? <Volume1 size={16} /> : <Volume2 size={16} />}
            </span>
            <div style={{ position: 'relative', width: 80, minWidth: 60, height: 20 }}>
              <div style={{
                position: 'absolute', top: '50%', left: 0, right: 0,
                height: 4, transform: 'translateY(-50%)', borderRadius: 4, pointerEvents: 'none',
                background: `linear-gradient(to right, var(--accent) ${volume * 100}%, var(--bg4) ${volume * 100}%)`,
              }} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', margin: 0, background: 'transparent' }}
              />
            </div>
            <span style={{ fontSize: 10, color: 'var(--text2)', width: 24, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(volume * 100)}%
            </span>

            <button
              onClick={() => { setPlaying(false); setDismissed(true); }}
              style={{
                background: 'none', border: 'none', color: 'var(--text2)',
                cursor: 'pointer', padding: '2px 6px', opacity: 0.5, display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
