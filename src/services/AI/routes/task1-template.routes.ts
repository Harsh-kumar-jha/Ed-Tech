import { Router } from 'express';
import { Task1TemplateController } from '../controller/task1-template.controller';
import { jwtMiddleware } from '../../Auth/middleware/jwt.middleware';
import { adminRoleMiddleware } from '../../Auth/middleware/role.middleware';

const router = Router();
const controller = new Task1TemplateController();

// All routes require JWT authentication and admin role
router.use(jwtMiddleware);
router.use(adminRoleMiddleware);

// Create new template
router.post('/', controller.createTemplate.bind(controller));

// Get all templates with optional filters
router.get('/', controller.getTemplates.bind(controller));

// Update template
router.put('/:id', controller.updateTemplate.bind(controller));

// Delete template
router.delete('/:id', controller.deleteTemplate.bind(controller));

export default router; 