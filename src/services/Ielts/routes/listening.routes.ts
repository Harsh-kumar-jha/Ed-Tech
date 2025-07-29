import { Router } from 'express';
import { ListeningTestController } from '../controller/listening-test.controller';
import { ListeningSessionController } from '../controller/listening-session.controller';
import { jwtMiddleware } from '../../Auth/middleware/jwt.middleware';
import { adminRoleMiddleware } from '../../Auth/middleware/role.middleware';
import { createAdvancedUpload } from '../../../common/multer-upload.middleware';
import { validateAudioUpload } from '../../../common/file-validation.middleware';
import { LISTENING_CONFIG } from '../../../constants/listening-config';

const router: Router = Router();
const testController = new ListeningTestController();
const sessionController = new ListeningSessionController();

// Apply JWT authentication middleware to all routes
router.use(jwtMiddleware);

// ===========================
// ADMIN ROUTES - Test Management
// ===========================

/**
 * @route   POST /api/v1/listening/admin/tests
 * @desc    Create a new listening test
 * @access  Admin only
 */
router.post('/admin/tests', 
  adminRoleMiddleware,
  testController.createTest.bind(testController)
);

/**
 * @route   POST /api/v1/listening/admin/tests/:testId/audio
 * @desc    Upload audio file for a listening test
 * @access  Admin only
 */
router.post('/admin/tests/:testId/audio',
  adminRoleMiddleware,
  createAdvancedUpload('audio', {
    allowedMimeTypes: [
      'audio/mpeg',
      'audio/wav', 
      'audio/mp4',
      'audio/x-m4a',
      'audio/aac'
    ],
    limits: {
      fileSize: LISTENING_CONFIG.AUDIO.MAX_FILE_SIZE
    }
  }),
  validateAudioUpload,
  testController.uploadAudio.bind(testController)
);

/**
 * @route   GET /api/v1/listening/admin/tests
 * @desc    Get all listening tests with pagination and filtering
 * @access  Admin only
 */
router.get('/admin/tests',
  adminRoleMiddleware,
  testController.getTests.bind(testController)
);

/**
 * @route   GET /api/v1/listening/admin/tests/:testId
 * @desc    Get single listening test by ID
 * @access  Admin only
 */
router.get('/admin/tests/:testId',
  adminRoleMiddleware,
  testController.getTestById.bind(testController)
);

/**
 * @route   PUT /api/v1/listening/admin/tests/:testId
 * @desc    Update listening test
 * @access  Admin only
 */
router.put('/admin/tests/:testId',
  adminRoleMiddleware,
  testController.updateTest.bind(testController)
);

/**
 * @route   DELETE /api/v1/listening/admin/tests/:testId
 * @desc    Delete listening test
 * @access  Admin only
 */
router.delete('/admin/tests/:testId',
  adminRoleMiddleware,
  testController.deleteTest.bind(testController)
);

/**
 * @route   GET /api/v1/listening/admin/tests/:testId/statistics
 * @desc    Get detailed test statistics
 * @access  Admin only
 */
router.get('/admin/tests/:testId/statistics',
  adminRoleMiddleware,
  testController.getTestStatistics.bind(testController)
);

// ===========================
// STUDENT ROUTES - Test Taking
// ===========================

/**
 * @route   GET /api/v1/listening/tests
 * @desc    Get active listening tests available to students
 * @access  Authenticated users
 */
router.get('/tests',
  testController.getActiveTests.bind(testController)
);

/**
 * @route   POST /api/v1/listening/start
 * @desc    Start a new listening test session
 * @access  Authenticated users
 */
router.post('/start',
  sessionController.startTest.bind(sessionController)
);

/**
 * @route   GET /api/v1/listening/session/active
 * @desc    Get current active listening session
 * @access  Authenticated users
 */
router.get('/session/active',
  sessionController.getActiveSession.bind(sessionController)
);

/**
 * @route   PUT /api/v1/listening/session/:attemptId/progress
 * @desc    Update progress of current listening session
 * @access  Authenticated users
 */
router.put('/session/:attemptId/progress',
  sessionController.updateProgress.bind(sessionController)
);

/**
 * @route   POST /api/v1/listening/submit
 * @desc    Submit answers and complete listening test
 * @access  Authenticated users
 */
router.post('/submit',
  sessionController.submitAnswers.bind(sessionController)
);

/**
 * @route   POST /api/v1/listening/session/:attemptId/abandon
 * @desc    Abandon current listening session
 * @access  Authenticated users
 */
router.post('/session/:attemptId/abandon',
  sessionController.abandonSession.bind(sessionController)
);

/**
 * @route   GET /api/v1/listening/session/:attemptId/stats
 * @desc    Get session statistics and progress
 * @access  Authenticated users
 */
router.get('/session/:attemptId/stats',
  sessionController.getSessionStats.bind(sessionController)
);

// ===========================
// USER ANALYTICS & HISTORY
// ===========================

/**
 * @route   GET /api/v1/listening/history
 * @desc    Get user's listening test history
 * @access  Authenticated users
 */
router.get('/history',
  sessionController.getTestHistory.bind(sessionController)
);

/**
 * @route   GET /api/v1/listening/analytics
 * @desc    Get user's listening performance analytics
 * @access  Authenticated users
 */
router.get('/analytics',
  sessionController.getAnalytics.bind(sessionController)
);

export default router; 