const express = require('express');
const { authLimiter, otpLimiter } = require('../../middleware/rateLimiter');
const { validate, schemas } = require('./auth.validator');
const controller = require('./auth.controller');
const authenticate = require('../../middleware/authenticate');

const router = express.Router();

router.post('/register', authLimiter, validate(schemas.registerSchema), controller.register);
router.post('/login', authLimiter, validate(schemas.loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.getMe);
router.post('/password/forgot', otpLimiter, validate(schemas.forgotPasswordSchema), controller.forgotPassword);
router.post('/password/verify-otp', otpLimiter, validate(schemas.verifyOtpSchema), controller.verifyOtp);
router.post('/password/reset', validate(schemas.resetPasswordSchema), controller.resetPassword);

module.exports = router;
