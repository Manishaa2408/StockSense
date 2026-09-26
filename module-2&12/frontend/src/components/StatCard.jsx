import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeType = 'neutral', // 'critical', 'warning', 'success', 'info', 'neutral'
  trend, // { value: "+12%", isPositive: true }
  accentColor = '#6366f1',
  onClick
}) {
  const badgeClasses = {
    critical: 'badge-critical',
    warning: 'badge-warning',
    success: 'badge-success',
    info: 'badge-info',
    neutral: 'badge-neutral'
  };

  return (
    <div 
      className="glass-panel stat-card-glow" 
      onClick={onClick}
      style={{ 
        padding: '1.15rem 1.25rem', 
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '135px'
      }}
    >
      {/* Top row: Title and Icon */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.01em' }}>
          {title}
        </span>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          borderRadius: '8px', 
          background: `${accentColor}18`, 
          border: `1px solid ${accentColor}33`,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0
        }}>
          {Icon && <Icon size={18} color={accentColor} />}
        </div>
      </div>

      {/* Middle row: Big Value */}
      <div style={{ margin: '0.4rem 0 0.2rem 0' }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', fontFamily: 'var(--font-sans)' }}>
          {value}
        </div>
      </div>

      {/* Bottom row: Subtitle and Badge / Trend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.725rem', color: '#64748b' }}>
          {subtitle}
        </span>

        {badgeText && (
          <span className={`badge ${badgeClasses[badgeType] || 'badge-neutral'}`}>
            {badgeText}
          </span>
        )}

        {trend && (
          <span style={{ 
            fontSize: '0.75rem', 
            fontWeight: 700, 
            color: trend.isPositive ? '#10b981' : '#ef4444' 
          }}>
            {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
