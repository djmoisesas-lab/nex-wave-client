import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';
import { useAuthStore } from '../services/store';

export default function MyTracks() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setLoading(true);
    api.getMyTracks({ page }).then((res) => {
      setTracks(res.tracks);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [isAuthenticated, page]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Mis Sets</h1>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>+ Subir</button>
      </div>

      {tracks.length === 0 ? (
        <div className="empty-state">
          <h3>No tienes sets subidos</h3>
          <p>Subí tu primer set para compartir tu música</p>
          <button className="btn btn-primary" onClick={() => navigate('/upload')}>Subir Set</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>

          {total > 20 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: 'var(--text2)' }}>
                Página {page} de {Math.ceil(total / 20)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page * 20 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
