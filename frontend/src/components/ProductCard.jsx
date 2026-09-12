import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRightLeft } from 'lucide-react';
import RatingStars from './RatingStars';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

const ProductCard = ({ product }) => {
  const { user, toggleWishlist } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isAdding, setIsAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const isInWishlist = user?.wishlist?.some(
    (item) => (item._id || item) === product._id
  );

  const discountedPrice =
    product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to save items', 'info');
      navigate('/login');
      return;
    }
    try {
      setWishlistLoading(true);
      const msg = await toggleWishlist(product._id);
      showToast(msg || 'Wishlist updated');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      showToast('Please sign in to add items to cart', 'info');
      navigate('/login');
      return;
    }
    if (product.stock <= 0) {
      showToast('This item is currently out of stock', 'error');
      return;
    }
    try {
      setIsAdding(true);
      await addToCart(product._id, 1);
      showToast(`Added to cart!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuickCompare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/compare?add=${product._id}`);
  };

  const mainImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        boxShadow: hovered ? 'var(--card-hover-shadow)' : 'var(--shadow-xs)',
        borderColor: hovered ? 'var(--border-main)' : 'var(--card-border)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* Image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: '75%',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-inset)',
        }}
      >
        <img
          src={mainImage}
          alt={product.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.35s ease',
            transform: hovered ? 'scale(1.04)' : 'scale(1)',
          }}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Discount Badge */}
        {product.discount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: 'var(--accent-red)',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.7rem',
              fontWeight: 700,
            }}
          >
            -{product.discount}%
          </span>
        )}

        {/* Hover Action Buttons */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateX(0)' : 'translateX(8px)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <button
            onClick={handleWishlist}
            disabled={wishlistLoading}
            title={isInWishlist ? 'Remove from Wishlist' : 'Save to Wishlist'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isInWishlist ? 'var(--accent-red)' : 'var(--text-secondary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <Heart size={16} fill={isInWishlist ? 'var(--accent-red)' : 'none'} />
          </button>

          <button
            onClick={handleQuickCompare}
            title="Compare"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <ArrowRightLeft size={15} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1, gap: '6px' }}>
        {/* Brand & Category */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.7rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <span>{product.brand}</span>
          <span
            style={{
              background: 'var(--bg-surface-elevated)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-secondary)',
            }}
          >
            {product.category}
          </span>
        </div>

        {/* Title */}
        <h4
          style={{
            fontSize: '0.9rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.4em',
          }}
        >
          {product.name}
        </h4>

        {/* Rating */}
        <RatingStars rating={product.rating} numReviews={product.numReviews} size={14} />

        {/* Price Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            marginTop: 'auto',
            paddingTop: '6px',
          }}
        >
          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            ₹{discountedPrice.toLocaleString('en-IN')}
          </span>
          {product.discount > 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          )}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: product.stock > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
            }}
          >
            {product.stock > 0 ? `In Stock` : 'Out of Stock'}
          </span>
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={isAdding || product.stock <= 0}
          className="btn btn-primary btn-sm"
          style={{
            width: '100%',
            marginTop: '8px',
            background: product.stock <= 0 ? 'var(--bg-surface-hover)' : undefined,
            color: product.stock <= 0 ? 'var(--text-muted)' : undefined,
            borderColor: product.stock <= 0 ? 'var(--border-main)' : undefined,
          }}
        >
          <ShoppingBag size={15} />
          {product.stock <= 0 ? 'Sold Out' : isAdding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
