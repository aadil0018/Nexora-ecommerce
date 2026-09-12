import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Trash2, Filter } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import RatingStars from '../../components/RatingStars';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ManageReviews = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState('All');

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/reviews?limit=50';
      if (sentimentFilter !== 'All') url += `&sentiment=${sentimentFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sentimentFilter, showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (reviewId) => {
    if (window.confirm('Are you sure you want to remove this customer review?')) {
      try {
        const res = await api.delete(`/reviews/${reviewId}`);
        if (res.data.success) {
          showToast('Review removed and product rating recalculated');
          setReviews((prev) => prev.filter((r) => r._id !== reviewId));
        }
      } catch (err) {
        showToast(err.message, 'error');
      }
    }
  };

  return (
    <div className="container" style={{ padding: '32px 0 80px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <AdminSidebar />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Manage Customer Reviews</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Moderate customer product feedback and inspect automated AI sentiment classifications.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sentiment:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', fontSize: '0.88rem' }}
            >
              <option value="All">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching review logs..." />
        ) : reviews.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No customer reviews matching this filter.</p>
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Product</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Customer</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Rating</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', width: '38%' }}>Review Content</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>AI Sentiment</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r, idx) => (
                  <tr
                    key={r._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <strong style={{ color: 'var(--text-primary)', display: 'block', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.product?.name || 'Deleted Product'}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {r.product?.brand}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.user?.name || 'Anonymous'}</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.user?.email}</div>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <RatingStars rating={r.rating} size={14} />
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      "{r.comment}"
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span
                        className={`badge ${
                          r.sentiment === 'positive'
                            ? 'badge-success'
                            : r.sentiment === 'negative'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {r.sentiment}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleDelete(r._id)}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 10px' }}
                        title="Delete review"
                      >
                        <Trash2 size={15} />
                      </button>
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

export default ManageReviews;
