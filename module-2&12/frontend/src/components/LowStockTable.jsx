import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShoppingCart, 
  Check, 
  ShieldAlert, 
  TrendingDown, 
  ArrowRight,
  Filter
} from 'lucide-react';

export default function LowStockTable({ lowStockItems, onStatusFilterChange, currentStatusFilter }) {
  const [reorderedItems, setReorderedItems] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  const handleSimulateReorder = (item) => {
    setReorderedItems(prev => ({ ...prev, [item.product_id]: true }));
    setToastMessage(`Purchase Reorder initiated for ${item.sku} (${item.recommended_order} units)`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem', position: 'relative' }}>
      
      {/* Toast Alert */}
      {toastMessage && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '20px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '0.45rem 0.9rem',
          borderRadius: '8px',
          fontSize: '0.775rem',
          fontWeight: 600,
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <Check size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} color="#ef4444" />
            <span>Low-Stock & Inventory Risk Alerts</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Immediate stock-out risks and reorder thresholds across warehouses
          </p>
        </div>

        {/* Status Pill Filters */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {[
            { id: 'ALL', label: 'All Items' },
            { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
            { id: 'LOW_STOCK', label: 'Low Stock' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              style={{
                background: currentStatusFilter === tab.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                border: currentStatusFilter === tab.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                color: currentStatusFilter === tab.id ? '#ffffff' : '#94a3b8',
                padding: '0.25rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                cursor: 'pointer',
                fontWeight: currentStatusFilter === tab.id ? 700 : 500
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>SKU / Product</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Threshold (Min)</th>
              <th>Status</th>
              <th>Deficit</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {lowStockItems.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                  No items match the current stock risk criteria. All tracked items are healthy.
                </td>
              </tr>
            ) : (
              lowStockItems.map(item => {
                const isOutOfStock = item.status === 'OUT_OF_STOCK';
                const isLowStock = item.status === 'LOW_STOCK';
                const isOrdered = reorderedItems[item.product_id];

                return (
                  <tr key={item.product_id}>
                    
                    {/* SKU & Name */}
                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                          {item.sku}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                      {item.category_name}
                    </td>

                    {/* Current Stock */}
                    <td style={{ fontWeight: 700, color: isOutOfStock ? '#ef4444' : isLowStock ? '#fbbf24' : '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {item.total_quantity} {item.unit_code}
                    </td>

                    {/* Reserved */}
                    <td style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {item.reserved_quantity}
                    </td>

                    {/* Available */}
                    <td style={{ fontWeight: 600, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                      {item.available_quantity}
                    </td>

                    {/* Threshold */}
                    <td style={{ color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                      {item.reorder_level}
                    </td>

                    {/* Status Badge */}
                    <td>
                      {isOutOfStock && (
                        <span className="badge badge-critical">
                          Out of Stock
                        </span>
                      )}
                      {isLowStock && (
                        <span className="badge badge-warning">
                          Low Stock
                        </span>
                      )}
                      {!isOutOfStock && !isLowStock && (
                        <span className="badge badge-success">
                          Healthy
                        </span>
                      )}
                    </td>

                    {/* Deficit */}
                    <td style={{ color: item.shortage > 0 ? '#ef4444' : '#64748b', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {item.shortage > 0 ? `-${item.shortage}` : '0'}
                    </td>

                    {/* Action Button */}
                    <td style={{ textAlign: 'right' }}>
                      {isOrdered ? (
                        <span style={{ fontSize: '0.725rem', color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          <Check size={13} /> PO Created
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSimulateReorder(item)}
                          disabled={item.shortage === 0}
                          style={{
                            background: isOutOfStock ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                            border: isOutOfStock ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
                            color: isOutOfStock ? '#f87171' : '#fbbf24',
                            padding: '0.25rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.725rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                          }}
                        >
                          <ShoppingCart size={12} />
                          <span>Order +{item.recommended_order}</span>
                        </button>
                      )}
                    </td>

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
