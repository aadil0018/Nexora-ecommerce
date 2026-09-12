import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  ShoppingCart,
  MessageCircle,
  Truck,
  Filter,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const MyOrders = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders/my-orders');
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error('[Orders Error]:', err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? An automated cancellation notification will be sent to your WhatsApp.')) {
      return;
    }

    try {
      setActionLoadingId(orderId);
      const res = await api.put(`/orders/${orderId}/cancel`);
      if (res.data.success) {
        showToast('Order cancelled successfully. Cancellation message sent to your WhatsApp.');
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? res.data.order : o))
        );
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReorder = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await api.post(`/orders/${orderId}/reorder`);
      if (res.data.success) {
        showToast(res.data.message || 'Items added back to your cart!');
        navigate('/cart');
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return (
          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={13} /> Delivered
          </span>
        );
      case 'Shipped':
        return (
          <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Truck size={13} /> Shipped
          </span>
        );
      case 'Cancelled':
        return (
          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <XCircle size={13} /> Cancelled
          </span>
        );
      default:
        return (
          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} /> Processing
          </span>
        );
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'Active') {
      return order.orderStatus === 'Processing' || order.orderStatus === 'Shipped';
    }
    if (activeTab === 'Delivered') {
      return order.orderStatus === 'Delivered';
    }
    if (activeTab === 'Cancelled') {
      return order.orderStatus === 'Cancelled';
    }
    return true;
  });

  const activeCount = orders.filter((o) => o.orderStatus === 'Processing' || o.orderStatus === 'Shipped').length;
  const deliveredCount = orders.filter((o) => o.orderStatus === 'Delivered').length;
  const cancelledCount = orders.filter((o) => o.orderStatus === 'Cancelled').length;

  return (
    <div className="container" style={{ padding: '32px 0 80px', maxWidth: '980px' }}>
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>My Orders & Purchase History</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Review past purchases, track active shipments, manage cancellations, and reorder items.
          </p>
        </div>

        <Link to="/products" className="btn btn-secondary btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <ShoppingCart size={15} /> Continue Shopping
        </Link>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          marginBottom: '24px',
          overflowX: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('All')}
          className={`btn btn-sm ${activeTab === 'All' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px' }}
        >
          All Orders ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Active')}
          className={`btn btn-sm ${activeTab === 'Active' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px' }}
        >
          Active Orders ({activeCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Delivered')}
          className={`btn btn-sm ${activeTab === 'Delivered' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px' }}
        >
          Delivered ({deliveredCount})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('Cancelled')}
          className={`btn btn-sm ${activeTab === 'Cancelled' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem', padding: '6px 16px' }}
        >
          Cancelled ({cancelledCount})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching order history..." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={Package}
          title={activeTab === 'All' ? 'No orders placed yet' : `No ${activeTab.toLowerCase()} orders found`}
          description={
            activeTab === 'All'
              ? 'Your placed orders, delivery tracking, and purchase receipts will appear here.'
              : `You do not have any orders in ${activeTab.toLowerCase()} status.`
          }
          actionText="Browse Catalog"
          actionLink="/products"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {filteredOrders.map((order) => {
            const isProcessing = order.orderStatus === 'Processing';
            const isCancelled = order.orderStatus === 'Cancelled';
            const customerPhone = order.shippingAddress?.phone || '8946066632';

            return (
              <div
                key={order._id}
                className="card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px',
                  border: isCancelled ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-subtle)',
                }}
              >
                {/* Order Meta Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingBottom: '14px',
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Order Placed:</span>
                    <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </strong>
                    <span style={{ color: 'var(--border-subtle)' }}>•</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      ID: <strong>#{order._id.slice(-8).toUpperCase()}</strong>
                    </span>
                    <span style={{ color: 'var(--border-subtle)' }}>•</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-green)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <MessageCircle size={13} /> {customerPhone}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {getStatusBadge(order.orderStatus)}
                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.82rem' }}
                    >
                      View Receipt <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>

                {/* Purchased Items List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {order.orderItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-surface-elevated)',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-md)',
                        gap: '14px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                          alt={item.name}
                          style={{
                            width: '46px',
                            height: '46px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--bg-inset)',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <h5
                            style={{
                              fontSize: '0.88rem',
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '420px',
                            }}
                          >
                            {item.name}
                          </h5>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Qty: {item.qty} × ₹{item.price.toLocaleString('en-IN')}
                          </div>
                        </div>
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', flexShrink: 0 }}>
                        ₹{(item.price * item.qty).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer with Actions and Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Payment: <strong>{order.paymentMethod}</strong> ({order.paymentStatus})
                    </span>

                    {/* Cancel Order Action */}
                    {isProcessing && (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={actionLoadingId === order._id}
                        className="btn btn-secondary btn-sm"
                        style={{
                          color: 'var(--accent-red)',
                          borderColor: 'rgba(239, 68, 68, 0.4)',
                          background: 'rgba(239, 68, 68, 0.08)',
                          fontSize: '0.8rem',
                          padding: '4px 12px',
                        }}
                      >
                        <XCircle size={14} />
                        {actionLoadingId === order._id ? 'Cancelling...' : 'Cancel Order'}
                      </button>
                    )}

                    {/* Reorder / Move to Cart Action for Cancelled or Delivered */}
                    {(isCancelled || order.orderStatus === 'Delivered') && (
                      <button
                        type="button"
                        onClick={() => handleReorder(order._id)}
                        disabled={actionLoadingId === order._id}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '4px 12px' }}
                      >
                        <RotateCcw size={14} />
                        {actionLoadingId === order._id ? 'Adding to Cart...' : 'Reorder / Add to Cart'}
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Total:</span>
                    <strong style={{ fontSize: '1.15rem', color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                      ₹{order.totalAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
