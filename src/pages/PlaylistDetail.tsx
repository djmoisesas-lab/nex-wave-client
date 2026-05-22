import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Playlist, Track } from '../types';
import TrackCard from '../components/TrackCard';
import { useAuthStore } from '../services/store';
import { useToastStore } from '../services/toast';
import { X } from 'lucide-react';

export default function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { toast } = useToastStore();
  const navigate = useNavigate();
  const coverRef = useRef<HTMLInputElement>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    api.getPlaylist(id).then((pl) => {
      setPlaylist(pl);
      setTracks(pl.tracks || []);
    }).catch(() => navigate('/playlists')).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const isOwner = user?.id === playlist?.user_id;

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    const fd = new FormData();
    fd.append('cover', file);
    try {
      const { coverUrl } = await api.uploadPlaylistCover(id, fd);
      setPlaylist((prev) => prev ? { ...prev, cover_url: coverUrl } : prev);
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!id) return;
    try {
      await api.removeTrackFromPlaylist(id, trackId);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleDelete = async () => {
    if (!id || !confirm('¿Eliminar esta playlist?')) return;
    try {
      await api.deletePlaylist(id);
      toast('Playlist eliminada', 'success');
      navigate('/playlists');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!playlist) return <div className="error">Playlist no encontrada</div>;

  const gradients = [
    'linear-gradient(135deg, #8b5cf6, #6366f1)',
    'linear-gradient(135deg, #ec4899, #8b5cf6)',
    'linear-gradient(135deg, #06b6d4, #3b82f6)',
    'linear-gradient(135deg, #f59e0b, #ef4444)',
    'linear-gradient(135deg, #10b981, #06b6d4)',
    'linear-gradient(135deg, #ef4444, #ec4899)',
  ];
  const gradientIdx = playlist.id ? playlist.id.charCodeAt(0) % gradients.length : 0;

  return (
    <div>
      <div style={{
        width: '100%', height: 200, borderRadius: 12, overflow: 'hidden', marginBottom: 20,
        background: playlist.cover_url ? `url(${playlist.cover_url}) center/cover no-repeat` : gradients[gradientIdx],
        position: 'relative', display: 'flex', alignItems: 'flex-end',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: playlist.cover_url ? 'linear-gradient(transparent 40%, rgba(0,0,0,0.7))' : 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, padding: 20, width: '100%' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'white' }}>{playlist.name}</h1>
          {playlist.description && (
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 }}>{playlist.description}</p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{tracks.length} sets</p>
        </div>
        {isOwner && (
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2, display: 'flex', gap: 8 }}>
            <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverUpload} style={{ display: 'none' }} />
            <button className="btn btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>
              {playlist.cover_url ? 'Cambiar portada' : 'Subir portada'}
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleDelete}>Eliminar</button>
          </div>
        )}
      </div>

      {tracks.length === 0 ? (
        <div className="empty-state">
          <h3>Playlist vacía</h3>
          <p>Agregá sets desde la página de cada set</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tracks.map((track, i) => (
            <div key={track.id} style={{ position: 'relative' }}>
              <TrackCard track={track} index={i} />
              {isOwner && (
                  <button
                  onClick={() => handleRemoveTrack(track.id)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', color: 'var(--text2)',
                    cursor: 'pointer', padding: 4, display: 'flex',
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
