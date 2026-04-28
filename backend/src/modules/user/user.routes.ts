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
router.post('/kyc', UserController.submitKyc);
router.post('/change-password', validate(changePasswordSchema), UserController.changePassword);
router.delete('/account', UserController.deleteAccount);

export default router;
