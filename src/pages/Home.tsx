import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Track, User } from '../types';
import TrackCard from '../components/TrackCard';
import Tilt from '../components/Tilt';
import { useAuthStore } from '../services/store';
import { Music, Users, ClipboardList, BarChart3, UserPlus, UserCheck, Headphones } from 'lucide-react';

export default function Home() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('date');
  const { isAuthenticated } = useAuthStore();
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const [suggestedTracks, setSuggestedTracks] = useState<Track[]>([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [followingUsers, setFollowingUsers] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState<string | null>(null);

  useEffect(() => {
    api.getTracks({ page: 1, sort }).then((res) => {
      setTracks(res.tracks);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [sort]);

  useEffect(() => {
    if (!isAuthenticated) { setRecsLoading(false); return; }
    api.getRecommendations().then((r) => {
      setSuggestedUsers(r.users);
      setSuggestedTracks(r.tracks);
    }).catch(() => {}).finally(() => setRecsLoading(false));
  }, [isAuthenticated]);

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (followLoading) return;
    setFollowLoading(userId);
    try {
      await api.followUser(userId);
      setFollowingUsers((prev) => new Set(prev).add(userId));
    } catch {}
    setFollowLoading(null);
  };

  return (
    <div>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes eqBounce {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        .eq-bar {
          width: 3px; height: 14px; border-radius: 2px;
          background: white;
          animation: eqBounce 0.6s ease-in-out infinite;
          transform-origin: bottom;
        }
      `}</style>
      <div style={{
        borderRadius: 16, marginBottom: 28, overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          padding: '40px 32px',
          background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1b3a 25%, #1a1a2e 50%, #2d1b3a 75%, #1a0a2e 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradientShift 12s ease infinite',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: '-60%', right: '-5%', width: 350, height: 350,
            borderRadius: '50%', background: 'rgba(139,92,246,0.15)',
            filter: 'blur(60px)',
            animation: 'gradientShift 8s ease infinite alternate',
          }} />
          <div style={{
            position: 'absolute', bottom: '-40%', left: '-5%', width: 250, height: 250,
            borderRadius: '50%', background: 'rgba(99,102,241,0.1)',
            filter: 'blur(50px)',
            animation: 'gradientShift 10s ease infinite alternate-reverse',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <h1 style={{
                  fontSize: 30, fontWeight: 800, color: 'white',
                  letterSpacing: '-0.5px', marginBottom: 4,
                }}>
                  <span style={{ color: 'var(--accent)' }}>Nex</span>Wave
                </h1>
                <p style={{
                  color: 'rgba(255,255,255,0.5)', fontSize: 14,
                  maxWidth: 400, lineHeight: 1.5,
                }}>
                  {isAuthenticated
                    ? 'Sube, reproduce y comparte tus sesiones con el mundo.'
                    : 'La plataforma para DJs que quieren compartir su música.'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {!isAuthenticated && (
                  <Tilt as="a" href="/register" style={{
                    padding: '8px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
                    background: 'linear-gradient(135deg, var(--accent), #7c3aed)', color: 'white', textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
                  }} tiltAmount={6}>Comenzar</Tilt>
                )}
                {isAuthenticated && (
                  <>
                    <Link to="/upload" style={{
                      padding: '8px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
                      background: 'var(--accent)', color: 'white', textDecoration: 'none',
                    }}>+ Subir Set</Link>
                    <Link to="/my-tracks" className="glass-light" style={{
                      padding: '8px 18px', borderRadius: 10, fontWeight: 600, fontSize: 13,
                      color: 'rgba(255,255,255,0.8)', textDecoration: 'none',
                    }}>Mis Sets</Link>
                  </>
                )}
              </div>
            </div>
            <div style={{
              display: 'flex', gap: 24, marginTop: 16, paddingTop: 16,
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              {isAuthenticated && (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                    {loading ? '...' : tracks.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>TRACKS</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>24/7</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.5px' }}>DISPONIBLE</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!isAuthenticated ? (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16, marginBottom: 28,
          }}>
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Music size={22} /></div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Subí tus sesiones</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                Compartí tus sesiones y producciones con la comunidad. Formatos MP3, WAV, FLAC y más.
              </p>
            </div>
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><Users size={22} /></div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Conectá con DJs</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                Seguí a otros artistas, descubrí su música y armá tu red de contactos.
              </p>
            </div>
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><ClipboardList size={22} /></div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Playlists inteligentes</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                Organizá tus sets favoritos en playlists y compartilas con quien quieras.
              </p>
            </div>
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, margin: '0 auto 14px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><BarChart3 size={22} /></div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Estadísticas</h3>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>
                Seguí tus reproducciones, descargas y hacé crecer tu presencia como DJ.
              </p>
            </div>
          </div>

          <div style={{
            borderRadius: 12, padding: '32px',
            background: 'var(--bg2)', border: '1px solid var(--border)',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              ¿Listo para compartir tu música?
            </h2>
            <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20, maxWidth: 500, margin: '0 auto 20px' }}>
              Crea tu perfil de DJ en segundos y empieza a subir tus sesiones. Es gratis.
            </p>
            <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px' }}>
              Crear cuenta gratis
            </Link>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 16, flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700 }}>Sets</h2>
                  <select value={sort} onChange={(e) => setSort(e.target.value)}
                    style={{ width: 140, fontSize: 12, padding: '4px 8px' }}>
                    <option value="date">Más recientes</option>
                    <option value="plays">Más reproducidos</option>
                    <option value="likes">Más likeados</option>
                    <option value="title">A-Z</option>
                  </select>
                </div>
                <Link to="/explore" style={{
                    fontSize: 13, color: 'var(--accent)', textDecoration: 'none',
                    fontWeight: 600, padding: '4px 10px', borderRadius: 6,
                    transition: 'background 0.2s',
                  }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    Ver todos →
                  </Link>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="card" style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: 14,
                    }}>
                      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ width: '60%', height: 14, marginBottom: 6 }} />
                        <div className="skeleton" style={{ width: '30%', height: 11 }} />
                      </div>
                      <div className="skeleton" style={{ width: 80, height: 20, borderRadius: 6 }} />
                    </div>
                  ))}
                </div>
              ) : tracks.length === 0 ? (
                <div style={{
                  padding: '48px 32px', textAlign: 'center', borderRadius: 12,
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16, margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, var(--accent), #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}><Music size={28} /></div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>No hay sets todavía</h3>
                  <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>Sé el primero en subir tu música</p>
                  <Link to="/upload" className="btn btn-primary">Subir Set</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {tracks.map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i} />
                  ))}
                </div>
              )}
            </div>

            {!recsLoading && suggestedUsers.length > 0 && (
              <div className="glass" style={{
                width: 260, flexShrink: 0, borderRadius: 12, padding: 16,
                position: 'sticky', top: 80,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <UserPlus size={16} style={{ color: 'var(--accent)' }} />
                  <h3 style={{ fontSize: 14, fontWeight: 700 }}>Creadores sugeridos</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {suggestedUsers.map((u) => {
                    const isFollowed = followingUsers.has(u.id);
                    const isLoading = followLoading === u.id;
                    return (
                      <div key={u.id} style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                        borderRadius: 8, transition: 'background 0.15s',
                      }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <Link to={`/profile/${u.id}`}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0,
                            textDecoration: 'none', color: 'var(--text)',
                          }}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                            flexShrink: 0, background: 'linear-gradient(135deg, var(--accent), #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 14, fontWeight: 800, color: 'white',
                          }}>
                            {u.avatar_url
                              ? <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : (u.display_name || u.username)[0].toUpperCase()}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {u.display_name || u.username}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                              {u.track_count || 0} sets · {u.followers_count || 0} seguidores
                            </div>
                          </div>
                        </Link>
                        <button
                          onClick={(e) => handleFollow(e, u.id)}
                          disabled={isLoading || isFollowed}
                          style={{
                            padding: '4px 10px', borderRadius: 6, border: 'none', fontWeight: 600, fontSize: 11,
                            cursor: isLoading || isFollowed ? 'default' : 'pointer',
                            background: isFollowed ? 'rgba(255,255,255,0.1)' : 'var(--accent)',
                            color: isFollowed ? 'rgba(255,255,255,0.6)' : 'white',
                            whiteSpace: 'nowrap', flexShrink: 0,
                            display: 'flex', alignItems: 'center', gap: 4,
                            transition: 'all 0.2s',
                          }}
                        >
                          {isLoading ? '...' : isFollowed ? <><UserCheck size={12} /> Siguiendo</> : 'Seguir'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {!recsLoading && suggestedTracks.length > 0 && (
            <div style={{ marginTop: 28 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Headphones size={18} style={{ color: 'var(--accent)' }} />
                <h2 style={{ fontSize: 17, fontWeight: 700 }}>Sets que te pueden gustar</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {suggestedTracks.map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
