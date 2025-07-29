# IELTS EdTech Platform

<div align="center">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101" alt="Socket.io">
  
  <br>
  
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg" alt="Version">
</div>

<div align="center">
  <h3>🎯 Comprehensive IELTS Test Preparation Platform</h3>
  <p>An AI-powered EdTech platform built with Node.js, Express.js, and TypeScript to help students prepare for IELTS exams and achieve their study abroad goals.</p>
</div>

---

## 🌟 Overview

The IELTS EdTech Platform is a comprehensive, open-source solution designed to revolutionize IELTS test preparation. Built with modern technologies and powered by AI, it provides students with personalized learning experiences, real-time feedback, and progress tracking to maximize their success in IELTS examinations.

### Why This Project?

- **🎓 Educational Impact**: Helps students worldwide achieve their study abroad dreams
- **🤖 AI-Powered**: Leverages Groq AI for intelligent test evaluation and feedback
- **🏗️ Modern Architecture**: Built with TypeScript, Express.js, and PostgreSQL for scalability
- **🔄 Real-time Features**: Socket.IO integration for live communication and updates
- **📊 Progress Tracking**: Comprehensive analytics and leaderboard system

## 🆕 **Latest Release: Listening Module**

> **🎉 NEW FEATURE**: Complete IELTS Listening Module now available!
> - **30-minute authentic tests** (25 min audio + 5 min review)
> - **AI-powered evaluation** with official IELTS band scoring
> - **Comprehensive analytics** tracking 6 core listening skills
> - **25+ API endpoints** for seamless integration
> 
> 📚 [**View Listening API Documentation →**](./api-docs/listening-module.api.docs.md)

---

## ✨ Key Features

### 📚 Core IELTS Modules

#### 📖 Reading Module
- **Advanced Comprehension Tests**: 3 passages with 40 questions covering all IELTS reading question types
- **Real-time Evaluation**: Instant scoring with detailed performance analytics
- **Question Type Mastery**: True/False/Not Given, Multiple Choice, Matching, and more
- **Progress Tracking**: Comprehensive analytics and improvement recommendations

#### 🎧 Listening Module ⭐ **NEW**
- **Authentic IELTS Experience**: 30-minute tests (25 min audio + 5 min review)
- **4-Section Structure**: Social survival contexts + Educational/training contexts
- **10 Question Types**: Form completion, Multiple choice, Note completion, Matching, etc.
- **AI-Powered Evaluation**: Official IELTS band score calculation (0-9 scale)
- **Advanced Analytics**: 6 core listening skills analysis with personalized feedback
- **Audio Security**: Non-pausable, non-rewindable playback with integrity controls
- **Smart Answer Matching**: Flexible answer validation with acceptable alternatives

#### ✍️ Writing Module
- **Task 1 & Task 2**: Academic and General Training essay evaluation
- **AI-Powered Feedback**: Detailed analysis across 4 IELTS criteria
- **Band Score Calculation**: Accurate scoring with improvement suggestions
- **Template Management**: Dynamic task generation and structured guidance

#### 🗣️ Speaking Module
- **Audio Response Recording**: Professional pronunciation analysis
- **Real-time Feedback**: Immediate evaluation and scoring
- **Fluency Assessment**: Comprehensive speaking skills evaluation

### 🚀 Platform Capabilities
- **👤 Student Portfolio System**: Comprehensive progress tracking and achievement management
- **🏆 Leaderboard & Gamification**: Motivational ranking system with badges and rewards
- **🤖 AI Integration**: Groq AI-powered evaluation with detailed feedback
- **📋 Test Summarizer**: Automated performance summaries and improvement suggestions
- **⚡ Real-time Communication**: Live features powered by Socket.IO
- **📁 File Management**: Support for audio, video, and document uploads
- **🔐 Secure Authentication**: JWT-based auth with OAuth2 support (Google, Microsoft)
- **🔒 Global Test Session Management**: Prevents concurrent module tests for better resource management

### 🎯 Global Test Session Management

The platform includes a sophisticated **Global Test Session Management System** that ensures:

- **Single Active Session Rule**: Users can only have one active test session across all IELTS modules at any time
- **Cross-Module Prevention**: Starting a Reading test prevents starting Writing, Listening, or Speaking tests simultaneously
- **Session Lifecycle Tracking**: Complete management from session creation to completion/abandonment
- **Automatic Cleanup**: Expired sessions are automatically cleaned up to maintain data integrity
- **User-Friendly Feedback**: Clear error messages when trying to start multiple tests

#### Key Benefits:
- **Prevents Resource Conflicts**: Users can't accidentally start multiple tests
- **Better User Experience**: Clear feedback about active sessions across modules
- **Data Integrity**: Ensures consistent test session state
- **Scalable Design**: Easily extensible to new IELTS modules

#### Global Session API:
- `GET /api/v1/test-session/active` - Check current active session
- `POST /api/v1/test-session/abandon` - Abandon current active session
- `GET /api/v1/test-session/history` - Get session history
- `POST /api/v1/test-session/cleanup-expired` - Admin cleanup of expired sessions

---

## 🔌 **API Endpoints Overview**

### 📖 **Reading Module**
```
GET    /api/v1/reading/test-sets          # Get available reading tests
POST   /api/v1/reading/start-test         # Start reading test session
POST   /api/v1/reading/begin-test/:id     # Begin test timing
POST   /api/v1/reading/submit-answers     # Submit answers for evaluation
GET    /api/v1/reading/results/:id        # Get test results
GET    /api/v1/reading/analytics          # Get user analytics
```

### 🎧 **Listening Module** ⭐ **NEW**
```
# Student Endpoints
GET    /api/v1/listening/tests             # Get available listening tests
POST   /api/v1/listening/start             # Start listening test session
GET    /api/v1/listening/session/active    # Get active session details
PUT    /api/v1/listening/session/:id/progress  # Update session progress
POST   /api/v1/listening/submit            # Submit answers for evaluation
GET    /api/v1/listening/history           # Get test history
GET    /api/v1/listening/analytics         # Get performance analytics

# Admin Endpoints
POST   /api/v1/listening/admin/tests       # Create new listening test
POST   /api/v1/listening/admin/tests/:id/audio  # Upload audio files
GET    /api/v1/listening/admin/tests       # Manage listening tests
GET    /api/v1/listening/admin/tests/:id/statistics  # View test statistics
```

### ✍️ **Writing Module**
```
POST   /api/v1/ai/writing/start            # Start writing test
POST   /api/v1/ai/writing/evaluate/task1   # Evaluate Task 1
POST   /api/v1/ai/writing/evaluate/task2   # Evaluate Task 2
GET    /api/v1/ai/writing/progress         # Get writing progress
```

### 🔐 **Authentication**
```
POST   /api/v1/auth/register               # User registration
POST   /api/v1/auth/login                  # Email/username login
POST   /api/v1/auth/phone-login            # Phone-based login
POST   /api/v1/auth/verify-otp             # OTP verification
POST   /api/v1/auth/forgot-password        # Password reset request
POST   /api/v1/auth/refresh                # Refresh JWT tokens
```

### 🎯 **Global Test Sessions**
```
GET    /api/v1/test-session/active         # Check active session
POST   /api/v1/test-session/abandon        # Abandon current session
GET    /api/v1/test-session/history        # Session history
```

> 📚 **Complete API Documentation**: See `/api-docs/` folder for detailed endpoint documentation

---

## 🏗️ Technical Architecture

### Technology Stack

| Category | Technology |
|----------|------------|
| **Backend** | Node.js, Express.js, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **AI/ML** | Groq AI for intelligent evaluation |
| **Real-time** | Socket.IO for live features |
| **Authentication** | JWT with OAuth2 (Google, Microsoft) |
| **File Storage** | Multer for local storage |
| **Logging** | Winston with daily rotation |
| **Validation** | Joi for request validation |
| **Security** | bcrypt, rate limiting, CORS |

### 📁 Project Structure

```
EdTech/
├── 📁 api-docs/            # Comprehensive API documentation
│   ├── 📄 auth.api.docs.md            # Authentication APIs
│   ├── 📄 reading-module.api.docs.md  # Reading module APIs
│   ├── 📄 listening-module.api.docs.md # 🆕 Listening module APIs
│   ├── 📄 writing-evaluation.api.docs.md # Writing evaluation APIs
│   └── 📄 GLOBAL-TEST-SESSION-SYSTEM.md # Global session management
├── 📁 src/
│   ├── 📁 config/           # Application configuration
│   ├── 📁 constants/        # Application constants
│   │   └── 📄 listening-config.ts # 🆕 Listening module constants
│   ├── 📁 db/              # Database utilities
│   ├── 📁 interface/       # TypeScript interfaces
│   │   └── 📄 listening.interface.ts # 🆕 Listening module interfaces
│   ├── 📁 services/        # Modular business logic services
│   │   ├── 📁 Auth/        # Authentication service
│   │   ├── 📁 AI/          # AI integration service
│   │   │   └── 📁 config/  
│   │   │       └── 📄 listening-evaluation.config.ts # 🆕 AI listening config
│   │   ├── 📁 Ielts/       # IELTS test services
│   │   │   ├── 📁 services/
│   │   │   │   ├── 📄 listening-test.service.ts # 🆕 Test management
│   │   │   │   ├── 📄 listening-session.service.ts # 🆕 Session handling
│   │   │   │   └── 📄 listening-evaluation.service.ts # 🆕 AI evaluation
│   │   │   ├── 📁 controller/
│   │   │   │   ├── 📄 listening-test.controller.ts # 🆕 Admin controllers
│   │   │   │   └── 📄 listening-session.controller.ts # 🆕 Student controllers
│   │   │   └── 📁 routes/
│   │   │       └── 📄 listening.routes.ts # 🆕 Listening API routes
│   │   ├── 📁 Leaderboard/ # Leaderboard service
│   │   └── 📁 Profile/     # User profile service
│   ├── 📁 tests/           # Test utilities and integration tests
│   ├── 📁 types/           # TypeScript type definitions
│   ├── 📁 utils/           # Utility functions
│   └── 📄 server.ts        # Server setup
├── 📁 prisma/              # Modular database schema
│   ├── 📁 models/          # Individual model files
│   │   └── 📄 listening-module.prisma # 🆕 Listening database models
│   ├── 📁 enums/           # Enum definitions
│   ├── 📁 scripts/         # Schema build scripts
│   └── 📄 schema.prisma    # Generated main schema
├── 📁 logs/                # Application logs
├── 📁 public/             # Static files
├── 📄 package.json        # Dependencies and scripts
├── 📄 tsconfig.json       # TypeScript configuration
└── 📄 index.ts           # Application entry point
```

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:

- **Node.js** (v18.0.0 or higher) - [Download here](https://nodejs.org/)
- **pnpm** (v8.0.0 or higher) - [Install guide](https://pnpm.io/installation)
- **PostgreSQL** (v13 or higher) - [Download here](https://www.postgresql.org/download/)
- **Groq AI API Key** - [Get your key](https://console.groq.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ielts-edtech-platform.git
   cd ielts-edtech-platform
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.sample .env
   ```

4. **Configure environment variables**
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

   # AI Configuration (Groq)
   GROQ_API_KEY=your-groq-api-key-here
   GROQ_MODEL=mixtral-8x7b-32768

   # OAuth Configuration
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

5. **Database setup**
   ```bash
   # Create database
   createdb ielts_edtech_db

   # Build schema and generate client
   pnpm run db:build-schema
   pnpm run db:generate
   pnpm run db:migrate

   # (Optional) Seed with test data
   pnpm run db:seed
   ```

6. **Start the application**
   ```bash
   # Development mode
   pnpm run dev

   # Production mode
   pnpm run build && pnpm start
   ```

Visit `http://localhost:3000` to access the application!

## 📚 Documentation

| Documentation | Description |
|---------------|-------------|
| [API Documentation](./api-docs/) | Complete API reference and examples |
| [Authentication Guide](./api-docs/auth.api.docs.md) | Authentication and authorization |
| [Writing Evaluation API](./api-docs/writing-evaluation.api.docs.md) | AI-powered writing assessment |
| [Global Test Session System](./GLOBAL-TEST-SESSION-SYSTEM.md) | Global session management documentation |
| [Contributing Guide](./CONTRIBUTING.md) | How to contribute to the project |
| [Code of Conduct](./CODE_OF_CONDUCT.md) | Community guidelines |

### 🔗 Key API Endpoints

#### Reading Module
- `GET /api/v1/reading/test-sets` - Get all reading test sets
- `GET /api/v1/reading/test-sets/:id` - Get specific test set details
- `POST /api/v1/reading/start-test/:testSetId` - Start a reading test session
- `POST /api/v1/reading/submit-answers` - Submit reading test answers
- `GET /api/v1/reading/session/:sessionId` - Get test session details
- `POST /api/v1/reading/session/:sessionId/abandon` - Abandon test session

#### Global Test Session Management
- `GET /api/v1/test-session/active` - Check current active session
- `POST /api/v1/test-session/abandon` - Abandon current active session
- `GET /api/v1/test-session/history` - Get session history
- `POST /api/v1/test-session/cleanup-expired` - Admin cleanup of expired sessions

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- 🐛 **Bug Reports**: Found an issue? [Create a bug report](https://github.com/yourusername/ielts-edtech-platform/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: Have an idea? [Suggest a feature](https://github.com/yourusername/ielts-edtech-platform/issues/new?template=feature_request.md)
- 📝 **Documentation**: Improve our docs or write tutorials
- 🔧 **Code Contributions**: Fix bugs or implement new features
- 🧪 **Testing**: Help us improve test coverage
- 🌐 **Translation**: Help us support more languages

### Development Workflow

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m 'Add some amazing feature'`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write tests for new features
- Update documentation for any API changes
- Ensure all tests pass before submitting
- Use descriptive commit messages

## 🔒 Security

Security is a top priority. This platform includes:

- **JWT-based authentication** with refresh tokens
- **OAuth 2.0 integration** (Google, Microsoft)
- **Rate limiting** to prevent abuse
- **Input validation** using Joi
- **CORS protection** and security headers
- **Password hashing** with bcrypt
- **Two-factor authentication** (SMS)
- **Audit logging** for sensitive operations

## 📊 Monitoring & Analytics

- **Winston logging** with daily rotation
- **Request/Response logging** for debugging
- **Error tracking** and performance monitoring
- **User analytics** and learning insights
- **Test performance metrics**

## 📈 Performance

- **Scalable architecture** with modular services
- **Database optimization** with Prisma ORM
- **Real-time features** with Socket.IO
- **File upload optimization** with Multer
- **Caching strategies** for improved performance

## 🌐 Community

- **Discord**: [Join our community](#)
- **GitHub Discussions**: [Ask questions and share ideas](#)
- **Twitter**: [@harshxdev](https://x.com/harshxdev)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Groq AI for providing powerful AI capabilities
- The open-source community for inspiration and support
- IELTS test-takers worldwide who inspired this project

---

<div align="center">
  <p>⭐ If you find this project helpful, please give it a star! ⭐</p>
  <p>Made with ❤️ by the IELTS EdTech Platform team</p>
</div>

## Cloudinary Integration

This project uses Cloudinary for media storage (images, audio, video). The integration provides:

- Secure storage and delivery of media assets
- Automatic optimization and transformation of images
- Responsive image handling
- Support for various media types

### Setup

1. Create a free Cloudinary account at [cloudinary.com](https://cloudinary.com/)
2. Configure your environment variables:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_SECURE=true
```

### Usage

The platform provides a reusable service for media uploads:

```typescript
import { CloudinaryUploader } from '../services/common/cloudinary-uploader.service';

// Get singleton instance
const uploader = CloudinaryUploader.getInstance();

// Upload a file
const result = await uploader.uploadFile(file, {
  folder: 'my-folder',
  tags: ['tag1', 'tag2'],
  // other Cloudinary options
});

// Access the Cloudinary URL
const imageUrl = result.data.secure_url;
```

For API endpoints that accept file uploads, use the multer middleware:

```typescript
import { createUploadMiddleware } from '../common/multer-upload.middleware';

const imageUpload = createUploadMiddleware('image', {
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

router.post('/upload', imageUpload, controller.uploadHandler);
```