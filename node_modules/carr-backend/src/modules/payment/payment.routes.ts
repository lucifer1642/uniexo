import { Router } from 'express';
import { PaymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createPaymentSchema, verifyPaymentSchema } from '../../validators/payment.validator';

const router = Router();

// Webhook (no auth - validated by signature)
router.post('/webhook', PaymentController.webhook);

// Authenticated
router.post('/create-order', authenticate, isAuthenticated, validate(createPaymentSchema), PaymentController.createOrder);
router.post('/verify', authenticate, isAuthenticated, validate(verifyPaymentSchema), PaymentController.verifyPayment);
router.get('/my', authenticate, isAuthenticated, PaymentController.getUserPayments);
router.get('/:id', authenticate, isAuthenticated, PaymentController.getById);

// Admin
router.get('/', authenticate, isAdmin, PaymentController.getAllPayments);

export default router;
