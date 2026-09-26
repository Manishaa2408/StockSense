import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Pagination from '../../components/ui/Pagination';
import Modal from '../../components/ui/Modal';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { formatDate } from '../../utils/date';
import { validateEmail, validatePassword, validateMatch, validateName } from '../../utils/validation';

export default function UsersListPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '', role_id: '' });
  const [errors, setErrors] = useState({});
  const [addLoading, setAddLoading] = useState(false);
  
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (roleId) params.append('role_id', roleId);
      
      const { data } = await api.get(`/users?${params.toString()}`);
      const payload = data.data || {};
      const userList = Array.isArray(payload) ? payload : (payload.users || []);
      setUsers(userList);

      const pagination = payload.pagination || data.meta || {};
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || userList.length);
    } catch (err) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data } = await api.get('/roles');
      const payload = data.data || {};
      const roleList = Array.isArray(payload) ? payload : (payload.roles || []);
      setRoles(roleList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [page, search, status, roleId]);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      first_name: validateName(formData.first_name, 'First Name'),
      last_name: validateName(formData.last_name, 'Last Name'),
      email: validateEmail(formData.email),
      password: validatePassword(formData.password),
      confirm_password: validateMatch(formData.password, formData.confirm_password, 'Passwords'),
      role_id: !formData.role_id ? 'Role is required' : null,
    };

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    try {
      setAddLoading(true);
      await api.post('/users', formData);
      toast.success('User created successfully');
      setIsAddModalOpen(false);
      setFormData({ first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: '', role_id: '' });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to create user');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <Button icon={Plus} onClick={() => setIsAddModalOpen(true)}>Add User</Button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            name="search" 
            placeholder="Search by name or email..." 
            icon={Search} 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            name="status" 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'DEACTIVATED', label: 'Deactivated' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select 
            name="roleId" 
            value={roleId} 
            onChange={(e) => setRoleId(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              ...roles.map(r => ({ value: r.id, label: r.name }))
            ]}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center"><Spinner className="mx-auto" /></td></tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><Badge variant="neutral">{u.role_name || u.Role?.name}</Badge></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={u.status === 'ACTIVE' ? 'success' : u.status === 'SUSPENDED' ? 'warning' : 'error'}>
                        {u.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(u.last_login_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => navigate(`/users/${u.id}`)} className="text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-5 w-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && users.length > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} onPageChange={setPage} />
        )}
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add User" size="lg">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" name="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} error={errors.first_name} required />
            <Input label="Last Name" name="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} error={errors.last_name} required />
          </div>
          <Input label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} error={errors.email} required />
          <Input label="Phone" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} error={errors.phone} />
          <Select label="Role" name="role_id" value={formData.role_id} onChange={(e) => setFormData({...formData, role_id: e.target.value})} error={errors.role_id} options={roles.map(r => ({ value: r.id, label: r.name }))} placeholder="Select a role" required />
          <div>
            <Input label="Password" name="password" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} error={errors.password} required />
            {formData.password && (
              <PasswordRequirements password={formData.password} />
            )}
          </div>
          <Input label="Confirm Password" name="confirm_password" type="password" value={formData.confirm_password} onChange={(e) => setFormData({...formData, confirm_password: e.target.value})} error={errors.confirm_password} required />
          <div className="flex justify-end pt-4">
            <Button type="submit" loading={addLoading}>Create User</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  );
}
