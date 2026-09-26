const nodemailer = require('nodemailer');
const config = require('./env');
const logger = require('../utils/logger');

let transporter;

if (config.MAIL_USER && config.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: config.MAIL_HOST,
    port: config.MAIL_PORT,
    auth: {
      user: config.MAIL_USER,
      pass: config.MAIL_PASS
    }
  });
}

const sendMail = async (to, subject, html) => {
  try {
    // Extract OTP if present for high-visibility server logging
    const otpMatch = html.match(/>([0-9]{6})</);
    const otp = otpMatch ? otpMatch[1] : null;

    if (otp) {
      console.log(`\n==============================================`);
      console.log(`📧 [EMAIL SENT / DEV OTP PREVIEW]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`🔑 OTP Code: ${otp}`);
      console.log(`==============================================\n`);
    }

    if (transporter) {
      const info = await transporter.sendMail({
        from: config.MAIL_FROM || 'noreply@stocksense.com',
        to,
        subject,
        html
      });
      logger.info(`Email successfully dispatched via SMTP to ${to}`);
      return info;
    } else {
      logger.info(`No SMTP credentials configured. Email logged to console above for local testing.`);
      return { messageId: 'simulated-dev-id' };
    }
  } catch (error) {
    logger.warn(`Failed to dispatch email via SMTP to ${to}: ${error.message}`);
  }
};

module.exports = { sendMail };
