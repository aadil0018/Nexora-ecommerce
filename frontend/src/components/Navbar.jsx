import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingBag,
  Heart,
  Search,
  User,
  LogOut,
  Bot,
  Menu,
  X,
  LayoutDashboard,
  Package,
  Sun,
  Moon,
  Sparkles,
  ArrowRightLeft,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

/* Inline SVG logo — clean "N" lettermark */
const NexoraLogo = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="8" fill="var(--primary)" />
    <path d="M8 24V8h3.5l8.5 11.5V8H23.5v16H20L11.5 12.5V24z" fill="white" />
  </svg>
);

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const wishlistCount = user?.wishlist?.length || 0;
  const isActive = (path) => location.pathname === path;

  const navLinkStyle = (path) => ({
    padding: '7px 14px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: isActive(path) ? 'var(--primary)' : 'var(--text-secondary)',
    background: isActive(path) ? 'var(--primary-light)' : 'transparent',
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  });

  const iconBtnStyle = {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-sm)',
    background: 'transparent',
    border: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const badgeCountStyle = {
    position: 'absolute',
    top: '-5px',
    right: '-5px',
    background: 'var(--accent-red)',
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 700,
    width: '17px',
    height: '17px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--navbar-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--navbar-border)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
          gap: '16px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <NexoraLogo />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: 'var(--text-primary)',
              }}
            >
              Nexora
            </span>
            <span
              className="navbar-brand-subtitle"
              style={{
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              AI-Powered Shopping
            </span>
          </div>
        </Link>

        {/* Search Bar - Desktop */}
        <form
          onSubmit={handleSearch}
          className="desktop-search"
          style={{
            flex: 1,
            maxWidth: '420px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control"
            style={{
              paddingLeft: '38px',
              height: '40px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
            }}
          />
        </form>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Link to="/products" style={navLinkStyle('/products')}>
            Catalog
          </Link>
          <Link to="/ai-assistant" style={navLinkStyle('/ai-assistant')}>
            <Bot size={15} /> AI Assistant
          </Link>
          <Link to="/ai-search" style={navLinkStyle('/ai-search')}>
            <Sparkles size={15} /> AI Search
          </Link>
          <Link to="/compare" style={navLinkStyle('/compare')}>
            <ArrowRightLeft size={15} /> Compare
          </Link>
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={iconBtnStyle}
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
          </button>

          {/* Wishlist */}
          <Link to="/wishlist" style={iconBtnStyle} title="Wishlist">
            <Heart size={17} />
            {wishlistCount > 0 && <span style={badgeCountStyle}>{wishlistCount}</span>}
          </Link>

          {/* Cart */}
          <Link to="/cart" style={iconBtnStyle} title="Cart">
            <ShoppingBag size={17} />
            {itemCount > 0 && <span style={badgeCountStyle}>{itemCount}</span>}
          </Link>

          {/* User Profile / Auth */}
          {user ? (
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen((prev) => !prev)}
                className="navbar-user-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  padding: '5px 12px 5px 5px',
                  borderRadius: 'var(--radius-full)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    flexShrink: 0,
                  }}
                >
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <span className="navbar-username">{user.name.split(' ')[0]}</span>
                <ChevronDown size={14} color="var(--text-muted)" className="navbar-chevron" />
              </button>

              {profileOpen && (
                <div
                  className="card"
                  style={{
                    position: 'absolute',
                    top: '44px',
                    right: 0,
                    width: '220px',
                    padding: '6px 0',
                    zIndex: 200,
                    boxShadow: 'var(--shadow-lg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {user.name}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</p>
                    {isAdmin && (
                      <span className="badge badge-primary" style={{ marginTop: '6px', fontSize: '0.65rem' }}>
                        Admin
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 16px',
                        fontSize: '0.85rem',
                        color: 'var(--primary)',
                        fontWeight: 500,
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <LayoutDashboard size={16} /> Admin Dashboard
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <User size={16} /> Profile
                  </Link>

                  <Link
                    to="/orders"
                    onClick={() => setProfileOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Package size={16} /> My Orders
                  </Link>

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--accent-red)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--badge-red-bg)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">
              Sign In
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none',
            }}
            className="mobile-toggle"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            padding: '14px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
            />
          </form>
          <Link to="/products" style={{ padding: '8px 0', fontWeight: 500, fontSize: '0.9rem' }}>
            Catalog
          </Link>
          <Link to="/ai-assistant" style={{ padding: '8px 0', fontWeight: 500, fontSize: '0.9rem', color: 'var(--primary)' }}>
            AI Assistant
          </Link>
          <Link to="/ai-search" style={{ padding: '8px 0', fontWeight: 500, fontSize: '0.9rem', color: 'var(--primary)' }}>
            AI Search
          </Link>
          <Link to="/compare" style={{ padding: '8px 0', fontWeight: 500, fontSize: '0.9rem' }}>
            Compare
          </Link>
          {isAdmin && (
            <Link to="/admin" style={{ padding: '8px 0', fontWeight: 500, fontSize: '0.9rem', color: 'var(--primary)' }}>
              Admin Dashboard
            </Link>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
