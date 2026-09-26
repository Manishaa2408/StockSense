import React from 'react';
import { 
  Package, 
  CheckCircle2, 
  Lock, 
  AlertCircle, 
  TrendingUp, 
  BarChart2, 
  Compass, 
  MapPin 
} from 'lucide-react';

export default function InventoryOverview({ overview, roleContext }) {
  if (!overview) return null;

  const total = overview.total_quantity || 0;
  const available = overview.available_quantity || 0;
  const reserved = overview.reserved_quantity || 0;

  const availablePct = total > 0 ? ((available / total) * 100).toFixed(1) : 0;
  const reservedPct = total > 0 ? ((reserved / total) * 100).toFixed(1) : 0;

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      
      {/* Title Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Compass size={18} color="#6366f1" />
            <span>Current Inventory Situation</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Live allocation of physical inventory across warehouses and storage locations
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-success">
            {overview.active_products_count} Active Products
          </span>
        </div>
      </div>

      {/* Primary Stock Breakdown Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        
        {/* Total Physical Stock */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Total Units In Stock</span>
            <Package size={15} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0' }}>
            {total.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Physical inventory on hand
          </div>
        </div>

        {/* Available Stock */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#34d399', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Available For Orders</span>
            <CheckCircle2 size={15} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', margin: '0.35rem 0' }}>
            {available.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {availablePct}% of total capacity
          </div>
        </div>

        {/* Reserved Stock */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Reserved / Committed</span>
            <Lock size={15} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fbbf24', margin: '0.35rem 0' }}>
            {reserved.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            {reservedPct}% allocated to dispatches
          </div>
        </div>

        {/* Critical Risk Tally */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '0.875rem 1rem', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>
            <span>Inventory Deficits</span>
            <AlertCircle size={15} color="#ef4444" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', margin: '0.35rem 0' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ef4444' }}>
              {overview.out_of_stock_count}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>out of stock</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24', marginLeft: 'auto' }}>
              {overview.low_stock_count}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>low</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
            Require purchase order trigger
          </div>
        </div>

      </div>

      {/* Stock Allocation Visual Ratio Bar */}
      <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.04)', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
          <span>Stock Allocation Ratio: <strong>{available.toLocaleString()} units free</strong></span>
          <span style={{ color: '#fbbf24' }}><strong>{reserved.toLocaleString()} units locked</strong></span>
        </div>
        <div style={{ width: '100%', height: '10px', background: '#334155', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
          <div style={{ width: `${availablePct}%`, background: 'linear-gradient(90deg, #10b981, #34d399)', height: '100%' }} title={`Available: ${availablePct}%`} />
          <div style={{ width: `${reservedPct}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', height: '100%' }} title={`Reserved: ${reservedPct}%`} />
        </div>
      </div>

      {/* Location Distribution Chips */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', marginBottom: '0.6rem' }}>
          <MapPin size={14} color="#6366f1" />
          <span>Top Active Storage Locations:</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {overview.location_breakdown?.slice(0, 8).map(loc => (
            <div 
              key={loc.location_id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '6px',
                fontSize: '0.75rem'
              }}
            >
              <span style={{ color: '#64748b' }}>{loc.warehouse_name.split(' ')[0]}:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{loc.location_name}</span>
              <span style={{ color: '#818cf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {loc.total_units.toLocaleString()}u
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
