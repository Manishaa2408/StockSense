import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  RefreshCw, 
  Search, 
  Filter, 
  Inbox, 
  AlertOctagon, 
  AlertTriangle, 
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import NotificationItem from '../../components/notifications/NotificationItem';
import notificationApi from '../../api/notifications.api';
import toast from 'react-hot-toast';
import AppLayout from '../../layouts/AppLayout';

const NOTIFICATION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'DELIVERY_READY', label: 'Delivery Ready' },
  { value: 'DELIVERY_COMPLETED', label: 'Delivery Completed' },
  { value: 'DELIVERY_CANCELED', label: 'Delivery Canceled' },
  { value: 'STOCK_TRANSFER_READY', label: 'Transfer Ready' },
  { value: 'GOODS_RECEIPT_VALIDATED', label: 'Goods Receipt Validated' },
  { value: 'SYSTEM_ALERT', label: 'System Alert' },
  { value: 'USER_ALERT', label: 'User Alert' }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Filters state
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'unread', 'critical', 'warning', 'info'
  const [selectedType, setSelectedType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit,
        search: debouncedSearch || undefined,
        type: selectedType || undefined
      };

      if (activeTab === 'unread') {
        params.unread = true;
      } else if (activeTab === 'critical') {
        params.severity = 'CRITICAL';
      } else if (activeTab === 'warning') {
        params.severity = 'WARNING';
      } else if (activeTab === 'info') {
        params.severity = 'INFO';
      }

      const res = await notificationApi.getNotifications(params);
      if (res?.success && res?.data) {
        setNotifications(res.data.notifications || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalCount(res.data.pagination?.total || 0);
        if (res.data.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [page, limit, activeTab, selectedType, debouncedSearch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, is_read: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id) => {
    try {
      const target = notifications.find((n) => n.id === id);
      await notificationApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      if (target && !target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast.success('Notification dismissed');
    } catch (err) {
      toast.error('Failed to dismiss notification');
    }
  };

  const handleClearAllRead = async () => {
    if (!window.confirm('Are you sure you want to remove all read notifications?')) return;
    try {
      await notificationApi.clearAllRead();
      loadNotifications();
      toast.success('Cleared read notifications');
    } catch (err) {
      toast.error('Failed to clear read notifications');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications & Alerts</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Real-time operational alerts, stock status changes, and delivery notifications.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={loadNotifications}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-3.5 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark all as read
            </button>
          )}

          <button
            type="button"
            onClick={handleClearAllRead}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-white hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 transition-colors"
            title="Clear all read notifications"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            Clear read
          </button>
        </div>
      </div>

      {/* Filter and Tab Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-4">
        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-100">
          <button
            type="button"
            onClick={() => { setActiveTab('all'); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            All Alerts
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('unread'); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            Unread
            {unreadCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('critical'); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'critical'
                ? 'bg-rose-50 text-rose-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            Critical
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('warning'); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'warning'
                ? 'bg-amber-50 text-amber-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Warnings
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('info'); setPage(1); }}
            className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Info className="w-4 h-4 text-blue-600" />
            Info
          </button>
        </div>

        {/* Detailed Filters: Search & Type Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search notifications by title or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="relative">
            <select
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
              className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white p-4 rounded-xl border border-gray-200 animate-pulse flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-3">
              <Inbox className="w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">No notifications found</h3>
            <p className="text-sm text-gray-500 max-w-sm mt-1">
              {activeTab === 'unread'
                ? "You're all caught up! No unread notifications at the moment."
                : 'There are no notifications matching your current filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <NotificationItem
                key={item.id}
                notification={item}
                compact={false}
                onMarkRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="bg-white px-4 py-3 border border-gray-200 rounded-xl flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{' '}
            <span className="font-medium">{totalCount}</span> results
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-2">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      </div>
    </AppLayout>
  );
}
