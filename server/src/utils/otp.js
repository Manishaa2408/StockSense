const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const generateOtp = () => {
  const otp = crypto.randomInt(100000, 999999);
  return otp.toString();
};

const hashOtp = async (otp) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(otp, salt);
};

const verifyOtp = async (otp, hash) => {
  return bcrypt.compare(otp, hash);
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp
};
