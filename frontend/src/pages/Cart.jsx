import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ShieldCheck } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const Cart = () => {
  const { cart, updateQty, removeFromCart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <EmptyState
          icon={ShoppingBag}
          title="Sign in to view your shopping cart"
          description="Your cart items are securely saved to your account across all your devices."
          actionText="Sign In Now"
          actionLink="/login"
        />
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <EmptyState
          icon={ShoppingBag}
          title="Your shopping cart is empty"
          description="Explore our collection of laptops, smartphones, and audio gear, or check your past and cancelled orders to reorder items."
          actionText="Explore Products"
          actionLink="/products"
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px' }}>
          <Link to="/orders" className="btn btn-secondary btn-sm">
            View Past & Cancelled Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Shopping Cart</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Looking for items from a cancelled order? <Link to="/orders" style={{ color: 'var(--primary)', fontWeight: 600 }}>Check Order History</Link>
          </p>
        </div>
        <button
          onClick={clearCart}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-red)',
            fontSize: '0.88rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          Clear All Items
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '36px',
          alignItems: 'flex-start',
        }}
      >
        {/* Cart Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', gridColumn: 'span 2' }}>
          {cart.items.map((item) => {
            const product = item.product;
            if (!product) return null;

            return (
              <div
                key={item._id}
                className="card"
                style={{
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  flexWrap: 'wrap',
                }}
              >
                {/* Image */}
                <img
                  src={
                    product.images && product.images.length > 0
                      ? product.images[0]
                      : 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80'
                  }
                  alt={product.name}
                  style={{
                    width: '90px',
                    height: '90px',
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-inset)',
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                    {product.brand}
                  </span>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 6px' }}>
                    <Link to={`/products/${product._id}`}>{product.name}</Link>
                  </h4>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2px',
                  }}
                >
                  <button
                    onClick={() => updateQty(item._id, Math.max(1, item.qty - 1))}
                    style={{
                      width: '30px',
                      height: '30px',
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
                  <span style={{ width: '36px', textAlign: 'center', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item._id, item.qty + 1)}
                    style={{
                      width: '30px',
                      height: '30px',
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

                {/* Subtotal for item */}
                <div style={{ width: '110px', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => removeFromCart(item._id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-red)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Order Summary Sidebar */}
        <div
          className="card"
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'sticky',
            top: '96px',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Order Summary</h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.92rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{cart.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Shipping</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>FREE</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Tax (GST)</span>
              <span style={{ color: 'var(--text-muted)' }}>Included in Price</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '1.25rem',
                fontWeight: 800,
              }}
            >
              <span style={{ color: 'var(--text-primary)' }}>Total Amount</span>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                ₹{cart.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/checkout')}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            Proceed to Checkout <ArrowRight size={18} />
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              justifyContent: 'center',
            }}
          >
            <ShieldCheck size={16} color="var(--accent-green)" />
            256-Bit SSL Encrypted & Protected Checkout
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
