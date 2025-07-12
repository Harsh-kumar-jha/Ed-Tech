import { Router } from 'express';
import { GlobalTestSessionController } from '../controller/global-test-session.controller';
import { jwtMiddleware } from '../../Auth/middleware/jwt.middleware';
import { adminRoleMiddleware } from '../../Auth/middleware/role.middleware';

const router: Router = Router();
const globalSessionController = new GlobalTestSessionController();

// Apply JWT authentication middleware to all routes
router.use(jwtMiddleware);

// ===========================
// USER ROUTES
// ===========================

/**
 * @route   GET /api/v1/test-session/active
 * @desc    Get user's active test session across all modules
 * @access  Authenticated users
 */
router.get('/active', globalSessionController.getActiveSession.bind(globalSessionController));

/**
 * @route   POST /api/v1/test-session/abandon
 * @desc    Abandon current active test session
 * @access  Authenticated users
 */
router.post('/abandon', globalSessionController.abandonActiveSession.bind(globalSessionController));

/**
 * @route   GET /api/v1/test-session/history
 * @desc    Get user's test session history across all modules
 * @access  Authenticated users
 * @query   page, limit
 */
router.get('/history', globalSessionController.getSessionHistory.bind(globalSessionController));

// ===========================
// ADMIN ROUTES
// ===========================

/**
 * @route   POST /api/v1/test-session/cleanup-expired
 * @desc    Clean up expired test sessions
 * @access  Admin only
 */
router.post(
  '/cleanup-expired',
  adminRoleMiddleware,
  globalSessionController.cleanupExpiredSessions.bind(globalSessionController)
);

export default router;
