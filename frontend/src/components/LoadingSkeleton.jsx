import React from 'react';

export default function LoadingSkeleton({ type = 'table', count = 4, height = 36 }) {
  if (type === 'cards') {
    return (
      <div className="skeleton-grid-cards">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton-card-pulse" />
        ))}
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div className="skeleton-detail-wrap">
        <div className="skeleton-bar-pulse" style={{ height: 48, marginBottom: 16 }} />
        <div className="skeleton-bar-pulse" style={{ height: 160, marginBottom: 16 }} />
        <div className="skeleton-bar-pulse" style={{ height: 220 }} />
      </div>
    );
  }

  return (
    <div className="skeleton-table-wrap">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="skeleton-row-pulse"
          style={{ height: height, marginBottom: 8 }}
        />
      ))}
    </div>
  );
}
