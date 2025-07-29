import { Router } from 'express';
import readingModuleRoutes from './reading-module.routes';
import globalTestSessionRoutes from './global-test-session.routes';
import listeningRoutes from './listening.routes';

const router: Router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'IELTS routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// Module Routes
router.use('/reading', readingModuleRoutes);
router.use('/listening', listeningRoutes);

// Global Test Session Routes
router.use('/test-session', globalTestSessionRoutes);

export default router;
