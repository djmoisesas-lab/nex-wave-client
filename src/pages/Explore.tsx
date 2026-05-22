import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Track } from '../types';
import TrackCard from '../components/TrackCard';

export default function Explore() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('date');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    api.getGenres().then(setGenres).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getTracks({ page, genre: selectedGenre, search, sort }).then((res) => {
      setTracks(res.tracks);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [page, selectedGenre, sort]);

  const handleSearch = () => {
    setPage(1);
    setLoading(true);
    api.getTracks({ page: 1, genre: selectedGenre, search, sort }).then((res) => {
      setTracks(res.tracks);
      setTotal(res.total);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  return (
    <div>
      <div className="page-header">
        <h1>Explorar</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Buscar sets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <select value={selectedGenre} onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }} style={{ width: 160 }}>
          <option value="">Todos los géneros</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} style={{ width: 150 }}>
          <option value="date">Más recientes</option>
          <option value="plays">Más reproducidos</option>
          <option value="likes">Más likeados</option>
          <option value="title">A-Z</option>
        </select>
        <button className="btn btn-secondary" onClick={handleSearch}>Buscar</button>
      </div>

      {loading ? (
        <div className="loading"><div className="spinner" /></div>
      ) : tracks.length === 0 ? (
        <div className="empty-state">
          <h3>No se encontraron sets</h3>
          <p>Probá con otra búsqueda o filtro</p>
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
                Página {page}
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
