import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Track, Playlist } from '../types';
import TrackCard from '../components/TrackCard';
import { useAuthStore } from '../services/store';
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
        borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        background: 'linear-gradient(135deg, #1e1028 0%, #2d1b3a 50%, #1a0a2e 100%)',
        position: 'relative',
      }}>
        <div style={{
          height: 140, position: 'relative', overflow: 'hidden',
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

        <div style={{ padding: '0 24px 24px', position: 'relative' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: -40, flexWrap: 'wrap',
          }}>
            <div style={{
              width: 96, height: 96, borderRadius: 16, overflow: 'hidden',
              border: '3px solid rgba(255,255,255,0.15)',
              background: 'linear-gradient(135deg, var(--accent), #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: 'white', flexShrink: 0,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                profile.display_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()
              )}
            </div>
            <div style={{ flex: 1, paddingTop: 40 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: 26, fontWeight: 800, color: 'white', marginBottom: 2 }}>
                    {profile.display_name || profile.username}
                  </h1>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontWeight: 500 }}>
                    @{profile.username}
                  </p>
                </div>
                {isOwner && (
                  <Link to="/settings" style={{
                    padding: '8px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13,
                    background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)', textDecoration: 'none',
                    transition: 'all 0.2s',
                  }}>
                    Editar perfil
                  </Link>
                )}
                {isAuthenticated && !isOwner && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      style={{
                        padding: '8px 20px', borderRadius: 8, border: 'none', fontWeight: 600, fontSize: 13,
                        cursor: followLoading ? 'default' : 'pointer',
                        background: following ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                        color: following ? 'rgba(255,255,255,0.8)' : 'white',
                        backdropFilter: 'blur(8px)',
                        transition: 'all 0.2s',
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
                          padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: 'rgba(255,255,255,0.1)', color: notifyOnUpload ? '#f59e0b' : 'rgba(255,255,255,0.8)',
                          backdropFilter: 'blur(8px)',
                          display: 'flex', alignItems: 'center',
                        }}
                        title={notifyOnUpload ? 'Notificaciones activadas' : 'Activar notificaciones'}
                      >
                        {notifyOnUpload ? <Bell size={15} fill='#f59e0b' /> : <BellOff size={15} />}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 24, marginTop: 14 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{tracks.length}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>TRACKS</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{profile.followers_count || 0}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>SEGUIDORES</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>{profile.following_count || 0}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.5px' }}>SIGUIENDO</div>
                </div>
              </div>
            </div>
          </div>

          {profile.bio && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.6, marginTop: 16, maxWidth: 600 }}>
              {profile.bio}
            </p>
          )}

          {(profile.social_instagram || profile.social_soundcloud || profile.social_mixcloud) && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
              {profile.social_instagram && (
                <a href={`https://instagram.com/${profile.social_instagram}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none', transition: 'background 0.2s',
                  backdropFilter: 'blur(8px)',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" /></svg>
                  Instagram
                </a>
              )}
              {profile.social_soundcloud && (
                <a href={`https://soundcloud.com/${profile.social_soundcloud}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none', transition: 'background 0.2s',
                  backdropFilter: 'blur(8px)',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.56 8.87V17h8.83a1.5 1.5 0 0 0 1.5-1.5v-5.16a1.5 1.5 0 0 0-1.5-1.5h-1.65V7.62a3.09 3.09 0 0 0-3.79-3c-1.22.22-2.12 1.2-2.4 2.35-.08.33-.12.67-.12 1.01v.88ZM2 12.88v4.02a.5.5 0 0 0 .5.5h1.67v-5.02H2.5a.5.5 0 0 0-.5.5Zm3.33-1.67v6.19a.5.5 0 0 0 .5.5h1.67v-7.19H5.83a.5.5 0 0 0-.5.5Zm3.34-.38v7.07a.5.5 0 0 0 .5.5h1.67V11.2h-1.67a.5.5 0 0 0-.5.5Z"/></svg>
                  SoundCloud
                </a>
              )}
              {profile.social_mixcloud && (
                <a href={`https://mixcloud.com/${profile.social_mixcloud}`} target="_blank" rel="noopener noreferrer" style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.8)',
                  textDecoration: 'none', transition: 'background 0.2s',
                  backdropFilter: 'blur(8px)',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.6 14.5a1.9 1.9 0 0 0 1.9-1.9v-5a1.9 1.9 0 0 0-3.8 0v5a1.9 1.9 0 0 0 1.9 1.9Zm5.6 0a1.9 1.9 0 0 0 1.9-1.9v-5a1.9 1.9 0 1 0-3.8 0v5A1.9 1.9 0 0 0 8.2 14.5Zm28.4-6.9v5a1.9 1.9 0 0 1-3.8 0v-5a1.9 1.9 0 1 1 3.8 0Zm5.6 0v5a1.9 1.9 0 1 1-3.8 0v-5a1.9 1.9 0 1 1 3.8 0Zm5.6 0v5a1.9 1.9 0 1 1-3.8 0v-5a1.9 1.9 0 1 1 3.8 0Z"/></svg>
                  Mixcloud
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
