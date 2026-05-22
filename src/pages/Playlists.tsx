import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Playlist } from '../types';
import { useAuthStore } from '../services/store';
import { useToastStore } from '../services/toast';
import { Music, Headphones } from 'lucide-react';

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCover, setNewCover] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);
  const { toast } = useToastStore();
  const coverRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    (isAuthenticated ? api.getMyPlaylists() : api.getPlaylists())
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [isAuthenticated]);

  const handleCreate = async () => {
    if (!newName) return;
    try {
      const pl = await api.createPlaylist(newName, newDesc);
      if (newCover) {
        const fd = new FormData();
        fd.append('cover', newCover);
        await api.uploadPlaylistCover(pl.id, fd);
      }
      setShowCreate(false);
      setNewName('');
      setNewDesc('');
      setNewCover(null);
      setNewCoverPreview(null);
      load();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewCover(file);
    setNewCoverPreview(URL.createObjectURL(file));
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Playlists</h1>
        {isAuthenticated && (
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Nueva</button>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nueva Playlist</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Nombre</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la playlist" />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Descripción opcional" />
              </div>
              <div className="form-group">
                <label>Portada</label>
                <input ref={coverRef} type="file" accept="image/*" onChange={handleCoverChange} style={{ display: 'none' }} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => coverRef.current?.click()}>
                  {newCoverPreview ? 'Cambiar imagen' : 'Subir imagen'}
                </button>
                {newCoverPreview && (
                  <img src={newCoverPreview} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginTop: 8 }} />
                )}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {playlists.length === 0 ? (
        <div className="empty-state">
          <h3>No hay playlists</h3>
          <p>{isAuthenticated ? 'Crea tu primera playlist' : 'Los DJs aún no crearon playlists'}</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {playlists.map((pl, i) => {
            const gradients = [
              'linear-gradient(135deg, #8b5cf6, #6366f1)',
              'linear-gradient(135deg, #ec4899, #8b5cf6)',
              'linear-gradient(135deg, #06b6d4, #3b82f6)',
              'linear-gradient(135deg, #f59e0b, #ef4444)',
              'linear-gradient(135deg, #10b981, #06b6d4)',
              'linear-gradient(135deg, #ef4444, #ec4899)',
            ];
            const gradient = gradients[i % gradients.length];
            const icons = [Music, Headphones, Music, Headphones, Music, Headphones];
            const Icon = icons[i % icons.length];
            return (
              <Link key={pl.id} to={`/playlist/${pl.id}`} className="card card-hover" style={{ position: 'relative', overflow: 'hidden', animation: `fadeIn 0.3s ease ${i * 0.05}s both` }}>
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: 'var(--radius-sm)',
                  background: pl.cover_url ? `url(${pl.cover_url}) center/cover no-repeat` : gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, marginBottom: 12, position: 'relative',
                }}>
                  {!pl.cover_url && (
                    <>
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)',
                      }} />
                      <Icon size={36} style={{ position: 'relative', zIndex: 1 }} />
                    </>
                  )}
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{pl.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>
                  {pl.track_count || 0} sets
                </p>
                {pl.description && (
                  <p style={{ fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pl.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
