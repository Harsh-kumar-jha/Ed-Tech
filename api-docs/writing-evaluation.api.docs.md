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

## Task1 Template Management

### Create Task1 Template
```http
POST /api/v1/ai/writing/templates/task1
Content-Type: multipart/form-data
```

Creates a new Task1 template with an image upload.

**Authentication:**
- Requires JWT token
- Requires ADMIN role

**Request:**
```
form-data:
  - image: [FILE] (Required)
  - type: "line_graph" | "bar_chart" | "pie_chart" | "table" | "process" | "map" | "mixed" (Required)
  - prompt: "string" (Required)
  - isActive: "true" | "false" (Optional, default: true)
  - tags: "tag1,tag2,tag3" (Optional, comma-separated tags)
```

**Response:**
```json
{
  "success": true,
  "message": "Template created successfully",
  "data": {
    "template": {
      "id": "string",
      "type": "string",
      "prompt": "string",
      "imageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/task1-templates/image.jpg",
      "imagePublicId": "task1-templates/image",
      "isActive": true,
      "createdBy": "string",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "creator": {
        "id": "string",
        "username": "string",
        "firstName": "string",
        "lastName": "string"
      }
    },
    "upload": {
      "publicId": "string",
      "url": "string",
      "secureUrl": "string",
      "format": "string",
      "width": 800,
      "height": 600,
      "bytes": 12345
    }
  }
}
```

### Update Task1 Template
```http
PUT /api/v1/ai/writing/templates/task1/:id
Content-Type: multipart/form-data
```

Updates an existing Task1 template with optional image replacement.

**Authentication:**
- Requires JWT token
- Requires ADMIN role

**Request:**
```
form-data:
  - image: [FILE] (Optional, only include to replace existing image)
  - type: "line_graph" | "bar_chart" | "pie_chart" | "table" | "process" | "map" | "mixed" (Optional)
  - prompt: "string" (Optional)
  - isActive: "true" | "false" (Optional)
  - tags: "tag1,tag2,tag3" (Optional, comma-separated tags)
```

**Response:**
```json
{
  "success": true,
  "message": "Template updated successfully",
  "data": {
    "template": {
      "id": "string",
      "type": "string",
      "prompt": "string",
      "imageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/task1-templates/image.jpg",
      "isActive": true,
      "createdBy": "string",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "creator": {
        "id": "string",
        "username": "string",
        "firstName": "string",
        "lastName": "string"
      }
    }
  }
}
```

### Get All Task1 Templates
```http
GET /api/v1/ai/writing/templates/task1
```

Retrieves all Task1 templates with optional filtering.

**Authentication:**
- Requires JWT token
- Requires ADMIN role

**Query Parameters:**
```
type: "line_graph" | "bar_chart" | "pie_chart" | "table" | "process" | "map" | "mixed" (Optional)
active_only: "true" | "false" (Optional, default: false)
difficulty: "beginner" | "intermediate" | "advanced" (Optional)
test_type: "academic" | "general_training" (Optional)
page: number (Optional, default: 1)
limit: number (Optional, default: 10)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "string",
        "type": "string",
        "prompt": "string",
        "imageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/task1-templates/image.jpg",
        "isActive": true,
        "createdBy": "string",
        "createdAt": "2023-01-01T00:00:00.000Z",
        "updatedAt": "2023-01-01T00:00:00.000Z",
        "creator": {
          "id": "string",
          "username": "string",
          "firstName": "string",
          "lastName": "string"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

### Get Task1 Template by ID
```http
GET /api/v1/ai/writing/templates/task1/:id
```

Retrieves a specific Task1 template by its ID.

**Authentication:**
- Requires JWT token
- Requires ADMIN role

**Response:**
```json
{
  "success": true,
  "data": {
    "template": {
      "id": "string",
      "type": "string",
      "prompt": "string",
      "imageUrl": "https://res.cloudinary.com/xxx/image/upload/v123/task1-templates/image.jpg",
      "isActive": true,
      "createdBy": "string",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z",
      "creator": {
        "id": "string",
        "username": "string",
        "firstName": "string",
        "lastName": "string"
      }
    }
  }
}
```

### Delete Task1 Template (Soft Delete)
```http
DELETE /api/v1/ai/writing/templates/task1/:id
```

Soft deletes a Task1 template by setting isActive to false.

**Authentication:**
- Requires JWT token
- Requires ADMIN role

**Response:**
```json
{
  "success": true,
  "message": "Template deleted successfully"
}
```

### Permanently Delete Task1 Template
```http
DELETE /api/v1/ai/writing/templates/task1/:id/permanent
```

Permanently deletes a Task1 template and its associated image from storage.

**Authentication:**
- Requires JWT token
- Requires ADMIN role

**Response:**
```json
{
  "success": true,
  "message": "Template permanently deleted"
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

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields",
    "details": {
      "required": ["type", "prompt"],
      "received": { "type": true, "prompt": false }
    }
  }
}
```

### File Upload Error
```json
{
  "success": false,
  "error": {
    "code": "UPLOAD_ERROR",
    "message": "Failed to upload image",
    "details": {
      "cloudinaryError": "Asset upload failed",
      "code": "CLOUDINARY_ERROR"
    }
  }
}
```

### Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

### Permission Error
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Only administrators can manage task templates"
  }
} 