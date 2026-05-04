import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

// OTP send endpoints
router.post('/send-signup-otp', AuthController.sendSignupOtp);
router.post('/send-login-otp', AuthController.sendLoginOtp);

// Unified OTP verification (accepts purpose in body)
router.post('/verify-otp', AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);

// Legacy endpoint (backward compatible — delegates to unified verify)
router.post('/verify-login-otp', AuthController.verifyLoginOtp);

export default router;
