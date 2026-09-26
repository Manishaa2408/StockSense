import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import useAuth from '../../hooks/useAuth';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { validateName, validatePhone } from '../../utils/validation';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      first_name: validateName(formData.first_name, 'First Name'),
      last_name: validateName(formData.last_name, 'Last Name'),
      phone: validatePhone(formData.phone),
    };

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.put('/profile', formData);
      updateUser(data.data);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 border-b border-gray-100">
            <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-3xl font-bold">
              {user?.first_name[0]}{user?.last_name[0]}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-2xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h2>
              <p className="text-gray-500 mb-2">{user?.email}</p>
              <Badge variant="neutral">{user?.Role?.name}</Badge>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="First Name" name="first_name" value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} error={errors.first_name} required />
                <Input label="Last Name" name="last_name" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} error={errors.last_name} required />
              </div>
              <Input label="Email" name="email" value={user?.email || ''} disabled className="bg-gray-50" />
              <Input label="Phone" name="phone" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} error={errors.phone} />
              
              <div className="pt-4 flex justify-end">
                <Button type="submit" loading={loading}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Security</h3>
            <p className="text-sm text-gray-500 mt-1">Update your password to keep your account secure.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/profile/change-password')}>
            Change Password
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
