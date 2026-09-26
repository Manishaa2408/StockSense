import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/ui/Button';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/forgot-password');
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    pastedData.forEach((char, index) => {
      if (!isNaN(char) && index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);
    if (pastedData.length > 0) {
      inputRefs.current[Math.min(pastedData.length, 5)].focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    try {
      setLoading(true);
      await api.post('/auth/password/verify-otp', { email, otp: otpValue });
      navigate('/reset-password', { state: { email, otp: otpValue } });
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await api.post('/auth/password/forgot', { email });
      setCountdown(60);
      toast.success('OTP resent');
    } catch (err) {
      toast.error('Failed to resend OTP');
    }
  };

  return (
    <AuthLayout>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900">Verify OTP</h2>
        <p className="mt-2 text-gray-600">Enter the 6-digit code sent to {email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-12 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-indigo-500"
            />
          ))}
        </div>

        <Button type="submit" fullWidth loading={loading} disabled={otp.join('').length !== 6}>
          Verify
        </Button>

        <div className="text-center text-sm">
          {countdown > 0 ? (
            <span className="text-gray-500">Resend in {countdown}s</span>
          ) : (
            <button type="button" onClick={handleResend} className="text-indigo-600 font-medium hover:text-indigo-500">
              Resend OTP
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
