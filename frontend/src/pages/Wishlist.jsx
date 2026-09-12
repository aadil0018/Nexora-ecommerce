import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Wishlist = () => {
  const { user } = useAuth();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlist = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await api.get('/auth/profile');
        if (res.data.success && res.data.user.wishlist) {
          setWishlistProducts(res.data.user.wishlist);
        }
      } catch (err) {
        console.error('[Wishlist Error]:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWishlist();
  }, [user]);

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <EmptyState
          icon={Heart}
          title="Sign in to view your wishlist"
          description="Save all your favorite electronics in one place."
          actionText="Sign In"
          actionLink="/login"
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 0 80px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>My Wishlist</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {wishlistProducts.length} saved electronics
        </p>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching wishlist items..." />
      ) : wishlistProducts.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Browse our catalog and click the heart icon on any device to save it for later."
          actionText="Discover Products"
          actionLink="/products"
        />
      ) : (
        <div className="product-grid">
          {wishlistProducts.map((prod) => (
            <ProductCard key={prod._id || prod} product={prod} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
