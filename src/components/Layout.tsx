import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore, usePlayerStore } from '../services/store';
import { api } from '../services/api';
import { connectNotificationStream, disconnectNotificationStream, onNotification } from '../services/notifications';
import { useMediaQuery } from '../services/useMediaQuery';
import { Notification } from '../types';
import Tilt from './Tilt';
import QueuePanel from './QueuePanel';
import { Bell, Heart, MessageCircle, Sun, Moon, Menu, Search, X, Upload, User, List, LogOut } from 'lucide-react';
import { useTheme } from '../services/theme';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString();
}

export default function Layout() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuthStore();
  const currentTrack = usePlayerStore((s) => s.currentTrack);
  const [queueVisible, setQueueVisible] = useState(true);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const hideSearch = !isAuthenticated;
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      api.searchUsers(searchQuery.trim()).then(setSearchResults).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) { setNotifications([]); disconnectNotificationStream(); return; }
    api.getNotifications().then(setNotifications).catch(() => {});
    connectNotificationStream();
    const unsub = onNotification((n) => {
      setNotifications((prev) => prev.some(x => x.id === n.id) ? prev : [n, ...prev]);
    });
    return () => { disconnectNotificationStream(); unsub(); };
  }, [isAuthenticated]);

  const handleNotifClick = async (n: Notification) => {
    if (!n.read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: 1 } : x));
    }
    setShowNotifs(false);
    if (n.track_id) navigate(`/track/${n.track_id}`);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 32 }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                <img src="/logo.png" alt="" style={{ height: 32, width: 'auto' }} />
                {!isMobile && (
                  <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' }}>
                    <span style={{ color: 'var(--accent)' }}>Nex</span>Wave
                  </span>
                )}
              </Link>
              {!isMobile && (
                <div style={{ display: 'flex', gap: 20, fontSize: 14, fontWeight: 500 }}>
                  {isAuthenticated && (
                    <>
                      <Link to="/upload" style={{ color: 'var(--text2)', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}>
                        Subir
                      </Link>
                      <Link to="/my-tracks" style={{ color: 'var(--text2)', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}>
                        Mis Sets
                      </Link>
                      <Link to="/playlists" style={{ color: 'var(--text2)', transition: 'color 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}>
                        Playlists
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>

            {!hideSearch && !isMobile && <div ref={searchRef} style={{ position: 'relative', maxWidth: 200, width: '100%' }}>
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                onFocus={() => setShowResults(true)}
                style={{
                  width: '100%', height: 34, fontSize: 13, padding: '0 10px',
                  background: 'var(--bg3)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none',
                }}
              />
              {showResults && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 200,
                }}>
                  {searchResults.map((u: any) => (
                    <Link
                      key={u.id}
                      to={`/profile/${u.id}`}
                      onClick={() => { setShowResults(false); setSearchQuery(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', fontSize: 13, color: 'var(--text)',
                        textDecoration: 'none', transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                        background: 'var(--accent)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: 'white',
                      }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          (u.display_name?.[0] || u.username?.[0] || '?').toUpperCase()
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.display_name || u.username}
                        </div>
                        {u.display_name && (
                          <div style={{ fontSize: 11, color: 'var(--text2)' }}>@{u.username}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)', padding: '12px 16px', zIndex: 200,
                  fontSize: 13, color: 'var(--text2)', textAlign: 'center',
                }}>
                  No se encontraron usuarios
                </div>
              )}
            </div>}

            <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 2 : 6 }}>
              <button
                onClick={toggleTheme}
                style={{
                  background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                  padding: '6px 8px', borderRadius: 'var(--radius-sm)', fontSize: 18,
                  transition: 'background 0.2s', lineHeight: 1, display: 'flex',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              {isAuthenticated ? (
                <>
                  {isMobile && (
                    <button
                      onClick={() => setShowMobileSearch(!showMobileSearch)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s', display: 'flex',
                      }}
                    >
                      <Search size={18} />
                    </button>
                  )}

                  {showMobileSearch && isMobile && (
                    <div style={{
                      position: 'fixed', top: 56, left: 0, right: 0, zIndex: 150,
                      padding: 8, background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
                    }}>
                      <div ref={searchRef} style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Buscar usuarios..."
                          value={searchQuery}
                          onChange={(e) => { setSearchQuery(e.target.value); setShowResults(true); }}
                          onFocus={() => setShowResults(true)}
                          autoFocus
                          style={{
                            width: '100%', height: 38, fontSize: 14, padding: '0 12px',
                            background: 'var(--bg3)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none',
                          }}
                        />
                        {showResults && searchResults.length > 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 200,
                          }}>
                            {searchResults.map((u: any) => (
                              <Link
                                key={u.id}
                                to={`/profile/${u.id}`}
                                onClick={() => { setShowResults(false); setSearchQuery(''); setShowMobileSearch(false); }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 14px', fontSize: 14, color: 'var(--text)',
                                  textDecoration: 'none', transition: 'background 0.15s',
                                }}
                              >
                                <div style={{
                                  width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                                  background: 'var(--accent)', flexShrink: 0,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 700, color: 'white',
                                }}>
                                  {u.avatar_url ? (
                                    <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    (u.display_name?.[0] || u.username?.[0] || '?').toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{u.display_name || u.username}</div>
                                  {u.display_name && <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{u.username}</div>}
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                        {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                          <div style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                            background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.4)', padding: '14px 16px', zIndex: 200,
                            fontSize: 14, color: 'var(--text2)', textAlign: 'center',
                          }}>
                            No se encontraron usuarios
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!isMobile && (
                    <Link to="/settings" style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      fontSize: 14, color: 'var(--text2)',
                      padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                      transition: 'background 0.2s',
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                        background: 'var(--accent)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0,
                      }}>
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          user?.display_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '?'
                        )}
                      </div>
                      {user?.display_name || user?.username}
                    </Link>
                  )}

                  <div ref={notifRef} style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowNotifs(!showNotifs)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)', fontSize: 18,
                        position: 'relative', transition: 'background 0.2s', lineHeight: 1, display: 'flex',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span style={{
                          position: 'absolute', top: 2, right: 2,
                          background: '#ef4444', color: 'white', fontSize: 10,
                          fontWeight: 700, minWidth: 16, height: 16,
                          borderRadius: 8, display: 'flex', alignItems: 'center',
                          justifyContent: 'center', padding: '0 4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifs && (
                      <div style={{
                        position: 'absolute', top: '100%', right: 0, marginTop: 4,
                        width: isMobile ? '90vw' : 340, maxHeight: 420,
                        background: 'var(--bg2)', border: '1px solid var(--border)',
                        borderRadius: 10, boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                        overflow: 'hidden', zIndex: 200,
                      }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderBottom: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: 14, fontWeight: 700 }}>Notificaciones</span>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllRead}
                              style={{
                                background: 'none', border: 'none', color: 'var(--accent)',
                                cursor: 'pointer', fontSize: 12, fontWeight: 600,
                                padding: '4px 8px', borderRadius: 6,
                                transition: 'background 0.15s',
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              Leer todas
                            </button>
                          )}
                        </div>

                        <div style={{ overflowY: 'auto', maxHeight: 370 }}>
                          {notifications.length === 0 ? (
                            <div style={{
                              padding: '32px 16px', textAlign: 'center',
                              color: 'var(--text2)', fontSize: 13,
                            }}>
                              Sin notificaciones
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <button
                                key={n.id}
                                onClick={() => handleNotifClick(n)}
                                style={{
                                  display: 'flex', gap: 10, width: '100%', textAlign: 'left',
                                  padding: '10px 14px', border: 'none', cursor: 'pointer',
                                  background: n.read ? 'transparent' : 'rgba(139,92,246,0.06)',
                                  color: 'var(--text)', fontSize: 13,
                                  borderBottom: '1px solid var(--border)',
                                  transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(139,92,246,0.06)'}
                              >
                                <div style={{ flexShrink: 0, marginTop: 2, color: n.type === 'like' ? '#ec4899' : 'var(--accent)' }}>
                                  {n.type === 'like' ? <Heart size={16} fill="currentColor" /> : <MessageCircle size={16} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    lineHeight: 1.4,
                                    fontWeight: n.read ? 400 : 600,
                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                  }}>
                                    <span style={{ fontWeight: 600 }}>
                                      {n.actor_display_name || n.actor_username}
                                    </span>{' '}
                                    {n.message}
                                  </div>
                                  <div style={{
                                    fontSize: 11, color: 'var(--text2)', marginTop: 2,
                                  }}>
                                    {timeAgo(n.created_at)}
                                  </div>
                                </div>
                                {!n.read && (
                                  <div style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: 'var(--accent)', flexShrink: 0, marginTop: 6,
                                  }} />
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isMobile ? (
                    <button
                      onClick={() => setShowMobileMenu(!showMobileMenu)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                        padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                        transition: 'background 0.2s', display: 'flex',
                      }}
                    >
                      {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                    </button>
                  ) : (
                    <Tilt as="button" className="btn btn-secondary btn-sm" onClick={() => { logout(); navigate('/'); }} tiltAmount={4}>
                      Salir
                    </Tilt>
                  )}

                  {showMobileMenu && isMobile && (
                    <>
                      <div
                        style={{
                          position: 'fixed', inset: 0, zIndex: 89, background: 'rgba(0,0,0,0.5)',
                        }}
                        onClick={() => setShowMobileMenu(false)}
                      />
                      <div style={{
                        position: 'fixed', top: 56, right: 0, zIndex: 90,
                        width: '70vw', maxWidth: 280, background: 'var(--bg2)',
                        borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                        borderRadius: '0 0 0 12px', overflow: 'hidden',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                      }}>
                        <Link to="/settings" onClick={() => setShowMobileMenu(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                            color: 'var(--text)', textDecoration: 'none', fontSize: 14,
                            borderBottom: '1px solid var(--border)', fontWeight: 500,
                          }}>
                          <User size={18} /> Perfil
                        </Link>
                        <Link to="/upload" onClick={() => setShowMobileMenu(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                            color: 'var(--text)', textDecoration: 'none', fontSize: 14,
                            borderBottom: '1px solid var(--border)', fontWeight: 500,
                          }}>
                          <Upload size={18} /> Subir Set
                        </Link>
                        <Link to="/my-tracks" onClick={() => setShowMobileMenu(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                            color: 'var(--text)', textDecoration: 'none', fontSize: 14,
                            borderBottom: '1px solid var(--border)', fontWeight: 500,
                          }}>
                          <List size={18} /> Mis Sets
                        </Link>
                        <Link to="/playlists" onClick={() => setShowMobileMenu(false)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                            color: 'var(--text)', textDecoration: 'none', fontSize: 14,
                            borderBottom: '1px solid var(--border)', fontWeight: 500,
                          }}>
                          <List size={18} /> Playlists
                        </Link>
                        <button onClick={() => { logout(); navigate('/'); setShowMobileMenu(false); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                            color: '#ef4444', textDecoration: 'none', fontSize: 14,
                            background: 'none', border: 'none', width: '100%', textAlign: 'left',
                            fontWeight: 500,
                          }}>
                          <LogOut size={18} /> Salir
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {isMobile ? (
                    <>
                      <button
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer',
                          padding: '6px 8px', borderRadius: 'var(--radius-sm)',
                          transition: 'background 0.2s', display: 'flex',
                        }}
                      >
                        {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
                      </button>
                      {showMobileMenu && (
                        <>
                          <div
                            style={{
                              position: 'fixed', inset: 0, zIndex: 89, background: 'rgba(0,0,0,0.5)',
                            }}
                            onClick={() => setShowMobileMenu(false)}
                          />
                          <div style={{
                            position: 'fixed', top: 56, right: 0, zIndex: 90,
                            width: '70vw', maxWidth: 280, background: 'var(--bg2)',
                            borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
                            borderRadius: '0 0 0 12px', overflow: 'hidden',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                          }}>
                            <Link to="/login" onClick={() => setShowMobileMenu(false)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                                color: 'var(--text)', textDecoration: 'none', fontSize: 14,
                                borderBottom: '1px solid var(--border)', fontWeight: 500,
                              }}>
                              Ingresar
                            </Link>
                            <Link to="/register" onClick={() => setShowMobileMenu(false)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                                color: 'var(--text)', textDecoration: 'none', fontSize: 14,
                                fontWeight: 500,
                              }}>
                              Registrarse
                            </Link>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <Tilt as="a" href="/login" className="btn btn-secondary btn-sm" tiltAmount={4}>Ingresar</Tilt>
                      <Tilt as="a" href="/register" className="btn btn-primary btn-sm" tiltAmount={4}>Registrarse</Tilt>
                    </>
                  )}
                </>
              )}
            </div>
        </div>
      </nav>

      <main style={{
        flex: 1, padding: isMobile ? '16px 0 90px 0' : '24px 0 100px 0',
        marginRight: !isMobile && currentTrack && queueVisible ? 300 : 0,
        transition: 'margin-right 0.2s ease',
      }}>
        <div className="container page-enter">
          <Outlet />
        </div>
      </main>

      <QueuePanel visible={queueVisible} onToggle={() => setQueueVisible(!queueVisible)} />
    </div>
  );
}
