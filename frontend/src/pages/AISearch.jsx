import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Search, Sliders, CheckCircle2, ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

const AISearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || 'Show me wireless headphones under ₹5000 with good battery life';

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [structuredData, setStructuredData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const sampleQueries = [
    'Show me wireless headphones under ₹5000 with good battery life',
    'I need a laptop for programming under ₹60000',
    'Apple smartwatch with health and sleep tracking',
    'Smartphones under ₹50000 with fast charging and great camera',
    'Budget boAt earphones below ₹2000',
  ];

  const executeSearch = async (textToSearch) => {
    const q = (textToSearch || queryInput).trim();
    if (!q) return;

    try {
      setLoading(true);
      setSearchParams({ q });

      const res = await api.post('/ai/search', { query: q });
      if (res.data.success) {
        setStructuredData(res.data.data.structuredFilters);
        setProducts(res.data.data.products || []);
      }
    } catch (err) {
      console.error('[AI Search Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSearch();
  };

  return (
    <div className="container" style={{ padding: '24px 0 80px', maxWidth: '1100px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div
          className="badge badge-ai"
          style={{
            padding: '6px 16px',
            fontSize: '0.82rem',
            marginBottom: '14px',
          }}
        >
          <Sparkles size={15} /> Natural Language Query Understanding
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
          Natural Language AI Product Search
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
          Type any shopping query in plain English. The AI extracts structured filters (category, budget limits, features) and queries the real catalog.
        </p>
      </div>

      {/* Query Search Bar */}
      <div
        className="card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          marginBottom: '32px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search
              size={20}
              color="var(--primary)"
              style={{ position: 'absolute', left: '16px', pointerEvents: 'none' }}
            />
            <input
              type="text"
              placeholder="e.g. 'Show me wireless headphones under ₹5000 with good battery life'"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="form-control"
              style={{
                paddingLeft: '48px',
                paddingRight: '16px',
                height: '52px',
                fontSize: '1rem',
                borderRadius: 'var(--radius-md)',
              }}
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ padding: '0 28px' }}>
            <Sparkles size={18} /> Parse & Search
          </button>
        </form>

        {/* Quick Sample Query Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginTop: '16px',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Examples:</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryInput(q);
                executeSearch(q);
              }}
              style={{
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 12px',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              "{q}"
            </button>
          ))}
        </div>
      </div>

      {/* Structured Query Parser Visualizer */}
      {structuredData && (
        <div
          className="card"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '36px',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Sliders size={18} color="var(--primary)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Extracted Structured Query Breakdown
            </h4>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
            }}
          >
            {/* Category */}
            <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Detected Category
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--primary)' }}>
                {structuredData.category || 'Any'}
              </strong>
            </div>

            {/* Budget Max */}
            <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Maximum Budget Limit
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--accent-green)' }}>
                {structuredData.maxPrice ? `₹${structuredData.maxPrice.toLocaleString('en-IN')}` : 'No limit specified'}
              </strong>
            </div>

            {/* Brand */}
            <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Preferred Brand
              </span>
              <strong style={{ fontSize: '1.05rem', color: 'var(--accent-orange)' }}>
                {structuredData.brand || 'Any Brand'}
              </strong>
            </div>

            {/* Identified Features */}
            <div style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                Extracted Requirements
              </span>
              <strong style={{ fontSize: '0.95rem', color: 'var(--primary)' }}>
                {structuredData.identifiedFeatures && structuredData.identifiedFeatures.length > 0
                  ? structuredData.identifiedFeatures.join(', ')
                  : 'General Search'}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
          Matching Products ({products.length})
        </h3>
      </div>

      {/* Products Grid */}
      {loading ? (
        <LoadingSpinner text="Querying database with AI filters..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products matched these requirements"
          description="Try relaxing your budget or searching for another category like Laptops, Smartphones, or Audio."
          actionText="Browse All Products"
          actionLink="/products"
        />
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AISearch;
