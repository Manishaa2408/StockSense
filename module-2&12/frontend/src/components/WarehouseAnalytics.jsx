import React from 'react';
import { Warehouse, Layers, DollarSign, Activity, Percent } from 'lucide-react';

export default function WarehouseAnalytics({ warehouses, roleContext }) {
  if (!warehouses || warehouses.length === 0) return null;

  const canViewValuation = roleContext?.can_view_valuation !== false;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Warehouse size={18} color="#6366f1" />
            <span>Warehouse Analytics & Utilization</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Multi-facility capacity tracking, product density, and facility load balance
          </p>
        </div>
      </div>

      {/* Warehouse Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {warehouses.map(wh => {
          const utilPct = wh.utilization_percentage || 0;
          let progressColor = '#10b981'; // green
          if (utilPct > 75) progressColor = '#f59e0b'; // amber
          if (utilPct > 90) progressColor = '#ef4444'; // red

          return (
            <div 
              key={wh.warehouse_id} 
              style={{ 
                background: 'rgba(15, 23, 42, 0.6)', 
                borderRadius: '10px', 
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '1.1rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff' }}>
                      {wh.warehouse_name}
                    </h3>
                    <span style={{ fontSize: '0.7rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                      {wh.warehouse_code}
                    </span>
                  </div>
                  <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                    {wh.product_count} SKUs
                  </span>
                </div>

                {/* Numbers row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.5rem', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Units Stored</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                      {wh.total_units.toLocaleString()}
                    </span>
                  </div>
                  {canViewValuation ? (
                    <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.5rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Stock Valuation</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>
                        ${wh.valuation.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '0.5rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', textTransform: 'uppercase' }}>Max Capacity</span>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#94a3b8' }}>
                        {wh.capacity.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.725rem', color: '#cbd5e1', marginBottom: '0.35rem' }}>
                  <span>Capacity Utilization</span>
                  <span style={{ fontWeight: 700, color: progressColor }}>
                    {utilPct}% ({wh.total_units.toLocaleString()} / {wh.capacity.toLocaleString()})
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${Math.min(utilPct * 5, 100)}%`, // Scale visually for demonstration if capacity is large
                      background: progressColor, 
                      height: '100%',
                      borderRadius: '4px',
                      transition: 'width 0.5s ease-in-out'
                    }} 
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
