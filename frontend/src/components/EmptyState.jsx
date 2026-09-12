import React from 'react';

const EmptyState = ({ icon: Icon, title, message, action }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 24px',
        gap: '12px',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            marginBottom: '4px',
          }}
        >
          <Icon size={26} strokeWidth={1.5} />
        </div>
      )}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {message && (
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
          {message}
        </p>
      )}
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  );
};

export default EmptyState;
