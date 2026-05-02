import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import vendorRoutes from '../modules/vendor/vendor.routes';
import vehicleRoutes from '../modules/vehicle/vehicle.routes';
import houseRoutes from '../modules/house/house.routes';
import laundryRoutes from '../modules/laundry/laundry.routes';
import marketplaceRoutes from '../modules/marketplace/marketplace.routes';
import bookingRoutes from '../modules/booking/booking.routes';
import paymentRoutes from '../modules/payment/payment.routes';
import walletRoutes from '../modules/wallet/wallet.routes';
import adminRoutes from '../modules/admin/admin.routes';
import reviewRoutes from '../modules/review/review.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vendors', vendorRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/houses', houseRoutes);
router.use('/laundry', laundryRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);
router.use('/reviews', reviewRoutes);

export default router;
