import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { vendorRegistrationSchema, vendorApprovalSchema, updateVendorProfileSchema } from '../../validators/vendor.validator';

const router = Router();

router.use(authenticate);

router.post('/register', isAuthenticated, validate(vendorRegistrationSchema), VendorController.register);
router.get('/profile', isAuthenticated, VendorController.getProfile);
router.patch('/profile', isAuthenticated, validate(updateVendorProfileSchema), VendorController.updateProfile);
router.post('/documents', isAuthenticated, upload.array('documents', 5), VendorController.uploadDocuments);
router.get('/dashboard/stats', isAuthenticated, VendorController.getDashboardStats);

// ─── Analytics Routes ───────────────────────────────────────────────────
router.get('/analytics/overview', isAuthenticated, VendorController.getAnalyticsOverview);
router.get('/analytics/sales', isAuthenticated, VendorController.getSalesBreakdown);
router.get('/analytics/ledger', isAuthenticated, VendorController.getLedgerBook);
router.get('/analytics/dues', isAuthenticated, VendorController.getDueAmounts);
router.get('/analytics/trends', isAuthenticated, VendorController.getBookingTrends);
router.get('/analytics/revenue-series', isAuthenticated, VendorController.getRevenueTimeSeries);
router.get('/analytics/room-occupancy', isAuthenticated, VendorController.getRoomOccupancy);

// ─── Admin Routes ────────────────────────────────────────────────────────
router.get('/', isAdmin, VendorController.listVendors);
router.patch('/:vendorId/approval', isAdmin, validate(vendorApprovalSchema), VendorController.approve);

export default router;
