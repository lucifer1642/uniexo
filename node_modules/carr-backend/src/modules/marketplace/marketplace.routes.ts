import { Router } from 'express';
import { MarketplaceController } from './marketplace.controller';
import { authenticate } from '../../middleware/auth';
import { isAuthenticated } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import { upload } from '../../middleware/upload';
import {
  createMarketplaceItemSchema,
  updateMarketplaceItemSchema,
  reportItemSchema,
  sendMessageSchema,
  marketplaceQuerySchema,
  createOfferSchema,
  updateOfferStatusSchema,
} from '../../validators/marketplace.validator';

const router = Router();

// Public
router.get('/', validate(marketplaceQuerySchema), MarketplaceController.listPublic);
router.get('/:id', MarketplaceController.getById);

// Authenticated
router.post('/', authenticate, isAuthenticated, upload.array('images', 10), validate(createMarketplaceItemSchema), MarketplaceController.createItem);
router.patch('/:id', authenticate, isAuthenticated, validate(updateMarketplaceItemSchema), MarketplaceController.update);
router.post('/:id/images', authenticate, isAuthenticated, upload.array('images', 10), MarketplaceController.uploadImages);
router.delete('/:id', authenticate, isAuthenticated, MarketplaceController.delete);
router.get('/user/my-items', authenticate, isAuthenticated, MarketplaceController.getUserItems);
router.post('/:id/report', authenticate, isAuthenticated, validate(reportItemSchema), MarketplaceController.reportItem);

// Chat
router.post('/messages', authenticate, isAuthenticated, validate(sendMessageSchema), MarketplaceController.sendMessage);
router.get('/messages/conversations', authenticate, isAuthenticated, MarketplaceController.getUserConversations);
router.get('/messages/:otherUserId', authenticate, isAuthenticated, MarketplaceController.getConversation);

// Offers
router.post('/offers', authenticate, isAuthenticated, validate(createOfferSchema), MarketplaceController.createOffer);
router.patch('/offers/:id/status', authenticate, isAuthenticated, validate(updateOfferStatusSchema), MarketplaceController.updateOfferStatus);
router.get('/offers/buyer', authenticate, isAuthenticated, MarketplaceController.getUserOffersAsBuyer);
router.get('/offers/seller', authenticate, isAuthenticated, MarketplaceController.getUserOffersAsSeller);
router.get('/:itemId/offers', authenticate, isAuthenticated, MarketplaceController.getOffersForItem);

export default router;
