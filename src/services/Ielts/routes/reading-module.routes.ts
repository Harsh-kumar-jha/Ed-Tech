import { Router } from 'express';
import { ReadingModuleController } from '../controller/reading-module.controller';
import { ReadingTestSessionController } from '../controller/reading-test-session.controller';
import { jwtMiddleware } from '../../Auth/middleware/jwt.middleware';
import { adminRoleMiddleware } from '../../Auth/middleware/role.middleware';

const router: Router = Router();
const readingController = new ReadingModuleController();
const sessionController = new ReadingTestSessionController();

// Apply JWT authentication middleware to all routes
router.use(jwtMiddleware);

// ===========================
// ADMIN ROUTES
// ===========================

/**
 * @route   POST /api/v1/reading/admin/bulk-upload
 * @desc    Bulk upload reading test sets from JSON array
 * @access  Admin only
 */
router.post('/admin/bulk-upload', adminRoleMiddleware, readingController.bulkUploadTestSets.bind(readingController));

/**
 * @route   GET /api/v1/reading/admin/test-sets
 * @desc    Get all reading test sets with pagination and filters
 * @access  Admin only
 * @query   page, limit, difficulty, isActive
 */
router.get('/admin/test-sets', adminRoleMiddleware, readingController.getReadingTestSets.bind(readingController));

/**
 * @route   GET /api/v1/reading/admin/test-sets/:id
 * @desc    Get specific reading test set by ID
 * @access  Admin only
 */
router.get(
  '/admin/test-sets/:id',
  adminRoleMiddleware,
  readingController.getReadingTestSetById.bind(readingController)
);

/**
 * @route   PUT /api/v1/reading/admin/test-sets/:id
 * @desc    Update reading test set
 * @access  Admin only
 */
router.put('/admin/test-sets/:id', adminRoleMiddleware, readingController.updateReadingTestSet.bind(readingController));

/**
 * @route   DELETE /api/v1/reading/admin/test-sets/:id
 * @desc    Delete reading test set
 * @access  Admin only
 */
router.delete(
  '/admin/test-sets/:id',
  adminRoleMiddleware,
  readingController.deleteReadingTestSet.bind(readingController)
);

/**
 * @route   GET /api/v1/reading/admin/statistics
 * @desc    Get reading module statistics
 * @access  Admin only
 */
router.get('/admin/statistics', adminRoleMiddleware, readingController.getTestStatistics.bind(readingController));

// ===========================
// STUDENT ROUTES
// ===========================

/**
 * @route   GET /api/v1/reading/get-test-set
 * @desc    Get random test set for user (excluding previously taken)
 * @access  Authenticated users
 */
router.get('/get-test-set', readingController.getRandomTestSetForUser.bind(readingController));

/**
 * @route   POST /api/v1/reading/start-test
 * @desc    Start a new reading test session
 * @access  Authenticated users
 */
router.post('/start-test', sessionController.startTest.bind(sessionController));

/**
 * @route   POST /api/v1/reading/begin-test/:attemptId
 * @desc    Mark test as started (when user actually begins)
 * @access  Authenticated users
 */
router.post('/begin-test/:attemptId', sessionController.beginTest.bind(sessionController));

/**
 * @route   POST /api/v1/reading/save-answer
 * @desc    Save answer for a question
 * @access  Authenticated users
 */
router.post('/save-answer', sessionController.saveAnswer.bind(sessionController));

/**
 * @route   POST /api/v1/reading/submit-test/:attemptId
 * @desc    Submit test and get results
 * @access  Authenticated users
 */
router.post('/submit-test/:attemptId', sessionController.submitTest.bind(sessionController));

/**
 * @route   GET /api/v1/reading/session-status/:attemptId
 * @desc    Get test session status
 * @access  Authenticated users
 */
router.get('/session-status/:attemptId', sessionController.getSessionStatus.bind(sessionController));

/**
 * @route   GET /api/v1/reading/my-tests
 * @desc    Get user's reading test history
 * @access  Authenticated users
 */
router.get('/my-tests', sessionController.getUserTestHistory.bind(sessionController));

/**
 * @route   GET /api/v1/reading/my-analytics
 * @desc    Get user's reading analytics
 * @access  Authenticated users
 */
router.get('/my-analytics', sessionController.getUserAnalytics.bind(sessionController));

export default router;
