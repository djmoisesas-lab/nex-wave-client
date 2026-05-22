import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await api.forgotPassword(email);
      setMessage(res.message);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-40%', right: '-20%', width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(139,92,246,0.08)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Recupera tu contraseña</p>
          </div>

          {message && <div style={{ textAlign: 'center', marginBottom: 16, background: 'rgba(34,197,94,0.1)', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text1)' }}>{message}</div>}
          {error && <div className="error" style={{ textAlign: 'center', marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email registrado" required />
            </div>

            <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ justifyContent: 'center', padding: '12px 20px' }}>
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 20 }}>
            <Link to="/login" style={{ fontWeight: 600 }}>Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
