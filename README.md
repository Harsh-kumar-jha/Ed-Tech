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
- **AI Integration**: Ollama-powered test evaluation and feedback
- **Test Summarizer**: AI-generated summaries after test completion
- **Real-time Communication**: Socket.IO for live features
- **File Upload**: Support for audio, video, and document uploads

## 🏗️ Architecture

### Tech Stack
- **Backend**: Node.js + Express.js + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI**: Ollama integration for intelligent features
- **Real-time**: Socket.IO for live communication
- **Authentication**: JWT-based authentication
- **File Storage**: Local storage with Multer
- **Logging**: Winston with daily rotation
- **Validation**: Joi for request validation

### Project Structure
```
EdTech/
├── src/
│   ├── config/           # Application configuration
│   ├── constants/        # Application constants
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic services
│   │   ├── Auth/         # Authentication service
│   │   ├── AI/           # AI integration service
│   │   ├── Ielts/        # IELTS test service
│   │   ├── Leaderboard/  # Leaderboard service
│   │   └── Profile/      # User profile service
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── server.ts         # Server setup
├── prisma/
│   └── schema.prisma     # Database schema
├── logs/                 # Application logs
├── uploads/              # File uploads
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── index.ts              # Application entry point
```

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **pnpm** (v8.0.0 or higher)
- **PostgreSQL** (v13 or higher)
- **Ollama** (for AI features)

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

# AI Configuration (Ollama)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Other configurations...
```

### 4. Database Setup

#### Create Database
```sql
-- Connect to PostgreSQL and create database
CREATE DATABASE ielts_edtech_db;
```

#### Run Migrations
```bash
# Generate Prisma client
pnpm run db:generate

# Run database migrations
pnpm run db:migrate

# (Optional) Seed database with test data
pnpm run db:seed
```

### 5. Ollama Setup (for AI Features)

#### Install Ollama
Follow the installation guide at [https://ollama.ai](https://ollama.ai)

#### Pull Required Models
```bash
# Pull the default model
ollama pull llama2

# Or pull a specific model for better performance
ollama pull codellama
```

#### Start Ollama Service
```bash
ollama serve
```

## 🚦 Running the Application

### Development Mode
```bash
pnpm run dev
```

### Staging Mode
```bash
pnpm run stage
```

### Production Mode
```bash
# Build the application
pnpm run build

# Start production server
pnpm run start
```

## 📚 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm run dev` | Start development server with hot reload |
| `pnpm run stage` | Start staging server |
| `pnpm run start` | Start production server |
| `pnpm run build` | Build for production |
| `pnpm run build:watch` | Build with watch mode |
| `pnpm run lint` | Run ESLint |
| `pnpm run lint:fix` | Fix ESLint errors |
| `pnpm run format` | Format code with Prettier |
| `pnpm run format:check` | Check code formatting |
| `pnpm run db:generate` | Generate Prisma client |
| `pnpm run db:migrate` | Run database migrations |
| `pnpm run db:migrate:deploy` | Deploy migrations |
| `pnpm run db:studio` | Open Prisma Studio |
| `pnpm run db:seed` | Seed database |
| `pnpm run test` | Run tests |
| `pnpm run test:watch` | Run tests in watch mode |
| `pnpm run clean` | Clean build directory |

## 🌐 API Endpoints

### Health Check
```
GET /health
```

### API Information
```
GET /api/v1
```

### Test Endpoint
```
GET /api/v1/test
```

### Planned API Routes
```
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
POST /api/v1/auth/refresh

# User Profile
GET    /api/v1/profile
PUT    /api/v1/profile
POST   /api/v1/profile/avatar

# IELTS Tests
GET    /api/v1/tests
POST   /api/v1/tests
GET    /api/v1/tests/:id
PUT    /api/v1/tests/:id
DELETE /api/v1/tests/:id
POST   /api/v1/tests/:id/attempt
POST   /api/v1/tests/:id/submit

# Leaderboard
GET    /api/v1/leaderboard
GET    /api/v1/leaderboard/:period

# AI Services
POST   /api/v1/ai/evaluate
POST   /api/v1/ai/summarize
POST   /api/v1/ai/feedback
```

## 🔧 Configuration

### Database Configuration
The application uses PostgreSQL with Prisma ORM. Configure your database connection in the `.env` file:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/ielts_edtech_db"
```

### JWT Configuration
Configure JWT settings for authentication:

```env
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key-here
JWT_REFRESH_EXPIRES_IN=30d
```

### File Upload Configuration
```env
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,mp3,mp4,wav
```

### AI Configuration
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama2
AI_TIMEOUT=30000
AI_MAX_RETRIES=3
```

## 📊 Logging

The application uses Winston for comprehensive logging:

- **Error logs**: `logs/error-YYYY-MM-DD.log`
- **Combined logs**: `logs/combined-YYYY-MM-DD.log`
- **Access logs**: `logs/access-YYYY-MM-DD.log`
- **Exception logs**: `logs/exceptions.log`
- **Rejection logs**: `logs/rejections.log`

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test:watch

# Run tests with coverage
pnpm run test:coverage
```

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: API rate limiting
- **Input Validation**: Joi validation for all inputs
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with configurable salt rounds
- **Error Handling**: Comprehensive error handling with logging

## 🚀 Deployment

### Production Checklist

1. **Environment Variables**: Set all production environment variables
2. **Database**: Ensure PostgreSQL is running and accessible
3. **AI Service**: Ensure Ollama is running with required models
4. **SSL/TLS**: Configure HTTPS for production
5. **Process Manager**: Use PM2 or similar for process management
6. **Monitoring**: Set up monitoring and alerting
7. **Backups**: Configure database backups

### Example PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'ielts-edtech-platform',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

## 📈 Performance

- **Compression**: Gzip compression enabled
- **Caching**: Redis caching for frequently accessed data
- **Database**: Optimized queries with proper indexing
- **Logging**: Structured logging with log rotation
- **Error Handling**: Graceful error handling without crashes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and formatting
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

---

**Happy Coding! 🎉** 