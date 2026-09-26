import React from 'react';
import { Check, X } from 'lucide-react';

export const getPasswordCriteria = (password = '') => {
  return [
    { id: 'length', label: 'At least 8 characters long', met: password.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(password) },
    { id: 'lowercase', label: 'At least one lowercase letter (a-z)', met: /[a-z]/.test(password) },
    { id: 'number', label: 'At least one number (0-9)', met: /[0-9]/.test(password) },
    { id: 'special', label: 'At least one special character (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];
};

export const isPasswordValid = (password = '') => {
  return getPasswordCriteria(password).every((c) => c.met);
};

export default function PasswordRequirements({ password = '' }) {
  const criteria = getPasswordCriteria(password);
  const allMet = criteria.every(c => c.met);

  return (
    <div className={`mt-2 p-3 rounded-lg text-xs space-y-1.5 transition-all duration-200 ${
      allMet ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-gray-700">Password Requirements:</p>
        <span className={`text-[11px] font-medium ${allMet ? 'text-emerald-600' : 'text-gray-500'}`}>
          {criteria.filter(c => c.met).length} of {criteria.length} met
        </span>
      </div>
      {criteria.map((item) => (
        <div 
          key={item.id} 
          className={`flex items-center space-x-2 transition-colors duration-150 ${
            item.met ? 'text-emerald-700 font-medium' : 'text-gray-500'
          }`}
        >
          {item.met ? (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center">
              <Check className="w-3 h-3 text-emerald-600" />
            </span>
          ) : (
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
              <X className="w-3 h-3 text-gray-400" />
            </span>
          )}
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
