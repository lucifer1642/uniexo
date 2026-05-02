import { Router } from 'express';
import { VehicleController } from './vehicle.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAdminOrVendor, isApprovedVendor } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import {
  createVehicleSchema,
  updateVehicleSchema,
  vehicleAvailabilitySchema,
  vehicleQuerySchema,
} from '../../validators/vehicle.validator';

const router = Router();

// Public routes
router.get('/', validate(vehicleQuerySchema), VehicleController.listPublic);
router.get('/:id', VehicleController.getById);

// Vendor routes
router.post(
  '/',
  authenticate,
  isApprovedVendor,
  upload.array('images', 10),
  validate(createVehicleSchema),
  VehicleController.create,
);
router.patch(
  '/:id',
  authenticate,
  isApprovedVendor,
  validate(updateVehicleSchema),
  VehicleController.update,
);
router.post(
  '/:id/images',
  authenticate,
  isApprovedVendor,
  upload.array('images', 10),
  VehicleController.uploadImages,
);
router.patch(
  '/:id/availability',
  authenticate,
  isApprovedVendor,
  validate(vehicleAvailabilitySchema),
  VehicleController.setAvailability,
);
router.delete('/:id', authenticate, isApprovedVendor, VehicleController.delete);
router.get('/vendor/my-vehicles', authenticate, isAdminOrVendor, VehicleController.listByVendor);
router.get('/vendor/fleet', authenticate, isAdminOrVendor, VehicleController.getFleet);
router.post('/:id/dispatch', authenticate, isApprovedVendor, VehicleController.dispatch);
router.post('/:id/return', authenticate, isApprovedVendor, VehicleController.returnVehicle);

// Admin routes
router.patch('/:id/approval', authenticate, isAdmin, VehicleController.approve);

export default router;
