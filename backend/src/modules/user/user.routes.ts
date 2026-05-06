import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import { updateProfileSchema, changePasswordSchema } from '../../validators/user.validator';

const router = Router();

router.use(authenticate);

router.get('/profile', UserController.getProfile);
router.patch('/profile', validate(updateProfileSchema), UserController.updateProfile);
router.post('/avatar', upload.single('avatar'), UserController.uploadAvatar);
router.post('/id-card', upload.single('idCard'), UserController.uploadIdCard);
router.post('/kyc', upload.fields([
  { name: 'idProof', maxCount: 1 },
  { name: 'businessProof', maxCount: 1 }
]), UserController.submitKyc);
router.post('/change-password', validate(changePasswordSchema), UserController.changePassword);
router.delete('/account', UserController.deleteAccount);

// Notifications (Dummy endpoints to satisfy frontend hooks)
router.get('/notifications', (_req, res) => ResponseFormatter.ok(res, 'Notifications fetched', []));
router.patch('/notifications/:id/read', (_req, res) => ResponseFormatter.ok(res, 'Notification marked as read'));
router.post('/notifications/read-all', (_req, res) => ResponseFormatter.ok(res, 'All notifications marked as read'));

export default router;
