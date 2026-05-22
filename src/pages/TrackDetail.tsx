import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Track, Comment } from '../types';
import { usePlayerStore, useAuthStore } from '../services/store';
import WaveformPlayer from '../components/WaveformPlayer';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import { useNavigate } from 'react-router-dom';
import Tilt from '../components/Tilt';
import { useToastStore } from '../services/toast';
import { Play, Pause, Eye, Download, Folder, Calendar, Link2, Pencil, Trash2, X, Heart, UserPlus, UserCheck, MessageCircle, Flag, Bell, BellOff } from 'lucide-react';

export default function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const [track, setTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [notifyOnUpload, setNotifyOnUpload] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const commentRef = useRef<HTMLTextAreaElement>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reporting, setReporting] = useState(false);
  const { setTrack: setPlayerTrack, currentTrack, isPlaying, setPlaying, addToQueue, currentTime, seekTo } = usePlayerStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToastStore();
  const navigate = useNavigate();

  function nestComments(flat: Comment[]): Comment[] {
    const map = new Map<string, Comment>();
    const roots: Comment[] = [];
    for (const c of flat) {
      map.set(c.id, { ...c, replies: [] });
    }
    for (const c of map.values()) {
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id)!.replies!.push(c);
      } else {
        roots.push(c);
      }
    }
    return roots;
  }

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.getTrack(id).then((t) => {
      setTrack(t);
      setLiked(t.is_liked);
      setLikesCount(t.likes_count);
      if (isAuthenticated && t.user_id !== user?.id) {
        api.checkFollow(t.user_id).then((r) => { setIsFollowing(r.following); setNotifyOnUpload(r.notify_on_upload); }).catch(() => {});
      }
    }).catch((e) => {
      setError(e.message);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (currentTrack && id && id !== currentTrack.id) {
      navigate(`/track/${currentTrack.id}`, { replace: true });
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!id) return;
    api.getComments(id).then(setComments).catch(() => {});
  }, [id]);

  if (loading) return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ marginBottom: 20 }}>
        <div className="skeleton" style={{ width: '70%', height: 28, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '40%', height: 14 }} />
      </div>
      <div className="skeleton" style={{ width: '100%', height: 100, marginBottom: 20, borderRadius: 8 }} />
      <div className="skeleton" style={{ width: '100%', height: 14, marginBottom: 6 }} />
      <div className="skeleton" style={{ width: '80%', height: 14, marginBottom: 20 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ width: 100, height: 32, borderRadius: 8 }} />
        <div className="skeleton" style={{ width: 80, height: 32, borderRadius: 8 }} />
      </div>
    </div>
  );
  if (error || !track) return <div className="error">{error || 'Set no encontrado'}</div>;

  const isCurrentTrack = currentTrack?.id === track.id;
  const isOwner = user?.id === track.user_id;

  const handlePlayPause = () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (isCurrentTrack) {
      setPlaying(!isPlaying);
    } else {
      setPlayerTrack(track);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este set definitivamente?')) return;
    try {
      await api.deleteTrack(track.id);
      toast('Set eliminado', 'success');
      navigate('/my-tracks');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !id) return;
    setCommentLoading(true);
    try {
      const c = await api.addComment(id, newComment.trim());
      setComments((prev) => [...prev, c]);
      setNewComment('');
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setCommentLoading(false);
      commentRef.current?.focus();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!id) return;
    try {
      await api.deleteComment(id, commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId && c.parent_id !== commentId));
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || !id) return;
    setReplyLoading(true);
    try {
      const c = await api.addComment(id, replyContent.trim(), parentId);
      setComments((prev) => [...prev, c]);
      setReplyContent('');
      setReplyTo(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleCommentLike = async (commentId: string, isLiked: boolean) => {
    if (!isAuthenticated || !id) return;
    setComments((prev) => prev.map((c) =>
      c.id === commentId
        ? { ...c, is_liked: !isLiked, likes_count: c.likes_count + (isLiked ? -1 : 1) }
        : c
    ));
    try {
      if (isLiked) {
        await api.unlikeComment(id, commentId);
      } else {
        await api.likeComment(id, commentId);
      }
    } catch {
      setComments((prev) => prev.map((c) =>
        c.id === commentId ? { ...c, is_liked: isLiked, likes_count: c.likes_count + (isLiked ? 1 : -1) } : c
      ));
    }
  };

  const commentsTree = nestComments(comments);

  return (
    <div>
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{track.title}</h1>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 14, color: 'var(--text2)', flexWrap: 'wrap' }}>
              <span>{track.artist || track.display_name || track.username}</span>
              {track.genre && <span className="badge">{track.genre}</span>}
              {track.bpm && <span className="badge">{track.bpm} BPM</span>}
              {track.musical_key && <span className="badge">{track.musical_key}</span>}
              {track.cover_url && <span className="badge">Con portada</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <Tilt as="button" className="btn btn-primary" onClick={handlePlayPause} tiltAmount={6} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {isCurrentTrack && isPlaying ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Reproducir</>}
            </Tilt>
            <Tilt as="button" className="btn btn-secondary" onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } addToQueue(track); }} tiltAmount={6}>
              + Cola
            </Tilt>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 24, marginBottom: 20, flexWrap: 'wrap' }}>
          {track.cover_url && (
            <div style={{ flexShrink: 0, animation: 'fadeSlideIn 0.4s ease-out' }}>
              <div style={{
                padding: 3, borderRadius: 14,
                background: 'linear-gradient(135deg, var(--accent), #6366f1, #a78bfa)',
                boxShadow: '0 0 24px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3)',
                transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s',
              }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 40px var(--accent-glow), 0 8px 32px rgba(0,0,0,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 24px var(--accent-glow), 0 4px 16px rgba(0,0,0,0.3)'; }}
              >
                <img
                  src={track.cover_url}
                  alt={track.title}
                  style={{
                    maxWidth: '100%', maxHeight: 200, borderRadius: 11,
                    objectFit: 'contain', display: 'block',
                  }}
                />
              </div>
            </div>
          )}

          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: 'var(--text2)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} /> {track.plays} reproducciones</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Download size={14} /> {track.downloads} descargas</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Folder size={14} /> {(track.file_size / 1024 / 1024).toFixed(1)} MB</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} /> {new Date(track.created_at).toLocaleDateString()}</span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Tilt as="a" href={api.downloadUrl(track.id)} className="btn btn-secondary" download tiltAmount={4} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', fontSize: 12 }}>
                  <Download size={12} /> Descargar
                </Tilt>
                <div style={{ display: 'flex', gap: 6 }}>
                  {track.username && (
                    <Link to={`/profile/${track.user_id}`} className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}>
                      Ver perfil de {track.display_name || track.username}
                    </Link>
                  )}
                  {isAuthenticated && user?.id !== track.user_id && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tilt as="button" className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={async () => {
                          if (followLoading) return;
                          setFollowLoading(true);
                          try {
                            if (isFollowing) {
                              await api.unfollowUser(track.user_id);
                              setIsFollowing(false);
                              setNotifyOnUpload(false);
                            } else {
                              await api.followUser(track.user_id);
                              setIsFollowing(true);
                            }
                          } catch (e: any) {
                            toast(e.message, 'error');
                          } finally {
                            setFollowLoading(false);
                          }
                        }}
                        tiltAmount={4}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}
                      >
                        {isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />}
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                      </Tilt>
                      {isFollowing && (
                        <Tilt as="button" className="btn btn-secondary"
                          onClick={async () => {
                            try {
                              const r = await api.toggleNotifyOnUpload(track.user_id);
                              setNotifyOnUpload(r.notify_on_upload);
                            } catch (e: any) {
                              toast(e.message || 'Error al cambiar notificaci\u00f3n', 'error');
                            }
                          }}
                          tiltAmount={4}
                          style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', fontSize: 13 }}
                          title={notifyOnUpload ? 'Notificaciones activadas' : 'Activar notificaciones'}
                        >
                          {notifyOnUpload ? <Bell size={15} fill='#f59e0b' style={{ color: '#f59e0b' }} /> : <BellOff size={15} />}
                        </Tilt>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {isAuthenticated && (
                <Tilt as="button" className="btn btn-secondary" onClick={() => setShowPlaylistModal(true)} tiltAmount={4} style={{ padding: '8px 16px', fontSize: 13 }}>
                  + Playlist
                </Tilt>
              )}
              <Tilt
                as="button"
                onClick={async () => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  setLiked(!liked);
                  setLikesCount((c) => c + (liked ? -1 : 1));
                  try {
                    if (liked) {
                      await api.unlikeTrack(track.id);
                    } else {
                      await api.likeTrack(track.id);
                    }
                  } catch {
                    setLiked(liked);
                    setLikesCount(likesCount);
                  }
                }}
                className="btn btn-secondary"
                style={{ color: liked ? '#ec4899' : undefined, display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}
                tiltAmount={4}
              >
                <Heart size={15} fill={liked ? 'currentColor' : 'none'} />
                {likesCount}
              </Tilt>
              <div style={{ position: 'relative' }}>
                <Tilt
                  as="button"
                  className="btn btn-secondary"
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  tiltAmount={4}
                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}
                >
                  <Link2 size={15} /> Compartir
                </Tilt>
                {showShareMenu && (
                  <div className="card" style={{
                    position: 'absolute', bottom: '100%', right: 0, marginBottom: 8,
                    padding: 8, minWidth: 180, zIndex: 50, display: 'flex', flexDirection: 'column', gap: 4,
                  }}>
                    <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', fontSize: 12, padding: '6px 10px' }}
                      onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/track/${track.id}`); toast('Link copiado', 'success'); setShowShareMenu(false); }}>
                      <Link2 size={13} /> Copiar link
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', fontSize: 12, padding: '6px 10px' }}
                      onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent(`${track.title} - ${window.location.origin}/track/${track.id}`)}`, '_blank'); setShowShareMenu(false); }}>
                      <MessageCircle size={13} /> WhatsApp
                    </button>
                    <button className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', fontSize: 12, padding: '6px 10px' }}
                      onClick={() => { window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${track.title} - ${window.location.origin}/track/${track.id}`)}`, '_blank'); setShowShareMenu(false); }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> Twitter / X
                    </button>
                  </div>
                )}
                {showShareMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setShowShareMenu(false)} />}
              </div>
              {!isOwner && (
                <Tilt as="button" className="btn btn-secondary" onClick={() => setShowReportModal(true)}
                  tiltAmount={4} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13, color: 'var(--text2)' }}>
                  <Flag size={14} /> Reportar
                </Tilt>
              )}
              {isOwner && (
                <>
                  <Link to={`/edit-track/${track.id}`} className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}>
                    <Pencil size={15} /> Editar
                  </Link>
                  <Tilt as="button" className="btn btn-danger" onClick={handleDelete} tiltAmount={4} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 16px', fontSize: 13 }}>
                    <Trash2 size={15} /> Eliminar
                  </Tilt>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <WaveformPlayer
            url={api.streamUrl(track.id)}
            isPlaying={isCurrentTrack && isPlaying}
            duration={track.duration || 0}
            currentTime={isCurrentTrack ? currentTime : 0}
            onSeek={(time) => seekTo(time)}
          />
        </div>

        {track.description && (
          <div style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text2)' }}>Descripción</h3>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{track.description}</p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20, padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Comentarios ({comments.length})</h2>

        {isAuthenticated && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <textarea
              ref={commentRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              rows={2}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, resize: 'none',
                fontFamily: 'inherit',
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
            />
            <Tilt as="button" className="btn btn-primary btn-sm" onClick={handleAddComment}
              disabled={!newComment.trim() || commentLoading}
              style={{ alignSelf: 'flex-end', opacity: !newComment.trim() || commentLoading ? 0.5 : 1 }}
              tiltAmount={4}
            >
              {commentLoading ? '...' : 'Enviar'}
            </Tilt>
          </div>
        )}

        {commentsTree.length === 0 ? (
          <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--text2)', fontSize: 13 }}>
            No hay comentarios todavía. {!isAuthenticated && 'Inicia sesión para comentar.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {commentsTree.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                trackId={id!}
                isAuthenticated={isAuthenticated}
                currentUserId={user?.id}
                replyTo={replyTo}
                replyContent={replyContent}
                replyLoading={replyLoading}
                onReplyTo={setReplyTo}
                onReplyContent={setReplyContent}
                onReply={handleReply}
                onLike={handleCommentLike}
                onDelete={handleDeleteComment}
              />
            ))}
          </div>
        )}
      </div>

      {showPlaylistModal && (
        <AddToPlaylistModal trackId={track.id} onClose={() => setShowPlaylistModal(false)} />
      )}

      {showReportModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowReportModal(false)}>
          <div className="card" style={{ width: '90%', maxWidth: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Reportar set</h3>
              <button onClick={() => setShowReportModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <select value={reportReason} onChange={(e) => setReportReason(e.target.value)}
                style={{ width: '100%', fontSize: 13 }}>
                <option value="">Seleccioná un motivo</option>
                <option value="inappropriate">Contenido inapropiado</option>
                <option value="copyright">Infracción de derechos de autor</option>
                <option value="spam">Spam</option>
                <option value="offensive">Contenido ofensivo</option>
                <option value="other">Otro</option>
              </select>
              <textarea value={reportDesc} onChange={(e) => setReportDesc(e.target.value)}
                placeholder="Más detalles (opcional)..."
                rows={3}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
                  background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, resize: 'none' }} />
              <button className="btn btn-primary" disabled={!reportReason || reporting}
                onClick={async () => {
                  if (!reportReason) return;
                  setReporting(true);
                  try {
                    await api.reportTrack(track.id, reportReason, reportDesc);
                    toast('Reporte enviado. Gracias.', 'success');
                    setShowReportModal(false);
                    setReportReason('');
                    setReportDesc('');
                  } catch (e: any) {
                    toast(e.message, 'error');
                  } finally {
                    setReporting(false);
                  }
                }}
                style={{ justifyContent: 'center' }}>
                {reporting ? 'Enviando...' : 'Enviar reporte'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentItem({ comment, trackId, isAuthenticated, currentUserId, replyTo, replyContent, replyLoading, onReplyTo, onReplyContent, onReply, onLike, onDelete }: {
  comment: Comment;
  trackId: string;
  isAuthenticated: boolean;
  currentUserId?: string;
  replyTo: string | null;
  replyContent: string;
  replyLoading: boolean;
  onReplyTo: (id: string | null) => void;
  onReplyContent: (v: string) => void;
  onReply: (parentId: string) => void;
  onLike: (commentId: string, isLiked: boolean) => void;
  onDelete: (commentId: string) => void;
}) {
  const isOwner = currentUserId === comment.user_id;
  const isReplying = replyTo === comment.id;

  return (
    <div>
      <div style={{
        display: 'flex', gap: 10, padding: '10px 12px',
        borderRadius: 8, background: 'var(--bg3)',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
          background: 'var(--accent)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 700, color: 'white',
        }}>
          {comment.avatar_url ? (
            <img src={comment.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            (comment.display_name?.[0] || comment.username?.[0] || '?').toUpperCase()
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Link to={`/profile/${comment.user_id}`} style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text)',
              textDecoration: 'none',
            }}>
              {comment.display_name || comment.username}
            </Link>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{comment.content}</p>
          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
            {isAuthenticated && (
              <button
                onClick={() => onReplyTo(isReplying ? null : comment.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 600, color: 'var(--text2)',
                  padding: 0, transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text2)'}
              >
                Responder
              </button>
            )}
            <button
              onClick={() => onLike(comment.id, comment.is_liked)}
              style={{
                background: 'none', border: 'none', cursor: isAuthenticated ? 'pointer' : 'default',
                fontSize: 11, display: 'flex', alignItems: 'center', gap: 3,
                color: comment.is_liked ? '#ec4899' : 'var(--text2)', padding: 0,
                transition: 'color 0.15s',
              }}
            >
              <Heart size={12} fill={comment.is_liked ? 'currentColor' : 'none'} />
              {comment.likes_count || 0}
            </button>
            {isOwner && (
              <button
                onClick={() => onDelete(comment.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'var(--text2)', padding: 0, opacity: 0.4,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.4'}
              >
                Eliminar
              </button>
            )}
          </div>
        </div>
      </div>

      {isReplying && (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, marginLeft: 42, marginBottom: 8 }}>
          <textarea
            ref={null}
            autoFocus
            value={replyContent}
            onChange={(e) => onReplyContent(e.target.value)}
            placeholder="Escribe tu respuesta..."
            rows={2}
            style={{
              flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg3)', color: 'var(--text)', fontSize: 13, resize: 'none',
              fontFamily: 'inherit',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onReply(comment.id); } }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => onReply(comment.id)}
              disabled={!replyContent.trim() || replyLoading}
              style={{ opacity: !replyContent.trim() || replyLoading ? 0.5 : 1 }}
            >
              {replyLoading ? '...' : 'Enviar'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => { onReplyTo(null); onReplyContent(''); }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div style={{ marginLeft: 42, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {comment.replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              trackId={trackId}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
              replyTo={replyTo}
              replyContent={replyContent}
              replyLoading={replyLoading}
              onReplyTo={onReplyTo}
              onReplyContent={onReplyContent}
              onReply={onReply}
              onLike={onLike}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
