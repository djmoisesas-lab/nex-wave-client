import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Track, Playlist } from '../types';
import TrackCard from '../components/TrackCard';
import { useAuthStore } from '../services/store';
import { useMediaQuery } from '../services/useMediaQuery';
import { Music, Headphones, Bell, BellOff } from 'lucide-react';
import { useToastStore } from '../services/toast';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [notifyOnUpload, setNotifyOnUpload] = useState(false);
  const [recentPlays, setRecentPlays] = useState<Track[]>([]);
  const { isAuthenticated, user } = useAuthStore();
  const { toast } = useToastStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const isOwner = user?.id === id;

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getUser(id).then((u) => {
      setProfile(u);
      setTracks(u.tracks || []);
      setPlaylists(u.playlists || []);
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));

    if (isAuthenticated && !isOwner) {
      api.checkFollow(id).then((r) => { setFollowing(r.following); setNotifyOnUpload(r.notify_on_upload); }).catch(() => {});
    }
    api.getRecentPlays(id).then(setRecentPlays).catch(() => {});
  }, [id]);

  const handleFollow = async () => {
    if (!id || followLoading) return;
    setFollowLoading(true);
    try {
      if (following) {
        await api.unfollowUser(id);
        setFollowing(false);
        setNotifyOnUpload(false);
        setProfile((p: any) => ({ ...p, followers_count: Math.max(0, (p.followers_count || 0) - 1) }));
      } else {
        await api.followUser(id);
        setFollowing(true);
        setProfile((p: any) => ({ ...p, followers_count: (p.followers_count || 0) + 1 }));
      }
    } catch (e: any) {
      toast(e.message || 'Error al seguir/dejar de seguir', 'error');
    }
    setFollowLoading(false);
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (error || !profile) return <div className="error">{error || 'Perfil no encontrado'}</div>;

  return (
    <div>
        <div style={{
          borderRadius: isMobile ? 12 : 16, overflow: 'hidden', marginBottom: 24,
          background: 'linear-gradient(135deg, #1e1028 0%, #2d1b3a 50%, #1a0a2e 100%)',
          position: 'relative',
        }}>
          <div style={{
            height: isMobile ? 100 : 140, position: 'relative', overflow: 'hidden',
          background: profile.banner_url
            ? `url(${profile.banner_url}) center/cover no-repeat`
            : 'linear-gradient(135deg, rgba(139,92,246,0.4), rgba(99,102,241,0.2))',
        }}>
          {profile.banner_url && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 50%)',
            }} />
          )}
          {!profile.banner_url && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(circle at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(99,102,241,0.1) 0%, transparent 50%)',
            }} />
          )}
        </div>

        <div style={{ padding: isMobile ? '0 16px 16px' : '0 24px 24px', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: isMobile ? 12 : 20, marginTop: isMobile ? -24 : -40, flexWrap: 'wrap',
          }}>
            <div style={{
              width: isMobile ? 72 : 96, height: isMobile ? 72 : 96, borderRadius: isMobile ? 12 : 16, overflow: 'hidden',
              border: '3px solid rgba(255,255,255,0.15)',
              background: 'linear-gradient(135deg, var(--accent), #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: isMobile ? 28 : 36, fontWeight: 800, color: 'white', flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, paddingTop: isMobile ? 24 : 40 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'white', marginBottom: 2 }}>
                    {profile.display_name || profile.username}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: isMobile ? 12 : 14, fontWeight: 500 }}>
                    @{profile.username}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {isOwner && (
                    <Link to="/settings" style={{
                      padding: '6px 14px', borderRadius: 8, fontWeight: 600, fontSize: isMobile ? 11 : 13,
                      background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)',
                      backdropFilter: 'blur(8px)', textDecoration: 'none',
                      transition: 'all 0.2s', whiteSpace: 'nowrap',
                    }}>
                      Editar perfil
                    </Link>
                  )}
                  {isAuthenticated && !isOwner && (
                    <>
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        style={{
                          padding: isMobile ? '6px 12px' : '8px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: isMobile ? 11 : 13,
                          cursor: followLoading ? 'default' : 'pointer',
                          background: following ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                          color: following ? 'rgba(255,255,255,0.8)' : 'white',
                          backdropFilter: 'blur(8px)',
                          transition: 'all 0.2s', whiteSpace: 'nowrap',
                        }}
                      >
                        {followLoading ? '...' : following ? 'Siguiendo' : 'Seguir'}
                      </button>
                      {following && (
                        <button
                          onClick={async () => {
                            try {
                              const r = await api.toggleNotifyOnUpload(id!);
                              setNotifyOnUpload(r.notify_on_upload);
                            } catch (e: any) {
                              toast(e.message || 'Error al cambiar notificaci\u00f3n', 'error');
                            }
                          }}
                          style={{
                            padding: isMobile ? '6px 10px' : '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: 'rgba(255,255,255,0.1)', color: notifyOnUpload ? '#f59e0b' : 'rgba(255,255,255,0.8)',
                            backdropFilter: 'blur(8px)',
                            display: 'flex', alignItems: 'center',
                          }}
                          title={notifyOnUpload ? 'Notificaciones activadas' : 'Activar notificaciones'}
                        >
                          {notifyOnUpload ? <Bell size={14} fill='#f59e0b' /> : <BellOff size={14} />}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: isMobile ? 16 : 24, marginTop: 10 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: 'white' }}>{tracks.length}</div>
                  <div style={{ fontSize: isMobile ? 10 : 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>TRACKS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: 'white' }}>{profile.followers_count || 0}</div>
                  <div style={{ fontSize: isMobile ? 10 : 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>SEGUIDORES</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: 'white' }}>{profile.following_count || 0}</div>
                  <div style={{ fontSize: isMobile ? 10 : 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>SIGUIENDO</div>
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6, marginTop: 16, maxWidth: 600 }}>
              {profile.bio}
            </p>
          )}

          {(profile.social_instagram || profile.social_tiktok || profile.social_facebook) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {profile.social_instagram && (
                <a href={`https://instagram.com/${profile.social_instagram}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: 'linear-gradient(135deg, #405de6, #5851db, #833ab4, #c13584, #e1306c, #fd1d1d)',
                  color: 'white', textDecoration: 'none', transition: 'opacity 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" /></svg>
                  Instagram
                </a>
              )}
              {profile.social_tiktok && (
                <a href={`https://tiktok.com/@${profile.social_tiktok}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: 'linear-gradient(135deg, #00f2ea, #ff0050)',
                  color: 'white', textDecoration: 'none', transition: 'opacity 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.29 0 .57.04.84.1v-3.5a6.37 6.37 0 0 0-.84-.06A6.34 6.34 0 0 0 3.4 15.6a6.34 6.34 0 0 0 6.35 6.34 6.34 6.34 0 0 0 6.35-6.34V8.75a8.28 8.28 0 0 0 4.77 1.49v-3.5a4.82 4.82 0 0 1-1.28-.05z"/></svg>
                  TikTok
                </a>
              )}
              {profile.social_facebook && (
                <a href={`https://facebook.com/${profile.social_facebook}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: '#1877f2', color: 'white', textDecoration: 'none', transition: 'opacity 0.2s',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: 'var(--bg2)', borderRadius: 12, padding: 20, marginBottom: 24,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Sets <span style={{ color: 'var(--text2)', fontWeight: 400 }}>({tracks.length})</span></h2>
        </div>
        {tracks.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            Este DJ aún no subió sets públicos.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tracks.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>
        )}
      </div>

      {recentPlays.length > 0 && (
        <div style={{
          background: 'var(--bg2)', borderRadius: 12, padding: 20, marginBottom: 24,
          border: '1px solid var(--border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700 }}>Escuchados recientemente</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentPlays.map((track, i) => (
              <TrackCard key={track.id} track={track} index={i} />
            ))}
          </div>
        </div>
      )}

      <div style={{
        background: 'var(--bg2)', borderRadius: 12, padding: 20,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Playlists <span style={{ color: 'var(--text2)', fontWeight: 400 }}>({playlists.length})</span></h2>
        </div>
        {playlists.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            Este DJ aún no creó playlists públicas.
          </p>
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
                <a key={pl.id} href={`/playlist/${pl.id}`} className="card card-hover" style={{
                  textDecoration: 'none', color: 'var(--text)',
                  background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16,
                }}>
                  <div style={{
                    width: '100%', aspectRatio: '1', borderRadius: 8,
                    background: gradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, marginBottom: 10, position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 60%)',
                    }} />
                    <Icon size={28} style={{ position: 'relative', zIndex: 1 }} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 600 }}>{pl.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{pl.track_count || 0} sets</p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
