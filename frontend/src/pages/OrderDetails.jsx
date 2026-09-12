import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  MapPin,
  CreditCard,
  Printer,
  Download,
  MessageCircle,
  ExternalLink,
  XCircle,
  RotateCcw,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/orders/${id}`);
        if (res.data.success) {
          setOrder(res.data.order);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order? An automated cancellation alert will be sent to your WhatsApp.')) {
      return;
    }

    try {
      setCancelling(true);
      const res = await api.put(`/orders/${order._id}/cancel`);
      if (res.data.success) {
        setOrder(res.data.order);
        showToast('Order cancelled successfully. Cancellation alert sent to your WhatsApp.');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const handleReorder = async () => {
    try {
      setReordering(true);
      const res = await api.post(`/orders/${order._id}/reorder`);
      if (res.data.success) {
        showToast(res.data.message || 'Items added back to your cart!');
        navigate('/cart');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReordering(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0' }}>
        <LoadingSpinner text="Loading order receipt..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 0', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const steps = ['Processing', 'Shipped', 'Delivered'];
  const currentStepIndex = steps.indexOf(order.orderStatus);

  return (
    <div className="container" style={{ padding: '32px 0 80px', maxWidth: '900px' }}>
      {/* Header with back link */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <Link
          to="/orders"
          className="btn btn-secondary btn-sm"
        >
          <ArrowLeft size={16} /> Back to My Orders
        </Link>
        <div style={{ display: 'flex', gap: '10px' }}>
          <a
            href={`/api/orders/${order._id}/invoice`}
            download={`Invoice_${order._id.toString().slice(-8).toUpperCase()}.pdf`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary btn-sm"
          >
            <Download size={15} /> Download PDF Invoice
          </a>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary btn-sm"
          >
            <Printer size={15} /> Print
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: '36px', borderRadius: 'var(--radius-xl)' }}>
        {/* Title & Order ID */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            paddingBottom: '24px',
            borderBottom: '1px solid var(--border-subtle)',
            marginBottom: '32px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
              Order #{order._id}
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          <div>
            <span
              className={`badge ${
                order.orderStatus === 'Delivered'
                  ? 'badge-success'
                  : order.orderStatus === 'Cancelled'
                  ? 'badge-danger'
                  : 'badge-primary'
              }`}
              style={{ fontSize: '0.85rem', padding: '6px 14px' }}
            >
              {order.orderStatus}
            </span>
          </div>
        </div>

        {/* Status Stepper */}
        {order.orderStatus !== 'Cancelled' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              marginBottom: '40px',
              padding: '0 20px',
            }}
          >
            {/* Connecting line */}
            <div
              style={{
                position: 'absolute',
                top: '20px',
                left: '60px',
                right: '60px',
                height: '3px',
                background: 'var(--border-subtle)',
                zIndex: 0,
              }}
            />

            {steps.map((step, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isPassed ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                      border: '2px solid',
                      borderColor: isPassed ? 'var(--primary)' : 'var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: isCurrent ? '0 0 15px rgba(99, 102, 241, 0.5)' : 'none',
                    }}
                  >
                    {isPassed ? <CheckCircle2 size={20} /> : idx + 1}
                  </div>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isPassed ? 'var(--text-primary)' : 'var(--text-muted)',
                    }}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Shipping & Payment Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
            marginBottom: '36px',
          }}
        >
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="var(--primary)" /> Shipping Destination
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {order.shippingAddress.address}<br />
              {order.shippingAddress.city}, {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}<br />
              Phone: {order.shippingAddress.phone}
            </p>
          </div>

          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} color="var(--accent-green)" /> Payment Information
            </h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              Method: <strong>{order.paymentMethod}</strong><br />
              Status: <span style={{ color: order.paymentStatus === 'Completed' ? 'var(--accent-green)' : '#fbbf24', fontWeight: 600 }}>{order.paymentStatus}</span><br />
              Total Billed: <strong style={{ color: 'var(--text-primary)' }}>₹{order.totalAmount.toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        {/* Automated WhatsApp Notifications Status & Quick Actions */}
        {(() => {
          const shortId = order._id.slice(-6).toUpperCase();
          const customerPhone = order.shippingAddress?.phone || '8946066632';
          const rawDigits = customerPhone.replace(/[^0-9]/g, '');
          const waPhone = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits;

          return (
            <div
              style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-lg)',
                background: order.orderStatus === 'Cancelled'
                  ? 'rgba(239, 68, 68, 0.06)'
                  : 'linear-gradient(135deg, rgba(37, 211, 102, 0.08) 0%, rgba(18, 140, 126, 0.03) 100%)',
                border: order.orderStatus === 'Cancelled'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(37, 211, 102, 0.3)',
                marginBottom: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: order.orderStatus === 'Cancelled' ? 'var(--accent-red)' : '#25d366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: order.orderStatus === 'Cancelled'
                      ? '0 0 14px rgba(239, 68, 68, 0.4)'
                      : '0 0 14px rgba(37, 211, 102, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  {order.orderStatus === 'Cancelled' ? (
                    <XCircle size={22} color="#fff" />
                  ) : (
                    <MessageCircle size={22} color="#000" />
                  )}
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {order.orderStatus === 'Cancelled' ? (
                      <>
                        <span>Order Cancelled</span>
                        <span className="badge badge-danger" style={{ fontSize: '0.72rem' }}>Cancelled</span>
                      </>
                    ) : (
                      <>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#25d366' }} />
                        <span>Automated WhatsApp Alerts Active</span>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>{order.orderStatus}</span>
                      </>
                    )}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {order.orderStatus === 'Cancelled'
                      ? `Cancellation confirmation dispatched to WhatsApp: ${customerPhone}.`
                      : `Live notifications (Processing, Shipped, Delivered) are automatically sent to ${customerPhone}.`}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Cancel Order, Reorder / Move to Cart, or Direct WhatsApp Chat */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {order.orderStatus === 'Processing' && (
                  <button
                    type="button"
                    onClick={handleCancelOrder}
                    disabled={cancelling}
                    className="btn btn-secondary btn-sm"
                    style={{
                      color: 'var(--accent-red)',
                      borderColor: 'rgba(239, 68, 68, 0.4)',
                      background: 'rgba(239, 68, 68, 0.08)',
                      fontSize: '0.82rem',
                    }}
                  >
                    <XCircle size={15} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
                  </button>
                )}

                {order.orderStatus === 'Cancelled' && (
                  <button
                    type="button"
                    onClick={handleReorder}
                    disabled={reordering}
                    className="btn btn-primary btn-sm"
                    style={{ fontSize: '0.82rem' }}
                  >
                    <RotateCcw size={14} /> {reordering ? 'Adding to Cart...' : 'Reorder Items (Add to Cart)'}
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* Itemized Table */}
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
          Purchased Items ({order.orderItems.length})
        </h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {order.orderItems.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <img
                src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                alt=""
                style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'var(--bg-inset)' }}
              />
              <div style={{ flex: 1 }}>
                <Link to={`/products/${item.product}`} style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {item.name}
                </Link>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Unit Price: ₹{item.price.toLocaleString('en-IN')} × {item.qty}
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                ₹{(item.price * item.qty).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </div>

        {/* Total Summary Breakdown */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '40px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            <span>Shipping:</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>FREE</span>
          </div>
          <div style={{ display: 'flex', gap: '40px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            <span>Total Paid:</span>
            <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
              ₹{order.totalAmount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
