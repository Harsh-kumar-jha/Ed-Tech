import { PrismaClient, TestStatus, ReadingQuestionType, IELTSModule } from '@prisma/client';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';
import { GlobalTestSessionService } from './global-test-session.service';

export class ReadingTestSessionService {
  private prisma: PrismaClient;
  private globalSessionService: GlobalTestSessionService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.globalSessionService = new GlobalTestSessionService();
  }

  /**
   * Start a new reading test session
   */
  async startTestSession(userId: string, testSetId: string) {
    try {
      // Check if user has any active test session across all modules
      const activeGlobalSession = await this.globalSessionService.checkActiveSession(userId);

      if (activeGlobalSession) {
        throw new AppError(
          `You already have an active ${activeGlobalSession.module.toLowerCase()} test session. Please complete or abandon your current test before starting a new one.`,
          HTTP_STATUS.CONFLICT
        );
      }

      // Check if user already has an active reading test session (backup check)
      const activeSession = await this.prisma.readingTestAttempt.findFirst({
        where: {
          userId,
          status: {
            in: [TestStatus.NOT_STARTED, TestStatus.IN_PROGRESS],
          },
        },
      });

      if (activeSession) {
        throw new AppError(
          'You already have an active test session. Please complete or cancel it before starting a new one.',
          HTTP_STATUS.CONFLICT
        );
      }

      // Create new test attempt
      const testAttempt = await this.prisma.readingTestAttempt.create({
        data: {
          userId,
          testSetId,
          status: TestStatus.NOT_STARTED,
          startedAt: new Date(),
        },
        include: {
          testSet: {
            include: {
              passages: {
                include: {
                  questions: true,
                },
                orderBy: {
                  passageNumber: 'asc',
                },
              },
            },
          },
        },
      });

      // Create global test session
      const timeLimit = 3600; // 60 minutes in seconds
      await this.globalSessionService.createTestSession(
        userId,
        IELTSModule.READING,
        testSetId,
        testAttempt.id,
        timeLimit
      );

      return {
        success: true,
        data: {
          attemptId: testAttempt.id,
          testSet: testAttempt.testSet,
          timeLimit: timeLimit,
          instructions:
            'You have 60 minutes to complete this Reading Module test. The test contains 3 passages with 40 questions in total.',
        },
      };
    } catch (error) {
      console.error('Error starting test session:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to start test session', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Update test status to IN_PROGRESS
   */
  async markTestAsStarted(attemptId: string, userId: string) {
    try {
      const updatedAttempt = await this.prisma.readingTestAttempt.update({
        where: { id: attemptId },
        data: {
          status: TestStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      });

      // Update global session status
      await this.globalSessionService.updateSessionStatus(userId, attemptId, TestStatus.IN_PROGRESS);

      return updatedAttempt;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Test attempt not found', HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError('Failed to update test status', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Save user answer for a question
   */
  async saveAnswer(attemptId: string, questionId: string, userAnswer: string) {
    try {
      // Check if answer already exists
      const existingAnswer = await this.prisma.readingAnswer.findUnique({
        where: {
          attemptId_questionId: {
            attemptId,
            questionId,
          },
        },
      });

      if (existingAnswer) {
        // Update existing answer
        return await this.prisma.readingAnswer.update({
          where: { id: existingAnswer.id },
          data: {
            userAnswer,
            timeSpent: existingAnswer.timeSpent + 1, // Increment time spent
          },
        });
      } else {
        // Create new answer
        const question = await this.prisma.readingQuestion.findUnique({
          where: { id: questionId },
        });

        if (!question) {
          throw new AppError('Question not found', HTTP_STATUS.NOT_FOUND);
        }

        return await this.prisma.readingAnswer.create({
          data: {
            attemptId,
            questionId,
            questionNumber: question.questionNumber,
            userAnswer,
            timeSpent: 1,
          },
        });
      }
    } catch (error) {
      console.error('Error saving answer:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to save answer', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Submit test and calculate results
   */
  async submitTest(attemptId: string) {
    try {
      return await this.prisma.$transaction(async tx => {
        // Get test attempt with all data
        const testAttempt = await tx.readingTestAttempt.findUnique({
          where: { id: attemptId },
          include: {
            testSet: {
              include: {
                passages: {
                  include: {
                    questions: true,
                  },
                },
              },
            },
            answers: true,
            user: true,
          },
        });

        if (!testAttempt) {
          throw new AppError('Test attempt not found', HTTP_STATUS.NOT_FOUND);
        }

        if (testAttempt.status === TestStatus.COMPLETED) {
          throw new AppError('Test already submitted', HTTP_STATUS.CONFLICT);
        }

        // Calculate results
        const results = await this.calculateTestResults(testAttempt);

        // Update test attempt
        const updatedAttempt = await tx.readingTestAttempt.update({
          where: { id: attemptId },
          data: {
            status: TestStatus.COMPLETED,
            completedAt: new Date(),
            submittedAt: new Date(),
            score: results.score,
            bandScore: results.bandScore,
            percentage: results.percentage,
            timeSpent: Math.floor((new Date().getTime() - testAttempt.startedAt.getTime()) / 1000),
          },
        });

        // Create test result record
        const testResult = await tx.readingTestResult.create({
          data: {
            userId: testAttempt.userId,
            testSetId: testAttempt.testSetId,
            attemptId: attemptId,
            score: results.score,
            bandScore: results.bandScore,
            percentage: results.percentage,
            timeSpent: updatedAttempt.timeSpent,
            correctAnswers: results.correctAnswers,
            wrongAnswers: results.wrongAnswers,
            skippedAnswers: results.skippedAnswers,
            passageScores: results.passageScores,
            questionTypeScores: results.questionTypeScores,
            strengths: results.strengths,
            weaknesses: results.weaknesses,
            aiSummary: results.aiSummary,
            aiFeedback: results.aiFeedback,
          },
        });

        // Update user reading test history
        await tx.userReadingTestHistory.create({
          data: {
            userId: testAttempt.userId,
            testSetId: testAttempt.testSetId,
          },
        });

        // Update user analytics
        await this.updateUserAnalytics(tx, testAttempt.userId, results);

        // Complete global test session
        await this.globalSessionService.completeTestSession(testAttempt.userId, attemptId);

        return {
          success: true,
          data: {
            testResult,
            bandScore: results.bandScore,
            score: results.score,
            totalScore: 40,
            percentage: results.percentage,
            feedback: results.aiFeedback,
          },
        };
      });
    } catch (error) {
      console.error('Error submitting test:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to submit test', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Calculate test results and band score
   */
  private async calculateTestResults(testAttempt: any) {
    const allQuestions = testAttempt.testSet.passages.flatMap((p: any) => p.questions);
    const userAnswers = testAttempt.answers;

    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;

    const passageScores: any = {};
    const questionTypeScores: any = {};

    // Process each question
    for (const question of allQuestions) {
      const userAnswer = userAnswers.find((a: any) => a.questionId === question.id);

      if (!userAnswer || !userAnswer.userAnswer.trim()) {
        skippedAnswers++;
      } else {
        const isCorrect = this.checkAnswer(question, userAnswer.userAnswer);

        if (isCorrect) {
          correctAnswers++;
          // Update answer record
          await this.prisma.readingAnswer.update({
            where: { id: userAnswer.id },
            data: {
              isCorrect: true,
              pointsEarned: 1,
            },
          });
        } else {
          wrongAnswers++;
          await this.prisma.readingAnswer.update({
            where: { id: userAnswer.id },
            data: {
              isCorrect: false,
              pointsEarned: 0,
            },
          });
        }

        // Track scores by passage
        const passage = testAttempt.testSet.passages.find((p: any) =>
          p.questions.some((q: any) => q.id === question.id)
        );
        if (passage) {
          if (!passageScores[passage.passageId]) {
            passageScores[passage.passageId] = { correct: 0, total: 0 };
          }
          passageScores[passage.passageId].total++;
          if (isCorrect) passageScores[passage.passageId].correct++;
        }

        // Track scores by question type
        if (!questionTypeScores[question.questionType]) {
          questionTypeScores[question.questionType] = { correct: 0, total: 0 };
        }
        questionTypeScores[question.questionType].total++;
        if (isCorrect) questionTypeScores[question.questionType].correct++;
      }
    }

    const score = correctAnswers;
    const percentage = (correctAnswers / 40) * 100;
    const bandScore = this.calculateBandScore(correctAnswers);

    // Generate AI feedback
    const aiFeedback = await this.generateAIFeedback(
      correctAnswers,
      wrongAnswers,
      skippedAnswers,
      passageScores,
      questionTypeScores
    );

    return {
      score,
      percentage,
      bandScore,
      correctAnswers,
      wrongAnswers,
      skippedAnswers,
      passageScores,
      questionTypeScores,
      strengths: aiFeedback.strengths,
      weaknesses: aiFeedback.weaknesses,
      aiSummary: aiFeedback.summary,
      aiFeedback: aiFeedback,
    };
  }

  /**
   * Check if user answer is correct
   */
  private checkAnswer(question: any, userAnswer: string): boolean {
    const correctAnswer = question.correctAnswer?.toLowerCase().trim();
    const userAnswerNormalized = userAnswer.toLowerCase().trim();

    // For different question types, implement specific checking logic
    switch (question.questionType) {
      case ReadingQuestionType.TRUE_FALSE_NOT_GIVEN:
      case ReadingQuestionType.YES_NO_NOT_GIVEN:
        return correctAnswer === userAnswerNormalized;

      case ReadingQuestionType.MULTIPLE_CHOICE:
      case ReadingQuestionType.MULTIPLE_CHOICE_INFERENCE:
        return correctAnswer === userAnswerNormalized;

      case ReadingQuestionType.SENTENCE_COMPLETION:
      case ReadingQuestionType.SUMMARY_COMPLETION:
        // Allow for minor variations in spelling/punctuation
        return this.isAnswerSimilar(correctAnswer, userAnswerNormalized);

      default:
        return correctAnswer === userAnswerNormalized;
    }
  }

  /**
   * Check if answers are similar (for completion questions)
   */
  private isAnswerSimilar(correct: string, user: string): boolean {
    // Remove common punctuation and extra spaces
    const cleanCorrect = correct
      .replace(/[.,;:!?]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    const cleanUser = user
      .replace(/[.,;:!?]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return cleanCorrect === cleanUser;
  }

  /**
   * Calculate IELTS band score based on correct answers
   */
  private calculateBandScore(correctAnswers: number): number {
    const bandMapping: { [key: number]: number } = {
      40: 9.0,
      39: 9.0,
      38: 8.5,
      37: 8.5,
      36: 8.0,
      35: 8.0,
      34: 7.5,
      33: 7.5,
      32: 7.0,
      31: 7.0,
      30: 7.0,
      29: 6.5,
      28: 6.5,
      27: 6.5,
      26: 6.0,
      25: 6.0,
      24: 6.0,
      23: 6.0,
      22: 5.5,
      21: 5.5,
      20: 5.5,
      19: 5.5,
      18: 5.0,
      17: 5.0,
      16: 5.0,
      15: 5.0,
      14: 4.5,
      13: 4.5,
      12: 4.0,
      11: 4.0,
      10: 4.0,
      9: 3.5,
      8: 3.5,
      7: 3.0,
      6: 3.0,
    };

    return bandMapping[correctAnswers] || 3.0;
  }

  /**
   * Generate AI feedback based on performance
   */
  private async generateAIFeedback(
    correctAnswers: number,
    wrongAnswers: number,
    skippedAnswers: number,
    passageScores: any,
    questionTypeScores: any
  ) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    // Analyze performance by question type
    for (const [questionType, scores] of Object.entries(questionTypeScores)) {
      const accuracy = (scores as any).correct / (scores as any).total;

      if (accuracy >= 0.8) {
        strengths.push(`Excellent performance in ${questionType.replace(/_/g, ' ').toLowerCase()} questions`);
      } else if (accuracy < 0.5) {
        weaknesses.push(`Needs improvement in ${questionType.replace(/_/g, ' ').toLowerCase()} questions`);
        recommendations.push(`Practice more ${questionType.replace(/_/g, ' ').toLowerCase()} questions`);
      }
    }

    // Analyze performance by passage
    for (const [passageId, scores] of Object.entries(passageScores)) {
      const accuracy = (scores as any).correct / (scores as any).total;

      if (accuracy < 0.5) {
        weaknesses.push(`Difficulty with ${passageId.replace(/_/g, ' ')} content`);
      }
    }

    // General feedback based on overall score
    let performanceLevel = '';
    const bandScore = this.calculateBandScore(correctAnswers);

    if (bandScore >= 8.0) {
      performanceLevel = 'Excellent';
    } else if (bandScore >= 7.0) {
      performanceLevel = 'Good';
    } else if (bandScore >= 6.0) {
      performanceLevel = 'Satisfactory';
    } else if (bandScore >= 5.0) {
      performanceLevel = 'Needs Improvement';
    } else {
      performanceLevel = 'Requires Significant Improvement';
    }

    const summary = `${performanceLevel} performance with ${correctAnswers}/40 correct answers (Band ${bandScore}). ${
      skippedAnswers > 5 ? 'Time management could be improved as several questions were left unanswered.' : ''
    }`;

    return {
      strengths,
      weaknesses,
      recommendations,
      summary,
      performanceLevel,
      bandScore,
      timeManagement: skippedAnswers <= 5 ? 'Good' : 'Needs Improvement',
    };
  }

  /**
   * Update user analytics after test completion
   */
  private async updateUserAnalytics(tx: any, userId: string, results: any) {
    const analytics = await tx.readingPerformanceAnalytics.findUnique({
      where: { userId },
    });

    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    if (analytics) {
      // Update existing analytics
      await tx.readingPerformanceAnalytics.update({
        where: { userId },
        data: {
          totalTests: analytics.totalTests + 1,
          latestBandScore: results.bandScore,
          bestBandScore: Math.max(analytics.bestBandScore || 0, results.bandScore),
          averageBandScore:
            analytics.totalTests > 0
              ? ((analytics.averageBandScore || 0) * analytics.totalTests + results.bandScore) /
                (analytics.totalTests + 1)
              : results.bandScore,
          averageTimeSpent:
            analytics.totalTests > 0
              ? Math.round(
                  ((analytics.averageTimeSpent || 0) * analytics.totalTests + results.timeSpent) /
                    (analytics.totalTests + 1)
                )
              : results.timeSpent,
          lastTestDate: now,
          next24HourTest: next24Hours,
          updatedAt: now,
        },
      });
    } else {
      // Create new analytics
      await tx.readingPerformanceAnalytics.create({
        data: {
          userId,
          totalTests: 1,
          averageBandScore: results.bandScore,
          bestBandScore: results.bandScore,
          latestBandScore: results.bandScore,
          averageTimeSpent: results.timeSpent,
          lastTestDate: now,
          next24HourTest: next24Hours,
        },
      });
    }
  }

  /**
   * Get test session status
   */
  async getTestSessionStatus(attemptId: string) {
    const attempt = await this.prisma.readingTestAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        testSet: {
          include: {
            passages: {
              include: {
                questions: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new AppError('Test attempt not found', HTTP_STATUS.NOT_FOUND);
    }

    const totalQuestions = attempt.testSet.passages.reduce(
      (sum: number, passage: any) => sum + passage.questions.length,
      0
    );

    const answeredQuestions = attempt.answers.filter((a: any) => a.userAnswer?.trim()).length;
    const timeElapsed = Math.floor((new Date().getTime() - attempt.startedAt.getTime()) / 1000);
    const timeRemaining = Math.max(0, 3600 - timeElapsed); // 60 minutes total

    return {
      attemptId: attempt.id,
      status: attempt.status,
      totalQuestions,
      answeredQuestions,
      timeElapsed,
      timeRemaining,
      autoSubmitAt: new Date(attempt.startedAt.getTime() + 3600 * 1000), // 1 hour from start
    };
  }
}
