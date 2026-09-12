import React from 'react';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, RefreshCw, Headphones } from 'lucide-react';

const Footer = () => {
  const trustItems = [
    { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹999' },
    { icon: ShieldCheck, title: 'Genuine Products', desc: '100% authentic warranty' },
    { icon: RefreshCw, title: 'Easy Returns', desc: '7-day replacement policy' },
    { icon: Headphones, title: '24/7 AI Support', desc: 'Always-on shopping assistant' },
  ];

  return (
    <footer
      style={{
        marginTop: '60px',
        background: 'var(--footer-bg)',
        padding: '48px 0 28px',
      }}
    >
      <div className="container">
        {/* Trust Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            paddingBottom: '36px',
            marginBottom: '36px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {trustItems.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icon size={20} color="#999" strokeWidth={1.5} />
              <div>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--footer-text)' }}>{title}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--footer-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '32px',
            marginBottom: '36px',
          }}
        >
          {/* Brand */}
          <div className="footer-brand" style={{ gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="#4f6ef7" />
                <path d="M8 24V8h3.5l8.5 11.5V8H23.5v16H20L11.5 12.5V24z" fill="white" />
              </svg>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--footer-text)' }}>
                Nexora
              </span>
            </div>
            <p
              style={{
                fontSize: '0.82rem',
                color: 'var(--footer-muted)',
                lineHeight: 1.6,
                maxWidth: '340px',
              }}
            >
              AI-powered e-commerce platform that helps you discover the perfect tech products through
              natural language conversations, smart recommendations, and verified review analysis.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--footer-text)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Shop
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <li><Link to="/products" style={{ color: 'var(--footer-muted)' }}>All Products</Link></li>
              <li><Link to="/products?category=Laptops" style={{ color: 'var(--footer-muted)' }}>Laptops</Link></li>
              <li><Link to="/products?category=Smartphones" style={{ color: 'var(--footer-muted)' }}>Smartphones</Link></li>
              <li><Link to="/products?category=Audio" style={{ color: 'var(--footer-muted)' }}>Audio</Link></li>
              <li><Link to="/products?category=Wearables" style={{ color: 'var(--footer-muted)' }}>Wearables</Link></li>
            </ul>
          </div>

          {/* AI Features */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--footer-text)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              AI Features
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <li><Link to="/ai-assistant" style={{ color: 'var(--footer-muted)' }}>Shopping Assistant</Link></li>
              <li><Link to="/ai-search" style={{ color: 'var(--footer-muted)' }}>Smart Search</Link></li>
              <li><Link to="/compare" style={{ color: 'var(--footer-muted)' }}>Product Comparison</Link></li>
              <li><Link to="/products" style={{ color: 'var(--footer-muted)' }}>Sentiment Analysis</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h5 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--footer-text)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Account
            </h5>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <li><Link to="/profile" style={{ color: 'var(--footer-muted)' }}>My Profile</Link></li>
              <li><Link to="/orders" style={{ color: 'var(--footer-muted)' }}>Order History</Link></li>
              <li><Link to="/wishlist" style={{ color: 'var(--footer-muted)' }}>Wishlist</Link></li>
              <li><Link to="/cart" style={{ color: 'var(--footer-muted)' }}>Cart</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div
          style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            fontSize: '0.75rem',
            color: 'var(--footer-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <p>© {new Date().getFullYear()} Nexora. All rights reserved.</p>
          <p>Built with MongoDB, Express, React, Node.js & Groq AI</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
