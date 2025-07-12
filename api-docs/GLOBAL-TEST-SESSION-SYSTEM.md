## Global Test Session Management System

### Overview
The Global Test Session Management System ensures that users can only have one active test session across all IELTS modules (Reading, Writing, Listening, Speaking) at any time.

### Key Features

1. **Single Active Session Rule**: Users cannot start multiple module tests simultaneously
2. **Cross-Module Session Tracking**: Active sessions are tracked globally across all modules
3. **Session Lifecycle Management**: Complete management from creation to completion/abandonment
4. **Automatic Cleanup**: Expired sessions are automatically cleaned up
5. **User-Friendly Error Messages**: Clear feedback when trying to start multiple tests

### Database Changes

#### New Model: `GlobalTestSession`
```prisma
model GlobalTestSession {
  id                String            @id @default(uuid())
  userId            String
  module            IELTSModule       // READING, WRITING, LISTENING, SPEAKING
  moduleTestId      String            // ID of the specific module test
  moduleAttemptId   String            // ID of the module-specific attempt
  status            TestStatus        @default(NOT_STARTED)
  startedAt         DateTime          @default(now())
  lastActivityAt    DateTime          @default(now())
  expiresAt         DateTime          // Auto-expire after time limit
  timeLimit         Int               // in seconds
  isActive          Boolean           @default(true)
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt

  user User @relation("UserGlobalTestSessions", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, isActive]) // Only one active session per user
  @@map("global_test_sessions")
}
```

### API Endpoints

#### Check Active Session
```
GET /api/v1/test-session/active
```
Returns user's current active session (if any) across all modules.

#### Abandon Active Session
```
POST /api/v1/test-session/abandon
```
Allows users to abandon their current active test session.

#### Session History
```
GET /api/v1/test-session/history
```
Get user's test session history across all modules.

#### Admin Cleanup
```
POST /api/v1/test-session/cleanup-expired
```
Admin endpoint to clean up expired sessions.

### Integration Points

#### Reading Module Integration
The Reading Module now:
1. Checks for active sessions before allowing new tests
2. Creates global sessions when starting tests
3. Updates global session status during test lifecycle
4. Completes global sessions when tests are submitted

#### Error Handling
- **Active Session Conflict**: Clear error message indicating which module has an active session
- **Session Expiry**: Automatic cleanup of expired sessions
- **User Authorization**: Proper permission checks for session management

### Usage Flow

1. **User starts a Reading test**:
   - System checks for any active global session
   - If active session exists in any module → Error message
   - If no active session → Creates Reading test + Global session

2. **User tries to start Writing test while Reading is active**:
   - System detects active Reading session
   - Returns error: "You already have an active reading test session"

3. **User completes Reading test**:
   - Reading module completes the test
   - Global session is marked as completed and inactive
   - User can now start tests in other modules

4. **User abandons test**:
   - User can call abandon endpoint
   - Global session is marked as abandoned and inactive
   - User can start new tests

### Benefits

1. **Prevents Resource Conflicts**: Users can't accidentally start multiple tests
2. **Better User Experience**: Clear feedback about active sessions
3. **Data Integrity**: Ensures consistent test session state
4. **Resource Management**: Automatic cleanup of expired sessions
5. **Scalable Design**: Easily extensible to other IELTS modules

### Next Steps

To fully implement this system:

1. Run database migration to add the GlobalTestSession table
2. Update other modules (Writing, Listening, Speaking) to use global session management
3. Add frontend checks to display active session warnings
4. Implement session recovery for interrupted tests
5. Add admin dashboard for session monitoring

### Database Migration Commands

```bash
# Build the schema
npm run db:build-schema

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate
```

This system provides a robust foundation for managing test sessions across all IELTS modules while maintaining data integrity and providing excellent user experience.
