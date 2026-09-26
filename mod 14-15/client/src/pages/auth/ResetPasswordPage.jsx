import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PasswordRequirements from '../../components/auth/PasswordRequirements';
import { validatePassword, validateMatch } from '../../utils/validation';

export default function ResetPasswordPage() {
  const [formData, setFormData] = useState({ new_password: '', confirm_password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};

  useEffect(() => {
    if (!email || !otp) navigate('/forgot-password');
  }, [email, otp, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {
      new_password: validatePassword(formData.new_password),
      confirm_password: validateMatch(formData.new_password, formData.confirm_password, 'Passwords'),
    };

    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/password/reset', {
        email,
        otp,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Reset Password</h2>
        <p className="mt-2 text-gray-600">Enter your new password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Input
            label="New Password"
            name="new_password"
            type="password"
            icon={Lock}
            value={formData.new_password}
            onChange={(e) => { setFormData({ ...formData, new_password: e.target.value }); setErrors({ ...errors, new_password: null }); }}
            error={errors.new_password}
            required
          />
          {formData.new_password && (
            <PasswordRequirements password={formData.new_password} />
          )}
        </div>

        <Input
          label="Confirm Password"
          name="confirm_password"
          type="password"
          icon={Lock}
          value={formData.confirm_password}
          onChange={(e) => { setFormData({ ...formData, confirm_password: e.target.value }); setErrors({ ...errors, confirm_password: null }); }}
          error={errors.confirm_password}
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  );
}
