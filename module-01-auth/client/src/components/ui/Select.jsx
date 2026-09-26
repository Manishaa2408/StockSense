import React from 'react';

export default function Select({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  required = false,
  placeholder,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`block w-full rounded-lg sm:text-sm py-2 pl-3 pr-10 border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
          error ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500' : ''
        } ${disabled ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
