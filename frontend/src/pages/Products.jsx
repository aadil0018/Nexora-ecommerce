import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, X, Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import api from '../services/api';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filter States from URL or defaults
  const search = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedBrand = searchParams.get('brand') || 'All';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const minRating = searchParams.get('rating') || '';
  const inStock = searchParams.get('inStock') === 'true';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page'), 10) || 1;

  // Local inputs for price range to avoid premature refetching
  const [priceRange, setPriceRange] = useState({ min: minPrice, max: maxPrice });
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Load available categories and brands on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await api.get('/products/categories');
        if (res.data.success) {
          setCategories(res.data.categories);
          setBrands(res.data.brands);
        }
      } catch (err) {
        console.error('[Products Error] Failed to fetch filter metadata:', err.message);
      }
    };
    fetchMeta();
  }, []);

  // Fetch products whenever searchParams change
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(searchParams);
      if (!params.get('limit')) params.set('limit', '12');

      const res = await api.get(`/products?${params.toString()}`);
      if (res.data.success) {
        setProducts(res.data.products);
        setTotalProducts(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      console.error('[Products Error] Failed to fetch products:', err.message);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Update query params helper
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'All' && value !== '') {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setPriceRange({ min: '', max: '' });
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (priceRange.min) newParams.set('minPrice', priceRange.min);
    else newParams.delete('minPrice');

    if (priceRange.max) newParams.set('maxPrice', priceRange.max);
    else newParams.delete('maxPrice');

    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('page', newPage.toString());
      setSearchParams(newParams);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const activeFilterCount =
    (selectedCategory !== 'All' ? 1 : 0) +
    (selectedBrand !== 'All' ? 1 : 0) +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (minRating ? 1 : 0) +
    (inStock ? 1 : 0) +
    (search ? 1 : 0);

  return (
    <div className="container" style={{ paddingBottom: '60px', marginTop: '24px' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Product Catalog</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Showing {totalProducts} verified electronics
            {search && ` matching "${search}"`}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mobile Filter Trigger */}
          <button
            onClick={() => setMobileFilterOpen((prev) => !prev)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'none' }}
            id="mobile-filter-btn"
          >
            <Filter size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              value={sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="form-control"
              style={{
                width: 'auto',
                padding: '8px 14px',
                fontSize: '0.85rem',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating-desc">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilterCount > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '24px',
          }}
        >
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active filters:</span>
          {search && (
            <span className="badge badge-primary" style={{ textTransform: 'none' }}>
              Search: "{search}"
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('search', '')} />
            </span>
          )}
          {selectedCategory !== 'All' && (
            <span className="badge badge-primary">
              Category: {selectedCategory}
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('category', 'All')} />
            </span>
          )}
          {selectedBrand !== 'All' && (
            <span className="badge badge-primary">
              Brand: {selectedBrand}
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('brand', 'All')} />
            </span>
          )}
          {minPrice && (
            <span className="badge badge-primary">
              Min ₹{minPrice}
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('minPrice', '')} />
            </span>
          )}
          {maxPrice && (
            <span className="badge badge-primary">
              Max ₹{maxPrice}
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('maxPrice', '')} />
            </span>
          )}
          {minRating && (
            <span className="badge badge-primary">
              {minRating}★ & above
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('rating', '')} />
            </span>
          )}
          {inStock && (
            <span className="badge badge-primary">
              In Stock
              <X size={14} style={{ cursor: 'pointer', marginLeft: '4px' }} onClick={() => updateFilter('inStock', '')} />
            </span>
          )}
          <button
            onClick={clearAllFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-red)',
              fontSize: '0.82rem',
              cursor: 'pointer',
              marginLeft: '6px',
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Main Layout: Filter Sidebar + Products Grid */}
      <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
        {/* Filter Sidebar Desktop */}
        <aside
          className={`card products-sidebar ${mobileFilterOpen ? 'mobile-open' : ''}`}
          style={{
            width: '280px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            flexShrink: 0,
            position: 'sticky',
            top: '96px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <SlidersHorizontal size={18} color="var(--primary)" /> Filters
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Reset
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === 'All'}
                  onChange={() => updateFilter('category', 'All')}
                />
                All Categories
              </label>
              {categories.map((c) => (
                <label
                  key={c.name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    color: selectedCategory === c.name ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: selectedCategory === c.name ? 600 : 400,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === c.name}
                      onChange={() => updateFilter('category', c.name)}
                    />
                    {c.name}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({c.count})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Price Range (₹)
            </h4>
            <form onSubmit={handlePriceApply} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((p) => ({ ...p, min: e.target.value }))}
                  className="form-control"
                  style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((p) => ({ ...p, max: e.target.value }))}
                  className="form-control"
                  style={{ padding: '8px 10px', fontSize: '0.85rem' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                Apply Price
              </button>
            </form>
          </div>

          {/* Brand Filter */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Brand
            </h4>
            <select
              value={selectedBrand}
              onChange={(e) => updateFilter('brand', e.target.value)}
              className="form-control"
              style={{ fontSize: '0.88rem' }}
            >
              <option value="All">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Minimum Rating
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[4, 3, 2].map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="rating"
                    checked={minRating === r.toString()}
                    onChange={() => updateFilter('rating', r.toString())}
                  />
                  <span>{r}★ & above</span>
                </label>
              ))}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="rating"
                  checked={minRating === ''}
                  onChange={() => updateFilter('rating', '')}
                />
                <span>All Ratings</span>
              </label>
            </div>
          </div>

          {/* Stock Toggle */}
          <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.88rem',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => updateFilter('inStock', e.target.checked ? 'true' : '')}
              />
              In Stock Only
            </label>
          </div>
        </aside>

        {/* Products Grid Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <LoadingSpinner text="Searching products..." />
          ) : products.length === 0 ? (
            <EmptyState
              title="No products match your criteria"
              description="Try adjusting your filters, price range, or searching with broader keywords."
              actionText="Reset All Filters"
              actionLink="/products"
            />
          ) : (
            <>
              <div className="product-grid">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '40px',
                  }}
                >
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="btn btn-secondary btn-sm"
                  >
                    <ChevronLeft size={16} /> Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: page === p ? 'var(--primary)' : 'var(--border-subtle)',
                        background: page === p ? 'var(--primary)' : 'transparent',
                        color: page === p ? '#fff' : 'var(--text-secondary)',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="btn btn-secondary btn-sm"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          #mobile-filter-btn {
            display: inline-flex !important;
          }
          .products-sidebar {
            display: none !important;
          }
          .products-sidebar.mobile-open {
            display: flex !important;
            position: fixed !important;
            top: 80px !important;
            left: 16px !important;
            right: 16px !important;
            width: auto !important;
            z-index: 99 !important;
            max-height: 80vh !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Products;
