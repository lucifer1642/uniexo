import { Router } from 'express';
import { WalletController } from './wallet.controller';
import { authenticate } from '../../middleware/auth';
import { isAuthenticated } from '../../middleware/rbac';

const router = Router();

router.use(authenticate, isAuthenticated);

router.get('/', WalletController.getWallet);
router.get('/transactions', WalletController.getTransactions);

export default router;
