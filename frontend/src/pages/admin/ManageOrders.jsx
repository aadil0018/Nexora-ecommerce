import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Search, Filter, CheckCircle2, Clock, MessageCircle } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ManageOrders = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/orders?limit=50';
      if (statusFilter !== 'All') url += `&status=${statusFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, showToast]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const res = await api.put(`/orders/${orderId}/status`, {
        orderStatus: newStatus,
      });
      if (res.data.success) {
        showToast(`Status updated to ${newStatus} — Official Tax Invoice PDF emailed to customer & WhatsApp dispatched`);
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? res.data.order : o))
        );
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 0 80px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <AdminSidebar />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage Customer Orders</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Inspect customer orders, track dispatch pipelines, and update fulfillment status.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', fontSize: '0.88rem', background: '#1e293b', color: '#ffffff', borderColor: 'var(--border-main)' }}
            >
              <option value="All" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>All Statuses</option>
              <option value="Processing" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Processing</option>
              <option value="Shipped" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Shipped</option>
              <option value="Delivered" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Delivered</option>
              <option value="Cancelled" style={{ backgroundColor: '#1e293b', color: '#ffffff' }}>Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Loading customer orders..." />
        ) : orders.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No orders found for this status.</p>
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Order ID & Date</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Customer</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Items</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Total Amount</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Payment</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, idx) => (
                  <tr
                    key={o._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <strong style={{ display: 'block', color: 'var(--text-primary)' }}>#{o._id.slice(-8)}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {new Date(o.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.user?.name || 'Customer'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                        <span>{o.shippingAddress?.city}</span>
                        <span>•</span>
                        {(() => {
                          const rawPhone = o.shippingAddress?.phone || '9790380815';
                          let clean = rawPhone.replace(/[^0-9]/g, '');
                          if (clean.startsWith('0')) clean = clean.replace(/^0+/, '');
                          if (clean.length === 10) clean = `91${clean}`;
                          const waUrl = `https://wa.me/${clean}?text=${encodeURIComponent(`Hello ${o.user?.name || 'Valued Customer'}! Regarding your Nexora Order #${o._id.slice(-6).toUpperCase()} (${o.orderStatus})...`)}`;
                          return (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: '#25d366', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
                              title="Chat with Customer on WhatsApp"
                            >
                              <MessageCircle size={12} /> {rawPhone}
                            </a>
                          );
                        })()}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{o.orderItems.length} items</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {o.orderItems.map((i) => i.name).join(', ')}
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', fontWeight: 800, color: 'var(--primary)' }}>
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: '0.82rem', display: 'block' }}>{o.paymentMethod}</span>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: o.paymentStatus === 'Completed' ? '#34d399' : '#fbbf24',
                          fontWeight: 600,
                        }}
                      >
                        {o.paymentStatus}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <select
                          value={o.orderStatus}
                          onChange={(e) => handleStatusChange(o._id, e.target.value)}
                          disabled={updatingId === o._id}
                          className="form-control"
                          style={{
                            width: 'auto',
                            fontSize: '0.84rem',
                            padding: '6px 12px',
                            background:
                              o.orderStatus === 'Delivered'
                                ? '#064e3b'
                                : o.orderStatus === 'Cancelled'
                                ? '#7f1d1d'
                                : o.orderStatus === 'Shipped'
                                ? '#1e3a8a'
                                : '#312e81',
                            color: '#ffffff',
                            borderColor:
                              o.orderStatus === 'Delivered'
                                ? '#10b981'
                                : o.orderStatus === 'Cancelled'
                                ? '#ef4444'
                                : o.orderStatus === 'Shipped'
                                ? '#3b82f6'
                                : '#818cf8',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="Processing" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600 }}>Processing</option>
                          <option value="Shipped" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600 }}>Shipped</option>
                          <option value="Delivered" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600 }}>Delivered</option>
                          <option value="Cancelled" style={{ backgroundColor: '#1e293b', color: '#ffffff', fontWeight: 600 }}>Cancelled</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const rawPhone = o.shippingAddress?.phone || '9790380815';
                            let clean = rawPhone.replace(/[^0-9]/g, '').replace(/^0+/, '');
                            if (clean.length === 10) clean = `91${clean}`;
                            const shortId = o._id.slice(-6).toUpperCase();
                            let msg = `📦 *Nexora Order #${shortId} Update*\n\nStatus: *${o.orderStatus}*\nTotal: ₹${o.totalAmount.toLocaleString('en-IN')}\n\n🔗 Live Tracking: ${window.location.origin}/orders/${o._id}`;
                            if (o.orderStatus === 'Processing') {
                              msg = `⚙️ *Order #${shortId} Processing Update*\n\nHi ${o.user?.name || 'Customer'}! Your package is currently being packed and prepared for dispatch.\n\n🔗 Live Tracking: ${window.location.origin}/orders/${o._id}`;
                            } else if (o.orderStatus === 'Shipped') {
                              msg = `🚚 *Order #${shortId} is On The Way!*\n\nHi ${o.user?.name || 'Customer'}! Your package has been dispatched and is out for delivery to ${o.shippingAddress?.city}.\n\n🔗 Live Tracking: ${window.location.origin}/orders/${o._id}`;
                            } else if (o.orderStatus === 'Delivered') {
                              msg = `✅ *Order #${shortId} Delivered!*\n\nHi ${o.user?.name || 'Customer'}! Your order has been delivered successfully. We hope you love your products!\n\n🔗 View Order: ${window.location.origin}/orders/${o._id}`;
                            }
                            window.open(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`, '_blank');
                          }}
                          className="btn btn-secondary btn-sm"
                          title="Send status update to customer on WhatsApp"
                          style={{ padding: '6px 8px', color: '#25d366' }}
                        >
                          <MessageCircle size={14} />
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
    </div>
  );
};

export default ManageOrders;
