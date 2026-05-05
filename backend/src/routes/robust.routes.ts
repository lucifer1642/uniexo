import { Router } from 'express';
import { RobustVendorController } from '../modules/vendor/robust.controller';
import { authenticate } from '../middleware/auth';
import { isApprovedVendor } from '../middleware/rbac';
import { upload } from '../middleware/upload';

const router = Router();

/**
 * Robust Backend Routes
 * These routes are designed to be independent of the main service routes
 * to provide a fail-safe listing mechanism for vendors.
 */

// All robust routes require authentication and vendor approval
router.use(authenticate);
router.use(isApprovedVendor);

// House
router.get('/houses', RobustVendorController.getMyHouses);
router.get('/houses/vendor/my-houses', RobustVendorController.getMyHouses);
router.post('/houses', upload.array('images', 10), RobustVendorController.createHouse);

// Vehicle
router.get('/vehicles', RobustVendorController.getMyVehicles);
router.get('/vehicles/vendor/my-vehicles', RobustVendorController.getMyVehicles);
router.post('/vehicles', upload.array('images', 10), RobustVendorController.createVehicle);

// Marketplace
router.get('/marketplace', RobustVendorController.getMyMarketplaceItems);
router.get('/marketplace/vendor/my-items', RobustVendorController.getMyMarketplaceItems);
router.post('/marketplace', upload.array('images', 10), RobustVendorController.createMarketplaceItem);

// Laundry
router.get('/laundry', RobustVendorController.getMyLaundryService);
router.post('/laundry', upload.array('images', 10), RobustVendorController.createLaundryService);

export default router;
