# Reading Module API Documentation

## Endpoints

### Start Reading Test

```http
POST /api/v1/reading/start-test
```

Starts a new reading test session with randomly selected test set.

**Authentication:**

- Requires JWT token

**Request Body:**

```json
{
  "difficulty": "EASY | MEDIUM | HARD", // Optional
  "skipQuotaCheck": false // Optional, for development/testing
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "attemptId": "string",
    "testSet": {
      "id": "string",
      "title": "string",
      "description": "string",
      "difficulty": "EASY | MEDIUM | HARD",
      "timeLimit": 3600,
      "passages": [
        {
          "id": "string",
          "title": "string",
          "content": "string",
          "passageNumber": 1,
          "questions": [
            {
              "id": "string",
              "questionText": "string",
              "questionType": "TRUE_FALSE_NOT_GIVEN | YES_NO_NOT_GIVEN | MULTIPLE_CHOICE | MATCHING_HEADINGS | MATCHING_INFORMATION | MATCHING_PARAGRAPH_INFORMATION | SENTENCE_COMPLETION | SUMMARY_COMPLETION | NOTE_COMPLETION | TABLE_COMPLETION | FLOW_CHART_COMPLETION | DIAGRAM_COMPLETION | SHORT_ANSWER",
              "questionNumber": 1,
              "options": ["string"], // Only for multiple choice questions
              "correctAnswer": "string",
              "explanation": "string"
            }
          ]
        }
      ]
    },
    "sessionInfo": {
      "timeStarted": "2023-01-01T00:00:00.000Z",
      "timeLimit": 3600,
      "status": "NOT_STARTED",
      "instructions": "string"
    },
    "quotaStatus": {
      "remainingTests": 5,
      "totalTests": 10,
      "isSubscribed": true
    }
  }
}
```

### Begin Reading Test

```http
POST /api/v1/reading/begin-test/:attemptId
```

Marks the test as started when user actually begins reading.

**Authentication:**

- Requires JWT token

**Response:**

```json
{
  "success": true,
  "data": {
    "attemptId": "string",
    "status": "IN_PROGRESS",
    "timeStarted": "2023-01-01T00:00:00.000Z",
    "timeRemaining": 3600
  }
}
```

### Save Answer

```http
POST /api/v1/reading/save-answer
```

Saves answer for a specific question during the test.

**Authentication:**

- Requires JWT token

**Request Body:**

```json
{
  "attemptId": "string",
  "questionId": "string",
  "answer": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "answerId": "string",
    "questionId": "string",
    "answer": "string",
    "savedAt": "2023-01-01T00:00:00.000Z",
    "isCorrect": null // Not revealed until test submission
  }
}
```

### Submit Reading Test

```http
POST /api/v1/reading/submit-test/:attemptId
```

Submits the reading test and receives comprehensive results with AI feedback.

**Authentication:**

- Requires JWT token

**Response:**

```json
{
  "success": true,
  "data": {
    "testResult": {
      "id": "string",
      "attemptId": "string",
      "score": 35,
      "totalQuestions": 40,
      "percentage": 87.5,
      "bandScore": 7.5,
      "timeSpent": 3240,
      "status": "COMPLETED",
      "submittedAt": "2023-01-01T00:00:00.000Z"
    },
    "detailedResults": {
      "passageResults": [
        {
          "passageId": "string",
          "passageTitle": "string",
          "score": 12,
          "totalQuestions": 13,
          "percentage": 92.3,
          "timeSpent": 1200,
          "questionResults": [
            {
              "questionId": "string",
              "questionNumber": 1,
              "questionType": "TRUE_FALSE_NOT_GIVEN",
              "userAnswer": "TRUE",
              "correctAnswer": "TRUE",
              "isCorrect": true,
              "timeSpent": 45
            }
          ]
        }
      ],
      "questionTypeAnalysis": [
        {
          "questionType": "TRUE_FALSE_NOT_GIVEN",
          "totalQuestions": 5,
          "correctAnswers": 4,
          "accuracy": 80.0,
          "averageTime": 52.4
        }
      ]
    },
    "aiFeedback": {
      "overallFeedback": "string",
      "strengths": ["string"],
      "areasForImprovement": ["string"],
      "skillAnalysis": {
        "skimmingAndScanning": {
          "score": 7.0,
          "feedback": "string"
        },
        "detailReading": {
          "score": 6.5,
          "feedback": "string"
        },
        "inferenceAndDeduction": {
          "score": 8.0,
          "feedback": "string"
        },
        "vocabularyInContext": {
          "score": 7.5,
          "feedback": "string"
        }
      },
      "recommendations": ["string"],
      "studyPlan": "string"
    },
    "bandDescriptor": {
      "band": 7.5,
      "description": "string",
      "skillLevels": {
        "readingSpeed": "Good",
        "comprehension": "Very Good",
        "vocabularyRange": "Good",
        "inferenceSkills": "Very Good"
      }
    }
  }
}
```

### Get Test Session Status

```http
GET /api/v1/reading/session-status/:attemptId
```

Gets current status of a reading test session.

**Authentication:**

- Requires JWT token

**Response:**

```json
{
  "success": true,
  "data": {
    "attemptId": "string",
    "status": "NOT_STARTED | IN_PROGRESS | COMPLETED | EXPIRED",
    "timeStarted": "2023-01-01T00:00:00.000Z",
    "timeRemaining": 2400,
    "questionsAnswered": 25,
    "totalQuestions": 40,
    "progress": 62.5,
    "lastActivityAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Get User Test History

```http
GET /api/v1/reading/my-tests
```

Gets paginated history of user's reading tests.

**Authentication:**

- Requires JWT token

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by test status
- `difficulty` (optional): Filter by difficulty level

**Response:**

```json
{
  "success": true,
  "data": {
    "tests": [
      {
        "id": "string",
        "testSetTitle": "string",
        "difficulty": "MEDIUM",
        "status": "COMPLETED",
        "score": 35,
        "totalQuestions": 40,
        "percentage": 87.5,
        "bandScore": 7.5,
        "timeSpent": 3240,
        "timeLimit": 3600,
        "startedAt": "2023-01-01T00:00:00.000Z",
        "completedAt": "2023-01-01T00:00:00.000Z",
        "aiFeedback": {
          "overallFeedback": "string",
          "bandScore": 7.5,
          "strengths": ["string"],
          "improvements": ["string"]
        }
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "statistics": {
      "totalTestsTaken": 45,
      "averageBandScore": 7.2,
      "bestScore": 8.5,
      "recentTrend": "improving | stable | declining"
    }
  }
}
```

### Get User Analytics

```http
GET /api/v1/reading/my-analytics
```

Gets comprehensive analytics for user's reading performance.

**Authentication:**

- Requires JWT token

**Query Parameters:**

- `period` (optional): Time period for analytics (30d, 90d, 1y, all) (default:
  30d)
- `includeDetailed` (optional): Include detailed breakdowns (default: false)

**Response:**

```json
{
  "success": true,
  "data": {
    "overallPerformance": {
      "averageBandScore": 7.2,
      "totalTestsCompleted": 45,
      "totalTimeSpent": 162000,
      "averageAccuracy": 78.5,
      "trend": "improving",
      "improvementRate": 12.5
    },
    "skillBreakdown": {
      "skimmingAndScanning": {
        "averageScore": 7.0,
        "accuracy": 75.2,
        "averageTime": 45.6,
        "trend": "stable"
      },
      "detailReading": {
        "averageScore": 6.8,
        "accuracy": 72.1,
        "averageTime": 89.3,
        "trend": "improving"
      },
      "inferenceAndDeduction": {
        "averageScore": 7.8,
        "accuracy": 84.2,
        "averageTime": 67.2,
        "trend": "improving"
      },
      "vocabularyInContext": {
        "averageScore": 7.3,
        "accuracy": 79.8,
        "averageTime": 52.1,
        "trend": "stable"
      }
    },
    "questionTypePerformance": [
      {
        "questionType": "TRUE_FALSE_NOT_GIVEN",
        "totalAttempted": 125,
        "correctAnswers": 98,
        "accuracy": 78.4,
        "averageTime": 48.2,
        "averageBandScore": 7.1,
        "trend": "improving"
      }
    ],
    "difficultyAnalysis": {
      "EASY": {
        "averageScore": 8.2,
        "accuracy": 89.5,
        "testsCompleted": 15
      },
      "MEDIUM": {
        "averageScore": 7.1,
        "accuracy": 76.8,
        "testsCompleted": 25
      },
      "HARD": {
        "averageScore": 6.5,
        "accuracy": 65.2,
        "testsCompleted": 5
      }
    },
    "timeManagement": {
      "averageTestTime": 3240,
      "averageTimePerQuestion": 81,
      "timeEfficiencyScore": 7.5,
      "recommendedPace": 90
    },
    "weakAreas": [
      {
        "area": "Matching Headings",
        "accuracy": 58.3,
        "recommendations": ["string"]
      }
    ],
    "recentProgress": {
      "last7Days": {
        "testsCompleted": 3,
        "averageBandScore": 7.8,
        "improvement": "+0.3"
      },
      "last30Days": {
        "testsCompleted": 12,
        "averageBandScore": 7.4,
        "improvement": "+0.6"
      }
    },
    "goals": {
      "targetBandScore": 8.0,
      "currentProgress": 90,
      "estimatedTimeToGoal": "2-3 weeks",
      "recommendedTestsPerWeek": 3
    }
  }
}
```

### Get Random Test Set

```http
GET /api/v1/reading/get-test-set
```

Gets a random test set for the user (excluding previously taken tests).

**Authentication:**

- Requires JWT token

**Query Parameters:**

- `difficulty` (optional): Filter by difficulty level
- `excludeCompleted` (optional): Exclude completed tests (default: true)

**Response:**

```json
{
  "success": true,
  "data": {
    "testSet": {
      "id": "string",
      "title": "string",
      "description": "string",
      "difficulty": "MEDIUM",
      "timeLimit": 3600,
      "totalQuestions": 40,
      "passageCount": 3,
      "averageCompletionTime": 3240,
      "averageBandScore": 7.2,
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z"
    },
    "userStats": {
      "testsRemaining": 8,
      "completedToday": 2,
      "dailyLimit": 5,
      "canTakeTest": true
    }
  }
}
```

## Admin Endpoints

### Bulk Upload Test Sets

```http
POST /api/v1/reading/admin/bulk-upload
```

Bulk upload reading test sets from JSON array.

**Authentication:**

- Requires JWT token
- Requires ADMIN or SUPER_ADMIN role

**Request Body:**

```json
{
  "testSets": {
    "TEST_SET_001": {
      "title": "Academic Reading Test 1",
      "description": "IELTS Academic Reading Module Test",
      "difficulty": "MEDIUM",
      "timeLimit": 3600,
      "passages": {
        "passage_1": {
          "title": "Climate Change and Agriculture",
          "content": "Long passage content...",
          "questions": {
            "1": {
              "question_text": "The passage states that...",
              "question_type": "true_false_not_given",
              "correct_answer": "TRUE",
              "explanation": "Explanation text..."
            }
          }
        }
      }
    }
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "uploadedTestSets": 5,
    "totalPassages": 15,
    "totalQuestions": 200,
    "skippedTestSets": 0,
    "errors": [],
    "summary": {
      "testSetsCreated": ["TEST_SET_001", "TEST_SET_002"],
      "duplicatesSkipped": [],
      "processingTime": "2.3s"
    }
  }
}
```

### Get All Test Sets

```http
GET /api/v1/reading/admin/test-sets
```

Gets all reading test sets with pagination and filters.

**Authentication:**

- Requires JWT token
- Requires ADMIN or SUPER_ADMIN role

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `difficulty` (optional): Filter by difficulty level
- `isActive` (optional): Filter by active status
- `search` (optional): Search in title and description

**Response:**

```json
{
  "success": true,
  "data": {
    "testSets": [
      {
        "id": "string",
        "title": "string",
        "description": "string",
        "difficulty": "MEDIUM",
        "timeLimit": 3600,
        "isActive": true,
        "passageCount": 3,
        "questionCount": 40,
        "attemptCount": 156,
        "averageBandScore": 7.2,
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "totalPages": 3,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Get Test Set by ID

```http
GET /api/v1/reading/admin/test-sets/:id
```

Gets a specific reading test set with full details including passages and
questions.

**Authentication:**

- Requires JWT token
- Requires ADMIN or SUPER_ADMIN role

**Response:**

```json
{
  "success": true,
  "data": {
    "testSet": {
      "id": "string",
      "title": "string",
      "description": "string",
      "difficulty": "MEDIUM",
      "timeLimit": 3600,
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "passages": [
        {
          "id": "string",
          "title": "string",
          "content": "string",
          "passageNumber": 1,
          "questions": [
            {
              "id": "string",
              "questionText": "string",
              "questionType": "TRUE_FALSE_NOT_GIVEN",
              "questionNumber": 1,
              "options": ["string"],
              "correctAnswer": "string",
              "explanation": "string"
            }
          ]
        }
      ],
      "statistics": {
        "totalAttempts": 156,
        "averageBandScore": 7.2,
        "averageCompletionTime": 3240,
        "accuracyRate": 78.5
      }
    }
  }
}
```

### Update Test Set

```http
PUT /api/v1/reading/admin/test-sets/:id
```

Updates an existing reading test set.

**Authentication:**

- Requires JWT token
- Requires ADMIN or SUPER_ADMIN role

**Request Body:**

```json
{
  "title": "string", // Optional
  "description": "string", // Optional
  "difficulty": "EASY | MEDIUM | HARD", // Optional
  "timeLimit": 3600, // Optional
  "isActive": true // Optional
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "testSet": {
      "id": "string",
      "title": "string",
      "description": "string",
      "difficulty": "MEDIUM",
      "timeLimit": 3600,
      "isActive": true,
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  }
}
```

### Delete Test Set

```http
DELETE /api/v1/reading/admin/test-sets/:id
```

Soft deletes a reading test set (sets isActive to false).

**Authentication:**

- Requires JWT token
- Requires ADMIN or SUPER_ADMIN role

**Response:**

```json
{
  "success": true,
  "message": "Reading test set deleted successfully"
}
```

### Get Module Statistics

```http
GET /api/v1/reading/admin/statistics
```

Gets comprehensive statistics for the reading module.

**Authentication:**

- Requires JWT token
- Requires ADMIN or SUPER_ADMIN role

**Query Parameters:**

- `period` (optional): Time period (7d, 30d, 90d, 1y, all) (default: 30d)
- `includeDetails` (optional): Include detailed breakdowns (default: false)

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalTestSets": 25,
      "activeTestSets": 23,
      "totalAttempts": 1250,
      "completedTests": 1180,
      "averageBandScore": 7.1,
      "totalUsers": 450
    },
    "testSetUsage": [
      {
        "testSetId": "string",
        "title": "string",
        "attempts": 156,
        "completionRate": 94.2,
        "averageBandScore": 7.3,
        "averageTime": 3240
      }
    ],
    "difficultyDistribution": {
      "EASY": {
        "testSets": 8,
        "attempts": 420,
        "averageBandScore": 7.8
      },
      "MEDIUM": {
        "testSets": 12,
        "attempts": 650,
        "averageBandScore": 7.1
      },
      "HARD": {
        "testSets": 5,
        "attempts": 180,
        "averageBandScore": 6.2
      }
    },
    "questionTypePerformance": [
      {
        "questionType": "TRUE_FALSE_NOT_GIVEN",
        "totalQuestions": 125,
        "averageAccuracy": 76.8,
        "averageTime": 48.2
      }
    ],
    "userEngagement": {
      "dailyActiveUsers": 85,
      "weeklyActiveUsers": 320,
      "monthlyActiveUsers": 450,
      "averageTestsPerUser": 2.8,
      "retentionRate": 68.5
    },
    "performanceTrends": {
      "bandScoreTrend": "improving",
      "accuracyTrend": "stable",
      "completionRateTrend": "improving",
      "engagementTrend": "improving"
    }
  }
}
```

## Error Responses

All endpoints may return the following error responses:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Common error codes:

- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `INVALID_INPUT`: Invalid request parameters
- `QUOTA_EXCEEDED`: Test quota exceeded
- `TEST_EXPIRED`: Test session has expired
- `TEST_ALREADY_COMPLETED`: Test has already been submitted
- `ACTIVE_SESSION_EXISTS`: User has an active test session
- `INTERNAL_ERROR`: Server error

### Validation Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "difficulty",
      "message": "Must be one of: EASY, MEDIUM, HARD",
      "value": "INVALID_DIFFICULTY"
    }
  }
}
```

### Quota Exceeded Error

```json
{
  "success": false,
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Daily test limit exceeded",
    "details": {
      "dailyLimit": 5,
      "testsCompleted": 5,
      "resetTime": "2023-01-02T00:00:00.000Z"
    }
  }
}
```

### Active Session Error

```json
{
  "success": false,
  "error": {
    "code": "ACTIVE_SESSION_EXISTS",
    "message": "You have an active test session in progress",
    "details": {
      "activeAttemptId": "string",
      "testSetTitle": "string",
      "timeRemaining": 2400,
      "questionsAnswered": 15
    }
  }
}
```

### Permission Error

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin privileges required to access this endpoint"
  }
}
```

### Test Session Error

```json
{
  "success": false,
  "error": {
    "code": "TEST_EXPIRED",
    "message": "Test session has expired",
    "details": {
      "attemptId": "string",
      "expiredAt": "2023-01-01T01:00:00.000Z",
      "timeLimit": 3600
    }
  }
}
```

## Data Models

### Question Types

The Reading Module supports the following IELTS question types:

- `TRUE_FALSE_NOT_GIVEN`: True/False/Not Given questions
- `YES_NO_NOT_GIVEN`: Yes/No/Not Given questions
- `MULTIPLE_CHOICE`: Multiple choice questions with options
- `MATCHING_HEADINGS`: Match headings to paragraphs
- `MATCHING_INFORMATION`: Match information to paragraphs
- `MATCHING_PARAGRAPH_INFORMATION`: Match paragraph information
- `SENTENCE_COMPLETION`: Complete sentences
- `SUMMARY_COMPLETION`: Complete summaries
- `NOTE_COMPLETION`: Complete notes
- `TABLE_COMPLETION`: Complete tables
- `FLOW_CHART_COMPLETION`: Complete flow charts
- `DIAGRAM_COMPLETION`: Complete diagrams
- `SHORT_ANSWER`: Short answer questions

### Difficulty Levels

- `EASY`: Band 4.0-6.0 level
- `MEDIUM`: Band 6.0-7.5 level
- `HARD`: Band 7.5-9.0 level

### Test Status

- `NOT_STARTED`: Test created but not begun
- `IN_PROGRESS`: Test is currently being taken
- `COMPLETED`: Test has been submitted and scored
- `EXPIRED`: Test session has expired
- `ABANDONED`: Test was started but not completed within time limit

### Band Score Calculation

Band scores are calculated based on the number of correct answers out of 40
questions:

- 39-40 correct: Band 9.0
- 37-38 correct: Band 8.5
- 35-36 correct: Band 8.0
- 33-34 correct: Band 7.5
- 30-32 correct: Band 7.0
- 27-29 correct: Band 6.5
- 23-26 correct: Band 6.0
- 19-22 correct: Band 5.5
- 15-18 correct: Band 5.0
- 13-14 correct: Band 4.5
- 10-12 correct: Band 4.0
- 8-9 correct: Band 3.5
- 6-7 correct: Band 3.0
- 4-5 correct: Band 2.5
- 3 correct: Band 2.0
- 2 correct: Band 1.5
- 1 correct: Band 1.0
- 0 correct: Band 0.0

## Rate Limits

- General API calls: 100 requests per minute per user
- Test creation: 5 tests per day per user (configurable by subscription)
- Admin endpoints: 200 requests per minute per admin user
- Bulk upload: 10 uploads per hour per admin user

## Authentication

All endpoints require JWT authentication except where noted. Include the JWT
token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Admin endpoints additionally require the user to have ADMIN or SUPER_ADMIN role.
