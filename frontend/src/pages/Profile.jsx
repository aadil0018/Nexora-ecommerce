import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, History, Trash2, Package, Heart, CheckCircle2, Shield, Eye, EyeOff } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [browsingHistory, setBrowsingHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/auth/profile');
        if (res.data.success) {
          setName(res.data.user.name);
          setEmail(res.data.user.email);
          setBrowsingHistory(res.data.user.browsingHistory || []);
        }
      } catch (err) {
        console.error('[Profile Fetch Error]:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const res = await api.put('/auth/profile', {
        name,
        email,
        password: password || undefined,
      });

      if (res.data.success) {
        setUser(res.data.user);
        setPassword('');
        showToast('Profile updated successfully');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      const res = await api.delete('/auth/browsing-history');
      if (res.data.success) {
        setBrowsingHistory([]);
        showToast('Browsing history cleared');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Please sign in to view your profile</h2>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="container profile-container" style={{ padding: '32px 0 80px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Account & Preferences</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Manage your personal details, credentials, and personalized browsing history.
        </p>
      </div>

      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '24px', marginBottom: '48px' }}>
        {/* User Card */}
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</p>
              <span className={`badge ${user.role === 'admin' ? 'badge-primary' : 'badge-ai'}`} style={{ marginTop: '6px' }}>
                {user.role === 'admin' ? 'Administrator' : 'Verified Customer'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <Link to="/orders" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Package size={16} /> My Orders
            </Link>
            <Link to="/wishlist" className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <Heart size={16} /> My Wishlist
            </Link>
          </div>
        </div>

        {/* Update Details Form */}
        <form onSubmit={handleUpdate} className="card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '18px' }}>
            Update Profile Information
          </h3>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Change Password (leave blank to keep current)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-control"
                style={{ paddingRight: '42px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={updating} className="btn btn-primary" style={{ width: '100%', marginTop: '6px' }}>
            {updating ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Browsing History Section (Personalization basis) */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <History size={20} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Recent Browsing History ({browsingHistory.length})
            </h3>
          </div>
          {browsingHistory.length > 0 && (
            <button
              onClick={handleClearHistory}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-red)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              <Trash2 size={15} /> Clear History
            </button>
          )}
        </div>

        {browsingHistory.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No browsing history recorded yet. As you view devices, our AI uses your interest signals to tune personalized product recommendations.
          </p>
        ) : (
          <div className="product-grid">
            {browsingHistory
              .filter((item) => item.product)
              .map((item) => (
                <ProductCard key={item._id || item.product._id} product={item.product} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
