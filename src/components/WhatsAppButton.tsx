import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '584123768842';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed', bottom: 75, right: 12, zIndex: 999,
        width: 38, height: 38, borderRadius: '50%',
        background: 'rgba(37, 211, 102, 0.85)',
        backdropFilter: 'blur(4px)',
        color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        cursor: 'pointer', transition: 'transform 0.2s, background 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = '#25D366'; e.currentTarget.style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(37, 211, 102, 0.85)'; e.currentTarget.style.transform = 'scale(1)'; }}
      title="Soporte"
    >
      <MessageCircle size={18} />
    </a>
  );
}
