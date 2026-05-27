import { usePlayerStore } from '../services/store';
import { useMediaQuery } from '../services/useMediaQuery';
import { Music, X, PanelRightClose, PanelRightOpen } from 'lucide-react';
import Tilt from './Tilt';

interface Props {
  visible: boolean;
  onToggle: () => void;
}

export default function QueuePanel({ visible, onToggle }: Props) {
  const { queue, currentTrack, removeFromQueue, setTrack, setPlaying } = usePlayerStore();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!currentTrack) return null;

  const currentIndex = queue.findIndex((t) => t.id === currentTrack.id);
  const upcoming = currentIndex === -1 ? queue : queue.slice(currentIndex + 1);

  if (!visible) {
    return (
      <div style={{
        position: 'fixed', top: isMobile ? 56 : 66, right: 8, zIndex: 91,
      }}>
        <Tilt as="button" onClick={onToggle} tiltAmount={6}
          title="Mostrar cola"
          style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--bg2)', color: 'var(--accent)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}>
          <PanelRightOpen size={16} />
        </Tilt>
      </div>
    );
  }

  return (
    <>
      {isMobile && (
        <div onClick={onToggle} style={{
          position: 'fixed', inset: 0, zIndex: 89,
          background: 'rgba(0,0,0,0.6)',
        }} />
      )}
      <div style={{
        position: 'fixed',
        top: isMobile ? 56 : 56,
        right: 0,
        bottom: isMobile ? 0 : 68,
        width: isMobile ? '100%' : 300,
        maxHeight: isMobile ? 'calc(100vh - 56px)' : undefined,
        zIndex: 90,
        background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        ...(isMobile ? { borderRadius: '12px 0 0 0' } : {}),
      }}>
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Cola</span>
          <span style={{ fontSize: 12, color: 'var(--text2)', marginLeft: 8 }}>
            {queue.length} {queue.length === 1 ? 'set' : 'sets'}
          </span>
        </div>
        <Tilt as="button" onClick={onToggle} tiltAmount={6}
          title="Ocultar cola"
          style={{
            width: 28, height: 28, borderRadius: 6, border: 'none',
            background: 'var(--bg3)', color: 'var(--text2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>
          <PanelRightClose size={14} />
        </Tilt>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        <div style={{ padding: '0 16px', marginBottom: 12 }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text2)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
          }}>
            Reproduciendo ahora
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
            borderRadius: 8, background: 'var(--accent-glow)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}>
            <Music size={16} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                color: 'var(--accent)',
              }}>
                {currentTrack.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                {currentTrack.artist || currentTrack.display_name || currentTrack.username}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '0 16px' }}>
          <div style={{
            fontSize: 11, fontWeight: 600, color: 'var(--text2)',
            textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8,
          }}>
            Siguientes ({upcoming.length})
          </div>

          {upcoming.length === 0 ? (
            <div style={{ padding: '12px 0', color: 'var(--text2)', fontSize: 13, textAlign: 'center' }}>
              No hay más sets en la cola
            </div>
          ) : (
            upcoming.map((t, i) => (
              <div key={`${t.id}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 8px', borderRadius: 6, fontSize: 13,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => { setTrack(t); setPlaying(true); }}
              >
                <span style={{ color: 'var(--text2)', fontSize: 11, width: 16, flexShrink: 0 }}>{i + 1}</span>
                <Music size={16} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text)' }}>
                    {t.title}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                    {t.artist || t.display_name || t.username}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFromQueue(t.id); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text2)',
                    cursor: 'pointer', padding: 2, flexShrink: 0, display: 'flex',
                    opacity: 0.5,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
    </>
  );
}
