import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Repeat, 
  SlidersHorizontal, 
  TrendingUp,
  Activity
} from 'lucide-react';

export default function StockMovementChart({ movementData, selectedPeriod, onPeriodChange }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!movementData) return null;

  const timeline = movementData.timeline || [];

  // Determine max value for SVG coordinate scaling
  const maxVal = Math.max(
    ...timeline.map(p => Math.max(p.receipts, p.deliveries, Math.abs(p.net_change))),
    50
  );

  const svgWidth = 720;
  const svgHeight = 220;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Coordinate generators
  const getX = (index) => {
    if (timeline.length <= 1) return paddingX;
    return paddingX + (index / (timeline.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return svgHeight - paddingY - (Math.max(0, val) / maxVal) * chartHeight;
  };

  // Generate SVG path points
  const receiptsPoints = timeline.map((p, i) => `${getX(i)},${getY(p.receipts)}`).join(' ');
  const deliveriesPoints = timeline.map((p, i) => `${getX(i)},${getY(p.deliveries)}`).join(' ');

  return (
    <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
      
      {/* Title & Timeframe Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#6366f1" />
            <span>Stock Movement & Inventory Trends</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Daily inbound receipts vs outbound dispatches and velocity flow
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            <span style={{ color: '#cbd5e1' }}>Inbound Receipts</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f87171', display: 'inline-block' }}></span>
            <span style={{ color: '#cbd5e1' }}>Outbound Deliveries</span>
          </div>
        </div>
      </div>

      {/* Movement Velocity Summary Metrics */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', 
        gap: '0.75rem', 
        background: 'rgba(15, 23, 42, 0.4)', 
        padding: '0.875rem', 
        borderRadius: '8px',
        marginBottom: '1.25rem',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowDownLeft size={13} color="#10b981" />
            <span>Today Receipts</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
            +{movementData.today_receipts.toLocaleString()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <ArrowUpRight size={13} color="#ef4444" />
            <span>Today Deliveries</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171', marginTop: '0.2rem' }}>
            -{movementData.today_deliveries.toLocaleString()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <Repeat size={13} color="#818cf8" />
            <span>Transfers</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#818cf8', marginTop: '0.2rem' }}>
            {movementData.today_transfers.toLocaleString()}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <SlidersHorizontal size={13} color="#fbbf24" />
            <span>Adjustments</span>
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.2rem' }}>
            {movementData.today_adjustments.toLocaleString()}
          </div>
        </div>

        <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)', paddingLeft: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <TrendingUp size={13} color={movementData.today_net_movement >= 0 ? '#10b981' : '#ef4444'} />
            <span>Net Velocity</span>
          </div>
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: 800, 
            color: movementData.today_net_movement >= 0 ? '#34d399' : '#f87171', 
            marginTop: '0.2rem' 
          }}>
            {movementData.today_net_movement >= 0 ? `+${movementData.today_net_movement}` : movementData.today_net_movement}
          </div>
        </div>
      </div>

      {/* Interactive Chart Container */}
      <div style={{ width: '100%', position: 'relative' }}>
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          style={{ width: '100%', height: 'auto', maxHeight: '250px', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="receiptGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="deliveryGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={getY(0)} x2={svgWidth - paddingX} y2={getY(0)} stroke="#334155" strokeDasharray="3 3" />
          <line x1={paddingX} y1={getY(maxVal * 0.5)} x2={svgWidth - paddingX} y2={getY(maxVal * 0.5)} stroke="#334155" strokeDasharray="3 3" opacity="0.5" />
          <line x1={paddingX} y1={getY(maxVal)} x2={svgWidth - paddingX} y2={getY(maxVal)} stroke="#334155" strokeDasharray="3 3" opacity="0.5" />

          {/* Value Labels */}
          <text x={paddingX - 8} y={getY(maxVal) + 4} fill="#64748b" fontSize="10" textAnchor="end">{Math.round(maxVal)}</text>
          <text x={paddingX - 8} y={getY(maxVal * 0.5) + 4} fill="#64748b" fontSize="10" textAnchor="end">{Math.round(maxVal * 0.5)}</text>
          <text x={paddingX - 8} y={getY(0) + 4} fill="#64748b" fontSize="10" textAnchor="end">0</text>

          {/* Receipts Polyline */}
          <polyline
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={receiptsPoints}
          />

          {/* Deliveries Polyline */}
          <polyline
            fill="none"
            stroke="#f87171"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={deliveriesPoints}
          />

          {/* Interactive Data points */}
          {timeline.map((point, index) => {
            const rx = getX(index);
            const ry = getY(point.receipts);
            const dy = getY(point.deliveries);

            return (
              <g key={point.date} style={{ cursor: 'pointer' }}>
                {/* Receipts circle */}
                <circle 
                  cx={rx} 
                  cy={ry} 
                  r="3.5" 
                  fill="#10b981" 
                  stroke="#0b0f19" 
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint({ ...point, x: rx, y: ry, type: 'Receipts', val: point.receipts })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Deliveries circle */}
                <circle 
                  cx={rx} 
                  cy={dy} 
                  r="3.5" 
                  fill="#f87171" 
                  stroke="#0b0f19" 
                  strokeWidth="1.5"
                  onMouseEnter={() => setHoveredPoint({ ...point, x: rx, y: dy, type: 'Deliveries', val: point.deliveries })}
                  onMouseLeave={() => setHoveredPoint(null)}
                />

                {/* Date labels for key indices */}
                {(index === 0 || index === Math.floor(timeline.length / 2) || index === timeline.length - 1) && (
                  <text 
                    x={rx} 
                    y={svgHeight - 6} 
                    fill="#94a3b8" 
                    fontSize="9.5" 
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                  >
                    {point.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (
          <div 
            style={{ 
              position: 'absolute', 
              top: '10px', 
              left: `${Math.min(hoveredPoint.x, 500)}px`,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '6px',
              padding: '0.4rem 0.65rem',
              fontSize: '0.75rem',
              pointerEvents: 'none',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
              zIndex: 10
            }}
          >
            <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '0.2rem' }}>
              {hoveredPoint.date}
            </div>
            <div style={{ color: '#10b981' }}>Receipts: +{hoveredPoint.receipts} units</div>
            <div style={{ color: '#f87171' }}>Deliveries: -{hoveredPoint.deliveries} units</div>
            <div style={{ color: '#818cf8' }}>Net: {hoveredPoint.net_change >= 0 ? `+${hoveredPoint.net_change}` : hoveredPoint.net_change} units</div>
          </div>
        )}
      </div>

    </div>
  );
}
