import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Mail, ShieldCheck, ArrowLeft, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOTP, resendOTP } = useAuth();
  const { showToast } = useToast();

  const email = location.state?.email || '';

  // 6 separate digit inputs for a sleek, modern, professional experience
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef([]);

  // Auto-focus first input on load
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Countdown timer for Resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const newDigits = [...digits];

    if (cleanVal.length > 1) {
      // Handle paste of full 6-digit code
      const pasted = cleanVal.slice(0, 6).split('');
      pasted.forEach((char, i) => {
        if (i < 6) newDigits[i] = char;
      });
      setDigits(newDigits);
      const nextFocus = Math.min(pasted.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const fullOtp = digits.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (fullOtp.length !== 6) {
      showToast('Please enter all 6 digits of your verification code', 'error');
      return;
    }
    if (!email) {
      showToast('No email address associated. Please sign up again.', 'error');
      navigate('/register');
      return;
    }

    try {
      setLoading(true);
      const user = await verifyOTP(email, fullOtp);
      showToast(`Welcome to Nexora, ${user.name}! Your account is now active.`);
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Invalid verification code. Please check your email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    try {
      setLoading(true);
      await resendOTP(email);
      showToast('A new 6-digit verification code has been sent to your email!', 'info');
      setResendCooldown(60);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{
        padding: '60px 0 100px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '44px 34px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-xl)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
        }}
      >
        {/* Glowing Top Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(56, 189, 248, 0.15))',
            border: '2px solid rgba(99, 102, 241, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--primary)',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.25)',
          }}
        >
          <Mail size={30} />
        </div>

        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
          Check Your Email
        </h1>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          We sent a 6-digit One-Time Password (OTP) to:
          <br />
          <strong style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {email || 'your registered email'}
          </strong>
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* 6 Segmented Digit Inputs */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '26px',
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                autoComplete="one-time-code"
                style={{
                  width: '46px',
                  height: '56px',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  borderRadius: 'var(--radius-md)',
                  border: digit ? '2px solid var(--primary)' : '1px solid var(--border-main)',
                  backgroundColor: digit ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.25)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = digit ? 'var(--primary)' : 'var(--border-main)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || fullOtp.length !== 6}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '13px 20px',
              fontSize: '0.95rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? 'Activating Account...' : 'Verify & Activate Account'}
            <ShieldCheck size={18} />
          </button>
        </form>

        {/* Resend & Support Info */}
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Didn't receive the email? Check your Spam or Promotions folder.
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || loading}
            style={{
              background: 'none',
              border: 'none',
              color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: resendCooldown > 0 ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <RefreshCw size={14} className={loading ? 'spinning' : ''} />
            {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
          </button>
        </div>

        <div style={{ marginTop: '20px' }}>
          <Link
            to="/register"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
            }}
          >
            <ArrowLeft size={14} /> Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
