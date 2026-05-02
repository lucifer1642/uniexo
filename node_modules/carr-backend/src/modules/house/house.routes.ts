import { Router } from 'express';
import { HouseController } from './house.controller';
import { authenticate } from '../../middleware/auth';
import { isAdmin, isAdminOrVendor, isApprovedVendor } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { createHouseSchema, updateHouseSchema, houseQuerySchema } from '../../validators/house.validator';

const router = Router();

// Public
router.get('/', validate(houseQuerySchema), HouseController.listPublic);
router.get('/:id', HouseController.getById);

// Vendor
router.post('/', authenticate, isApprovedVendor, upload.array('images', 10), validate(createHouseSchema), HouseController.create);
router.patch('/:id', authenticate, isApprovedVendor, validate(updateHouseSchema), HouseController.update);
router.post('/:id/images', authenticate, isApprovedVendor, upload.array('images', 10), HouseController.uploadImages);
router.delete('/:id', authenticate, isApprovedVendor, HouseController.delete);
router.get('/vendor/my-houses', authenticate, isAdminOrVendor, HouseController.listByVendor);

// Admin
router.patch('/:id/approval', authenticate, isAdmin, HouseController.approve);

export default router;
