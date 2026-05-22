import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Playlist } from '../types';

interface Props {
  trackId: string;
  onClose: () => void;
}

export default function AddToPlaylistModal({ trackId, onClose }: Props) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.getMyPlaylists()
      .then(setPlaylists)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async (playlistId: string) => {
    setAdding(playlistId);
    try {
      await api.addTrackToPlaylist(playlistId, trackId);
      setMsg('✓ Agregado a la playlist');
      setTimeout(onClose, 1000);
    } catch (e: any) {
      setMsg(e.message);
    } finally {
      setAdding('');
    }
  };

  const handleCreate = async () => {
    if (!newName) return;
    try {
      const pl = await api.createPlaylist(newName);
      await api.addTrackToPlaylist(pl.id, trackId);
      setMsg('✓ Playlist creada y track agregado');
      setTimeout(onClose, 1000);
    } catch (e: any) {
      setMsg(e.message);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <h2>Añadir a playlist</h2>

        {msg ? (
          <p style={{ textAlign: 'center', padding: 20, fontSize: 15, color: 'var(--accent)' }}>{msg}</p>
        ) : showCreate ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label>Nombre</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nombre de la playlist" autoFocus />
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreate}>Crear y agregar</button>
            </div>
          </div>
        ) : loading ? (
          <div className="loading"><div className="spinner" /></div>
        ) : playlists.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ marginBottom: 16, color: 'var(--text2)' }}>No tienes playlists</p>
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Crear playlist</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {playlists.map((pl) => (
              <button
                key={pl.id}
                onClick={() => handleAdd(pl.id)}
                disabled={adding === pl.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer', color: 'var(--text)',
                  fontSize: 14, transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <span>{pl.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                  {adding === pl.id ? 'Agregando...' : `${pl.track_count || 0} tracks`}
                </span>
              </button>
            ))}
            <button
              className="btn btn-secondary"
              onClick={() => setShowCreate(true)}
              style={{ marginTop: 8 }}
            >
              + Nueva playlist
            </button>
          </div>
        )}

        {!msg && !showCreate && (
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          </div>
        )}
      </div>
    </div>
  );
}
