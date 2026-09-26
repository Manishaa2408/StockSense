import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Check, 
  Trash2, 
  ExternalLink,
  Package,
  Truck,
  BellRing
} from 'lucide-react';

const SEVERITY_THEME = {
  CRITICAL: {
    icon: AlertOctagon,
    iconColor: 'text-rose-600',
    iconBg: 'bg-rose-100',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    unreadBg: 'bg-rose-50/40',
    dotColor: 'bg-rose-600'
  },
  WARNING: {
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-100',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    unreadBg: 'bg-amber-50/40',
    dotColor: 'bg-amber-500'
  },
  INFO: {
    icon: Info,
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-100',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    unreadBg: 'bg-indigo-50/30',
    dotColor: 'bg-indigo-600'
  }
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDays = Math.floor(diffHour / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

const formatTypeLabel = (type) => {
  if (!type) return 'Alert';
  return type.replace(/_/g, ' ');
};

export default function NotificationItem({
  notification,
  onMarkRead,
  onDelete,
  compact = false,
  onCloseDropdown
}) {
  const navigate = useNavigate();
  const { id, type, title, message, severity, is_read, created_at, action_url } = notification;

  const theme = SEVERITY_THEME[severity] || SEVERITY_THEME.INFO;
  const IconComponent = theme.icon;

  const handleCardClick = (e) => {
    // Don't trigger if clicked on an action button
    if (e.target.closest('button')) return;

    if (!is_read && onMarkRead) {
      onMarkRead(id);
    }

    if (action_url) {
      if (onCloseDropdown) onCloseDropdown();
      navigate(action_url);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative transition-all duration-150 border-b border-gray-100 last:border-b-0 ${
        is_read ? 'bg-white hover:bg-gray-50' : `${theme.unreadBg} hover:bg-opacity-80`
      } ${action_url ? 'cursor-pointer' : ''} ${
        compact ? 'p-3 text-sm' : 'p-4 rounded-xl border mb-3 border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Severity Icon */}
        <div className={`p-2 rounded-lg flex-shrink-0 ${theme.iconBg} ${theme.iconColor}`}>
          <IconComponent className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`font-semibold truncate ${is_read ? 'text-gray-800' : 'text-gray-950 font-bold'}`}>
                {title}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border uppercase tracking-wider ${theme.badgeClass}`}>
                {formatTypeLabel(type)}
              </span>
            </div>

            {/* Time ago & Unread indicator */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatTimeAgo(created_at)}
              </span>
              {!is_read && (
                <span className={`w-2 h-2 rounded-full ${theme.dotColor}`} title="Unread" />
              )}
            </div>
          </div>

          <p className={`text-gray-600 text-xs leading-relaxed line-clamp-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {message}
          </p>

          {/* Action Links & Buttons */}
          <div className="mt-2 flex items-center justify-between gap-2">
            <div>
              {action_url && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!is_read && onMarkRead) onMarkRead(id);
                    if (onCloseDropdown) onCloseDropdown();
                    navigate(action_url);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
                >
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
              {!is_read && onMarkRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkRead(id);
                  }}
                  className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                  title="Mark as read"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}

              {onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(id);
                  }}
                  className="p-1 rounded text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
