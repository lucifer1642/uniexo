import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();

router.post('/send-signup-otp', AuthController.sendSignupOtp);
router.post('/send-login-otp', AuthController.sendLoginOtp);
router.post('/verify-login-otp', AuthController.verifyLoginOtp);

export default router;
