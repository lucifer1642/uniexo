import { Router } from 'express';
import { BookingController } from './booking.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAdminOrVendor, isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createBookingSchema, updateBookingStatusSchema, bookingQuerySchema } from '../../validators/booking.validator';

const router = Router();

router.use(authenticate);

router.post('/', isAuthenticated, validate(createBookingSchema), BookingController.create);
router.get('/my', isAuthenticated, validate(bookingQuerySchema), BookingController.getUserBookings);
router.get('/vendor', isAdminOrVendor, validate(bookingQuerySchema), BookingController.getVendorBookings);
router.get('/:id', isAuthenticated, BookingController.getById);
router.patch('/:id/status', isAuthenticated, validate(updateBookingStatusSchema), BookingController.updateStatus);

// Admin
router.get('/', isAdmin, validate(bookingQuerySchema), BookingController.getAllBookings);

export default router;
