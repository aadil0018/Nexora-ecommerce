import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ProductModal = ({ isOpen, onClose, product, onSave }) => {
  const { showToast } = useToast();
  const isEdit = Boolean(product && product._id);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'Laptops',
    price: '',
    discount: 0,
    stock: 10,
    description: '',
    images: '',
    features: '',
  });

  const [specs, setSpecs] = useState([{ key: '', value: '' }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        brand: product.brand || '',
        category: product.category || 'Laptops',
        price: product.price || '',
        discount: product.discount || 0,
        stock: product.stock !== undefined ? product.stock : 10,
        description: product.description || '',
        images: Array.isArray(product.images) ? product.images.join('\n') : '',
        features: Array.isArray(product.features) ? product.features.join('\n') : '',
      });

      if (product.specifications) {
        const specEntries = Object.entries(product.specifications).map(([key, value]) => ({
          key,
          value,
        }));
        setSpecs(specEntries.length > 0 ? specEntries : [{ key: '', value: '' }]);
      } else {
        setSpecs([{ key: '', value: '' }]);
      }
    } else {
      setFormData({
        name: '',
        brand: '',
        category: 'Laptops',
        price: '',
        discount: 0,
        stock: 10,
        description: '',
        images: '',
        features: '',
      });
      setSpecs([{ key: '', value: '' }]);
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleSpecChange = (index, field, val) => {
    setSpecs((prev) => {
      const copy = [...prev];
      copy[index][field] = val;
      return copy;
    });
  };

  const addSpecRow = () => {
    setSpecs((prev) => [...prev, { key: '', value: '' }]);
  };

  const removeSpecRow = (index) => {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.brand || !formData.price || !formData.description) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const specificationsObj = {};
    specs.forEach((s) => {
      if (s.key.trim() && s.value.trim()) {
        specificationsObj[s.key.trim()] = s.value.trim();
      }
    });

    const payload = {
      name: formData.name.trim(),
      brand: formData.brand.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      discount: Number(formData.discount) || 0,
      stock: Number(formData.stock) || 0,
      description: formData.description.trim(),
      images: formData.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      features: formData.features
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      specifications: specificationsObj,
    };

    try {
      setSaving(true);
      if (isEdit) {
        await api.put(`/products/${product._id}`, payload);
        showToast('Product updated successfully');
      } else {
        await api.post('/products', payload);
        showToast('New product created successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '32px',
          borderRadius: 'var(--radius-xl)',
          position: 'relative',
          background: 'var(--bg-surface)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
          {isEdit ? 'Edit Product Hardware' : 'Add New Hardware to Catalog'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="form-control"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Brand *</label>
              <input
                type="text"
                placeholder="e.g. Apple, Sony, ASUS"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-control"
              >
                <option value="Laptops">Laptops</option>
                <option value="Smartphones">Smartphones</option>
                <option value="Audio">Audio & Headphones</option>
                <option value="Wearables">Wearables & Watches</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="90"
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity *</label>
              <input
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                required
                className="form-control"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Image URLs (one per line)</label>
            <textarea
              rows="2"
              placeholder="https://images.unsplash.com/..."
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              className="form-control"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Key Features (one per line)</label>
            <textarea
              rows="2"
              placeholder="144Hz high refresh rate screen&#10;RGB backlit gaming keyboard"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              className="form-control"
            />
          </div>

          {/* Specifications Key-Value rows */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Technical Specifications Sheet</label>
              <button
                type="button"
                onClick={addSpecRow}
                className="btn btn-secondary btn-sm"
                style={{ fontSize: '0.75rem', padding: '4px 8px' }}
              >
                <Plus size={12} /> Add Spec Field
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {specs.map((s, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Spec Name (e.g. RAM)"
                    value={s.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="form-control"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. 16GB DDR5)"
                    value={s.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="form-control"
                    style={{ flex: 2, padding: '8px 12px', fontSize: '0.85rem' }}
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSpecRow(idx)}
                      style={{ background: 'none', border: 'none', color: '#fb7185', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={16} />
              {saving ? 'Saving Product...' : isEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
