import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../services/store';
import { useToastStore } from '../services/toast';

export default function EditTrack() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const { toast } = useToastStore();

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    api.getGenres().then(setGenres).catch(() => {});
    if (!id) return;
    api.getTrack(id).then((t) => {
      if (!t) { navigate('/'); return; }
      setTitle(t.title);
      setArtist(t.artist || '');
      setGenre(t.genre || '');
      setDescription(t.description || '');
      setCoverUrl(t.cover_url || null);
    }).catch(() => navigate('/')).finally(() => setLoading(false));
  }, [id, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError('');
    try {
      await api.updateTrack(id, {
        title,
        artist,
        genre,
        description,
        cover_url: coverUrl || null,
      });
      if (coverFile) {
        setCoverUploading(true);
        try {
          const coverForm = new FormData();
          coverForm.append('cover', coverFile);
          await api.uploadTrackCover(id, coverForm);
        } catch (e: any) {
          toast(e.message, 'error');
          setCoverUploading(false);
          return;
        }
        setCoverUploading(false);
      }
      navigate(`/track/${id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Editar Set</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div className="error">{error}</div>}

        <div
          onClick={() => coverRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            borderColor: coverFile ? 'var(--accent)' : undefined,
            background: coverFile ? 'var(--accent-glow)' : undefined,
          }}
        >
          {(coverPreview || coverUrl) && !coverFile ? (
            <div>
              <img src={coverPreview || coverUrl!} alt="Cover" style={{ maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Portada actual · Haz clic para cambiar</div>
            </div>
          ) : coverPreview ? (
            <div>
              <img src={coverPreview} alt="Cover preview" style={{ maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{coverFile?.name}</div>
            </div>
          ) : (
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Imagen de portada (opcional)</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>JPG, PNG, WebP, AVIF · Max 5 MB</div>
            </div>
          )}
          <input
            ref={coverRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,.avif,image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setCoverFile(f);
                setCoverPreview(URL.createObjectURL(f));
              }
            }}
          />
          {(coverFile || coverUrl) && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={(e) => {
                e.stopPropagation();
                setCoverFile(null);
                setCoverPreview(null);
                setCoverUrl(null);
                if (coverRef.current) coverRef.current.value = '';
              }}
            >
              Quitar imagen
            </button>
          )}
          {coverUploading && <div style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4 }}>Subiendo portada...</div>}
        </div>

        <div className="form-group">
          <label>Título *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nombre del set" required />
        </div>

        <div className="form-group">
          <label>Artista</label>
          <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Tu nombre DJ o artista" />
        </div>

        <div className="form-group">
          <label>Género</label>
          <select value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Sin género</option>
            {genres.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Cuenta sobre este set..." />
        </div>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ justifyContent: 'center' }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
