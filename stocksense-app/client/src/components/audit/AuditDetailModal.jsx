import React from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Globe, 
  ShieldCheck, 
  FileText, 
  Layers, 
  ArrowRight,
  Monitor
} from 'lucide-react';
import AuditActionBadge from './AuditActionBadge';

export default function AuditDetailModal({ log, isOpen, onClose }) {
  if (!isOpen || !log) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} at ${d.toLocaleTimeString()}`;
  };

  const hasBefore = log.before_data && Object.keys(log.before_data).length > 0;
  const hasAfter = log.after_data && Object.keys(log.after_data).length > 0;
  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">Audit Event Record</h3>
                <span className="text-xs font-mono text-gray-500">#{log.id}</span>
                <AuditActionBadge action={log.action} />
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Immutable system activity history entry</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Top metadata grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Actor */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                <User className="w-4 h-4 text-indigo-600" />
                Performed By
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {log.user_first_name ? `${log.user_first_name} ${log.user_last_name || ''}` : 'System / Anonymous'}
              </p>
              <p className="text-xs text-gray-500 truncate">{log.user_email || `User ID: ${log.user_id || 'N/A'}`}</p>
              {log.user_role_name && (
                <span className="inline-block mt-1 text-[10px] font-semibold bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">
                  {log.user_role_name}
                </span>
              )}
            </div>

            {/* Target Resource */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                <Layers className="w-4 h-4 text-indigo-600" />
                Target Resource
              </div>
              <p className="text-sm font-semibold text-gray-900 truncate">{log.module}</p>
              <p className="text-xs text-gray-600 font-mono mt-0.5">
                {log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}
              </p>
            </div>

            {/* Timestamp */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Timestamp
              </div>
              <p className="text-xs font-semibold text-gray-900">{formatDate(log.created_at)}</p>
            </div>

            {/* Network Client */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-1">
                <Globe className="w-4 h-4 text-indigo-600" />
                IP Address
              </div>
              <p className="text-xs font-mono font-medium text-gray-900 truncate">
                {log.ip_address || '127.0.0.1 (Local)'}
              </p>
            </div>
          </div>

          {/* Description banner */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider block mb-1">
              Activity Description
            </span>
            <p className="text-sm text-gray-800 font-medium">{log.description || 'No description recorded.'}</p>
          </div>

          {/* Before vs After Visual Diff */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-gray-600" />
              <h4 className="text-sm font-bold text-gray-900">Change State Comparison</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before Data */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/30 overflow-hidden">
                <div className="px-4 py-2 bg-rose-100/60 border-b border-rose-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                    Previous State (Before)
                  </span>
                  {!hasBefore && <span className="text-[10px] text-gray-500">None</span>}
                </div>
                <div className="p-3">
                  {hasBefore ? (
                    <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-60 bg-white/70 p-2.5 rounded-lg border border-rose-100">
                      {JSON.stringify(log.before_data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-500 italic p-4 text-center">
                      No prior state (e.g. newly created record)
                    </p>
                  )}
                </div>
              </div>

              {/* After Data */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 overflow-hidden">
                <div className="px-4 py-2 bg-emerald-100/60 border-b border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                    New State (After)
                  </span>
                  {!hasAfter && <span className="text-[10px] text-gray-500">None</span>}
                </div>
                <div className="p-3">
                  {hasAfter ? (
                    <pre className="text-xs font-mono text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-60 bg-white/70 p-2.5 rounded-lg border border-emerald-100">
                      {JSON.stringify(log.after_data, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-xs text-gray-500 italic p-4 text-center">
                      No subsequent state (e.g. record deleted)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* User Agent / Request Context */}
          {log.user_agent && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs">
              <span className="font-semibold text-gray-700 flex items-center gap-1.5 mb-1">
                <Monitor className="w-3.5 h-3.5 text-gray-500" />
                Client User Agent
              </span>
              <p className="text-gray-600 font-mono text-[11px] break-all">{log.user_agent}</p>
            </div>
          )}

          {/* Request Metadata */}
          {hasMetadata && (
            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200">
              <span className="text-xs font-bold text-gray-700 block mb-2">Request Metadata</span>
              <pre className="text-xs font-mono text-gray-700 bg-white p-3 rounded-lg border border-gray-200 overflow-x-auto max-h-40">
                {JSON.stringify(log.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
