import React, { useState } from 'react';
import { 
  Filter, 
  Warehouse, 
  Tag, 
  AlertTriangle, 
  Calendar, 
  Search, 
  RotateCcw, 
  Download,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';

export default function FilterBar({ 
  filterOptions, 
  filters, 
  onFilterChange, 
  onResetFilters,
  roleContext
}) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  const isWarehouseDisabled = !!roleContext?.warehouse_restriction;

  const handleExport = (type) => {
    setShowExportMenu(false);
    const url = api.getExportUrl(type, filters.warehouse_id);
    window.open(url, '_blank');
  };

  return (
    <div className="glass-panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
        
        {/* Left Side: Filter Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <Filter size={15} color="#6366f1" />
            <span>Filters:</span>
          </div>

          {/* Warehouse Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
            <Warehouse size={14} color="#94a3b8" />
            <select
              value={filters.warehouse_id || ''}
              disabled={isWarehouseDisabled}
              onChange={e => onFilterChange('warehouse_id', e.target.value ? Number(e.target.value) : null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: isWarehouseDisabled ? '#94a3b8' : '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: isWarehouseDisabled ? 'not-allowed' : 'pointer'
              }}
            >
              <option value="" style={{ background: '#111827', color: '#fff' }}>All Warehouses</option>
              {filterOptions.warehouses?.map(w => (
                <option key={w.id} value={w.id} style={{ background: '#111827', color: '#fff' }}>
                  {w.label} ({w.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
            <Tag size={14} color="#94a3b8" />
            <select
              value={filters.category_id || ''}
              onChange={e => onFilterChange('category_id', e.target.value ? Number(e.target.value) : null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: '#111827', color: '#fff' }}>All Categories</option>
              {filterOptions.categories?.map(c => (
                <option key={c.id} value={c.id} style={{ background: '#111827', color: '#fff' }}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
            <AlertTriangle size={14} color="#f59e0b" />
            <select
              value={filters.status || 'ALL'}
              onChange={e => onFilterChange('status', e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {filterOptions.statuses?.map(s => (
                <option key={s.id} value={s.id} style={{ background: '#111827', color: '#fff' }}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
            <Calendar size={14} color="#60a5fa" />
            <select
              value={filters.period || '30d'}
              onChange={e => onFilterChange('period', e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#f8fafc',
                fontSize: '0.8rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="today" style={{ background: '#111827', color: '#fff' }}>Today</option>
              <option value="7d" style={{ background: '#111827', color: '#fff' }}>Last 7 Days</option>
              <option value="30d" style={{ background: '#111827', color: '#fff' }}>Last 30 Days</option>
              <option value="90d" style={{ background: '#111827', color: '#fff' }}>Last 3 Months</option>
            </select>
          </div>

          {/* Quick Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.35rem 0.75rem', minWidth: '180px' }}>
            <Search size={14} color="#94a3b8" />
            <input
              type="text"
              placeholder="Search SKU or Name..."
              value={filters.search || ''}
              onChange={e => onFilterChange('search', e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '0.8rem',
                outline: 'none',
                width: '100%'
              }}
            />
          </div>

        </div>

        {/* Right Side: Actions (Reset & Export) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          
          <button
            onClick={onResetFilters}
            className="btn-secondary"
            title="Reset filters to default"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.775rem' }}
          >
            <RotateCcw size={13} />
            <span>Reset</span>
          </button>

          {/* Export Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-primary"
              style={{ padding: '0.4rem 0.85rem', fontSize: '0.775rem' }}
            >
              <Download size={13} />
              <span>Export</span>
              <ChevronDown size={13} />
            </button>

            {showExportMenu && (
              <div 
                className="glass-panel" 
                style={{ 
                  position: 'absolute', 
                  right: 0, 
                  top: '110%', 
                  width: '210px', 
                  zIndex: 50, 
                  padding: '0.4rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.7)'
                }}
              >
                <div 
                  onClick={() => handleExport('inventory')}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '0.8rem',
                    color: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 600 }}>Stock Valuation CSV</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Products, stock levels & valuation</span>
                </div>
                <div 
                  onClick={() => handleExport('movements')}
                  style={{ 
                    padding: '0.5rem 0.75rem', 
                    borderRadius: '6px', 
                    cursor: 'pointer', 
                    fontSize: '0.8rem',
                    color: '#f8fafc',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <span style={{ fontWeight: 600 }}>Movement Ledger CSV</span>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Receipts, deliveries & transfers</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
