import { Router } from 'express';
import { WritingEvaluationController } from '../controller/writing-evaluation.controller';
import { jwtMiddleware } from '../../Auth/middleware/jwt.middleware';

const router = Router();
const controller = new WritingEvaluationController();

// Protected routes - require JWT authentication
router.use(jwtMiddleware);

// Start a new writing test - generates Task 1 and Task 2 prompts
router.post('/start', controller.startWritingTest.bind(controller));

// Submit and evaluate Task 1 - returns Task 2 prompt with evaluation
router.post('/evaluate/task1', controller.evaluateTask1.bind(controller));

// Submit and evaluate Task 2 - returns combined evaluation
router.post('/evaluate/task2', controller.evaluateTask2.bind(controller));

export default router; 