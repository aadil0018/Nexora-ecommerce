import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Sliders,
  Sparkles,
  X,
  Plus,
  CheckCircle,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import RatingStars from '../components/RatingStars';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import FormattedAIMessage from '../components/FormattedAIMessage';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ProductComparison = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState('');

  // Initial load: fetch all products for the dropdown picker
  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await api.get('/products?limit=50');
        if (res.data.success) {
          setAvailableProducts(res.data.products);

          // Check if 'add' query param exists
          const addId = searchParams.get('add');
          const idsParam = searchParams.get('ids');

          let initial = [];
          if (idsParam) {
            initial = idsParam.split(',').filter(Boolean);
          } else if (addId) {
            initial = [addId];
            // pick a second product from same category if possible
            const current = res.data.products.find((p) => p._id === addId);
            if (current) {
              const alternative = res.data.products.find(
                (p) => p._id !== addId && p.category === current.category
              );
              if (alternative) initial.push(alternative._id);
            }
          } else if (res.data.products.length >= 2) {
            // default pick first two laptops or smartphones
            initial = [res.data.products[0]._id, res.data.products[1]._id];
          }

          setSelectedProductIds(initial);
        }
      } catch (err) {
        console.error('[Compare Catalog Error]:', err.message);
      }
    };

    fetchCatalog();
  }, [searchParams]);

  // Whenever selectedProductIds changes and has >= 2 items, fetch comparison matrix & AI verdict
  useEffect(() => {
    if (selectedProductIds.length >= 2) {
      const fetchComparison = async () => {
        try {
          setLoading(true);
          const res = await api.post('/ai/compare', {
            productIds: selectedProductIds,
          });
          if (res.data.success) {
            setComparisonData(res.data.data);
          }
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchComparison();
    } else {
      setComparisonData(null);
    }
  }, [selectedProductIds]);

  const addProductToCompare = (productId) => {
    if (!productId) return;
    if (selectedProductIds.includes(productId)) {
      showToast('Product already in comparison', 'info');
      return;
    }
    if (selectedProductIds.length >= 3) {
      showToast('You can compare a maximum of 3 products at a time', 'info');
      return;
    }
    const updated = [...selectedProductIds, productId];
    setSelectedProductIds(updated);
    setAddingId('');
  };

  const removeProductFromCompare = (productId) => {
    setSelectedProductIds((prev) => prev.filter((id) => id !== productId));
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1);
      showToast(`Added ${product.name} to cart!`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="container" style={{ padding: '24px 0 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-primary" style={{ marginBottom: '12px' }}>
          <Sliders size={14} /> Side-by-Side Specs Matrix
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>
          AI-Powered Product Comparison
        </h1>
        <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
          Select 2 to 3 products to compare specs, prices, ratings, and read an AI-generated trade-off analysis explaining which device wins for your use case.
        </p>
      </div>

      {/* Product Selector Bar */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>
            Comparing ({selectedProductIds.length}/3 products):
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {selectedProductIds.map((id) => {
              const p = availableProducts.find((item) => item._id === id);
              return (
                <span key={id} className="badge badge-primary" style={{ padding: '6px 12px' }}>
                  {p ? p.name.slice(0, 26) + '...' : id}
                  <X
                    size={14}
                    style={{ cursor: 'pointer', marginLeft: '6px' }}
                    onClick={() => removeProductFromCompare(id)}
                  />
                </span>
              );
            })}
          </div>
        </div>

        {selectedProductIds.length < 3 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={addingId}
              onChange={(e) => setAddingId(e.target.value)}
              className="form-control"
              style={{ width: '280px', fontSize: '0.85rem' }}
            >
              <option value="">+ Add product to comparison...</option>
              {availableProducts
                .filter((p) => !selectedProductIds.includes(p._id))
                .map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} (₹{p.price.toLocaleString('en-IN')})
                  </option>
                ))}
            </select>
            <button
              type="button"
              disabled={!addingId}
              onClick={() => addProductToCompare(addingId)}
              className="btn btn-primary btn-sm"
            >
              <Plus size={16} /> Add
            </button>
          </div>
        )}
      </div>

      {/* Comparison Matrix & AI Verdict */}
      {selectedProductIds.length < 2 ? (
        <EmptyState
          icon={Sliders}
          title="Please select at least 2 products"
          description="Pick 2 or 3 products above to generate an instant comparative table and AI analysis."
          actionText=""
          actionLink=""
        />
      ) : loading ? (
        <LoadingSpinner text="Generating technical comparison matrix and AI verdict..." />
      ) : comparisonData ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '36px' }}>
          {/* AI VERDICT SUMMARY CARD */}
          <div
            className="card"
            style={{
              padding: '32px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  AI Trade-Off Analysis & Recommendations
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Grounded comparison of performance, pricing value, and user sentiment
                </p>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.95rem',
                lineHeight: 1.7,
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <FormattedAIMessage content={comparisonData.verdictSummary} />
            </div>
          </div>

          {/* SIDE-BY-SIDE MATRIX TABLE */}
          <div
            className="card"
            style={{
              overflowX: 'auto',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '20px', width: '220px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Features & Specifications
                  </th>
                  {comparisonData.products.map((p) => (
                    <th key={p._id} style={{ padding: '20px', minWidth: '240px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: 'var(--radius-md)', background: 'var(--bg-inset)' }}
                        />
                        <Link to={`/products/${p._id}`} style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {p.name}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                            ₹{p.price.toLocaleString('en-IN')}
                          </span>
                          {p.discount > 0 && (
                            <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                              {p.discount}% OFF
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="btn btn-primary btn-sm"
                          style={{ width: '100%', marginTop: '4px' }}
                        >
                          <ShoppingBag size={15} /> Add to Cart
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Brand */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Brand</td>
                  {comparisonData.products.map((p) => (
                    <td key={p._id} style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>{p.brand}</td>
                  ))}
                </tr>

                {/* Rating */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface-elevated)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Customer Rating</td>
                  {comparisonData.products.map((p) => (
                    <td key={p._id} style={{ padding: '14px 20px' }}>
                      <RatingStars rating={p.rating} numReviews={p.numReviews} size={15} />
                    </td>
                  ))}
                </tr>

                {/* Stock */}
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>Availability</td>
                  {comparisonData.products.map((p) => (
                    <td key={p._id} style={{ padding: '14px 20px' }}>
                      {p.stock > 0 ? (
                        <span className="badge badge-success">In Stock ({p.stock})</span>
                      ) : (
                        <span className="badge badge-danger">Out of Stock</span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Dynamic Spec Rows */}
                {comparisonData.comparisonMatrix.map((row, idx) => (
                  <tr
                    key={row.specKey}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'var(--bg-surface-elevated)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {row.specKey}
                    </td>
                    {comparisonData.products.map((p) => (
                      <td key={p._id} style={{ padding: '14px 20px', color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                        {row[p._id.toString()] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProductComparison;
