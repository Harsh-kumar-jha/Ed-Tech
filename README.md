# IELTS EdTech Platform

A comprehensive Node.js + Express.js + TypeScript platform for IELTS test preparation, designed to help students preparing for IELTS exams to study abroad for their master's degree.

## 🚀 Features

### Core IELTS Modules
- **Reading Tests**: Comprehensive reading comprehension tests
- **Listening Tests**: Audio-based listening comprehension
- **Writing Tests**: Essay writing with AI evaluation
- **Speaking Tests**: Audio response recording and analysis

### Platform Features
- **Student Portfolio System**: Track progress and achievements
- **Leaderboard**: Motivate students with rankings and competition
- **AI Integration**: Groq AI-powered test evaluation and feedback
- **Test Summarizer**: AI-generated summaries after test completion
- **Real-time Communication**: Socket.IO for live features
- **File Upload**: Support for audio, video, and document uploads

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM (Modular Schema)
- **AI**: Groq AI integration for intelligent features
- **Real-time**: Socket.IO for live communication
- **Authentication**: JWT-based authentication with OAuth support
- **File Storage**: Local storage with Multer
- **Logging**: Winston with daily rotation
- **Validation**: Joi for request validation

### Project Structure
```
EdTech/
├── src/
│   ├── config/           # Application configuration
│   ├── constants/        # Application constants
│   ├── db/              # Database utilities
│   ├── models/          # Database models (TypeScript interfaces)
│   ├── services/        # Business logic services
│   │   ├── Auth/        # Authentication service
│   │   │   ├── controller/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   ├── config/
│   │   │   └── routes/
│   │   ├── AI/          # AI integration service
│   │   │   ├── controller/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── config/
│   │   ├── Ielts/       # IELTS test service
│   │   │   ├── controller/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── config/
│   │   ├── Leaderboard/ # Leaderboard service
│   │   │   ├── controller/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   └── config/
│   │   └── Profile/     # User profile service
│   │       ├── controller/
│   │       ├── middleware/
│   │       ├── utils/
│   │       └── config/
│   ├── tests/           # Test utilities and integration tests
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Server setup
├── prisma/              # Database schema (Modular)
│   ├── models/          # Individual model files
│   ├── enums/           # Enum definitions
│   ├── scripts/         # Schema build scripts
│   └── schema.prisma    # Generated main schema file
├── logs/                # Application logs
├── public/             # Static files
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── index.ts           # Application entry point
```

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **pnpm** (v8.0.0 or higher)
- **PostgreSQL** (v13 or higher)
- **Groq AI** API access

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd EdTech
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Setup
Copy the environment sample file and configure your environment variables:

```bash
cp .env.sample .env
```

Update the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/ielts_edtech_db"

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=30d

# AI Configuration (Groq)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=mixtral-8x7b-32768

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# Other configurations...
```

### 4. Database Setup

#### Create Database
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE ielts_edtech_db;
```

#### Modular Prisma Setup
This project uses a modular Prisma schema approach:

```bash
# Build the main schema from modular files
pnpm run db:build-schema

# Generate Prisma client
pnpm run db:generate

# Update schema and generate client in one command
pnpm run db:update

# Run database migrations (when ready)
pnpm run db:migrate

# (Optional) Seed database with test data
pnpm run db:seed
```

## 🚀 Running the Application

### Development Mode
```bash
# Start in development mode with hot reload
pnpm run dev
```

### Production Mode
```bash
# Build the application
pnpm run build

# Start in production mode
pnpm start
```

## 📚 API Documentation

API documentation is available in the `/api-docs` directory:

- [Authentication API](./api-docs/auth.api.docs.md)
- [Writing Evaluation API](./api-docs/writing-evaluation.api.docs.md)

## 🔒 Security Features

- JWT-based authentication
- OAuth 2.0 integration (Google, Microsoft)
- Rate limiting
- Input validation
- CORS protection
- HTTP security headers
- Password hashing with bcrypt
- Two-factor authentication (SMS)

## 📊 Monitoring & Logging

- Winston logger with daily rotation
- Request/Response logging
- Error tracking
- Performance monitoring
- Audit logging for sensitive operations

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 