import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../services/store';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
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
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Ingresa a tu cuenta</p>
          </div>

          {error && <div className="error" style={{ textAlign: 'center', marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Usuario</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Tu nombre de usuario" required />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Tu contraseña" required />
            </div>

            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: 12, color: 'var(--text2)' }}>Olvidé mi contraseña</Link>
            </div>

            <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ justifyContent: 'center', padding: '12px 20px' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)', marginTop: 20 }}>
            ¿No tienes cuenta?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>Regístrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
