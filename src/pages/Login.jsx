import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!loginId.trim() || !password.trim()) {
      setError('Please enter Login ID and Password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await login(loginId.trim(), password.trim(), undefined);
      if (result.success) {
        navigate('/', { replace: true });
      } else {
        setError(result.error || 'Login failed.');
      }
    } catch (e) {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="loginWrap">
      <div className="lx">
        <div className="lx-top">
          <div className="lx-logo" id="lxLogoWrap" style={{ background: 'transparent', height: '140px', width: 'auto', marginBottom: '16px' }}>
            <img src="/logo.png" alt="Carecay Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
          <div className="lx-sub">Carecay Private Limited — Used Car ERP</div>
        </div>

        <div className="lx-body">
          <label style={{ marginTop: 0 }}>Login ID</label>
          <input
            id="lId"
            placeholder="Enter Login ID or Email"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />

          <label>Password</label>
          <input
            id="lPw"
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />

          {error && (
            <div style={{
              background: 'rgba(248,113,113,0.1)', border: '1px solid #F87171',
              borderRadius: 'var(--radius-sm)', padding: '8px 12px',
              color: 'var(--danger)', fontSize: 12, marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <i className="fa fa-circle-exclamation"></i> {error}
            </div>
          )}

          <button
            className="btn-login"
            onClick={handleLogin}
            disabled={loading}
            style={{
              marginTop: 8,
              ...(loading ? { opacity: 0.7, cursor: 'not-allowed' } : {})
            }}
          >
            {loading ? (
              <><i className="car-spinner"></i> &nbsp;SIGNING IN…</>
            ) : (
              <><i className="fa fa-right-to-bracket"></i> &nbsp;SIGN IN</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
