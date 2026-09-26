import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  ShieldCheck, 
  RotateCw, 
  Clock, 
  UserCircle2, 
  Sparkles,
  Layers,
  ChevronDown,
  LayoutDashboard,
  Building2
} from 'lucide-react';

export default function Header({ 
  role, 
  onRoleChange, 
  roleContext, 
  onRefresh, 
  isRefreshing,
  autoRefresh,
  onToggleAutoRefresh,
  activeTab = 'dashboard',
  onTabChange
}) {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const roles = [
    { id: 'ADMIN', name: 'Admin', desc: 'Unrestricted enterprise visibility, valuation & audit logs' },
    { id: 'INVENTORY_MANAGER', name: 'Inventory Manager', desc: 'Stock overview, movement velocity & reordering' },
    { id: 'WAREHOUSE_STAFF', name: 'Warehouse Staff', desc: 'Restricted warehouse-specific dispatch & receipt operations' }
  ];

  return (
    <header className="glass-panel" style={{ padding: '0.875rem 1.5rem', marginBottom: '1.25rem' }}>
      
      {/* Top Row: Brand & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        
        {/* Brand & System Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            background: 'linear-gradient(135deg, #6366f1, #3b82f6)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
          }}>
            <Boxes size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                StockSense
              </h1>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.1rem' }}>
              <Layers size={13} color="#6366f1" />
              <span>Enterprise Inventory & Vendor Command Platform</span>
            </p>
          </div>
        </div>

        {/* Center / Right controls: Live Time, Auto-Refresh, Refresh, Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          
          {/* Live Clock */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.35rem 0.75rem', 
            background: 'rgba(15, 23, 42, 0.6)', 
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontSize: '0.75rem',
            color: '#cbd5e1'
          }}>
            <span className="live-indicator"></span>
            <Clock size={13} color="#94a3b8" />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{timeStr || '12:00:00'}</span>
          </div>

          {/* Auto Refresh Toggle (only active on dashboard) */}
          {activeTab === 'dashboard' && (
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.4rem', 
              fontSize: '0.75rem', 
              color: '#94a3b8', 
              cursor: 'pointer',
              padding: '0.35rem 0.65rem',
              borderRadius: '6px',
              background: autoRefresh ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
              border: autoRefresh ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent'
            }}>
              <input 
                type="checkbox" 
                checked={autoRefresh} 
                onChange={e => onToggleAutoRefresh(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: '#6366f1' }}
              />
              <span>Live Auto (30s)</span>
            </label>
          )}

          {/* Refresh Button */}
          <button 
            onClick={onRefresh} 
            disabled={isRefreshing}
            className="btn-secondary"
            title="Refresh active view"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} style={{
              animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
            }} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>

          {/* Role Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.7)', padding: '0.35rem 0.6rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <UserCircle2 size={16} color="#6366f1" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Active Role</span>
              <select
                value={role}
                onChange={e => onRoleChange(e.target.value)}
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#ffffff', 
                  fontWeight: 700, 
                  fontSize: '0.825rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {roles.map(r => (
                  <option key={r.id} value={r.id} style={{ background: '#111827', color: '#ffffff' }}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
            <span className={role === 'ADMIN' ? 'badge badge-info' : role === 'INVENTORY_MANAGER' ? 'badge badge-success' : 'badge badge-warning'} style={{ marginLeft: '0.25rem' }}>
              {role === 'ADMIN' ? 'Full Access' : role === 'INVENTORY_MANAGER' ? 'Manager' : 'WH Dallas'}
            </span>
          </div>

        </div>
      </div>

      {/* Navigation Tabs Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          
          <button
            onClick={() => onTabChange('dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'dashboard' ? '1px solid #6366f1' : '1px solid transparent',
              background: activeTab === 'dashboard' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'dashboard' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <LayoutDashboard size={15} color={activeTab === 'dashboard' ? '#818cf8' : '#94a3b8'} />
            <span>Dashboard & Analytics</span>
          </button>

          <button
            onClick={() => onTabChange('suppliers')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.825rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: activeTab === 'suppliers' ? '1px solid #6366f1' : '1px solid transparent',
              background: activeTab === 'suppliers' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: activeTab === 'suppliers' ? '#ffffff' : '#94a3b8',
              transition: 'all 0.15s ease'
            }}
          >
            <Building2 size={15} color={activeTab === 'suppliers' ? '#818cf8' : '#94a3b8'} />
            <span>Suppliers & Vendors</span>
          </button>

        </nav>

        {/* Status notice according to role */}
        {role === 'WAREHOUSE_STAFF' && (
          <span style={{ fontSize: '0.75rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ShieldCheck size={14} /> Dallas Central Hub Scope Active
          </span>
        )}
      </div>

    </header>
  );
}
