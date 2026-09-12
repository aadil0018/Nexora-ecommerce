import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, KeyRound, ShieldCheck, X, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP & New Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login, forgotPassword, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please provide both email and password', 'error');
      return;
    }
    try {
      setLoading(true);
      const user = await login(email.trim(), password);
      showToast(`Welcome back, ${user.name}!`);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Reset OTP
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      showToast('Please provide your email address', 'error');
      return;
    }
    try {
      setForgotLoading(true);
      const res = await forgotPassword(forgotEmail.trim());
      showToast(`Password reset OTP sent to ${forgotEmail}`, 'info');
      setForgotStep(2);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Reset Password with OTP
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      showToast('Please enter the 6-digit OTP', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      showToast('New password must be at least 6 characters', 'error');
      return;
    }
    try {
      setForgotLoading(true);
      const user = await resetPassword(forgotEmail.trim(), forgotOtp.trim(), newPassword);
      showToast('Password reset successful! Welcome back.');
      setShowForgotModal(false);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        padding: '48px 0 80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 30px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <svg width="36" height="36" viewBox="0 0 32 32" fill="none" style={{ margin: '0 auto 12px' }}>
            <rect width="32" height="32" rx="8" fill="var(--primary)" />
            <path d="M8 24V8h3.5l8.5 11.5V8H23.5v16H20L11.5 12.5V24z" fill="white" />
          </svg>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>Welcome back</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Sign in to your Nexora account
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label className="form-label">Email or Username</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Enter your email or username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="form-control"
                style={{ paddingLeft: '38px' }}
              />
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label">Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  marginBottom: '6px',
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '40px' }}
              />
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '11px 20px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '24px' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
            Create an account
          </Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '420px',
              padding: '28px',
              position: 'relative',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'rgba(99, 102, 241, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                  color: 'var(--primary)',
                }}
              >
                <KeyRound size={22} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Reset Your Password</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {forgotStep === 1
                  ? 'We will send a 6-digit OTP to your registered email'
                  : `Enter the OTP sent to ${forgotEmail} and your new password`}
              </p>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleForgotSubmit}>
                <div className="form-group">
                  <label className="form-label">Registered Email</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    className="form-control"
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {forgotLoading ? 'Sending OTP...' : 'Send Reset OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetSubmit}>

                <div className="form-group">
                  <label className="form-label">6-Digit Reset OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    className="form-control"
                    style={{
                      textAlign: 'center',
                      letterSpacing: '5px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                    }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="form-control"
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      tabIndex={-1}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading || forgotOtp.length !== 6}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  {forgotLoading ? 'Resetting...' : 'Set New Password & Login'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                    }}
                  >
                    Change Email
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
