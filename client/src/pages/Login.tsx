import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SunMedium } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { apiErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const { push } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@demo.solardispatch.test');
  const [password, setPassword] = useState('SolarAdmin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      push('Signed in successfully', 'success');
      navigate('/');
    } catch (err) {
      const msg = apiErrorMessage(err, 'Sign in failed');
      setError(msg);
      push(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-brand-panel">
        <div className="login-brand-mark">
          <div className="mark"><SunMedium size={22} /></div>
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.15rem' }}>SolarDispatch</div>
            <div style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: 'var(--slate-400)', textTransform: 'uppercase' }}>Rooftop Solar ERP</div>
          </div>
        </div>
        <div>
          <h1>Sales, inventory & dispatch for rooftop solar.</h1>
          <p>Track leads, follow-ups, site surveys and every panel that leaves the warehouse — with atomic stock control and printable challans built in.</p>
        </div>
        <div style={{ color: 'var(--slate-400)', fontSize: '0.8rem' }}>© 2026 SolarDispatch · Demo environment</div>
      </div>
      <div className="login-form-panel">
        <div className="login-card">
          <h2>Sign in</h2>
          <p>Use one of the seeded demo accounts to explore.</p>
          <form onSubmit={onSubmit} data-testid="login-form">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="login-email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="login-password"
              />
            </div>
            {error && <div className="field-error mb-sm" role="alert" data-testid="login-error">{error}</div>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading} data-testid="login-submit-btn">
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <div className="demo-creds" data-testid="demo-creds">
            <strong>Demo accounts</strong>
            <div>Admin: admin@demo.solardispatch.test / SolarAdmin@123</div>
            <div>Sales: sales@demo.solardispatch.test / SolarSales@123</div>
            <div>Warehouse: warehouse@demo.solardispatch.test / SolarWarehouse@123</div>
            <div>Accounts: accounts@demo.solardispatch.test / SolarAccounts@123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
