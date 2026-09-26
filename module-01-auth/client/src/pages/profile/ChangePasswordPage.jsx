import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AppLayout from '../../layouts/AppLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { validatePassword, validateMatch, validateRequired } from '../../utils/validation';

export default function ChangePasswordPage() {
  const [formData, setFormData] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      current_password: validateRequired(formData.current_password, 'Current Password'),
      new_password: validatePassword(formData.new_password),
      confirm_password: validateMatch(formData.new_password, formData.confirm_password, 'Passwords'),
    };
    if (formData.new_password === formData.current_password) {
      newErrors.new_password = 'New password must be different from current';
    }

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await api.patch('/profile/password', {
        current_password: formData.current_password,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      toast.success('Password changed successfully');
      navigate('/profile');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-md mx-auto mt-8">
        <div className="mb-6">
          <button onClick={() => navigate('/profile')} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            ← Back to Profile
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Change Password</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Current Password"
              name="current_password"
              type="password"
              icon={Lock}
              value={formData.current_password}
              onChange={(e) => setFormData({...formData, current_password: e.target.value})}
              error={errors.current_password}
              required
            />
            
            <div>
              <Input
                label="New Password"
                name="new_password"
                type="password"
                icon={Lock}
                value={formData.new_password}
                onChange={(e) => setFormData({...formData, new_password: e.target.value})}
                error={errors.new_password}
                required
              />
              {formData.new_password && (
                <PasswordRequirements password={formData.new_password} />
              )}
            </div>

            <Input
              label="Confirm New Password"
              name="confirm_password"
              type="password"
              icon={Lock}
              value={formData.confirm_password}
              onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
              error={errors.confirm_password}
              required
            />

            <div className="pt-4">
              <Button type="submit" fullWidth loading={loading}>
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
