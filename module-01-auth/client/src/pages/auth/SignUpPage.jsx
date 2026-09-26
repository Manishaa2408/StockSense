import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PasswordRequirements, { isPasswordValid } from '../../components/auth/PasswordRequirements';
import { validateEmail, validatePassword, validateMatch, validateName, validatePhone } from '../../utils/validation';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', password: '', confirm_password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = {
      first_name: validateName(formData.first_name, 'First Name'),
      last_name: validateName(formData.last_name, 'Last Name'),
      email: validateEmail(formData.email),
      phone: validatePhone(formData.phone),
      password: validatePassword(formData.password),
      confirm_password: validateMatch(formData.password, formData.confirm_password, 'Passwords'),
    };
    
    if (Object.values(newErrors).some(Boolean)) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      await signup(formData);
      toast.success('Account created successfully! Please sign in.');
      navigate('/login');
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-2 text-gray-600">Get started with StockSense</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" name="first_name" icon={User} value={formData.first_name} onChange={handleChange} error={errors.first_name} required />
          <Input label="Last Name" name="last_name" icon={User} value={formData.last_name} onChange={handleChange} error={errors.last_name} required />
        </div>
        <Input label="Email address" name="email" type="email" icon={Mail} value={formData.email} onChange={handleChange} error={errors.email} required />
        <Input label="Phone (Optional)" name="phone" icon={Phone} value={formData.phone} onChange={handleChange} error={errors.phone} />
        
        <div>
          <Input label="Password" name="password" type="password" icon={Lock} value={formData.password} onChange={handleChange} error={errors.password} required />
          {formData.password && (
            <PasswordRequirements password={formData.password} />
          )}
        </div>

        <Input label="Confirm Password" name="confirm_password" type="password" icon={Lock} value={formData.confirm_password} onChange={handleChange} error={errors.confirm_password} required />

        <Button type="submit" fullWidth loading={loading} className="mt-6">Sign Up</Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
