import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authLimiter, otpLimiter } from '../../middleware/rateLimiter';
import {
  signupSchema,
  verifyOTPSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resendOTPSchema,
} from '../../validators/auth.validator';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), AuthController.signup);
router.post('/verify-otp', otpLimiter, validate(verifyOTPSchema), AuthController.verifyOTP);
router.post('/login', authLimiter, validate(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', otpLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', otpLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post('/resend-otp', otpLimiter, validate(resendOTPSchema), AuthController.resendOTP);

export default router;
