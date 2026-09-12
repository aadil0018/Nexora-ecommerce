import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  MessageSquare,
  Activity,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';

const AdminSidebar = () => {
  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Reviews', path: '/admin/reviews', icon: MessageSquare },
    { label: 'AI Activity', path: '/admin/ai-activity', icon: Activity },
  ];

  return (
    <aside className="card admin-sidebar">
      {/* Header */}
      <div className="admin-sidebar-header">
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Admin Console
          </h3>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Manage your store
          </p>
        </div>
        <Link
          to="/"
          className="admin-mobile-back-btn"
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}
        >
          <ArrowLeft size={14} /> Store
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="admin-nav-list">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <a
          href="/api/whatsapp/scan"
          target="_blank"
          rel="noreferrer"
          className="admin-nav-item whatsapp-link"
        >
          <MessageCircle size={17} />
          <span>WhatsApp QR</span>
        </a>
      </nav>

      {/* Back to Store (Desktop) */}
      <div className="admin-sidebar-footer">
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            fontWeight: 500,
            color: 'var(--text-muted)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ArrowLeft size={15} />
          Back to Store
        </Link>
      </div>
    </aside>
  );
};

export default AdminSidebar;
