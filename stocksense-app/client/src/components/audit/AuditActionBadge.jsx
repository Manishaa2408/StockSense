import React from 'react';

const ACTION_STYLES = {
  CREATE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  UPDATE: 'bg-blue-50 text-blue-700 border-blue-200',
  DELETE: 'bg-rose-50 text-rose-700 border-rose-200',
  LOGIN: 'bg-slate-50 text-slate-700 border-slate-200',
  LOGOUT: 'bg-slate-50 text-slate-600 border-slate-200',
  LOGIN_FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
  PASSWORD_RESET: 'bg-amber-50 text-amber-700 border-amber-200',
  STATUS_CHANGE: 'bg-purple-50 text-purple-700 border-purple-200',
  APPROVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCEL: 'bg-amber-50 text-amber-700 border-amber-200',
  ADJUST: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  TRANSFER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  RECEIVE: 'bg-teal-50 text-teal-700 border-teal-200',
  VALIDATE: 'bg-teal-50 text-teal-700 border-teal-200',
  ROLE_CHANGE: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200'
};

export default function AuditActionBadge({ action, className = '' }) {
  const normalizedAction = (action || 'UNKNOWN').toUpperCase();
  const style = ACTION_STYLES[normalizedAction] || 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider border ${style} ${className}`}
    >
      {normalizedAction.replace(/_/g, ' ')}
    </span>
  );
}
