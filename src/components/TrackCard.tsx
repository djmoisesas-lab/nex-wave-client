import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Track } from '../types';
import { usePlayerStore, useAuthStore } from '../services/store';
import { api } from '../services/api';
import { useMediaQuery } from '../services/useMediaQuery';
import Tilt from './Tilt';
import { Play } from 'lucide-react';

interface Props {
  track: Track;
  index?: number;
  onLike?: (trackId: string, liked: boolean) => void;
}

export default function TrackCard({ track, index = 0, onLike }: Props) {
  const { setTrack, currentTrack, isPlaying, setPlaying, addToQueue } = usePlayerStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(track.is_liked);
  const [likesCount, setLikesCount] = useState(track.likes_count);
  const [isHovered, setIsHovered] = useState(false);

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isCurrentTrack) {
      setPlaying(!isPlaying);
    } else {
      setTrack(track);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) { navigate('/login'); return; }
    setLiked(!liked);
    setLikesCount((c) => c + (liked ? -1 : 1));
    try {
      if (liked) {
        await api.unlikeTrack(track.id);
      } else {
        await api.likeTrack(track.id);
      }
      onLike?.(track.id, !liked);
    } catch {
      setLiked(liked);
      setLikesCount(likesCount);
    }
  };

  return (
    <Link
      to={`/track/${track.id}`}
      className="card track-card-enter"
      style={{
        display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 14, padding: isMobile ? 10 : 14,
        borderColor: isHovered ? 'var(--accent)' : isCurrentTrack ? 'var(--accent)' : undefined,
        animationDelay: `${index * 0.03}s`,
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-1px) scale(1.01)' : undefined,
        boxShadow: isHovered ? `0 0 24px var(--accent-glow), 0 4px 12px rgba(0,0,0,0.3)` : undefined,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Tilt
        as="button"
        onClick={handlePlay}
        className={`play-btn ${isCurrentTrack ? 'play-btn-active' : 'play-btn-inactive'}`}
        tiltAmount={8}
      >
        {isCurrentTrack && isPlaying ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, height: 16 }}>
            <span className="eq-bar" style={{ animationDelay: '0s' }} />
            <span className="eq-bar" style={{ animationDelay: '0.15s' }} />
            <span className="eq-bar" style={{ animationDelay: '0.3s' }} />
          </span>
        ) : (
          <Play size={16} />
        )}
      </Tilt>
      {track.cover_url && !isMobile && (
        <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
          <img src={track.cover_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 600, fontSize: 14, marginBottom: 2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color: isCurrentTrack ? 'var(--accent)' : 'var(--text)',
        }}>
          {track.title}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text2)' }}>
          <span>{track.artist || track.display_name || track.username}</span>
          {track.genre && (
            <>
              <span>·</span>
              <span>{track.genre}</span>
            </>
          )}
          {track.bpm && (
            <>
              <span>·</span>
              <span>{track.bpm} BPM</span>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: isMobile ? 6 : 8, alignItems: 'center', flexShrink: 0 }}>
        <button
          onClick={handleLike}
          style={{
            display: 'flex', gap: 3, alignItems: 'center', fontSize: isMobile ? 11 : 12,
            background: 'none', border: 'none', cursor: isAuthenticated ? 'pointer' : 'default',
            color: liked ? '#ec4899' : 'var(--text2)', padding: '2px 4px',
            transition: 'color 0.15s, transform 0.15s',
          }}
          title={liked ? 'Quitar like' : 'Dar like'}
        >
          <svg
            width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} viewBox="0 0 24 24"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
{likesCount}
        </button>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', fontSize: isMobile ? 11 : 12, color: 'var(--text2)' }}>
          <svg width={isMobile ? 12 : 14} height={isMobile ? 12 : 14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {track.plays}
        </div>
        {!isMobile && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!isAuthenticated) { navigate('/login'); return; } addToQueue(track); }}
            className="btn btn-secondary btn-sm"
            style={{ whiteSpace: 'nowrap' }}
            title="Añadir a la cola"
          >
            + Cola
          </button>
        )}
      </div>
    </Link>
  );
}
