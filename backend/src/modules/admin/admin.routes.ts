import { Router } from 'express';
import { AdminController } from './admin.controller';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin } from '../../middleware/rbac';

const router = Router();

router.use(authenticate, isAdmin);

// Deep Analytics & KPIs
router.get('/analytics/kpi', AnalyticsController.getKpiStats);
router.get('/analytics/revenue', AnalyticsController.getRevenueTrends);
router.get('/analytics/modules', AnalyticsController.getModuleInsights);
router.get('/analytics/conversion', AnalyticsController.getConversionFunnel);

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.listUsers);
router.patch('/users/:userId/suspend', AdminController.suspendUser);
router.get('/reports', AdminController.getReportedItems);
router.get('/kyc', AdminController.listKycRequests);
router.patch('/kyc/:kycId', AdminController.processKycRequest);
router.delete('/reports/:itemId', AdminController.removeReportedItem);
router.get('/settings', AdminController.getSettings);
router.post('/settings', AdminController.updateSetting);
router.post('/commission', AdminController.setCommission);
router.get('/transactions', AdminController.getTransactions);
router.post('/backfill-vendors', AdminController.backfillVendorProfiles);

// Rank Optimization
router.get('/rank/:category', AdminController.getVendorsByCategory);
router.patch('/rank/:vendorProfileId', AdminController.updateVendorRank);

export default router;
