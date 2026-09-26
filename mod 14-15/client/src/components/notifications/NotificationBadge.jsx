import React from 'react';

export default function NotificationBadge({ count, className = '' }) {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count;

  return (
    <span
      className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform bg-rose-600 rounded-full shadow-sm animate-pulse ${className}`}
    >
      {displayCount}
    </span>
  );
}
