import { Router } from 'express';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'AI routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// Future AI endpoints
router.post('/analyze', (req, res) => {
  res.json({
    success: true,
    message: 'AI analysis (placeholder)',
    data: {},
  });
});

export default router; 