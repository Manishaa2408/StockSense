import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Filter, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Edit,
  Eye,
  Tag,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import { api } from '../services/api';
import SupplierModal from './SupplierModal';
import SupplierDetailDrawer from './SupplierDetailDrawer';

export default function SupplierList({ role, roleContext }) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 1 });

  // Modal & Drawer State
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSuppliers(role, {
        page,
        limit,
        search,
        status: statusFilter
      });
      setSuppliers(res.items || []);
      setPagination({ total: res.total, total_pages: res.total_pages });
    } catch (err) {
      setError(err.message || 'Failed to fetch suppliers.');
    } finally {
      setLoading(false);
    }
  }, [role, page, limit, search, statusFilter]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleOpenCreate = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setIsModalOpen(true);
  };

  const handleSaveSupplier = async (data) => {
    setIsSaving(true);
    try {
      if (editingSupplier) {
        await api.updateSupplier(role, editingSupplier.id, data);
      } else {
        await api.createSupplier(role, data);
      }
      setIsModalOpen(false);
      fetchSuppliers();
      if (selectedSupplierId === editingSupplier?.id) {
        // re-trigger load if drawer is open
        setSelectedSupplierId(editingSupplier.id);
      }
    } catch (err) {
      alert('Error saving supplier: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async (id, newStatus) => {
    try {
      await api.updateSupplierStatus(role, id, newStatus);
      fetchSuppliers();
    } catch (err) {
      alert('Error updating supplier status: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '0.5rem 0' }}>
      
      {/* Top Banner & Action */}
      <div className="glass-panel" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 size={22} color="#6366f1" />
              <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                Supplier & Vendor Directory
              </h1>
              <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                Master Data
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Manage certified supplier master records, contact channels, address books and product supply catalogs
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={fetchSuppliers}
              className="btn-secondary"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
            >
              <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
            >
              <Plus size={15} />
              <span>New Supplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel" style={{ padding: '0.875rem 1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.875rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '0.35rem 0.75rem', minWidth: '240px' }}>
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search by code, company, contact or city..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
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

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.35rem' }}>
              {[
                { id: 'ALL', label: 'All Vendors' },
                { id: 'ACTIVE', label: 'Active Only' },
                { id: 'INACTIVE', label: 'Inactive' }
              ].map(st => (
                <button
                  key={st.id}
                  onClick={() => { setStatusFilter(st.id); setPage(1); }}
                  style={{
                    background: statusFilter === st.id ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                    border: statusFilter === st.id ? '1px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                    color: statusFilter === st.id ? '#ffffff' : '#94a3b8',
                    padding: '0.3rem 0.65rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: statusFilter === st.id ? 700 : 500
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Showing <strong>{suppliers.length}</strong> of <strong>{pagination.total}</strong> suppliers
          </div>

        </div>
      </div>

      {/* Supplier Table */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '1.25rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Supplier / Company</th>
                <th>Contact Person</th>
                <th>Contact Info</th>
                <th>Location</th>
                <th>Products</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    Loading supplier directory...
                  </td>
                </tr>
              ) : suppliers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                    No suppliers match the current search or status filter.
                  </td>
                </tr>
              ) : (
                suppliers.map(s => {
                  const isActive = s.status === 'ACTIVE';

                  return (
                    <tr key={s.id}>
                      {/* Code */}
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: '#818cf8', 
                          fontFamily: 'var(--font-mono)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          padding: '0.2rem 0.45rem',
                          borderRadius: '4px'
                        }}>
                          {s.code}
                        </span>
                      </td>

                      {/* Company Name */}
                      <td>
                        <div 
                          onClick={() => setSelectedSupplierId(s.id)}
                          style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem', cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#818cf8'}
                          onMouseLeave={e => e.currentTarget.style.color = '#f8fafc'}
                        >
                          {s.name}
                        </div>
                        {s.tax_id && (
                          <div style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                            Tax: {s.tax_id}
                          </div>
                        )}
                      </td>

                      {/* Contact Person */}
                      <td style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>
                        {s.contact_person || '—'}
                      </td>

                      {/* Contact Info */}
                      <td>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Mail size={12} color="#64748b" />
                          <span>{s.email || '—'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.15rem' }}>
                          <Phone size={12} color="#64748b" />
                          <span>{s.phone || '—'}</span>
                        </div>
                      </td>

                      {/* Location */}
                      <td style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                        {[s.city, s.country].filter(Boolean).join(', ') || '—'}
                      </td>

                      {/* Products Count */}
                      <td>
                        <span className="badge badge-info" style={{ fontSize: '0.65rem' }}>
                          {s.products_count} Products
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={isActive ? 'badge badge-success' : 'badge badge-neutral'}>
                          {s.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            onClick={() => setSelectedSupplierId(s.id)}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                            title="View supplier details and products"
                          >
                            <Eye size={12} />
                            <span>Details</span>
                          </button>

                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="btn-secondary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem' }}
                            title="Edit supplier"
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            onClick={() => handleStatusToggle(s.id, isActive ? 'INACTIVE' : 'ACTIVE')}
                            style={{
                              background: isActive ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                              color: isActive ? '#f87171' : '#34d399',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.725rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                            title={isActive ? 'Deactivate supplier' : 'Activate supplier'}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Page {page} of {pagination.total_pages}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: page <= 1 ? 0.4 : 1 }}
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
              disabled={page >= pagination.total_pages}
              className="btn-secondary"
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', opacity: page >= pagination.total_pages ? 0.4 : 1 }}
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* Modal for Create / Edit */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSupplier}
        supplier={editingSupplier}
        isSaving={isSaving}
      />

      {/* Detail Drawer with Associated Products */}
      {selectedSupplierId && (
        <SupplierDetailDrawer
          supplierId={selectedSupplierId}
          role={role}
          onClose={() => setSelectedSupplierId(null)}
          onEdit={(sup) => { setSelectedSupplierId(null); handleOpenEdit(sup); }}
          onStatusToggle={(id, newStatus) => {
            handleStatusToggle(id, newStatus);
            setSelectedSupplierId(id);
          }}
        />
      )}

    </div>
  );
}
