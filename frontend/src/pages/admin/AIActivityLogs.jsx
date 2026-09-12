import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Sparkles, Search, Bot, SlidersHorizontal } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const AIActivityLogs = () => {
  const { showToast } = useToast();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('All');

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/admin/ai-activity?limit=50';
      if (typeFilter !== 'All') url += `&type=${typeFilter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setActivities(res.data.activities);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, showToast]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  return (
    <div className="container admin-layout" style={{ padding: '32px 0 80px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <AdminSidebar />

      <div className="admin-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>AI Audit & Telemetry Logs</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Real-time audit records of user interactions with the AI assistant, search, and recommendation engine.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Interaction Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-control"
              style={{ width: 'auto', fontSize: '0.88rem' }}
            >
              <option value="All">All Types</option>
              <option value="chat">Assistant Chat</option>
              <option value="search">NL Search</option>
              <option value="recommendation">Personalized Recommendations</option>
              <option value="comparison">Product Comparison</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching AI activity stream..." />
        ) : activities.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)' }}>No recorded AI interactions for this filter.</p>
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Timestamp</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Interaction Type</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>User / Session</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', width: '38%' }}>Query Prompt</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Result Telemetry</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, idx) => (
                  <tr
                    key={act._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(act.createdAt).toLocaleString()}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span className="badge badge-ai" style={{ fontSize: '0.72rem' }}>
                        {act.type}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      {act.user ? (
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{act.user.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Guest Session</span>
                      )}
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500 }}>
                      "{act.query}"
                    </td>

                    <td style={{ padding: '16px 20px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {JSON.stringify(act.results || {})}
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

export default AIActivityLogs;
