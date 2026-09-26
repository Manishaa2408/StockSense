import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder = '',
  icon: Icon,
  disabled = false,
  className = '',
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          </div>
        )}
        <input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`block w-full rounded-lg sm:text-sm transition-colors ${
            Icon ? 'pl-10' : 'pl-3'
          } ${
            isPassword ? 'pr-10' : 'pr-3'
          } py-2 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''
          } ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
