const getTimestamp = () => new Date().toISOString();

const formatMessage = (level, message) => `[${getTimestamp()}] [${level.toUpperCase()}]: ${message}`;

const logger = {
  info: (message) => console.log(formatMessage('info', message)),
  warn: (message) => console.warn(formatMessage('warn', message)),
  error: (message) => console.error(formatMessage('error', message)),
  debug: (message) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message));
    }
  }
};

const sanitizeData = (data) => {
  if (!data) return data;
  const sanitized = { ...data };
  const sensitiveFields = ['password', 'otp', 'token', 'password_hash'];
  for (const key of Object.keys(sanitized)) {
    if (sensitiveFields.includes(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
};

const logEvent = (eventName, data = {}) => {
  const sanitized = sanitizeData(data);
  console.log(`[EVENT] ${eventName} - ${JSON.stringify(sanitized)}`);
};

module.exports = { ...logger, logEvent };
