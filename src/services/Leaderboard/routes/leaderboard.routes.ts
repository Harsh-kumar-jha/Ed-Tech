import { Router } from 'express';

const router = Router();

// Test route
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Leaderboard routes are working!',
    timestamp: new Date().toISOString(),
  });
});

// Future Leaderboard endpoints
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Get leaderboard (placeholder)',
    data: [],
  });
});

export default router; 