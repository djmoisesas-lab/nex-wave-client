import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '../services/toast';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const ICONS = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
};

const COLORS = {
  success: '#10b981',
  error: '#ef4444',
  info: 'var(--accent)',
};

export default function ToastContainer() {
  const { toasts, remove } = useToastStore();

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 10,
              background: 'var(--bg2)', border: '1px solid var(--border)',
              boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 0 1px ${COLORS[t.type]}22`,
              fontSize: 13, fontWeight: 500, color: 'var(--text)',
              pointerEvents: 'auto', whiteSpace: 'nowrap',
            }}
          >
            <span style={{ color: COLORS[t.type], flexShrink: 0, display: 'flex' }}>
              {ICONS[t.type]}
            </span>
            <span>{t.message}</span>
            <button
              onClick={() => remove(t.id)}
              style={{
                background: 'none', border: 'none', color: 'var(--text2)',
                cursor: 'pointer', padding: 2, marginLeft: 4, display: 'flex',
                opacity: 0.5,
              }}
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
