import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, QrCode, Banknote, Lock, MessageCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');
  const [placingOrder, setPlacingOrder] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    const finalPhone = formData.phone?.trim();

    if (!finalPhone) {
      showToast('Please enter your mobile phone number for order updates', 'error');
      return;
    }

    if (!formData.address || !formData.city || !formData.postalCode) {
      showToast('Please fill in all shipping details', 'error');
      return;
    }

    if (!cart.items || cart.items.length === 0) {
      showToast('Your cart is empty', 'error');
      navigate('/cart');
      return;
    }

    try {
      setPlacingOrder(true);
      const res = await api.post('/orders', {
        orderItems: cart.items.map((i) => ({
          product: i.product._id || i.product,
          qty: i.qty,
          price: i.price,
          name: i.product.name,
        })),
        shippingAddress: {
          name: formData.name?.trim() || user?.name || 'Customer',
          email: user?.email || '',
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
          phone: finalPhone,
        },
        paymentMethod,
      });

      if (res.data.success) {
        showToast(`Order placed successfully! PDF invoice bill sent to ${user?.email || 'your email'}.`);
        await clearCart();
        navigate(`/orders/${res.data.order._id}`);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 0 80px', maxWidth: '1000px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Express Checkout</h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Review your shipping destination, choose a payment method, and confirm your order.
        </p>
      </div>

      <form onSubmit={handlePlaceOrder} autoComplete="off" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px' }}>
        {/* Left Column: Shipping & Payment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Shipping Address Section */}
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <Truck size={20} color="var(--primary)" /> 1. Shipping Address
            </h3>

            <div className="form-group">
              <label className="form-label">Full Recipient Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                WhatsApp Phone Number <span style={{ color: 'var(--accent-red)' }}>*</span>
              </label>
              <input
                type="tel"
                name="phone"
                placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                value={formData.phone}
                onChange={handleChange}
                required
                className="form-control"
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '8px',
                  fontSize: '0.8rem',
                  color: 'var(--accent-green)',
                  background: 'var(--badge-green-bg)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <MessageCircle size={15} color="var(--accent-green)" />
                <span>
                  <strong>Direct WhatsApp Updates:</strong> Instant order confirmation, dispatch tracking, and delivery receipts will be sent to this number.
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Street Address / Landmark</label>
              <textarea
                name="address"
                rows="2"
                placeholder="Apartment, Studio, Floor, Street..."
                value={formData.address}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g. Bengaluru"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Postal / PIN Code</label>
                <input
                  type="text"
                  name="postalCode"
                  placeholder="e.g. 560001"
                  value={formData.postalCode}
                  onChange={handleChange}
                  required
                  className="form-control"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)' }}>
              <CreditCard size={20} color="var(--accent-green)" /> 2. Payment Method
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: paymentMethod === 'Cash on Delivery' ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                  border: '1px solid',
                  borderColor: paymentMethod === 'Cash on Delivery' ? 'var(--primary)' : 'var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash on Delivery"
                  checked={paymentMethod === 'Cash on Delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <Banknote size={22} color="var(--accent-green)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Cash on Delivery</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pay upon physical package inspection at your door</span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: paymentMethod === 'UPI / QR Code' ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                  border: '1px solid',
                  borderColor: paymentMethod === 'UPI / QR Code' ? 'var(--primary)' : 'var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="UPI / QR Code"
                  checked={paymentMethod === 'UPI / QR Code'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <QrCode size={22} color="var(--primary)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary)' }}>UPI / Instant QR Code</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Google Pay, PhonePe, Paytm, or BHIM UPI</span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: paymentMethod === 'Credit / Debit Card' ? 'var(--primary-light)' : 'var(--bg-surface-elevated)',
                  border: '1px solid',
                  borderColor: paymentMethod === 'Credit / Debit Card' ? 'var(--primary)' : 'var(--border-subtle)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Credit / Debit Card"
                  checked={paymentMethod === 'Credit / Debit Card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <CreditCard size={22} color="var(--accent-purple)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary)' }}>Credit / Debit Card</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visa, MasterCard, RuPay, American Express</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review */}
        <div
          className="card"
          style={{
            padding: '28px',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            height: 'fit-content',
            position: 'sticky',
            top: '96px',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>Order Review</h3>

          {/* Items Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto' }}>
            {cart.items.map((item) => (
              <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.88rem' }}>
                <img
                  src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                  alt=""
                  style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'var(--bg-inset)' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {item.product?.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  ₹{(item.price * item.qty).toLocaleString('en-IN')}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{cart.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Shipping Delivery</span>
              <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>FREE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-primary)' }}>Total Pay</span>
              <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                ₹{cart.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={placingOrder}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '8px' }}
          >
            <Lock size={18} />
            {placingOrder ? 'Processing Order...' : `Place Order (₹${cart.totalAmount.toLocaleString('en-IN')})`}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)', justifyContent: 'center' }}>
            <ShieldCheck size={16} color="var(--accent-green)" />
            Guaranteed Genuine & 100% Encrypted Payment
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
