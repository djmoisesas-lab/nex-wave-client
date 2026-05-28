import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await api.resetPassword(token, password);
      setMessage(res.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ maxWidth: 400, margin: '24px auto' }}>
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <p style={{ color: 'var(--text2)', marginBottom: 16 }}>Enlace inválido. No se encontró el token de recuperación.</p>
          <Link to="/forgot-password" className="btn btn-primary gradient-btn" style={{ display: 'inline-flex', padding: '10px 20px' }}>Solicitar nuevo enlace</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: '24px auto' }}>
      <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-40%', right: '-20%', width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(139,92,246,0.08)',
          filter: 'blur(40px)', pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>Nueva contraseña</p>
          </div>

          {message && <div style={{ textAlign: 'center', marginBottom: 16, background: 'rgba(34,197,94,0.1)', padding: '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text1)' }}>{message}</div>}
          {error && <div className="error" style={{ textAlign: 'center', marginBottom: 16, background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: 8 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required style={{ width: '100%', paddingRight: 36 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)',
                  padding: 4, display: 'flex',
                }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirmar contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repetí la contraseña" required style={{ width: '100%', paddingRight: 36 }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{
                  position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text2)',
                  padding: 4, display: 'flex',
                }}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary gradient-btn" disabled={loading} style={{ justifyContent: 'center', padding: '12px 20px' }}>
              {loading ? 'Actualizando...' : 'Cambiar contraseña'}
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
