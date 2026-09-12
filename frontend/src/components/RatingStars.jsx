import React from 'react';
import { Star } from 'lucide-react';

const RatingStars = ({ rating = 0, numReviews, size = 14, showCount = true }) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', gap: '1px' }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={size}
            fill={i <= fullStars ? 'var(--accent-orange)' : i === fullStars + 1 && hasHalf ? 'var(--accent-orange)' : 'none'}
            color={i <= fullStars || (i === fullStars + 1 && hasHalf) ? 'var(--accent-orange)' : 'var(--border-main)'}
            strokeWidth={1.5}
            style={i === fullStars + 1 && hasHalf ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
          />
        ))}
      </div>
      {showCount && (
        <span style={{ fontSize: `${size * 0.75}px`, color: 'var(--text-muted)', fontWeight: 500, marginLeft: '2px' }}>
          {rating > 0 ? rating.toFixed(1) : ''}
          {numReviews !== undefined && ` (${numReviews})`}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
