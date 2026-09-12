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
    <aside
      className="card"
      style={{
        width: '240px',
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        height: 'fit-content',
        position: 'sticky',
        top: '84px',
      }}
    >
      {/* Header */}
      <div style={{ padding: '0 10px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Admin Console
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
          Manage your store
        </p>
      </div>

      {/* Nav Items */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={17} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <a
          href="http://localhost:5000/api/whatsapp/scan"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.84rem',
            fontWeight: 600,
            color: '#25d366',
            background: 'rgba(37, 211, 102, 0.08)',
            border: '1px solid rgba(37, 211, 102, 0.25)',
            textDecoration: 'none',
            marginTop: '4px',
          }}
        >
          <MessageCircle size={17} />
          <span>WhatsApp QR Link</span>
        </a>
      </nav>

      {/* Back to Store */}
      <div style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)' }}>
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
