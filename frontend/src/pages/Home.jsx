import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ArrowRight,
  Bot,
  Laptop,
  Smartphone,
  Headphones,
  Watch,
  Keyboard,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [recommendationBasis, setRecommendationBasis] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiPrompt, setAiPrompt] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const prodRes = await api.get('/products?sort=rating-desc&limit=8');
        if (prodRes.data.success) setFeaturedProducts(prodRes.data.products);

        const catRes = await api.get('/products/categories');
        if (catRes.data.success) setCategories(catRes.data.categories);

        const recRes = await api.post('/ai/recommend');
        if (recRes.data.success) {
          setRecommendedProducts(recRes.data.data.products);
          setRecommendationBasis(recRes.data.data.recommendationBasis);
        }
      } catch (err) {
        console.error('[Home Error]:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAiSearch = (e) => {
    e.preventDefault();
    if (aiPrompt.trim()) {
      navigate(`/ai-search?q=${encodeURIComponent(aiPrompt.trim())}`);
    }
  };

  const starterPrompts = [
    'Laptop for programming under ₹60,000',
    'Wireless headphones with good battery',
    'Flagship smartphone with high rating',
    'Smartwatch with sleep tracking',
  ];

  const categoryIcons = {
    Laptops: Laptop,
    Smartphones: Smartphone,
    Audio: Headphones,
    Wearables: Watch,
    Accessories: Keyboard,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '40px' }}>
      {/* ── Hero Section ── */}
      <section
        style={{
          padding: '56px 0 48px',
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="container" style={{ textAlign: 'center', maxWidth: '720px' }}>
          <span
            className="badge badge-primary"
            style={{ marginBottom: '16px', padding: '5px 14px', fontSize: '0.75rem' }}
          >
            <Sparkles size={12} /> AI-Powered Shopping
          </span>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              marginBottom: '14px',
              color: 'var(--text-primary)',
            }}
          >
            Find the right tech,{' '}
            <span style={{ color: 'var(--primary)' }}>without the guesswork</span>
          </h1>

          <p
            style={{
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.65,
              marginBottom: '28px',
              maxWidth: '560px',
              margin: '0 auto 28px',
            }}
          >
            Ask our AI assistant what you need in plain English. It searches our catalog, compares specs, and
            analyzes real customer reviews to recommend the best match.
          </p>

          {/* AI Search Bar */}
          <form
            onSubmit={handleAiSearch}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--input-bg)',
              border: '1px solid var(--input-border)',
              borderRadius: 'var(--radius-full)',
              padding: '5px 6px 5px 18px',
              maxWidth: '580px',
              margin: '0 auto 18px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Search size={18} color="var(--text-muted)" style={{ marginRight: '10px', flexShrink: 0 }} />
            <input
              type="text"
              placeholder='Try "coding laptop under ₹60000" or "wireless earbuds with ANC"'
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                padding: '8px 0',
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ borderRadius: 'var(--radius-full)', padding: '8px 18px' }}>
              Search <ArrowRight size={15} />
            </button>
          </form>

          {/* Starter Prompts */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Try:</span>
            {starterPrompts.map((prompt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(`/ai-search?q=${encodeURIComponent(prompt)}`)}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  padding: '4px 11px',
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                "{prompt}"
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="container">
        <div className="section-header">
          <div>
            <h2>Shop by Category</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Browse our curated electronics catalog
            </p>
          </div>
          <Link to="/products" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.name] || Laptop;
            return (
              <Link
                key={cat.name}
                to={`/products?category=${cat.name}`}
                className="card"
                style={{
                  padding: '22px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  transition: 'box-shadow 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
              >
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)',
                  }}
                >
                  <Icon size={24} strokeWidth={1.5} />
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {cat.name}
                </h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {cat.count} products
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── AI Recommendations ── */}
      <section className="container">
        <div
          className="card"
          style={{ padding: '28px', borderLeft: '3px solid var(--primary)' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Sparkles size={18} color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Recommended for You</h2>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Personalized by AI · Based on{' '}
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  {recommendationBasis.replace('_', ' ')}
                </span>
              </p>
            </div>
            <Link to="/ai-assistant" className="btn btn-primary btn-sm">
              <Bot size={15} /> AI Assistant
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner text="Computing recommendations..." />
          ) : (
            <div className="product-grid">
              {recommendedProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Rated ── */}
      <section className="container">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={20} color="var(--accent-orange)" />
            <div>
              <h2>Top Rated & Trending</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Highest rated products with verified positive reviews
              </p>
            </div>
          </div>
          <Link to="/products?sort=rating-desc" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            See More <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading products..." />
        ) : (
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── AI Assistant Banner ── */}
      <section className="container">
        <div
          className="card"
          style={{
            padding: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
            flexWrap: 'wrap',
            borderRadius: 'var(--radius-xl)',
          }}
        >
          <div style={{ maxWidth: '520px' }}>
            <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
              AI Shopping Assistant
            </span>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '12px' }}>
              Need help choosing the right device?
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '20px' }}>
              Chat with our AI assistant — tell it your budget, specs, and use case. It queries
              the live product catalog and verified reviews to find your perfect match.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link to="/ai-assistant" className="btn btn-primary">
                <Bot size={17} /> Chat with AI
              </Link>
              <Link to="/compare" className="btn btn-secondary">
                Compare Products
              </Link>
            </div>
          </div>

          {/* Chat Preview */}
          <div
            className="card"
            style={{
              flex: 1,
              minWidth: '260px',
              maxWidth: '380px',
              padding: '18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '12px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)' }} />
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                AI Assistant — Live Preview
              </span>
            </div>
            <div
              style={{
                background: 'var(--bg-surface-elevated)',
                padding: '10px 13px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
                marginBottom: '8px',
              }}
            >
              💬 "I need a laptop for programming under ₹60000"
            </div>
            <div
              style={{
                background: 'var(--primary-light)',
                border: '1px solid var(--border-subtle)',
                padding: '10px 13px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                lineHeight: 1.5,
              }}
            >
              🤖 Found: <strong>ASUS TUF Gaming F15</strong> (₹54,990) — Intel i5, 16GB RAM, 512GB SSD. Ideal for coding and multitasking.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
