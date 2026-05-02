import { Router } from 'express';
import { LaundryController } from './laundry.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createLaundryServiceSchema,
  createLaundryOrderSchema,
  updateOrderStatusSchema,
} from '../../validators/laundry.validator';

const router = Router();

// Public
router.get('/services', LaundryController.listServices);
router.get('/services/:id', LaundryController.getServiceById);

// User
router.post('/orders', authenticate, isAuthenticated, validate(createLaundryOrderSchema), LaundryController.placeOrder);
router.get('/orders/my', authenticate, isAuthenticated, LaundryController.getUserOrders);
router.get('/orders/:id', authenticate, isAuthenticated, LaundryController.getOrderById);

// Vendor — manage own laundry service
router.get('/vendor/my-service', authenticate, isAuthenticated, LaundryController.getMyService);
router.patch('/vendor/my-service', authenticate, isAuthenticated, LaundryController.updateMyService);
router.get('/vendor/orders', authenticate, isAuthenticated, LaundryController.getVendorOrders);
router.patch('/vendor/orders/:id/status', authenticate, isAuthenticated, LaundryController.updateVendorOrderStatus);

// Admin
router.post('/services', authenticate, isAdmin, validate(createLaundryServiceSchema), LaundryController.createService);
router.patch('/services/:id', authenticate, isAdmin, LaundryController.updateService);
router.delete('/services/:id', authenticate, isAdmin, LaundryController.deleteService);
router.patch('/orders/:id/status', authenticate, isAdmin, validate(updateOrderStatusSchema), LaundryController.updateOrderStatus);
router.get('/orders', authenticate, isAdmin, LaundryController.listAllOrders);

export default router;
