import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit, ClipboardCheck, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';

export default function GoodsReceiptsListPage() {
  const [receipts, setReceipts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [warehouseId, setWarehouseId] = useState('');

  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const fetchWarehouses = async () => {
    try {
      const { data } = await api.get('/warehouses');
      setWarehouses(data.data || []);
    } catch (err) {
      console.error('Failed to fetch warehouses', err);
    }
  };

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 10 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (warehouseId) params.append('warehouse_id', warehouseId);

      const { data } = await api.get(`/goods-receipts?${params.toString()}`);
      setReceipts(data.data || []);
      if (data.meta) {
        setTotalPages(data.meta.totalPages);
        setTotalItems(data.meta.total);
      }
    } catch (err) {
      toast.error('Failed to fetch goods receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [page, search, status, warehouseId]);

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <ClipboardCheck className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Receiving (GRN)</h1>
            <p className="text-sm text-gray-500 mt-1">Manage incoming goods and receipt notes</p>
          </div>
        </div>
        {hasPermission('RECEIPT.CREATE') && (
          <Button icon={Plus} onClick={() => navigate('/goods-receipts/new')}>New Goods Receipt</Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <Input 
            name="search" 
            placeholder="Search GRN number or supplier..." 
            icon={Search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div>
          <Select 
            name="status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'CANCELED', label: 'Canceled' },
            ]}
          />
        </div>
        <div>
          <Select 
            name="warehouseId" 
            value={warehouseId} 
            onChange={(e) => setWarehouseId(e.target.value)}
            options={[
              { value: '', label: 'All Warehouses' },
              ...warehouses.map(w => ({ value: w.id, label: w.name }))
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GRN Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Ref</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warehouse & Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receipt Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="px-6 py-8 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : receipts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    No goods receipts found
                  </td>
                </tr>
              ) : (
                receipts.map((grn) => (
                  <tr key={grn.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-indigo-600">{grn.reference_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{grn.supplier_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{grn.po_reference || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{grn.warehouse_name}</div>
                      <div className="text-sm text-gray-500">{grn.location_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grn.receipt_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant={
                        grn.status === 'CONFIRMED' ? 'success' : 
                        grn.status === 'CANCELED' ? 'error' : 
                        grn.status === 'DRAFT' ? 'warning' : 'neutral'
                      }>
                        {grn.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => navigate(`/goods-receipts/${grn.id}`)} className="text-indigo-600 hover:text-indigo-900" title="View Details">
                        <Eye className="h-5 w-5 inline" />
                      </button>
                      {grn.status === 'DRAFT' && hasPermission('RECEIPT.UPDATE') && (
                        <button onClick={() => navigate(`/goods-receipts/${grn.id}/edit`)} className="text-gray-600 hover:text-gray-900" title="Edit Draft">
                          <Edit className="h-5 w-5 inline" />
                        </button>
                      )}
                      {(grn.status === 'DRAFT' || grn.status === 'RECEIVED') && hasPermission('RECEIPT.UPDATE') && (
                        <button onClick={() => navigate(`/goods-receipts/${grn.id}`)} className="text-emerald-600 hover:text-emerald-900" title="Confirm/Validate">
                          <CheckCircle className="h-5 w-5 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && receipts.length > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
        )}
      </div>
    </AppLayout>
  );
}
