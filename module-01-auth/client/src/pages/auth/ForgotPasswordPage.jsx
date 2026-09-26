import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AuthLayout from '../../layouts/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { validateEmail } from '../../utils/validation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/password/forgot', { email });
      const devOtp = res.data?.data?.devOtp;

      if (devOtp) {
        toast((t) => (
          <div>
            <p className="font-bold text-gray-900">OTP Sent!</p>
            <p className="text-xs text-gray-600 mt-1">🔑 Dev OTP Code: <span className="font-mono font-bold text-indigo-600 text-sm">{devOtp}</span></p>
          </div>
        ), { duration: 8000, icon: '📧' });
      } else {
        toast.success('If an account exists, an OTP has been sent to your email.');
      }

      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      toast.success('If an account exists, an OTP has been sent.');
      navigate('/verify-otp', { state: { email } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Forgot Password?</h2>
        <p className="mt-2 text-gray-600">Enter your email and we'll send you a reset code.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email address"
          name="email"
          type="email"
          icon={Mail}
          value={email}
          onChange={(e) => { setEmail(e.target.value); setError(null); }}
          error={error}
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Send OTP
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-gray-600">
        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Back to Sign In
        </Link>
      </p>
    </AuthLayout>
  );
}
