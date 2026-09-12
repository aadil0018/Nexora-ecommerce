import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingStars from '../../components/RatingStars';
import api from '../../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [aiActivities, setAiActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/analytics');
      if (res.data.success) {
        setStats(res.data.stats);
        setRecentOrders(res.data.recentOrders);
        setTopProducts(res.data.topProducts);
        setAiActivities(res.data.aiActivities);
      }
    } catch (err) {
      console.error('[Dashboard Error]:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="container admin-layout" style={{ padding: '32px 0 80px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <AdminSidebar />

      <div className="admin-content" style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Operations & AI Metrics</h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Real-time platform telemetry, orders, inventory performance, and AI inference audit.
            </p>
          </div>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
            <RefreshCw size={14} /> Refresh Data
          </button>
        </div>

        {loading ? (
          <LoadingSpinner text="Computing operational telemetry..." />
        ) : stats ? (
          <>
            {/* Top Stat Cards Grid */}
            <div
              className="admin-stats-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '18px',
                marginBottom: '32px',
              }}
            >
              {/* Total Revenue */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Gross Revenue</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--badge-green-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-green)' }}>
                    <TrendingUp size={16} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  ₹{stats.totalSales.toLocaleString('en-IN')}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)' }}>From completed orders</span>
              </div>

              {/* Total Orders */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Orders</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <ShoppingBag size={16} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.totalOrders}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {stats.pendingOrders} pending • {stats.deliveredOrders} delivered
                </span>
              </div>

              {/* Total Products */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Active Catalog</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Package size={16} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.totalProducts}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Electronics & Hardware</span>
              </div>

              {/* Total Users */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Registered Users</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--badge-orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-orange)' }}>
                    <Users size={16} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.totalUsers}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Accounts active</span>
              </div>

              {/* AI Interactions */}
              <div className="card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>AI Interactions</span>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--badge-purple-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-purple)' }}>
                    <Sparkles size={16} />
                  </div>
                </div>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {stats.totalAIInteractions}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)' }}>Chat, NL Search & Recs</span>
              </div>
            </div>

            {/* Recent Orders & Top Selling Products */}
            <div className="admin-two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
              {/* Recent Orders Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Transactions</h3>
                  <Link to="/admin/orders" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
                    View All Orders
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {recentOrders.map((o) => (
                    <div
                      key={o._id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {o.user?.name || 'Customer'}
                        </strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          #{o._id.slice(-6)} • {new Date(o.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary)' }}>
                          ₹{o.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <span
                          className={`badge ${
                            o.orderStatus === 'Delivered'
                              ? 'badge-success'
                              : o.orderStatus === 'Cancelled'
                              ? 'badge-danger'
                              : 'badge-warning'
                          }`}
                          style={{ fontSize: '0.65rem' }}
                        >
                          {o.orderStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Products Card */}
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Top Rated Hardware</h3>
                  <Link to="/admin/products" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
                    Manage Inventory
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topProducts.map((p) => (
                    <div
                      key={p._id}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface-elevated)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                      }}
                    >
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                        alt=""
                        style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', objectFit: 'cover', background: 'var(--bg-inset)' }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </div>
                        <RatingStars rating={p.rating} numReviews={p.numReviews} size={13} />
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          ₹{p.price.toLocaleString('en-IN')}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: p.stock > 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                          {p.stock} in stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Assistant Activity Stream */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live AI Query Activity Stream</h3>
                </div>
                <Link to="/admin/ai-activity" style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>
                  View Full Audit Log
                </Link>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aiActivities.map((act) => (
                  <div
                    key={act._id}
                    style={{
                      padding: '10px 16px',
                      background: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="badge badge-ai" style={{ fontSize: '0.68rem' }}>
                        {act.type}
                      </span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>"{act.query}"</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {new Date(act.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default AdminDashboard;
