import { Router } from 'express';
import writingEvaluationRoutes from './writing-evaluation.routes';
import task1TemplateRoutes from './task1-template.routes';

const router: Router = Router();

// Mount writing evaluation routes
router.use('/writing', writingEvaluationRoutes);

// Mount task1 template routes
router.use('/writing/templates/task1', task1TemplateRoutes);

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'AI routes are working!',
    timestamp: new Date().toISOString(),
  });
});

export default router; 