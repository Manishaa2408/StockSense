export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Invalid email format';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character';
  return null;
};

export const validateRequired = (value, fieldName) => {
  if (!value || value.toString().trim() === '') return `${fieldName} is required`;
  return null;
};

export const validateMatch = (val1, val2, fieldName) => {
  if (val1 !== val2) return `${fieldName} does not match`;
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null;
  const re = /^\+?[\d\s-]{10,}$/;
  if (!re.test(phone)) return 'Invalid phone number format';
  return null;
};

export const validateName = (name, fieldName) => {
  if (!name) return `${fieldName} is required`;
  if (name.length < 2 || name.length > 100) return `${fieldName} must be 2-100 characters`;
  if (!/^[a-zA-Z\s]+$/.test(name)) return `${fieldName} must contain only letters and spaces`;
  return null;
};
