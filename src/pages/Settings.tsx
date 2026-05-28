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
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="url(#ig-gradient)" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                <defs><linearGradient id="ig-gradient" x1="0" y1="0" x2="24" y2="24"><stop offset="0" stopColor="#405de6"/><stop offset="0.25" stopColor="#5851db"/><stop offset="0.5" stopColor="#833ab4"/><stop offset="0.75" stopColor="#c13584"/><stop offset="1" stopColor="#fd1d1d"/></linearGradient></defs>
                <rect x="2" y="2" width="20" height="20" rx="5" />
                <circle cx="12" cy="12" r="5" />
                <circle cx="17.5" cy="6.5" r="1.5" />
              </svg>
              Instagram
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>instagram.com/</span>
              <input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="tu_usuario" style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="url(#tt-gradient)" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                <defs><linearGradient id="tt-gradient" x1="0" y1="0" x2="24" y2="24"><stop offset="0" stopColor="#00f2ea"/><stop offset="1" stopColor="#ff0050"/></linearGradient></defs>
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.29 0 .57.04.84.1v-3.5a6.37 6.37 0 0 0-.84-.06A6.34 6.34 0 0 0 3.4 15.6a6.34 6.34 0 0 0 6.35 6.34 6.34 6.34 0 0 0 6.35-6.34V8.75a8.28 8.28 0 0 0 4.77 1.49v-3.5a4.82 4.82 0 0 1-1.28-.05z"/>
              </svg>
              TikTok
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>tiktok.com/@</span>
              <input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="tu_usuario" style={{ flex: 1 }} />
            </div>
          </div>

          <div className="form-group">
            <label>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#1877f2" style={{ marginRight: 4, verticalAlign: 'middle' }}>
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </label>
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
                {socialInstagram && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'linear-gradient(135deg, #405de6, #fd1d1d)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
                    Instagram
                  </span>
                )}
                {socialTiktok && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: 'linear-gradient(135deg, #00f2ea, #ff0050)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.29 0 .57.04.84.1v-3.5a6.37 6.37 0 0 0-.84-.06A6.34 6.34 0 0 0 3.4 15.6a6.34 6.34 0 0 0 6.35 6.34 6.34 6.34 0 0 0 6.35-6.34V8.75a8.28 8.28 0 0 0 4.77 1.49v-3.5a4.82 4.82 0 0 1-1.28-.05z"/></svg>
                    TikTok
                  </span>
                )}
                {socialFacebook && (
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#1877f2', color: 'white', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
