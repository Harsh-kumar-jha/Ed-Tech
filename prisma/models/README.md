# Prisma Models - Modular Structure

This directory contains the separated database models for better organization and maintainability.

## Structure

### Models Directory
- `user.prisma` - User and UserProfile models
- `ielts-test.prisma` - IELTSTest and TestQuestion models
- `test-attempt.prisma` - TestAttempt, TestAnswer, and TestResult models
- `leaderboard.prisma` - LeaderboardEntry model
- `session.prisma` - Session management model
- `audit-log.prisma` - Audit logging model
- `file-upload.prisma` - File upload model

### Enums Directory
- `index.prisma` - All enum definitions

## How It Works

The main `schema.prisma` file in the root prisma directory consolidates all these separate files into a single schema that Prisma can use. This modular approach provides:

1. **Better Organization** - Related models are grouped together
2. **Easier Maintenance** - Find and edit specific models quickly
3. **Team Collaboration** - Multiple developers can work on different model files
4. **Clear Documentation** - Each file focuses on a specific domain

## Model Relationships

### User Management
- `User` ↔ `UserProfile` (One-to-One)
- `User` ↔ `Session` (One-to-Many)
- `User` ↔ `AuditLog` (One-to-Many)

### IELTS Testing
- `User` ↔ `IELTSTest` (Creator relationship)
- `IELTSTest` ↔ `TestQuestion` (One-to-Many)
- `User` ↔ `TestAttempt` (One-to-Many)
- `IELTSTest` ↔ `TestAttempt` (One-to-Many)
- `TestAttempt` ↔ `TestAnswer` (One-to-Many)
- `TestAttempt` ↔ `TestResult` (One-to-One)

### Leaderboard
- `User` ↔ `LeaderboardEntry` (One-to-Many)

## Usage

When making changes:
1. Edit the specific model file in this directory
2. Update the main `schema.prisma` file to reflect changes
3. Run `pnpm db:generate` to regenerate the Prisma client
4. Run migrations if schema changes affect the database

## Commands

```bash
# Generate Prisma client
pnpm db:generate

# Create and apply migrations
pnpm db:migrate

# Reset database (development only)
pnpm db:migrate:reset

# View database in Prisma Studio
pnpm db:studio
``` 