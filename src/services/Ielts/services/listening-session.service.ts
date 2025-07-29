import { PrismaClient, IELTSModule, TestStatus } from '@prisma/client';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import { LISTENING_CONFIG, LISTENING_ERRORS, LISTENING_MESSAGES } from '../../../constants/listening-config';
import { 
  IListeningSessionService,
  StartListeningTestResponse,
  SubmitListeningAnswersRequest,
  SubmitListeningAnswersResponse,
  IListeningTestAttempt
} from '../../../interface/listening.interface';
import { GlobalTestSessionService } from './global-test-session.service';
import { ListeningEvaluationService } from './listening-evaluation.service';

export class ListeningSessionService implements IListeningSessionService {
  private prisma: PrismaClient;
  private globalSessionService: GlobalTestSessionService;
  private evaluationService: ListeningEvaluationService;

  constructor() {
    this.prisma = new PrismaClient();
    this.globalSessionService = new GlobalTestSessionService();
    this.evaluationService = new ListeningEvaluationService();
  }

  /**
   * Start a new listening test session
   */
  async startTest(userId: string, testId: string): Promise<StartListeningTestResponse> {
    try {
      // Check if user has any active test session across all modules
      const activeGlobalSession = await this.globalSessionService.checkActiveSession(userId);

      if (activeGlobalSession) {
        throw new AppError(
          `You already have an active ${activeGlobalSession.module.toLowerCase()} test session. Please complete or abandon your current test before starting a new one.`,
          HTTP_STATUS.CONFLICT
        );
      }

      // Get test details
      const test = await this.prisma.listeningTest.findUnique({
        where: { testId },
        include: {
          sections: {
            include: {
              questions: {
                select: {
                  id: true,
                  questionNumber: true,
                  questionType: true,
                  questionText: true,
                  options: true,
                  hints: true,
                  audioTimestamp: true
                }
              }
            },
            orderBy: {
              sectionNumber: 'asc'
            }
          }
        }
      });

      if (!test || !test.isActive) {
        throw new AppError(LISTENING_ERRORS.INVALID_TEST_ID, HTTP_STATUS.NOT_FOUND);
      }

      // Check user test restrictions based on subscription tier
      await this.checkUserTestRestrictions(userId);

      // Create new test attempt
      const testAttempt = await this.prisma.listeningTestAttempt.create({
        data: {
          userId,
          testId: test.id,
          status: TestStatus.NOT_STARTED,
          startedAt: new Date()
        }
      });

      // Create global test session
      const timeLimit = LISTENING_CONFIG.TOTAL_DURATION; // 30 minutes
      await this.globalSessionService.createTestSession(
        userId,
        IELTSModule.LISTENING,
        test.id,
        testAttempt.id,
        timeLimit
      );

      // Mark attempt as in progress
      await this.prisma.listeningTestAttempt.update({
        where: { id: testAttempt.id },
        data: { status: TestStatus.IN_PROGRESS }
      });

      return {
        success: true,
        data: {
          attemptId: testAttempt.id,
          test: {
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
          },
          sections: test.sections.map(section => ({
            id: section.id,
            testId: section.testId,
            sectionNumber: section.sectionNumber,
            title: section.title,
            description: section.description,
            type: section.type,
            audioUrl: section.audioUrl,
            audioStartTime: section.audioStartTime,
            audioEndTime: section.audioEndTime,
            questionCount: section.questionCount,
            instructions: section.instructions,
            createdAt: section.createdAt,
            updatedAt: section.updatedAt
          })),
          timeLimit,
          audioUrl: test.audioUrl
        }
      };

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to start listening test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get active listening session for user
   */
  async getActiveSession(userId: string): Promise<IListeningTestAttempt | null> {
    try {
      const attempt = await this.prisma.listeningTestAttempt.findFirst({
        where: {
          userId,
          status: {
            in: [TestStatus.NOT_STARTED, TestStatus.IN_PROGRESS]
          }
        },
        include: {
          test: true
        }
      });

      return attempt ? this.mapAttemptToInterface(attempt) : null;
    } catch (error: any) {
      throw new AppError('Failed to get active session', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update progress of listening test attempt
   */
  async updateProgress(attemptId: string, data: Partial<IListeningTestAttempt>): Promise<IListeningTestAttempt> {
    try {
      const attempt = await this.prisma.listeningTestAttempt.update({
        where: { id: attemptId },
        data: {
          currentSection: data.currentSection,
          audioStartedAt: data.audioStartedAt,
          audioTimeSpent: data.audioTimeSpent,
          timeSpent: data.timeSpent,
          audioCompleted: data.audioCompleted,
          warningShown: data.warningShown
        },
        include: {
          test: true
        }
      });

      return this.mapAttemptToInterface(attempt);
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError(LISTENING_ERRORS.SESSION_NOT_ACTIVE, HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError('Failed to update progress', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Submit answers for listening test
   */
  async submitAnswers(data: SubmitListeningAnswersRequest): Promise<SubmitListeningAnswersResponse> {
    try {
      // Get attempt details
      const attempt = await this.prisma.listeningTestAttempt.findUnique({
        where: { id: data.attemptId },
        include: {
          test: {
            include: {
              sections: {
                include: {
                  questions: true
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        throw new AppError(LISTENING_ERRORS.SESSION_NOT_ACTIVE, HTTP_STATUS.NOT_FOUND);
      }

      if (attempt.status === TestStatus.COMPLETED || attempt.status === TestStatus.SUBMITTED) {
        throw new AppError(LISTENING_ERRORS.ANSWERS_ALREADY_SUBMITTED, HTTP_STATUS.BAD_REQUEST);
      }

      // Save answers
      const savedAnswers = await Promise.all(
        data.answers.map(async (answer) => {
          return this.prisma.listeningAnswer.upsert({
            where: {
              attemptId_questionId: {
                attemptId: data.attemptId,
                questionId: answer.questionId
              }
            },
            update: {
              userAnswer: answer.userAnswer,
              timeSpent: answer.timeSpent || 0,
              submittedAt: new Date()
            },
            create: {
              attemptId: data.attemptId,
              questionId: answer.questionId,
              questionNumber: answer.questionNumber,
              userAnswer: answer.userAnswer,
              timeSpent: answer.timeSpent || 0,
              submittedAt: new Date()
            }
          });
        })
      );

      // Mark attempt as completed
      await this.prisma.listeningTestAttempt.update({
        where: { id: data.attemptId },
        data: {
          status: TestStatus.COMPLETED,
          completedAt: new Date(),
          submittedAt: new Date()
        }
      });

      // Evaluate answers and generate results
      const result = await this.evaluationService.evaluateAnswers(data.attemptId, savedAnswers);

      // Update analytics
      const analytics = await this.evaluationService.updateAnalytics(attempt.userId, result);

      // Complete global session
      await this.globalSessionService.completeTestSession(attempt.userId, data.attemptId);

      return {
        success: true,
        data: {
          result,
          analytics
        }
      };

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to submit answers', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Abandon current listening session
   */
  async abandonSession(attemptId: string): Promise<boolean> {
    try {
      const attempt = await this.prisma.listeningTestAttempt.findUnique({
        where: { id: attemptId }
      });

      if (!attempt) {
        throw new AppError(LISTENING_ERRORS.SESSION_NOT_ACTIVE, HTTP_STATUS.NOT_FOUND);
      }

      // Update attempt status
      await this.prisma.listeningTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: TestStatus.EXPIRED,
          completedAt: new Date()
        }
      });

      // Abandon global session
      await this.globalSessionService.abandonTestSession(attempt.userId, attemptId);

      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to abandon session', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get session statistics and progress
   */
  async getSessionStats(attemptId: string) {
    try {
      const attempt = await this.prisma.listeningTestAttempt.findUnique({
        where: { id: attemptId },
        include: {
          answers: true,
          test: true
        }
      });

      if (!attempt) {
        throw new AppError(LISTENING_ERRORS.SESSION_NOT_ACTIVE, HTTP_STATUS.NOT_FOUND);
      }

      const totalQuestions = attempt.test.totalQuestions;
      const answeredQuestions = attempt.answers.length;
      const completionRate = (answeredQuestions / totalQuestions) * 100;

      // Calculate time utilization
      const audioUtilization = attempt.audioTimeSpent > 0 
        ? (attempt.audioTimeSpent / attempt.test.audioDuration) * 100 
        : 0;

      return {
        attemptId: attempt.id,
        status: attempt.status,
        currentSection: attempt.currentSection,
        totalQuestions,
        answeredQuestions,
        completionRate,
        timeSpent: attempt.timeSpent,
        audioTimeSpent: attempt.audioTimeSpent,
        audioUtilization,
        audioCompleted: attempt.audioCompleted,
        warningShown: attempt.warningShown
      };

    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to get session statistics', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  // Private helper methods

  /**
   * Check user test restrictions based on subscription tier
   */
  private async checkUserTestRestrictions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        listeningAnalytics: true
      }
    });

    if (!user) {
      throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
    }

    if (user.subscriptionTier === 'FREE') {
      // Free users: only 5 listening tests allowed
      const testCount = await this.prisma.listeningTestAttempt.count({
        where: {
          userId,
          status: 'COMPLETED'
        }
      });

      if (testCount >= LISTENING_CONFIG.TEST_LIMITS.FREE) {
        throw new AppError(
          `Free users are limited to ${LISTENING_CONFIG.TEST_LIMITS.FREE} Listening Module tests. Please upgrade to Premium for unlimited tests.`,
          HTTP_STATUS.FORBIDDEN
        );
      }
    } else if (user.subscriptionTier === 'PREMIUM') {
      // Premium users: 24-hour cooldown between tests
      if (user.listeningAnalytics?.next24HourTest) {
        const now = new Date();
        const nextAllowedTest = new Date(user.listeningAnalytics.next24HourTest);

        if (now < nextAllowedTest) {
          const hoursRemaining = Math.ceil((nextAllowedTest.getTime() - now.getTime()) / (1000 * 60 * 60));
          throw new AppError(
            `Please wait ${hoursRemaining} hours before taking another Listening Module test.`,
            HTTP_STATUS.TOO_MANY_REQUESTS
          );
        }
      }
    }
  }

  private mapAttemptToInterface(attempt: any): IListeningTestAttempt {
    return {
      id: attempt.id,
      userId: attempt.userId,
      testId: attempt.testId,
      status: attempt.status,
      startedAt: attempt.startedAt,
      audioStartedAt: attempt.audioStartedAt,
      completedAt: attempt.completedAt,
      submittedAt: attempt.submittedAt,
      timeSpent: attempt.timeSpent,
      audioTimeSpent: attempt.audioTimeSpent,
      score: attempt.score,
      totalScore: attempt.totalScore,
      bandScore: attempt.bandScore,
      percentage: attempt.percentage,
      currentSection: attempt.currentSection,
      audioCompleted: attempt.audioCompleted,
      warningShown: attempt.warningShown,
      aiSummary: attempt.aiSummary,
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt
    };
  }
} 