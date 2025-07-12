import { Router } from 'express';
import { Task1TemplateController } from '../controller/task1-template.controller';
import { jwtMiddleware } from '../../Auth/middleware/jwt.middleware';
import { adminRoleMiddleware } from '../../Auth/middleware/role.middleware';
import { createUploadMiddleware } from '../../../common/multer-upload.middleware';
import { validateImageUpload } from '../../../common/file-validation.middleware';

const router = Router();
const controller = new Task1TemplateController();

// Configure upload middleware for template images
const templateImageUpload = createUploadMiddleware('image', {
  allowedMimeTypes: [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'
  ],
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for template images
  },
  multiple: false
});

// Public routes (require only JWT auth)
router.use(jwtMiddleware);

// Get all templates with optional filters
router.get('/', controller.getTemplates.bind(controller));

// Get template by ID
router.get('/:id', controller.getTemplateById.bind(controller));

// Admin-only routes
router.use(adminRoleMiddleware);

// Create new template - with image upload
router.post('/', templateImageUpload, controller.createTemplate.bind(controller));

// Update template - with optional image upload
router.put('/:id', templateImageUpload, controller.updateTemplate.bind(controller));

// Delete template (soft delete)
router.delete('/:id', controller.deleteTemplate.bind(controller));

// Hard delete template
router.delete('/:id/permanent', controller.permanentlyDeleteTemplate.bind(controller));

export default router; 