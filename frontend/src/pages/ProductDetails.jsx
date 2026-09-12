import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  CheckCircle,
  Clock,
  Shield,
  Truck,
  ArrowRightLeft,
  Send,
  MessageSquare,
  ThumbsUp,
  Minus,
  Plus,
} from 'lucide-react';
import RatingStars from '../components/RatingStars';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, toggleWishlist, recordView } = useAuth();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [sentimentSummary, setSentimentSummary] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Review Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        // Record viewing in user browsing history
        recordView(id);

        const res = await api.get(`/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.product);
          setReviews(res.data.reviews || []);

          // Fetch AI Sentiment summary
          try {
            const sentRes = await api.post('/ai/sentiment', { productId: id });
            if (sentRes.data.success) {
              setSentimentSummary(sentRes.data.data);
            }
          } catch (sentErr) {
            console.warn('[Sentiment Error]:', sentErr.message);
          }

          // Fetch similar products in same category
          try {
            const simRes = await api.get(
              `/products?category=${res.data.product.category}&limit=4`
            );
            if (simRes.data.success) {
              setSimilarProducts(
                simRes.data.products.filter((p) => p._id !== id)
              );
            }
          } catch (simErr) {
            console.warn('[Similar Products Error]:', simErr.message);
          }
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
    window.scrollTo(0, 0);
  }, [id, recordView]);

  const handleAddToCart = async () => {
    if (!user) {
      showToast('Please sign in to add items to your cart', 'info');
      navigate('/login');
      return;
    }
    if (product.stock < quantity) {
      showToast(`Only ${product.stock} items remaining in stock`, 'error');
      return;
    }
    try {
      setIsAddingToCart(true);
      await addToCart(product._id, quantity);
      showToast(`Added ${quantity} x ${product.name} to your cart!`);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleWishlistToggle = async () => {
    if (!user) {
      showToast('Please sign in to save items to your wishlist', 'info');
      navigate('/login');
      return;
    }
    try {
      const msg = await toggleWishlist(product._id);
      showToast(msg || 'Wishlist updated');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to submit a review', 'info');
      navigate('/login');
      return;
    }
    if (!newComment.trim()) {
      showToast('Please write a comment for your review', 'error');
      return;
    }

    try {
      setSubmittingReview(true);
      const res = await api.post('/reviews', {
        productId: id,
        rating: newRating,
        comment: newComment.trim(),
      });

      if (res.data.success) {
        showToast('Review submitted and classified by AI sentiment engine!');
        setReviews((prev) => [res.data.review, ...prev.filter(r => r.user?._id !== user._id)]);
        setNewComment('');

        // Refresh sentiment summary
        const sentRes = await api.post('/ai/sentiment', { productId: id });
        if (sentRes.data.success) {
          setSentimentSummary(sentRes.data.data);
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <LoadingSpinner text="Fetching product details..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Product Not Found</h2>
        <Link to="/products" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Back to Catalog
        </Link>
      </div>
    );
  }

  const isInWishlist = user?.wishlist?.some(
    (item) => (item._id || item) === product._id
  );

  const discountedPrice =
    product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'];

  return (
    <div className="container" style={{ paddingBottom: '80px', marginTop: '24px' }}>
      {/* Back breadcrumb */}
      <div style={{ marginBottom: '20px' }}>
        <Link
          to="/products"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--text-secondary)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} /> Back to Catalog
        </Link>
      </div>

      {/* Main Product Presentation Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '40px',
          alignItems: 'flex-start',
        }}
      >
        {/* Gallery */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className="card"
            style={{
              position: 'relative',
              width: '100%',
              paddingTop: '80%',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-inset)',
            }}
          >
            <img
              src={images[selectedImage]}
              alt={product.name}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
            {product.discount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: 'var(--accent-red)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                {product.discount}% OFF
              </span>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '12px' }}>
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: selectedImage === idx ? 'var(--primary)' : 'var(--border-subtle)',
                    background: 'var(--bg-inset)',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="badge badge-primary">{product.category}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Brand: {product.brand}
              </span>
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.3 }}>
              {product.name}
            </h1>
          </div>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RatingStars rating={product.rating} numReviews={product.numReviews} size={18} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>|</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
              Verified Buyer Sentiment
            </span>
          </div>

          {/* Price Box */}
          <div
            className="card"
            style={{
              padding: '20px',
              display: 'flex',
              alignItems: 'baseline',
              gap: '16px',
            }}
          >
            <span
              style={{
                fontSize: '2.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            >
              ₹{discountedPrice.toLocaleString('en-IN')}
            </span>
            {product.discount > 0 && (
              <span
                style={{
                  fontSize: '1.2rem',
                  color: 'var(--text-muted)',
                  textDecoration: 'line-through',
                }}
              >
                ₹{product.price.toLocaleString('en-IN')}
              </span>
            )}

            <div style={{ marginLeft: 'auto' }}>
              {product.stock > 0 ? (
                <span className="badge badge-success">In Stock ({product.stock} units)</span>
              ) : (
                <span className="badge badge-danger">Out of Stock</span>
              )}
            </div>
          </div>

          {/* Short Description */}
          <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {product.description}
          </p>

          {/* Purchase Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Quantity Stepper */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '4px',
                }}
              >
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ width: '40px', textAlign: 'center', fontWeight: 700 }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.stock <= 0}
                className="btn btn-primary btn-lg"
                style={{ flex: 1 }}
              >
                <ShoppingBag size={18} />
                {product.stock <= 0
                  ? 'Out of Stock'
                  : isAddingToCart
                  ? 'Adding...'
                  : `Add to Cart • ₹${(discountedPrice * quantity).toLocaleString('en-IN')}`}
              </button>

              {/* Wishlist Button */}
              <button
                onClick={handleWishlistToggle}
                className="btn btn-secondary"
                style={{
                  width: '50px',
                  height: '50px',
                  padding: 0,
                  borderRadius: 'var(--radius-md)',
                  color: isInWishlist ? '#f43f5e' : 'var(--text-primary)',
                }}
                title={isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
              >
                <Heart size={20} fill={isInWishlist ? '#f43f5e' : 'none'} />
              </button>

              {/* Compare Button */}
              <button
                onClick={() => navigate(`/compare?add=${product._id}`)}
                className="btn btn-secondary"
                style={{
                  width: '50px',
                  height: '50px',
                  padding: 0,
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--primary)',
                }}
                title="Compare with another device"
              >
                <ArrowRightLeft size={18} />
              </button>
            </div>
          </div>

          {/* Guarantees Box */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck size={18} color="var(--primary)" /> Express Delivery
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} color="#10b981" /> 1 Year Warranty
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#f59e0b" /> 7 Days Replacement
            </div>
          </div>
        </div>
      </div>

      {/* Specifications & Features Tabs */}
      <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Key Features */}
        {product.features && product.features.length > 0 && (
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px' }}>
              Key Highlights & Features
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {product.features.map((feature, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Specifications Sheet Table */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div className="card" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '20px' }}>
              Technical Specifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              {Object.entries(product.specifications).map(([key, val], idx) => (
                <div
                  key={key}
                  style={{
                    display: 'flex',
                    padding: '12px 18px',
                    background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.05)',
                    borderBottom: idx !== Object.keys(product.specifications).length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    fontSize: '0.9rem',
                  }}
                >
                  <span style={{ width: '220px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {key}
                  </span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI REVIEW SENTIMENT ANALYSIS SECTION */}
        <div
          className="card"
          style={{
            padding: '36px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                AI Review Sentiment Analysis
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Automated NLP classification of customer feedback and satisfaction breakdown
              </p>
            </div>
          </div>

          {/* Sentiment Summary Meters */}
          {sentimentSummary && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '24px',
                padding: '24px',
                background: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '32px',
              }}
            >
              <div>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Total Analyzed Reviews
                </span>
                <h4 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {sentimentSummary.totalReviews}
                </h4>
                <p style={{ fontSize: '0.88rem', color: 'var(--primary)', marginTop: '6px' }}>
                  {sentimentSummary.overallVerdict}
                </p>
              </div>

              {/* Progress Breakdown Bars */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                {/* Positive */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#34d399', fontWeight: 600 }}>Positive Sentiment</span>
                    <span>{sentimentSummary.percentages.positive}% ({sentimentSummary.breakdown.positive})</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${sentimentSummary.percentages.positive}%`, height: '100%', background: '#10b981' }} />
                  </div>
                </div>

                {/* Neutral */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>Neutral Sentiment</span>
                    <span>{sentimentSummary.percentages.neutral}% ({sentimentSummary.breakdown.neutral})</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${sentimentSummary.percentages.neutral}%`, height: '100%', background: '#f59e0b' }} />
                  </div>
                </div>

                {/* Negative */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>Negative Sentiment</span>
                    <span>{sentimentSummary.percentages.negative}% ({sentimentSummary.breakdown.negative})</span>
                  </div>
                  <div style={{ height: '8px', borderRadius: '4px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                    <div style={{ width: `${sentimentSummary.percentages.negative}%`, height: '100%', background: '#f43f5e' }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Write a Review Form */}
          <form
            onSubmit={handleReviewSubmit}
            style={{
              padding: '24px',
              background: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '36px',
            }}
          >
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px' }}>
              Write a Review & Get Instant AI Sentiment Rating
            </h4>

            <div style={{ marginBottom: '14px' }}>
              <label className="form-label" style={{ display: 'block', marginBottom: '6px' }}>
                Your Rating:
              </label>
              <RatingStars
                rating={newRating}
                interactive={true}
                onSelect={(val) => setNewRating(val)}
                size={22}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Review Comment</label>
              <textarea
                rows="3"
                placeholder="Share your experience (e.g. 'Battery life is exceptional, display is crystal clear!')..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="form-control"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="btn btn-ai btn-sm"
              style={{ marginTop: '8px' }}
            >
              <Send size={15} />
              {submittingReview ? 'Analyzing & Posting...' : 'Submit Review'}
            </button>
          </form>

          {/* Customer Reviews List */}
          <div>
            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px' }}>
              Customer Reviews ({reviews.length})
            </h4>

            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                No customer reviews yet. Be the first to share your thoughts!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((rev) => (
                  <div
                    key={rev._id}
                    style={{
                      padding: '18px 20px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {rev.user?.name || 'Verified Customer'}
                        </span>
                        <RatingStars rating={rev.rating} size={14} />
                      </div>

                      {/* AI Sentiment Badge */}
                      {rev.sentiment && (
                        <span
                          className={`badge ${
                            rev.sentiment === 'positive'
                              ? 'badge-success'
                              : rev.sentiment === 'negative'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          AI Sentiment: {rev.sentiment}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {rev.comment}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
                      Posted on {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Similar Products Carousel / Rail */}
        {similarProducts.length > 0 && (
          <div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '20px' }}>
              Similar Products You Might Like
            </h3>
            <div className="product-grid">
              {similarProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetails;
