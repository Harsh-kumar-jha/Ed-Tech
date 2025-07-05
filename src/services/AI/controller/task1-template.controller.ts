import { Request, Response } from 'express';
import { getPrisma } from '../../../db/database';
import { UserRole } from '../../../types/UserRole';

export class Task1TemplateController {
  private prisma = getPrisma();

  async createTemplate(req: Request, res: Response) {
    try {
      const { type, prompt, image_url } = req.body;
      const userId = req.user.id;

      // Validate admin role
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'Only administrators can manage task templates',
        });
      }

      // Validate required fields
      if (!type || !prompt || !image_url) {
        return res.status(400).json({
          error: 'Missing required fields',
          required: ['type', 'prompt', 'image_url'],
        });
      }

      const template = await this.prisma.writingTask1Template.create({
        data: {
          type,
          prompt,
          imageUrl: image_url,
          createdBy: userId,
        },
      });

      return res.status(201).json({
        message: 'Template created successfully',
        template,
      });
    } catch (error) {
      console.error('Failed to create template:', error);
      return res.status(500).json({
        error: 'Failed to create template',
      });
    }
  }

  async getTemplates(req: Request, res: Response) {
    try {
      const { type, active_only } = req.query;
      const userId = req.user.id;

      // Validate admin role
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'Only administrators can view task templates',
        });
      }

      const templates = await this.prisma.writingTask1Template.findMany({
        where: {
          ...(type && { type: String(type) }),
          ...(active_only === 'true' && { isActive: true }),
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json({
        templates,
      });
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      return res.status(500).json({
        error: 'Failed to fetch templates',
      });
    }
  }

  async updateTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { type, prompt, image_url, is_active } = req.body;
      const userId = req.user.id;

      // Validate admin role
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'Only administrators can manage task templates',
        });
      }

      const template = await this.prisma.writingTask1Template.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({
          error: 'Template not found',
        });
      }

      const updatedTemplate = await this.prisma.writingTask1Template.update({
        where: { id },
        data: {
          ...(type && { type }),
          ...(prompt && { prompt }),
          ...(image_url && { imageUrl: image_url }),
          ...(typeof is_active === 'boolean' && { isActive: is_active }),
        },
      });

      return res.status(200).json({
        message: 'Template updated successfully',
        template: updatedTemplate,
      });
    } catch (error) {
      console.error('Failed to update template:', error);
      return res.status(500).json({
        error: 'Failed to update template',
      });
    }
  }

  async deleteTemplate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Validate admin role
      if (req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({
          error: 'Only administrators can manage task templates',
        });
      }

      const template = await this.prisma.writingTask1Template.findUnique({
        where: { id },
      });

      if (!template) {
        return res.status(404).json({
          error: 'Template not found',
        });
      }

      await this.prisma.writingTask1Template.delete({
        where: { id },
      });

      return res.status(200).json({
        message: 'Template deleted successfully',
      });
    } catch (error) {
      console.error('Failed to delete template:', error);
      return res.status(500).json({
        error: 'Failed to delete template',
      });
    }
  }
} 