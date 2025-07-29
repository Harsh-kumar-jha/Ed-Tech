import { PrismaClient, DifficultyLevel } from '@prisma/client';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import { LISTENING_CONFIG, LISTENING_ERRORS } from '../../../constants/listening-config';
import { 
  IListeningTestService, 
  CreateListeningTestRequest, 
  IListeningTest,
  ListeningAudioUploadResponse
} from '../../../interface/listening.interface';
import * as path from 'path';
import { promises as fs } from 'fs';

export class ListeningTestService implements IListeningTestService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new listening test with sections and questions
   */
  async createTest(data: CreateListeningTestRequest, createdBy: string): Promise<IListeningTest> {
    try {
      // Validate test structure
      this.validateTestStructure(data);

      // Create test with nested sections and questions
      const test = await this.prisma.listeningTest.create({
        data: {
          testId: `listening_test_${Date.now()}`,
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          audioUrl: '', // Will be updated after audio upload
          audioFileName: '',
          audioFileSize: 0,
          totalQuestions: data.sections.reduce((total, section) => total + section.questions.length, 0),
          createdBy,
          sections: {
            create: data.sections.map((section) => ({
              sectionNumber: section.sectionNumber,
              title: section.title,
              description: section.description,
              type: section.type,
              audioStartTime: section.audioStartTime,
              audioEndTime: section.audioEndTime,
              questionCount: section.questions.length,
              instructions: section.instructions,
              questions: {
                create: section.questions.map((question) => ({
                  questionNumber: question.questionNumber,
                  questionType: question.questionType,
                  questionText: question.questionText,
                  options: question.options || [],
                  correctAnswer: question.correctAnswer,
                  acceptableAnswers: question.acceptableAnswers || [],
                  caseSensitive: question.caseSensitive || false,
                  points: question.points || 1.0,
                  audioTimestamp: question.audioTimestamp,
                  hints: question.hints || []
                }))
              }
            }))
          }
        },
        include: {
          sections: {
            include: {
              questions: true
            },
            orderBy: {
              sectionNumber: 'asc'
            }
          }
        }
      });

      return this.mapToInterface(test);
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to create listening test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Upload audio file for a listening test
   */
  async uploadAudio(file: Express.Multer.File, testId: string): Promise<ListeningAudioUploadResponse> {
    try {
      // Validate file
      this.validateAudioFile(file);

      // Check if test exists
      const test = await this.prisma.listeningTest.findUnique({
        where: { testId }
      });

      if (!test) {
        throw new AppError(LISTENING_ERRORS.INVALID_TEST_ID, HTTP_STATUS.NOT_FOUND);
      }

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const fileName = `listening_${testId}_${Date.now()}${fileExtension}`;
      const uploadPath = path.join(process.env.UPLOAD_DIR || './uploads/audio', fileName);

      // Ensure directory exists
      await fs.mkdir(path.dirname(uploadPath), { recursive: true });

      // Save file
      await fs.writeFile(uploadPath, file.buffer);

      // Update test with audio information
      const audioUrl = `/uploads/audio/${fileName}`;
      await this.prisma.listeningTest.update({
        where: { testId },
        data: {
          audioUrl,
          audioFileName: file.originalname,
          audioFileSize: file.size
        }
      });

      return {
        success: true,
        data: {
          audioUrl,
          fileName: file.originalname,
          fileSize: file.size,
          duration: undefined // Will be extracted if needed
        }
      };

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(LISTENING_ERRORS.AUDIO_UPLOAD_FAILED, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get listening test by ID
   */
  async getTestById(testId: string): Promise<IListeningTest | null> {
    try {
      const test = await this.prisma.listeningTest.findUnique({
        where: { testId },
        include: {
          sections: {
            include: {
              questions: true
            },
            orderBy: {
              sectionNumber: 'asc'
            }
          }
        }
      });

      return test ? this.mapToInterface(test) : null;
    } catch (error: any) {
      throw new AppError('Failed to fetch listening test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update listening test
   */
  async updateTest(testId: string, data: Partial<IListeningTest>): Promise<IListeningTest> {
    try {
      const test = await this.prisma.listeningTest.update({
        where: { testId },
        data: {
          title: data.title,
          description: data.description,
          difficulty: data.difficulty,
          isActive: data.isActive
        },
        include: {
          sections: {
            include: {
              questions: true
            },
            orderBy: {
              sectionNumber: 'asc'
            }
          }
        }
      });

      return this.mapToInterface(test);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(LISTENING_ERRORS.INVALID_TEST_ID, HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError('Failed to update listening test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete listening test
   */
  async deleteTest(testId: string): Promise<boolean> {
    try {
      // Get test details first for cleanup
      const test = await this.prisma.listeningTest.findUnique({
        where: { testId }
      });

      if (!test) {
        throw new AppError(LISTENING_ERRORS.INVALID_TEST_ID, HTTP_STATUS.NOT_FOUND);
      }

      // Delete associated audio file
      if (test.audioUrl) {
        try {
          const filePath = path.join(process.env.UPLOAD_DIR || './uploads', test.audioUrl);
          await fs.unlink(filePath);
        } catch (fileError) {
          // Log but don't fail the deletion
          console.warn(`Failed to delete audio file: ${test.audioUrl}`);
        }
      }

      // Delete test (cascade will handle related records)
      await this.prisma.listeningTest.delete({
        where: { testId }
      });

      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new AppError(LISTENING_ERRORS.INVALID_TEST_ID, HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError('Failed to delete listening test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get all active listening tests
   */
  async getActiveTests(): Promise<IListeningTest[]> {
    try {
      const tests = await this.prisma.listeningTest.findMany({
        where: { isActive: true },
        include: {
          sections: {
            include: {
              questions: true
            },
            orderBy: {
              sectionNumber: 'asc'
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return tests.map(test => this.mapToInterface(test));
    } catch (error: any) {
      throw new AppError('Failed to fetch active listening tests', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get tests with pagination and filtering
   */
  async getTests(
    page: number = 1,
    limit: number = 10,
    difficulty?: DifficultyLevel,
    isActive?: boolean
  ) {
    try {
      const skip = (page - 1) * limit;
      const where: any = {};

      if (difficulty) {
        where.difficulty = difficulty;
      }

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      const [tests, total] = await Promise.all([
        this.prisma.listeningTest.findMany({
          where,
          include: {
            sections: {
              include: {
                questions: true
              },
              orderBy: {
                sectionNumber: 'asc'
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip,
          take: limit
        }),
        this.prisma.listeningTest.count({ where })
      ]);

      return {
        tests: tests.map(test => this.mapToInterface(test)),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      throw new AppError('Failed to fetch listening tests', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Private helper methods

  private validateTestStructure(data: CreateListeningTestRequest): void {
    if (!data.title || data.title.trim().length === 0) {
      throw new AppError('Test title is required', HTTP_STATUS.BAD_REQUEST);
    }

    if (!data.sections || data.sections.length !== 4) {
      throw new AppError('Listening test must have exactly 4 sections', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate each section
    data.sections.forEach((section, index) => {
      if (section.sectionNumber !== index + 1) {
        throw new AppError(`Section ${index + 1} has incorrect section number`, HTTP_STATUS.BAD_REQUEST);
      }

      if (!section.questions || section.questions.length !== 10) {
        throw new AppError(`Section ${index + 1} must have exactly 10 questions`, HTTP_STATUS.BAD_REQUEST);
      }

      // Validate questions in section
      section.questions.forEach((question, qIndex) => {
        const expectedQuestionNumber = (index * 10) + qIndex + 1;
        if (question.questionNumber !== expectedQuestionNumber) {
          throw new AppError(
            `Question in section ${index + 1} has incorrect question number`,
            HTTP_STATUS.BAD_REQUEST
          );
        }

        if (!question.questionText || !question.correctAnswer) {
          throw new AppError(
            `Question ${expectedQuestionNumber} is missing required fields`,
            HTTP_STATUS.BAD_REQUEST
          );
        }
      });
    });
  }

  private validateAudioFile(file: Express.Multer.File): void {
    if (!file) {
      throw new AppError('Audio file is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Check file size
    if (file.size > LISTENING_CONFIG.AUDIO.MAX_FILE_SIZE) {
      throw new AppError(
        `Audio file too large. Maximum size is ${LISTENING_CONFIG.AUDIO.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Check file format
    const fileExtension = path.extname(file.originalname).toLowerCase().slice(1);
    if (!LISTENING_CONFIG.AUDIO.ALLOWED_FORMATS.includes(fileExtension)) {
      throw new AppError(
        `Invalid audio format. Allowed formats: ${LISTENING_CONFIG.AUDIO.ALLOWED_FORMATS.join(', ')}`,
        HTTP_STATUS.BAD_REQUEST
      );
    }
  }

  private mapToInterface(test: any): IListeningTest {
    return {
      id: test.id,
      testId: test.testId,
      title: test.title,
      description: test.description,
      difficulty: test.difficulty,
      audioUrl: test.audioUrl,
      audioFileName: test.audioFileName,
      audioFileSize: test.audioFileSize,
      audioDuration: test.audioDuration,
      totalDuration: test.totalDuration,
      totalQuestions: test.totalQuestions,
      isActive: test.isActive,
      createdBy: test.createdBy,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt
    };
  }
} 