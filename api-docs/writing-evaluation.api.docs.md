# Writing Evaluation API Documentation

## Endpoints

### Start Writing Test
```http
POST /api/v1/ai/writing/start
```

Starts a new writing test session with Task 1 and Task 2 prompts.

**Request Body:**
```json
{
  "test_type": "academic | general_training",
  "task1_type": "line_graph | bar_chart | pie_chart | table | process | map | mixed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "testSessionId": "string",
    "task1": {
      "type": "string",
      "prompt": "string",
      "imageUrl": "string"
    },
    "timeLimit": 1200,
    "quotaStatus": {
      "remainingTests": 0,
      "totalTests": 0,
      "isSubscribed": false
    },
    "testType": "string"
  }
}
```

### Evaluate Task 1
```http
POST /api/v1/ai/writing/evaluate/task1
```

Submits and evaluates Task 1 response.

**Request Body:**
```json
{
  "testSessionId": "string",
  "response": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "band": 0,
      "feedback": "string",
      "strengths": ["string"],
      "improvements": ["string"]
    },
    "task2": {
      "prompt": "string",
      "timeLimit": 1200
    }
  }
}
```

### Evaluate Task 2
```http
POST /api/v1/ai/writing/evaluate/task2
```

Submits and evaluates Task 2 response.

**Request Body:**
```json
{
  "testSessionId": "string",
  "response": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "evaluation": {
      "band": 0,
      "feedback": "string",
      "strengths": ["string"],
      "improvements": ["string"]
    },
    "overallEvaluation": {
      "combinedBand": 0,
      "generalFeedback": "string"
    }
  }
}
```

### Get Progress
```http
GET /api/v1/ai/writing/progress
```

Gets user's writing progress analysis.

**Response:**
```json
{
  "success": true,
  "data": {
    "overallProgress": {
      "averageBand": 0,
      "testsCompleted": 0,
      "trend": "improving | stable | declining"
    },
    "skillBreakdown": {
      "taskAchievement": 0,
      "coherenceAndCohesion": 0,
      "lexicalResource": 0,
      "grammaticalRangeAndAccuracy": 0
    },
    "recommendations": {
      "focusAreas": ["string"],
      "nextSteps": ["string"]
    }
  }
}
```

### Get Test History
```http
GET /api/v1/ai/writing/history
```

Gets paginated history of user's writing tests.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": {
    "tests": [{
      "testId": "string",
      "testType": "string",
      "startedAt": "string",
      "completedAt": "string",
      "status": "string",
      "task1": {
        "prompt": "string",
        "response": "string",
        "evaluation": {
          "band": 0,
          "feedback": "string",
          "strengths": ["string"],
          "improvements": ["string"]
        }
      },
      "task2": {
        "prompt": "string",
        "response": "string",
        "evaluation": {
          "band": 0,
          "feedback": "string",
          "strengths": ["string"],
          "improvements": ["string"]
        }
      },
      "overallBand": 0
    }],
    "pagination": {
      "total": 0,
      "page": 0,
      "limit": 0,
      "totalPages": 0
    }
  }
}
```

### Configure Webhooks
```http
POST /api/v1/ai/writing/webhooks/configure
```

Configures webhook for progress notifications (Premium users only).

**Request Body:**
```json
{
  "webhookUrl": "string",
  "events": ["progress.updated", "test.completed", "band.improved"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "webhookId": "string",
    "webhookUrl": "string",
    "events": ["string"],
    "secret": "string"
  }
}
```

## Task 1 Templates

### List Templates
```http
GET /api/v1/ai/writing/templates/task1
```

Gets list of available Task 1 templates.

**Query Parameters:**
- `type` (optional): Filter by template type
- `isActive` (optional): Filter by active status

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [{
      "id": "string",
      "type": "string",
      "prompt": "string",
      "imageUrl": "string",
      "isActive": true,
      "createdAt": "string",
      "updatedAt": "string"
    }]
  }
}
```

### Get Template by ID
```http
GET /api/v1/ai/writing/templates/task1/:id
```

Gets a specific Task 1 template by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "type": "string",
    "prompt": "string",
    "imageUrl": "string",
    "isActive": true,
    "createdAt": "string",
    "updatedAt": "string"
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
- `INTERNAL_ERROR`: Server error 