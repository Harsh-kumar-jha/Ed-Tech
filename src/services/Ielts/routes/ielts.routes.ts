import { Router } from 'express';

const router: Router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'IELTS routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// Future IELTS endpoints
router.get('/tests', (req, res) => {
  res.json({
    success: true,
    message: 'Get IELTS tests (placeholder)',
    data: [],
  });
});

router.post('/tests', (req, res) => {
  res.json({
    success: true,
    message: 'Create IELTS test (placeholder)',
    data: { testId: 'test-123' },
  });
});

export default router; 