import { Router } from 'express';
import { ReviewController } from './review.controller';
import { authenticate } from '../../middleware/auth';
import { isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { createReviewSchema } from '../../validators/review.validator';

const router = Router();

router.get('/:serviceId', ReviewController.getServiceReviews);
router.get('/:serviceId/average', ReviewController.getAverageRating);

router.post('/', authenticate, isAuthenticated, validate(createReviewSchema), ReviewController.create);
router.delete('/:id', authenticate, isAuthenticated, ReviewController.delete);

export default router;
