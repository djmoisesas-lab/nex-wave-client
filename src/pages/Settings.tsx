import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../services/store';
import { useMediaQuery } from '../services/useMediaQuery';

export default function Settings() {
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (user) {
      setDisplayName(user.display_name || '');
      setBio(user.bio || '');
      setSocialInstagram(user.social_instagram || '');
      setSocialTiktok(user.social_tiktok || '');
      setSocialFacebook(user.social_facebook || '');
      setIsPublic(!!user.is_public);
    }
  }, [user, isAuthenticated]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      if (avatarFile) {
        setUploadingAvatar(true);
        const fd = new FormData();
        fd.append('avatar', avatarFile);
        await api.uploadAvatar(fd);
        setUploadingAvatar(false);
      }
      if (bannerFile) {
        const fd = new FormData();
        fd.append('banner', bannerFile);
        await api.uploadBanner(fd);
      }
      await api.updateProfile({
        displayName, bio, socialInstagram, socialTiktok, socialFacebook, isPublic,
      });
      await loadUser();
      setMessage('Perfil actualizado');
      setTimeout(() => setMessage(''), 3000);
    } catch (e: any) {
      setMessage('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const previewName = displayName || user?.display_name || user?.username || '';
  const previewInitial = previewName[0]?.toUpperCase() || '?';

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header">
        <h1>Configuración</h1>
      </div>

      {message && <div style={{
        marginBottom: 16, padding: 10,
        background: message.includes('Error') ? 'rgba(220,38,38,0.1)' : 'rgba(34,197,94,0.1)',
        borderRadius: 'var(--radius-sm)', fontSize: 14, textAlign: 'center'
      }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20, alignItems: 'start' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Información del perfil</h3>

          <div className="form-group">
            <label>Nombre a mostrar</label>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre artístico" />
          </div>

          <div className="form-group">
            <label>Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Contá quién sos..." maxLength={500} />
            <span style={{ fontSize: 11, color: 'var(--text2)', textAlign: 'right' }}>{bio.length}/500</span>
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8 }}>Redes sociales</h3>

          <div className="form-group">
            <label>Instagram</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>instagram.com/</span>
              <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="tu_usuario" style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label>TikTok</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>tiktok.com/@</span>
              <input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="tu_usuario" style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label>Facebook</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>facebook.com/</span>
              <input value={socialFacebook} onChange={(e) => setSocialFacebook(e.target.value)} placeholder="tu_usuario" style={{ flex: 1 }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <input type="checkbox" id="isPublic" checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)} style={{ width: 'auto' }} />
            <label htmlFor="isPublic" style={{ fontSize: 14, cursor: 'pointer' }}>
              Perfil público (visible para todos)
            </label>
          </div>

          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ justifyContent: 'center' }}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{
              height: 80,
              background: bannerPreview
                ? `url(${bannerPreview}) center/cover no-repeat`
                : user?.banner_url
                  ? `url(${user.banner_url}) center/cover no-repeat`
                  : 'linear-gradient(135deg, var(--accent), #6366f1)',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 6,
            }}>
              <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerChange} style={{ display: 'none' }} />
              <button type="button" className="btn btn-secondary btn-sm"
                onClick={() => bannerRef.current?.click()}
                style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white' }}>
                {bannerPreview || user?.banner_url ? 'Cambiar' : 'Subir banner'}
              </button>
            </div>
            <div style={{ padding: '0 16px 16px', marginTop: -32, display: 'flex', alignItems: 'flex-end', gap: 12 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 12, overflow: 'hidden', flexShrink: 0,
                border: '3px solid var(--bg)',
                background: 'linear-gradient(135deg, var(--accent), #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, fontWeight: 700, color: 'white',
              }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : user?.avatar_url ? (
                  <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : previewInitial}
              </div>
              <div style={{ paddingTop: 32 }}>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={() => fileRef.current?.click()}
                  style={{ fontSize: 11, padding: '4px 10px' }}>
                  {avatarPreview ? 'Cambiar foto' : 'Subir foto'}
                </button>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16, fontSize: 13 }}>
            <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: 'var(--text2)' }}>Vista previa del perfil</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
                background: 'linear-gradient(135deg, var(--accent), #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: 'white',
              }}>
                {avatarPreview ? <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 : user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                 : previewInitial}
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>{previewName || 'Tu nombre'}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{user?.username || 'usuario'}</div>
              </div>
            </div>
            {bio && <p style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 }}>{bio}</p>}
            {(socialInstagram || socialTiktok || socialFacebook) && (
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {socialInstagram && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)' }}>📷 Instagram</span>}
                {socialTiktok && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)' }}>🎵 TikTok</span>}
                {socialFacebook && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'var(--bg3)' }}>👍 Facebook</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
