import React, { useState, useEffect, useCallback } from 'react';
import { Users, Shield, User, Search } from 'lucide-react';
import AdminSidebar from '../../components/AdminSidebar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

const ManageUsers = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      let url = '/admin/users?limit=50';
      if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`;
      const res = await api.get(url);
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'customer' : 'admin';
    try {
      setUpdatingId(userId);
      const res = await api.put(`/admin/users/${userId}/role`, { role: newRole });
      if (res.data.success) {
        showToast(`User role updated to ${newRole}`);
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container admin-layout" style={{ padding: '32px 0 80px', display: 'flex', gap: '32px', alignItems: 'flex-start' }}>
      <AdminSidebar />

      <div className="admin-content" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>User Management Directory</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Inspect registered customer profiles and toggle administrative privileges.
          </p>
        </div>

        {/* Search */}
        <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '14px' }} />
            <input
              type="text"
              placeholder="Search by customer name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '40px', height: '40px', fontSize: '0.88rem' }}
            />
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching user records..." />
        ) : (
          <div className="card" style={{ overflowX: 'auto', borderRadius: 'var(--radius-xl)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>User</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Email Address</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Role</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>Joined Date</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-muted)', textAlign: 'right' }}>Permissions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u._id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      background: idx % 2 === 0 ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
                    }}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: u.role === 'admin' ? 'var(--primary)' : 'var(--bg-surface-elevated)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: u.role === 'admin' ? '#fff' : 'var(--text-primary)',
                          }}
                        >
                          {u.name ? u.name[0].toUpperCase() : 'U'}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-primary)', display: 'block' }}>{u.name}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{u._id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                      {u.email}
                    </td>

                    <td style={{ padding: '16px 20px' }}>
                      <span className={`badge ${u.role === 'admin' ? 'badge-primary' : 'badge-ai'}`}>
                        {u.role}
                      </span>
                    </td>

                    <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                      <button
                        onClick={() => handleRoleToggle(u._id, u.role)}
                        disabled={updatingId === u._id}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {u.role === 'admin' ? 'Revoke Admin' : 'Make Admin'}
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

export default ManageUsers;
