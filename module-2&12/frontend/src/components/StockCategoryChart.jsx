import React from 'react';
import { PieChart, Tag, DollarSign } from 'lucide-react';

export default function StockCategoryChart({ categories, roleContext }) {
  if (!categories || categories.length === 0) return null;

  const canViewValuation = roleContext?.can_view_valuation !== false;

  // Colors for category segments
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

  // Calculate cumulative angles for SVG donut
  let cumulativeAngle = 0;
  const radius = 60;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <PieChart size={18} color="#6366f1" />
            <span>Category Distribution</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Portfolio share and inventory asset allocation by product category
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', alignItems: 'center' }}>
        
        {/* SVG Donut Chart */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <svg width="170" height="170" viewBox="0 0 170 170" style={{ transform: 'rotate(-90deg)' }}>
            {categories.map((cat, i) => {
              const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -cumulativeAngle;
              cumulativeAngle += (cat.percentage / 100) * circumference;

              return (
                <circle
                  key={cat.category_id}
                  cx="85"
                  cy="85"
                  r={radius}
                  fill="transparent"
                  stroke={colors[i % colors.length]}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'all 0.5s ease' }}
                />
              );
            })}
          </svg>
          <div style={{ position: 'absolute', textAlign: 'center' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', display: 'block' }}>
              {categories.length}
            </span>
            <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>
              Categories
            </span>
          </div>
        </div>

        {/* Categories Legend List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {categories.map((cat, i) => (
            <div 
              key={cat.category_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.35rem 0.5rem',
                borderRadius: '6px',
                background: 'rgba(15, 23, 42, 0.4)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[i % colors.length], display: 'inline-block' }} />
                <span style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 500 }}>
                  {cat.category_name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
                <span style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  {cat.total_units.toLocaleString()}u ({cat.percentage}%)
                </span>
                {canViewValuation && (
                  <span style={{ color: '#34d399', fontWeight: 700 }}>
                    ${cat.valuation.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
