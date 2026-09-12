import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Edit2, Trash2, Search, Filter, AlertCircle } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProductModal from './ProductModal';
import RatingStars from '../../components/RatingStars';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ManageProducts = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([]);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let url = `/products?limit=100`;
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      if (categoryFilter !== 'All') url += `&category=${encodeURIComponent(categoryFilter)}`;

      const res = await api.get(url);
      if (res.data.success) {
        setProducts(res.data.products);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, categoryFilter, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await api.get('/products/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
        }
      } catch (err) {
        // ignore
      }
    };
    fetchCats();
  }, []);

  const handleEdit = (prod) => {
    setEditingProduct(prod);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setModalOpen(true);
  };

  const handleDelete = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
      try {
        const res = await api.delete(`/products/${productId}`);
        if (res.data.success) {
          showToast('Product deleted successfully');
          fetchProducts();
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="container" style={{ padding: '32px 0 80px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <AdminSidebar />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage Hardware Inventory</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Add, update, or remove electronics in the catalog ({products.length} products).
            </p>
          </div>
          <button onClick={handleCreate} className="btn btn-primary">
            <Plus size={18} /> Add New Product
          </button>
        </div>

        {/* Filter / Search Bar */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
          <div style={{ flex: 1, minWidth: '220px', position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
            <input
              type="text"
              placeholder="Filter by name, brand, or specs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '40px', height: '40px', fontSize: '0.88rem' }}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-control"
            style={{ width: 'auto', minWidth: '180px', height: '40px', fontSize: '0.88rem' }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.count})
              </option>
            ))}
          </select>
        </div>

        {/* Inventory Table */}
        {loading ? (
          <LoadingSpinner text="Loading inventory records..." />
        ) : (
          <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Product</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Category & Brand</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Price (₹)</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Stock</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Rating</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p, idx) => (
                  <tr
                    key={p._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                          alt=""
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', background: 'var(--bg-inset)' }}
                        />
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                            {p.name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ID: {p._id.slice(-6)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                        {p.category}
                      </span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {p.brand}
                      </div>
                    </td>

                    <td style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--primary)' }}>
                      ₹{p.price.toLocaleString('en-IN')}
                      {p.discount > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                          -{p.discount}%
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      {p.stock > 0 ? (
                        <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                          {p.stock} in stock
                        </span>
                      ) : (
                        <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                          Out of Stock
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 20px' }}>
                      <RatingStars rating={p.rating} numReviews={p.numReviews} size={14} />
                    </td>

                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleEdit(p)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Edit product"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.name)}
                          className="btn btn-danger btn-sm"
                          style={{ padding: '6px 10px' }}
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        product={editingProduct}
        onSave={fetchProducts}
      />
    </div>
  );
};

export default ManageProducts;
