import { Request, Response } from 'express';
import { getPrisma } from '../../../db/database';
import { UserRole } from '../../../types/UserRole';
import { CloudinaryUploader } from '../../common/cloudinary-uploader.service';
import { 
  CreateTask1TemplateRequest, 
  UpdateTask1TemplateRequest, 
  Task1TemplateResponse,
  ImageUploadResponse 
} from '../../../interface/upload.interface';
import { ServiceResponse } from '../../../interface/base.interface';
import { logError, logInfo } from '../../../utils/logger';

export class Task1TemplateController {
  private prisma = getPrisma();
  private cloudinaryUploader = CloudinaryUploader.getInstance();

  /**
   * Create a new Task1 template with image upload
   * Expects multipart/form-data with image file and template data
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { type, prompt, description, tags, isActive = true, difficulty, testType } = req.body;
      const userId = req.user.id;

      logInfo('Creating Task1 template', {
        userId,
        type,
        hasFile: !!req.file,
        filename: req.file?.originalname
      });

      // Validate admin role
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can manage task templates'
          }
        });
        return;
      }

      // Validate required fields
      if (!type || !prompt) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required fields',
            details: {
              required: ['type', 'prompt'],
              received: { type: !!type, prompt: !!prompt }
            }
          }
        });
        return;
      }

      // Validate image upload
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Image file is required',
            details: {
              field: 'image',
              message: 'Please upload an image file for the template'
            }
          }
        });
        return;
      }

      // Upload image to Cloudinary
      const uploadResult = await this.cloudinaryUploader.uploadFile(req.file, {
        folder: 'task1-templates',
        tags: ['task1-template', type, ...(tags ? tags.split(',') : [])],
        resource_type: 'image',
        transformation: [
          { width: 800, height: 600, crop: 'limit' },
          { quality: 'auto' },
          { format: 'auto' }
        ]
      });

      if (!uploadResult.success) {
        logError('Failed to upload image to Cloudinary', {
          userId,
          error: uploadResult.error,
          code: uploadResult.code
        });

        res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Failed to upload image',
            details: {
              cloudinaryError: uploadResult.error,
              code: uploadResult.code
            }
          }
        });
        return;
      }

      // Create template in database
      const template = await this.prisma.writingTask1Template.create({
        data: {
          type,
          prompt,
          imageUrl: uploadResult.data!.secure_url,
          isActive: isActive === 'true' || isActive === true,
          createdBy: userId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logInfo('Task1 template created successfully', {
        templateId: template.id,
        userId,
        type,
        imageUrl: uploadResult.data!.secure_url
      });

      res.status(201).json({
        success: true,
        message: 'Template created successfully',
        data: {
          template: {
            id: template.id,
            type: template.type,
            prompt: template.prompt,
            imageUrl: template.imageUrl,
            imagePublicId: uploadResult.data!.public_id,
            isActive: template.isActive,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            creator: template.user
          },
          upload: {
            publicId: uploadResult.data!.public_id,
            url: uploadResult.data!.url,
            secureUrl: uploadResult.data!.secure_url,
            format: uploadResult.data!.format,
            width: uploadResult.data!.width,
            height: uploadResult.data!.height,
            bytes: uploadResult.data!.bytes
          }
        }
      });
    } catch (error) {
      logError('Failed to create Task1 template', error, {
        userId: req.user?.id,
        hasFile: !!req.file
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create template'
        }
      });
    }
  }

  /**
   * Update an existing Task1 template
   * Can optionally update the image by providing a new file
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { type, prompt, description, tags, isActive, difficulty, testType } = req.body;
      const userId = req.user.id;

      logInfo('Updating Task1 template', {
        templateId: id,
        userId,
        hasFile: !!req.file,
        filename: req.file?.originalname
      });

      // Validate admin role
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can manage task templates'
          }
        });
        return;
      }

      // Check if template exists
      const existingTemplate = await this.prisma.writingTask1Template.findUnique({
        where: { id }
      });

      if (!existingTemplate) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      let imageUrl = existingTemplate.imageUrl;
      let uploadData = null;

      // Handle image upload if new file is provided
      if (req.file) {
        // Upload new image to Cloudinary
        const uploadResult = await this.cloudinaryUploader.uploadFile(req.file, {
          folder: 'task1-templates',
          tags: ['task1-template', type || existingTemplate.type, ...(tags ? tags.split(',') : [])],
          resource_type: 'image',
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        });

        if (!uploadResult.success) {
          logError('Failed to upload new image to Cloudinary', {
            templateId: id,
            userId,
            error: uploadResult.error,
            code: uploadResult.code
          });

          res.status(400).json({
            success: false,
            error: {
              code: 'UPLOAD_ERROR',
              message: 'Failed to upload new image',
              details: {
                cloudinaryError: uploadResult.error,
                code: uploadResult.code
              }
            }
          });
          return;
        }

        imageUrl = uploadResult.data!.secure_url;
        uploadData = {
          publicId: uploadResult.data!.public_id,
          url: uploadResult.data!.url,
          secureUrl: uploadResult.data!.secure_url,
          format: uploadResult.data!.format,
          width: uploadResult.data!.width,
          height: uploadResult.data!.height,
          bytes: uploadResult.data!.bytes
        };

        // TODO: Delete old image from Cloudinary
        // This requires storing the public_id in the database
      }

      // Update template in database
      const updatedTemplate = await this.prisma.writingTask1Template.update({
        where: { id },
        data: {
          ...(type && { type }),
          ...(prompt && { prompt }),
          ...(imageUrl !== existingTemplate.imageUrl && { imageUrl }),
          ...(description !== undefined && { description }),
          ...(isActive !== undefined && { isActive: isActive === 'true' || isActive === true }),
          ...(difficulty !== undefined && { difficulty }),
          ...(testType !== undefined && { testType }),
          updatedAt: new Date()
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      logInfo('Task1 template updated successfully', {
        templateId: id,
        userId,
        hasNewImage: !!req.file,
        imageUrl: updatedTemplate.imageUrl
      });

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        data: {
          template: {
            id: updatedTemplate.id,
            type: updatedTemplate.type,
            prompt: updatedTemplate.prompt,
            imageUrl: updatedTemplate.imageUrl,
            description: updatedTemplate.description,
            isActive: updatedTemplate.isActive,
            difficulty: updatedTemplate.difficulty,
            testType: updatedTemplate.testType,
            createdBy: updatedTemplate.createdBy,
            createdAt: updatedTemplate.createdAt,
            updatedAt: updatedTemplate.updatedAt,
            creator: updatedTemplate.user
          },
          ...(uploadData && { upload: uploadData })
        }
      });
    } catch (error) {
      logError('Failed to update Task1 template', error, {
        templateId: req.params.id,
        userId: req.user?.id,
        hasFile: !!req.file
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update template'
        }
      });
    }
  }

  /**
   * Get all templates with filtering
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      const { type, active_only, difficulty, test_type, page = 1, limit = 10 } = req.query;
      const userId = req.user.id;

      logInfo('Fetching Task1 templates', {
        userId,
        filters: { type, active_only, difficulty, test_type },
        pagination: { page, limit }
      });

      // Validate admin role
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can view task templates'
          }
        });
        return;
      }

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);
      const skip = (pageNum - 1) * limitNum;

      const whereClause = {
        ...(type && { type: String(type) }),
        ...(active_only === 'true' && { isActive: true }),
        ...(difficulty && { difficulty: String(difficulty) }),
        ...(test_type && { testType: String(test_type) })
      };

      const [templates, total] = await Promise.all([
        this.prisma.writingTask1Template.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limitNum
        }),
        this.prisma.writingTask1Template.count({
          where: whereClause
        })
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: {
          templates: templates.map(template => ({
            id: template.id,
            type: template.type,
            prompt: template.prompt,
            imageUrl: template.imageUrl,
            description: template.description,
            isActive: template.isActive,
            difficulty: template.difficulty,
            testType: template.testType,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            creator: template.user
          })),
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPreviousPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logError('Failed to fetch Task1 templates', error, {
        userId: req.user?.id,
        filters: req.query
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch templates'
        }
      });
    }
  }

  /**
   * Get a specific template by ID
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await this.prisma.writingTask1Template.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          template: {
            id: template.id,
            type: template.type,
            prompt: template.prompt,
            imageUrl: template.imageUrl,
            description: template.description,
            isActive: template.isActive,
            difficulty: template.difficulty,
            testType: template.testType,
            createdBy: template.createdBy,
            createdAt: template.createdAt,
            updatedAt: template.updatedAt,
            creator: template.user
          }
        }
      });
    } catch (error) {
      logError('Failed to get Task1 template by ID', error, {
        templateId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get template'
        }
      });
    }
  }

  /**
   * Delete a template (soft delete by setting isActive to false)
   */
  async deleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      logInfo('Deleting Task1 template', {
        templateId: id,
        userId
      });

      // Validate admin role
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can manage task templates'
          }
        });
        return;
      }

      const template = await this.prisma.writingTask1Template.findUnique({
        where: { id }
      });

      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      // Soft delete by setting isActive to false
      await this.prisma.writingTask1Template.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });

      logInfo('Task1 template deleted successfully', {
        templateId: id,
        userId
      });

      res.status(200).json({
        success: true,
        message: 'Template deleted successfully'
      });
    } catch (error) {
      logError('Failed to delete Task1 template', error, {
        templateId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete template'
        }
      });
    }
  }

  /**
   * Permanently delete a template and its associated image
   */
  async permanentlyDeleteTemplate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      logInfo('Permanently deleting Task1 template', {
        templateId: id,
        userId
      });

      // Validate admin role
      if (req.user.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only administrators can manage task templates'
          }
        });
        return;
      }

      const template = await this.prisma.writingTask1Template.findUnique({
        where: { id }
      });

      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found'
          }
        });
        return;
      }

      // Delete from database first
      await this.prisma.writingTask1Template.delete({
        where: { id }
      });

      // TODO: Delete image from Cloudinary
      // This requires storing the public_id in the database
      // For now, we'll just log a warning
      logInfo('Template deleted from database. Image cleanup required.', {
        templateId: id,
        imageUrl: template.imageUrl
      });

      res.status(200).json({
        success: true,
        message: 'Template permanently deleted'
      });
    } catch (error) {
      logError('Failed to permanently delete Task1 template', error, {
        templateId: req.params.id,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to permanently delete template'
        }
      });
    }
  }
} 