import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/store';

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(username, email, password, displayName || undefined);
      navigate('/');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '24px auto' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-30%', left: '-10%', width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(139,92,246,0.08)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-10%', width: 180, height: 180,
          borderRadius: '50%', background: 'rgba(99,102,241,0.06)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Crea tu cuenta de DJ</p>
          </div>

          {error && <div className="error" style={{ textAlign: 'center', marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Nombre de usuario *</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu nombre de DJ" required />
            </div>

            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required />
            </div>

            <div className="form-group">
              <label>Nombre a mostrar</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre artístico" />
            </div>

            <div className="form-group">
              <label>Contraseña *</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>

            <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ justifyContent: 'center', padding: '12px 20px' }}>
              {loading ? 'Registrando...' : 'Registrarse'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 20 }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>Ingresa</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
