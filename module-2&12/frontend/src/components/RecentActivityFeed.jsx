import React from 'react';
import { 
  History, 
  Truck, 
  DownloadCloud, 
  Shuffle, 
  Sliders, 
  PackagePlus, 
  AlertCircle, 
  User, 
  Clock 
} from 'lucide-react';

export default function RecentActivityFeed({ activities }) {
  if (!activities || activities.length === 0) return null;

  const getActionConfig = (action) => {
    switch (action) {
      case 'DELIVERY_COMPLETED':
      case 'DELIVERY_VALIDATED':
        return { icon: Truck, color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', label: 'Delivery' };
      case 'RECEIPT_CREATED':
      case 'RECEIPT_CONFIRMED':
        return { icon: DownloadCloud, color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)', label: 'Receipt' };
      case 'TRANSFER_COMPLETED':
      case 'TRANSFER_DISPATCHED':
        return { icon: Shuffle, color: '#818cf8', bg: 'rgba(129, 140, 248, 0.15)', label: 'Transfer' };
      case 'STOCK_ADJUSTED':
        return { icon: Sliders, color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)', label: 'Adjustment' };
      case 'PRODUCT_CREATED':
        return { icon: PackagePlus, color: '#ec4899', bg: 'rgba(236, 72, 153, 0.15)', label: 'Product' };
      default:
        return { icon: History, color: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.15)', label: 'System' };
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} color="#6366f1" />
            <span>Recent Operational Activity Feed</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Live audit trail of warehouse transactions and inventory updates
          </p>
        </div>
        <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
          Real-Time Log
        </span>
      </div>

      {/* Activity Timeline List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {activities.map(act => {
          const cfg = getActionConfig(act.action);
          const Icon = cfg.icon;

          return (
            <div 
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                padding: '0.65rem 0.85rem',
                background: 'rgba(15, 23, 42, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '8px'
              }}
            >
              {/* Event Icon */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: cfg.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginTop: '0.1rem'
              }}>
                <Icon size={16} color={cfg.color} />
              </div>

              {/* Event Text & Details */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 700, 
                      color: cfg.color, 
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}>
                      {cfg.label}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>•</span>
                    <span style={{ fontSize: '0.75rem', color: '#818cf8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                      {act.entity_id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: '#64748b' }}>
                    <Clock size={11} />
                    <span>{act.created_at}</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#e2e8f0', marginBottom: '0.25rem' }}>
                  {act.description}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#94a3b8' }}>
                  <User size={12} color="#6366f1" />
                  <span>Initiated by <strong>{act.user_name}</strong></span>
                </div>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
}
