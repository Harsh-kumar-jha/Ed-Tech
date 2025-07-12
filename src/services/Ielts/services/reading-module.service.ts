import { PrismaClient, ReadingQuestionType, DifficultyLevel } from '@prisma/client';
import { AppError } from '../../../utils/exceptions';
import { HTTP_STATUS } from '../../../constants/http-status';

export class ReadingModuleService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Bulk upload reading test sets from JSON array
   */
  async bulkUploadTestSets(jsonData: any[], createdBy: string) {
    try {
      const results = [];

      for (const testData of jsonData) {
        // Extract test set ID and validate structure
        const testSetKey = Object.keys(testData)[0]; // e.g., "test_1"
        const testSetData = testData[testSetKey];

        if (!testSetData) {
          throw new AppError('Invalid test set structure', HTTP_STATUS.BAD_REQUEST);
        }

        // Validate that we have exactly 3 passages
        const passageKeys = Object.keys(testSetData).filter(key => key.startsWith('passage_'));
        if (passageKeys.length !== 3) {
          throw new AppError(`Test set ${testSetKey} must contain exactly 3 passages`, HTTP_STATUS.BAD_REQUEST);
        }

        // Check if test set already exists
        const existingTestSet = await this.prisma.readingTestSet.findUnique({
          where: { testId: testSetKey },
        });

        if (existingTestSet) {
          throw new AppError(`Test set ${testSetKey} already exists`, HTTP_STATUS.CONFLICT);
        }

        // Create test set with passages and questions in a transaction
        const result = await this.prisma.$transaction(async tx => {
          // Create the test set
          const testSet = await tx.readingTestSet.create({
            data: {
              testId: testSetKey,
              title: `Reading Test Set ${testSetKey}`,
              description: `IELTS Reading Module Test containing 3 passages with ${this.countTotalQuestions(testSetData)} questions`,
              difficulty: DifficultyLevel.INTERMEDIATE,
              totalQuestions: this.countTotalQuestions(testSetData),
              createdBy: createdBy,
            },
          });

          // Create passages and questions
          const passagePromises = passageKeys.map(async (passageKey, index) => {
            const passageData = testSetData[passageKey];
            const passageNumber = index + 1;

            // Create passage
            const passage = await tx.readingPassage.create({
              data: {
                testSetId: testSet.id,
                passageId: passageKey,
                passageNumber: passageNumber,
                title: passageData.title,
                content: passageData.text || passageData.content,
                wordCount: this.countWords(passageData.text || passageData.content),
              },
            });

            // Process questions for this passage
            const questionsData = testSetData[`${passageKey}_questions`];
            if (questionsData) {
              await this.createQuestionsForPassage(tx, passage.id, questionsData);
            }

            return passage;
          });

          await Promise.all(passagePromises);
          return testSet;
        });

        results.push(result);
      }

      return {
        success: true,
        message: `Successfully uploaded ${results.length} test sets`,
        data: results,
      };
    } catch (error) {
      console.error('Error in bulk upload:', error);
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Failed to upload test sets', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create questions for a passage from the questions data
   */
  private async createQuestionsForPassage(tx: any, passageId: string, questionsData: any) {
    const questionPromises = [];

    // Process different question types
    for (const [questionType, questions] of Object.entries(questionsData)) {
      if (Array.isArray(questions)) {
        for (const questionData of questions) {
          const readingQuestionType = this.mapQuestionType(questionType);

          questionPromises.push(
            tx.readingQuestion.create({
              data: {
                passageId: passageId,
                questionNumber: questionData.question_number,
                questionType: readingQuestionType,
                questionText: questionData.question,
                options: questionData.options || [],
                correctAnswer: this.getCorrectAnswer(questionData, questionType),
              },
            })
          );
        }
      }
    }

    await Promise.all(questionPromises);
  }

  /**
   * Map question type string to ReadingQuestionType enum
   */
  private mapQuestionType(questionType: string): ReadingQuestionType {
    const typeMapping: { [key: string]: ReadingQuestionType } = {
      true_false_not_given: ReadingQuestionType.TRUE_FALSE_NOT_GIVEN,
      yes_no_not_given: ReadingQuestionType.YES_NO_NOT_GIVEN,
      multiple_choice: ReadingQuestionType.MULTIPLE_CHOICE,
      matching_headings: ReadingQuestionType.MATCHING_HEADINGS,
      matching_information: ReadingQuestionType.MATCHING_INFORMATION,
      matching_paragraph_information: ReadingQuestionType.MATCHING_PARAGRAPH_INFORMATION,
      sentence_completion: ReadingQuestionType.SENTENCE_COMPLETION,
      summary_completion: ReadingQuestionType.SUMMARY_COMPLETION,
      list_of_headings: ReadingQuestionType.LIST_OF_HEADINGS,
      multiple_choice_inference: ReadingQuestionType.MULTIPLE_CHOICE_INFERENCE,
      choosing_title: ReadingQuestionType.CHOOSING_TITLE,
      fill_blank: ReadingQuestionType.FILL_BLANK,
    };

    return typeMapping[questionType] || ReadingQuestionType.MULTIPLE_CHOICE;
  }

  /**
   * Extract correct answer from question data
   */
  private getCorrectAnswer(questionData: any, questionType: string): string {
    // For the sample data, answers are in the all_answers section
    // We'll need to handle this during the bulk upload by processing answers separately
    return questionData.correct_answer || questionData.answer || '';
  }

  /**
   * Count total questions across all passages
   */
  private countTotalQuestions(testSetData: any): number {
    let totalQuestions = 0;

    Object.keys(testSetData).forEach(key => {
      if (key.includes('_questions')) {
        const questionsData = testSetData[key];
        Object.values(questionsData).forEach((questions: any) => {
          if (Array.isArray(questions)) {
            totalQuestions += questions.length;
          }
        });
      }
    });

    return totalQuestions;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  /**
   * Get all reading test sets with pagination
   */
  async getReadingTestSets(page: number = 1, limit: number = 10, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.difficulty) {
      where.difficulty = filters.difficulty;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const [testSets, totalCount] = await Promise.all([
      this.prisma.readingTestSet.findMany({
        where,
        skip,
        take: limit,
        include: {
          passages: {
            include: {
              questions: true,
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.readingTestSet.count({ where }),
    ]);

    return {
      testSets,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Get a specific reading test set by ID
   */
  async getReadingTestSetById(id: string) {
    const testSet = await this.prisma.readingTestSet.findUnique({
      where: { id },
      include: {
        passages: {
          include: {
            questions: true,
          },
          orderBy: {
            passageNumber: 'asc',
          },
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!testSet) {
      throw new AppError('Reading test set not found', HTTP_STATUS.NOT_FOUND);
    }

    return testSet;
  }

  /**
   * Update a reading test set
   */
  async updateReadingTestSet(id: string, updateData: any) {
    try {
      const testSet = await this.prisma.readingTestSet.update({
        where: { id },
        data: {
          title: updateData.title,
          description: updateData.description,
          difficulty: updateData.difficulty,
          isActive: updateData.isActive,
          updatedAt: new Date(),
        },
        include: {
          passages: {
            include: {
              questions: true,
            },
          },
        },
      });

      return testSet;
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Reading test set not found', HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError('Failed to update reading test set', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Delete a reading test set
   */
  async deleteReadingTestSet(id: string) {
    try {
      await this.prisma.readingTestSet.delete({
        where: { id },
      });

      return { success: true, message: 'Reading test set deleted successfully' };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new AppError('Reading test set not found', HTTP_STATUS.NOT_FOUND);
      }
      throw new AppError('Failed to delete reading test set', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get random test set for user (excluding previously taken tests)
   */
  async getRandomTestSetForUser(userId: string) {
    // Get test sets the user has already completed
    const completedTestSets = await this.prisma.userReadingTestHistory.findMany({
      where: { userId },
      select: { testSetId: true },
    });

    const excludedTestSetIds = completedTestSets.map(history => history.testSetId);

    // Get available test sets
    const availableTestSets = await this.prisma.readingTestSet.findMany({
      where: {
        isActive: true,
        id: {
          notIn: excludedTestSetIds,
        },
      },
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
    });

    if (availableTestSets.length === 0) {
      throw new AppError('No available test sets found', HTTP_STATUS.NOT_FOUND);
    }

    // Return random test set
    const randomIndex = Math.floor(Math.random() * availableTestSets.length);
    return availableTestSets[randomIndex];
  }

  /**
   * Process answers from uploaded JSON and update questions
   */
  async processAnswersFromBulkUpload(jsonData: any[]) {
    try {
      for (const testData of jsonData) {
        const testSetKey = Object.keys(testData)[0];
        const testSetData = testData[testSetKey];

        if (testSetData.all_answers) {
          const testSet = await this.prisma.readingTestSet.findUnique({
            where: { testId: testSetKey },
            include: {
              passages: {
                include: {
                  questions: true,
                },
              },
            },
          });

          if (testSet) {
            // Update questions with correct answers
            for (const [passageKey, answers] of Object.entries(testSetData.all_answers)) {
              const passage = testSet.passages.find(p => p.passageId === passageKey);
              if (passage && typeof answers === 'object') {
                for (const [questionNum, answer] of Object.entries(answers)) {
                  const questionNumber = parseInt(questionNum);
                  const question = passage.questions.find(q => q.questionNumber === questionNumber);

                  if (question) {
                    await this.prisma.readingQuestion.update({
                      where: { id: question.id },
                      data: { correctAnswer: String(answer) },
                    });
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing answers:', error);
      throw new AppError('Failed to process answers', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }
  }
}
