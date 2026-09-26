import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { formatDate } from '../../utils/date';

export default function UserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/users/${id}`);
        setUser(data.data);
        setSelectedRole(data.data.role_id);
      } catch (err) {
        toast.error('Failed to load user details');
        navigate('/users');
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, navigate]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const { data } = await api.get('/roles');
        setRoles(data.data);
      } catch (err) {}
    };
    if (hasPermission('USER.MANAGE')) fetchRoles();
  }, [hasPermission]);

  const handleStatusChange = async (newStatus) => {
    try {
      setActionLoading(true);
      await api.patch(`/users/${id}/status`, { status: newStatus });
      setUser({ ...user, status: newStatus });
      toast.success(`User status changed to ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      setActionLoading(true);
      const { data } = await api.patch(`/users/${id}/role`, { role_id: selectedRole });
      setUser({ ...user, role_id: selectedRole, Role: { ...user.Role, name: roles.find(r => r.id === selectedRole)?.name } });
      toast.success('User role updated');
      setIsRoleModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <AppLayout><div className="flex justify-center py-12"><Spinner size="lg" /></div></AppLayout>;
  }

  if (!user) return null;

  const permissionsByModule = user.Role?.Permissions?.reduce((acc, perm) => {
    const module = perm.name.split('.')[0];
    if (!acc[module]) acc[module] = [];
    acc[module].push(perm.name);
    return acc;
  }, {}) || {};

  return (
    <AppLayout>
      <div className="mb-6">
        <button onClick={() => navigate('/users')} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
          ← Back to Users
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col items-center">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold mb-4">
                {user.first_name[0]}{user.last_name[0]}
              </div>
              <h2 className="text-xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
              <p className="text-gray-500 mb-4">{user.email}</p>
              <div className="flex gap-2 mb-6">
                <Badge variant="neutral">{user.Role?.name}</Badge>
                <Badge variant={user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : 'error'}>
                  {user.status}
                </Badge>
              </div>
              
              <div className="w-full space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Phone</span><span className="font-medium text-gray-900">{user.phone || 'N/A'}</span></div>
                <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Member Since</span><span className="font-medium text-gray-900">{formatDate(user.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Last Login</span><span className="font-medium text-gray-900">{formatDate(user.last_login)}</span></div>
              </div>
            </div>

            {hasPermission('USER.MANAGE') && (
              <div className="mt-8 space-y-3 pt-6 border-t border-gray-100">
                <Button fullWidth variant="outline" onClick={() => setIsRoleModalOpen(true)}>Change Role</Button>
                {user.status === 'ACTIVE' ? (
                  <Button fullWidth variant="warning" className="bg-amber-100 text-amber-800 hover:bg-amber-200" onClick={() => handleStatusChange('SUSPENDED')} loading={actionLoading}>Suspend User</Button>
                ) : (
                  <Button fullWidth variant="success" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200" onClick={() => handleStatusChange('ACTIVE')} loading={actionLoading}>Activate User</Button>
                )}
                {user.status !== 'DEACTIVATED' && (
                  <Button fullWidth variant="danger" onClick={() => handleStatusChange('DEACTIVATED')} loading={actionLoading}>Deactivate User</Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Permissions ({user.Role?.name})</h3>
            {Object.keys(permissionsByModule).length === 0 ? (
              <p className="text-gray-500">No specific permissions assigned.</p>
            ) : (
              <div className="space-y-6">
                {Object.entries(permissionsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <h4 className="text-sm font-semibold text-gray-700 uppercase mb-2 border-b pb-1">{module}</h4>
                    <div className="flex flex-wrap gap-2">
                      {perms.map(p => (
                        <Badge key={p} variant="info">{p.split('.')[1]}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={isRoleModalOpen} onClose={() => setIsRoleModalOpen(false)} title="Change Role">
        <div className="space-y-4">
          <Select 
            label="New Role" 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            options={roles.map(r => ({ value: r.id, label: r.name }))}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
            <Button onClick={handleRoleChange} loading={actionLoading}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}
