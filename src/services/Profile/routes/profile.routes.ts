import { Router } from 'express';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Profile routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// Future Profile endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Get user profile (placeholder)',
    data: {},
  });
});

router.put('/', (req, res) => {
  res.json({
    success: true,
    message: 'Update user profile (placeholder)',
    data: {},
  });
});

export default router; 