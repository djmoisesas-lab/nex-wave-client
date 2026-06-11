import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../services/store';
import { useToastStore } from '../services/toast';
import { useMediaQuery } from '../services/useMediaQuery';
import { useEffect } from 'react';
import { Upload as UploadIcon, Music, FolderOpen } from 'lucide-react';

export default function Upload() {
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToastStore();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login');
  }, [isAuthenticated]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('');

  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.getGenres().then(setGenres).catch(() => {});
  }, []);

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { setError('Seleccioná un archivo de audio'); return; }
    if (!title) { setError('El título es requerido'); return; }

    setUploading(true);
    setProgress(0);
    setError('');

    const MAX_SIZE = 400 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError(`El archivo supera el límite de 400 MB`);
      setUploading(false);
      return;
    }

    try {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const { url, path } = await api.initUpload(ext || '.mp3', file.type || 'audio/mpeg', file.size);

      await api.uploadToSignedUrl(url, file, setProgress);

      const track = await api.uploadTrackFromFirebase({
        firebasePath: path,
        title,
        artist,
        genre,
        description,
        originalName: file.name,
      });

      if (cover) {
        const coverForm = new FormData();
        coverForm.append('cover', cover);
        await api.uploadTrackCover(track.id, coverForm);
      }
      toast('Set subido con éxito', 'success');
      navigate(`/track/${track.id}`);
    } catch (e: any) {
      setError(e.message);
      toast(e.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Subir Set</h1>
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div className="error">{error}</div>}

        {uploading ? (
          <div style={{ padding: 32, textAlign: 'center' }}>
            <UploadIcon size={32} style={{ marginBottom: 12 }} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Subiendo...</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
              {file?.name} · {file ? formatSize(file.size) : ''}
            </div>
            <div style={{
              width: '100%', height: 8, background: 'var(--bg3)', borderRadius: 4,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--accent), var(--accent2))',
                borderRadius: 4, transition: 'width 0.2s ease',
              }} />
            </div>
            <div style={{ fontSize: 13, color: 'var(--accent)', marginTop: 8, fontWeight: 600 }}>
              {progress}%
            </div>
            <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 4 }}>
              No cierres esta página hasta que termine
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--radius)',
              padding: isMobile ? 24 : 40,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.2s, background 0.2s',
              background: file ? 'var(--accent-glow)' : undefined,
              borderColor: file ? 'var(--accent)' : undefined,
            }}
          >
            {file ? (
              <div>
                <Music size={isMobile ? 24 : 32} style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : undefined }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                  {formatSize(file.size)}
                </div>
              </div>
            ) : (
              <div>
                <FolderOpen size={isMobile ? 24 : 32} style={{ marginBottom: 8 }} />
                <div style={{ fontWeight: 600, fontSize: isMobile ? 13 : undefined }}>Haz clic para seleccionar</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
                  MP3, WAV, FLAC, AAC, OGG, M4A · Max 400 MB
                </div>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".mp3,.wav,.flac,.aac,.ogg,.m4a,audio/*"
              style={{ display: 'none' }}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          )}

        <div
          onClick={() => coverRef.current?.click()}
          style={{
            border: '2px dashed var(--border)',
            borderRadius: 'var(--radius)',
            padding: isMobile ? 14 : 20,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'border-color 0.2s',
            borderColor: cover ? 'var(--accent)' : undefined,
            background: cover ? 'var(--accent-glow)' : undefined,
          }}
        >
          {coverPreview ? (
            <div>
              <img src={coverPreview} alt="Cover preview" style={{ maxHeight: 120, borderRadius: 8, marginBottom: 8 }} />
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{cover?.name}</div>
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
                setCover(f);
                setCoverPreview(URL.createObjectURL(f));
              }
            }}
          />
          {cover && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ marginTop: 8 }}
              onClick={(e) => { e.stopPropagation(); setCover(null); setCoverPreview(null); if (coverRef.current) coverRef.current.value = ''; }}
            >
              Quitar imagen
            </button>
          )}
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

        <button type="submit" className="btn btn-primary" disabled={uploading} style={{ justifyContent: 'center' }}>
          {uploading ? `Subiendo ${progress}%...` : 'Subir Set'}
        </button>
      </form>
    </div>
  );
}
