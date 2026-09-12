import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = 'Loading...' }) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '14px',
        padding: '60px 0',
      }}
    >
      <Loader2
        size={28}
        color="var(--primary)"
        style={{ animation: 'spin 0.8s linear infinite' }}
      />
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{text}</p>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
