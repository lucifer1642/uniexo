import { Router } from 'express';
import { VendorController } from './vendor.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { vendorRegistrationSchema, vendorApprovalSchema, updateVendorProfileSchema } from '../../validators/vendor.validator';

const router = Router();

router.use(authenticate);

// ── REGISTRATION & PROFILE ──────────────────────────────────────────────────
router.post('/register', validate(vendorRegistrationSchema), VendorController.register);
router.get('/profile', VendorController.getProfile);
router.patch('/profile', validate(updateVendorProfileSchema), VendorController.updateProfile);
router.post('/documents', upload.array('documents', 5), VendorController.uploadDocuments);
router.get('/dashboard/stats', VendorController.getDashboardStats);

// ── ANALYTICS ────────────────────────────────────────────────────────────────
router.get('/analytics/overview', VendorController.getAnalyticsOverview);
router.get('/analytics/sales', VendorController.getSalesBreakdown);
router.get('/analytics/ledger', VendorController.getLedgerBook);
router.get('/analytics/dues', VendorController.getDueAmounts);
router.get('/analytics/trends', VendorController.getBookingTrends);
router.get('/analytics/revenue-series', VendorController.getRevenueTimeSeries);
router.get('/analytics/room-occupancy', VendorController.getRoomOccupancy);

// ── ADMIN ───────────────────────────────────────────────────────────────────
router.get('/', isAdmin, VendorController.listVendors);
router.patch('/:vendorId/approval', isAdmin, validate(vendorApprovalSchema), VendorController.approve);

export default router;
