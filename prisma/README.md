# 🗄️ IELTS EdTech Platform - Database Schema

This directory contains a **modular Prisma schema** for the IELTS EdTech Platform, organized for better maintainability and team collaboration.

## 📁 Directory Structure

```
prisma/
├── 📄 schema.prisma          # Main consolidated schema (auto-generated)
├── 🌱 seed.ts               # Database seeding script
├── 📝 README.md             # This file
├── 📂 models/               # Individual model files
│   ├── user.prisma          # User & UserProfile models
│   ├── ielts-test.prisma    # IELTSTest & TestQuestion models
│   ├── test-attempt.prisma  # TestAttempt, TestAnswer & TestResult models
│   ├── leaderboard.prisma   # LeaderboardEntry model
│   ├── session.prisma       # Session management
│   ├── audit-log.prisma     # Audit logging
│   ├── file-upload.prisma   # File upload management
│   └── README.md            # Models documentation
├── 📂 enums/                # Enum definitions
│   └── index.prisma         # All application enums
└── 📂 scripts/              # Utility scripts
    ├── build-schema.js      # Combines modular files
    └── README.md            # Scripts documentation
```

## 🎯 Database Models Overview

### 👥 User Management
- **User**: Core user data, authentication, roles
- **UserProfile**: Extended user information, preferences
- **Session**: User session management for JWT tokens

### 📚 IELTS Testing System
- **IELTSTest**: Test definitions (Reading, Listening, Writing, Speaking)
- **TestQuestion**: Individual questions within tests
- **TestAttempt**: User test attempts and progress tracking
- **TestAnswer**: User responses to specific questions
- **TestResult**: Processed results and AI analysis

### 🏆 Gamification
- **LeaderboardEntry**: Ranking system with different time periods

### 🔍 System Management
- **AuditLog**: Track all user actions and changes
- **FileUpload**: Manage uploaded files (audio, images, documents)

## 🛠️ Available Commands

### Schema Management
```bash
# Build schema from modular files
pnpm db:build-schema

# Generate Prisma client
pnpm db:generate

# Update: build schema + generate client
pnpm db:update
```

### Database Operations
```bash
# Create and apply migrations
pnpm db:migrate

# Deploy migrations (production)
pnpm db:migrate:deploy

# Reset database (development only)
pnpm db:reset

# Seed database with sample data
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio
```

## 🔄 Development Workflow

### Making Schema Changes

1. **Edit modular files** in `models/` or `enums/` directories:
   ```bash
   # Example: Edit user model
   code prisma/models/user.prisma
   ```

2. **Build consolidated schema**:
   ```bash
   pnpm db:build-schema
   ```

3. **Generate Prisma client**:
   ```bash
   pnpm db:generate
   ```

4. **Create migration** (if database structure changed):
   ```bash
   pnpm db:migrate
   ```

### Quick Update Command
```bash
# Combines steps 2 and 3
pnpm db:update
```

## 🔗 Model Relationships

```
User ────┐
         ├─ UserProfile (1:1)
         ├─ Session (1:Many)
         ├─ TestAttempt (1:Many)
         ├─ TestResult (1:Many)
         ├─ LeaderboardEntry (1:Many)
         ├─ AuditLog (1:Many)
         └─ IELTSTest as Creator (1:Many)

IELTSTest ────┐
              ├─ TestQuestion (1:Many)
              ├─ TestAttempt (1:Many)
              └─ TestResult (1:Many)

TestAttempt ────┐
                ├─ TestAnswer (1:Many)
                └─ TestResult (1:1)
```

## 📊 Database Enums

- **UserRole**: STUDENT, INSTRUCTOR, ADMIN, SUPER_ADMIN
- **IELTSModule**: READING, LISTENING, WRITING, SPEAKING
- **DifficultyLevel**: BEGINNER, INTERMEDIATE, ADVANCED
- **QuestionType**: MULTIPLE_CHOICE, TRUE_FALSE, FILL_BLANK, ESSAY, AUDIO_RESPONSE
- **TestStatus**: NOT_STARTED, IN_PROGRESS, COMPLETED, SUBMITTED, GRADED, EXPIRED
- **LeaderboardType**: DAILY, WEEKLY, MONTHLY, GLOBAL

## 🚀 Getting Started

1. **Setup database connection** in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/ielts_edtech"
   ```

2. **Build and generate schema**:
   ```bash
   pnpm db:update
   ```

3. **Run migrations**:
   ```bash
   pnpm db:migrate
   ```

4. **Seed with sample data**:
   ```bash
   pnpm db:seed
   ```

5. **Explore with Prisma Studio**:
   ```bash
   pnpm db:studio
   ```

## ✨ Benefits of Modular Structure

- **🎯 Focused Editing**: Each file contains related models only
- **👥 Team Collaboration**: Multiple developers can work on different areas
- **📖 Better Documentation**: Clear separation of concerns
- **🔍 Easy Navigation**: Find specific models quickly
- **🛠️ Maintainable**: Easier to understand and modify
- **🔄 Version Control**: Cleaner diffs and merge conflicts

## 🔧 Troubleshooting

**Schema not updating?**
```bash
pnpm db:build-schema && pnpm db:generate
```

**Client generation errors?**
```bash
# Clear generated files and regenerate
rm -rf node_modules/.prisma
pnpm db:generate
```

**Migration issues?**
```bash
# Reset in development
pnpm db:reset
```

Happy coding! 🎉 