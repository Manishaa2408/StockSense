import React, { useState, useEffect } from 'react';
import { 
  X, 
  Building2, 
  Phone, 
  Mail, 
  User, 
  MapPin, 
  FileText, 
  Tag, 
  Plus, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Clock, 
  DollarSign, 
  Star,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { api } from '../services/api';

export default function SupplierDetailDrawer({
  supplierId,
  role,
  onClose,
  onEdit,
  onStatusToggle
}) {
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Link Product Modal / Form State
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [newProductData, setNewProductData] = useState({
    product_id: '',
    supplier_sku: '',
    unit_cost: 0.0,
    lead_time_days: 7,
    is_primary: 1
  });
  const [linkingProduct, setLinkingProduct] = useState(false);
  const [linkError, setLinkError] = useState(null);

  // Load supplier details
  const loadSupplier = async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSupplier(role, supplierId);
      setSupplier(data);
    } catch (err) {
      setError(err.message || 'Failed to load supplier details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSupplier();
  }, [supplierId, role]);

  // Load product catalog for linking
  useEffect(() => {
    if (showAddProduct) {
      api.getProductsLookup(role)
        .then(res => setCatalogProducts(res))
        .catch(err => console.error(err));
    }
  }, [showAddProduct, role]);

  const handleLinkProduct = async (e) => {
    e.preventDefault();
    if (!newProductData.product_id) {
      setLinkError('Please select a product from the catalog.');
      return;
    }
    setLinkingProduct(true);
    setLinkError(null);
    try {
      await api.addSupplierProduct(role, supplierId, {
        product_id: Number(newProductData.product_id),
        supplier_sku: newProductData.supplier_sku,
        unit_cost: Number(newProductData.unit_cost),
        lead_time_days: Number(newProductData.lead_time_days),
        is_primary: newProductData.is_primary ? 1 : 0
      });
      setShowAddProduct(false);
      setNewProductData({ product_id: '', supplier_sku: '', unit_cost: 0.0, lead_time_days: 7, is_primary: 1 });
      loadSupplier();
    } catch (err) {
      setLinkError(err.message || 'Failed to associate product.');
    } finally {
      setLinkingProduct(false);
    }
  };

  const handleUnlinkProduct = async (productId) => {
    if (!window.confirm('Remove this product association from the supplier?')) return;
    try {
      await api.removeSupplierProduct(role, supplierId, productId);
      loadSupplier();
    } catch (err) {
      alert('Error unlinking product: ' + err.message);
    }
  };

  if (!supplierId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      maxWidth: '650px',
      background: '#0b1120',
      borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '-10px 0 35px rgba(0, 0, 0, 0.8)',
      zIndex: 90,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.25s ease-out'
    }}>
      
      {/* Drawer Header */}
      <div style={{ padding: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#818cf8" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
              {supplier?.name || 'Supplier Profile'}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
              <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#818cf8', fontWeight: 600 }}>
                {supplier?.code}
              </span>
              <span className={supplier?.status === 'ACTIVE' ? 'badge badge-success' : 'badge badge-neutral'} style={{ fontSize: '0.65rem' }}>
                {supplier?.status}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {supplier && (
            <button
              onClick={() => onEdit(supplier)}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
            >
              <Edit3 size={13} />
              <span>Edit</span>
            </button>
          )}
          <button 
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.35rem' }}
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Drawer Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>
            Loading supplier record...
          </div>
        ) : error ? (
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px' }}>
            {error}
          </div>
        ) : supplier ? (
          <>
            {/* Quick Status Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, display: 'block' }}>Operational Lifecycle</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: supplier.status === 'ACTIVE' ? '#34d399' : '#94a3b8' }}>
                  {supplier.status === 'ACTIVE' ? 'Active Vendor (Accepting POs)' : 'Inactive (Archived for Historical Records)'}
                </span>
              </div>
              <button
                onClick={() => onStatusToggle(supplier.id, supplier.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                style={{
                  background: supplier.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  border: supplier.status === 'ACTIVE' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                  color: supplier.status === 'ACTIVE' ? '#f87171' : '#34d399',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {supplier.status === 'ACTIVE' ? 'Deactivate Vendor' : 'Reactivate Vendor'}
              </button>
            </div>

            {/* Contact & Organization Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem', marginBottom: '1.25rem' }}>
              
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.875rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                  <User size={13} /> Primary Contact
                </span>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.85rem' }}>
                  {supplier.contact_person || 'No Contact Specified'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Mail size={12} /> {supplier.email || 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Phone size={12} /> {supplier.phone || 'N/A'}
                </div>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.875rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.5rem' }}>
                  <MapPin size={13} /> Location & Tax
                </span>
                <div style={{ fontSize: '0.8rem', color: '#f8fafc' }}>
                  {supplier.address_line1 || 'No physical address'}
                  {supplier.address_line2 ? `, ${supplier.address_line2}` : ''}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                  {[supplier.city, supplier.state, supplier.postal_code, supplier.country].filter(Boolean).join(', ') || 'N/A'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.35rem', fontFamily: 'var(--font-mono)' }}>
                  Tax ID: {supplier.tax_id || 'Not Registered'}
                </div>
              </div>

            </div>

            {/* Notes if present */}
            {supplier.notes && (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '0.75rem 0.875rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.25rem' }}>
                  <FileText size={13} /> Vendor Notes
                </span>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {supplier.notes}
                </p>
              </div>
            )}

            {/* SECTION 7: Associated Products Junction */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Tag size={15} color="#6366f1" />
                    <span>Associated Catalog Products ({supplier.products?.length || 0})</span>
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                    Products this vendor supplies to StockSense facilities
                  </span>
                </div>
                <button
                  onClick={() => setShowAddProduct(true)}
                  className="btn-primary"
                  style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                >
                  <Plus size={13} />
                  <span>Link Product</span>
                </button>
              </div>

              {/* Form to link new product */}
              {showAddProduct && (
                <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid #6366f1', borderRadius: '8px', padding: '1rem', marginBottom: '1rem', animation: 'fadeIn 0.2s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>Link Product to Supplier</span>
                    <button onClick={() => setShowAddProduct(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <X size={16} />
                    </button>
                  </div>

                  {linkError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '0.4rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      {linkError}
                    </div>
                  )}

                  <form onSubmit={handleLinkProduct}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.25rem' }}>
                        Select Product from Catalog *
                      </label>
                      <select
                        value={newProductData.product_id}
                        onChange={e => {
                          const pId = e.target.value;
                          const found = catalogProducts.find(p => p.id === Number(pId));
                          setNewProductData({
                            ...newProductData,
                            product_id: pId,
                            unit_cost: found ? found.cost_price : newProductData.unit_cost,
                            supplier_sku: found ? `${supplier.code.split('-')[1]}-${found.sku}` : ''
                          });
                        }}
                        required
                        style={{ width: '100%', padding: '0.45rem 0.6rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                      >
                        <option value="">-- Choose Catalog Product --</option>
                        {catalogProducts.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.sku} — {p.name} ({p.category_name})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Supplier SKU</label>
                        <input
                          type="text"
                          placeholder="e.g. VEND-SKU-1"
                          value={newProductData.supplier_sku}
                          onChange={e => setNewProductData({ ...newProductData, supplier_sku: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Unit Cost ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={newProductData.unit_cost}
                          onChange={e => setNewProductData({ ...newProductData, unit_cost: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#cbd5e1', marginBottom: '0.2rem' }}>Lead Time (Days)</label>
                        <input
                          type="number"
                          value={newProductData.lead_time_days}
                          onChange={e => setNewProductData({ ...newProductData, lead_time_days: e.target.value })}
                          style={{ width: '100%', padding: '0.4rem', background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#cbd5e1', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={newProductData.is_primary === 1}
                          onChange={e => setNewProductData({ ...newProductData, is_primary: e.target.checked ? 1 : 0 })}
                        />
                        <span>Set as Primary Supplier for this product</span>
                      </label>
                      <button
                        type="submit"
                        disabled={linkingProduct}
                        className="btn-primary"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                      >
                        {linkingProduct ? 'Linking...' : 'Add Link'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Products Table */}
              <div style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Supplier SKU</th>
                      <th>Unit Cost</th>
                      <th>Lead Time</th>
                      <th>Primary</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!supplier.products || supplier.products.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8' }}>
                          No products currently mapped to this supplier.
                        </td>
                      </tr>
                    ) : (
                      supplier.products.map(p => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.8rem' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#818cf8', fontFamily: 'var(--font-mono)' }}>
                              {p.sku}
                            </div>
                          </td>
                          <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#cbd5e1' }}>
                            {p.supplier_sku || '—'}
                          </td>
                          <td style={{ fontWeight: 700, color: '#34d399', fontSize: '0.8rem' }}>
                            ${p.unit_cost?.toFixed(2)}
                          </td>
                          <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            {p.lead_time_days} days
                          </td>
                          <td>
                            {p.is_primary === 1 ? (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                <Star size={10} /> Primary
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Secondary</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              onClick={() => handleUnlinkProduct(p.product_id)}
                              style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '0.2rem' }}
                              title="Unlink product"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </>
        ) : null}
      </div>

    </div>
  );
}
