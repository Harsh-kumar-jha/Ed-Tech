# Contributing to IELTS EdTech Platform

Thank you for your interest in contributing to the IELTS EdTech Platform! 🎉 We're excited to have you join our community of developers working to improve IELTS test preparation for students worldwide.

## 🌟 Ways to Contribute

### 🐛 Bug Reports
Found a bug? Help us squash it! When reporting bugs, please:
- Use the [Bug Report Template](https://github.com/Harsh-kumar-jha/Ed-Tech/issues/new?template=bug_report.md)
- Include detailed steps to reproduce the issue
- Provide system information (OS, Node.js version, etc.)
- Include screenshots or error messages if applicable

### 💡 Feature Requests
Have an idea for a new feature? We'd love to hear it!
- Use the [Feature Request Template](https://github.com/Harsh-kumar-jha/Ed-Tech/issues/new?template=feature_request.md)
- Explain the problem you're trying to solve
- Describe your proposed solution
- Consider the impact on existing users

### 📝 Documentation
Help us improve our documentation:
- Fix typos or unclear explanations
- Add examples or tutorials
- Translate documentation to other languages
- Create video tutorials or guides

### 🔧 Code Contributions
Ready to code? Here's what we need help with:
- Bug fixes
- Feature implementations
- Performance optimizations
- Test coverage improvements
- Code refactoring

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- pnpm (v8.0.0 or higher)
- PostgreSQL (v13 or higher)
- Git knowledge
- TypeScript familiarity

### Development Setup

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub, then clone your fork
   git clone https://github.com/Harsh-kumar-jha/Ed-Tech.git
   cd Ed-Tech
   ```

2. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/originalowner/Ed-Tech.git
   ```

3. **Install dependencies**
   ```bash
   pnpm install
   ```

4. **Set up environment**
   ```bash
   cp .env.sample .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   pnpm run db:build-schema
   pnpm run db:generate
   pnpm run db:migrate
   pnpm run db:seed
   ```

6. **Start development server**
   ```bash
   pnpm run dev
   ```

## 📋 Development Workflow

### Creating a Pull Request

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b bugfix/your-bug-fix
   ```

2. **Make your changes**
   - Follow our [coding standards](#coding-standards)
   - Write tests for new features
   - Update documentation as needed

3. **Test your changes**
   ```bash
   pnpm run test
   pnpm run test:integration
   pnpm run lint
   pnpm run type-check
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use our [PR template](https://github.com/Harsh-kumar-jha/Ed-Tech/blob/main/.github/pull_request_template.md)
   - Link related issues
   - Provide clear description of changes

### Pull Request Guidelines

- **Title**: Use conventional commits format (feat:, fix:, docs:, etc.)
- **Description**: Clearly explain what changes were made and why
- **Testing**: Include information about how you tested your changes
- **Breaking Changes**: Clearly document any breaking changes
- **Screenshots**: Include screenshots for UI changes

## 🔧 Coding Standards

### TypeScript Guidelines
- Use TypeScript for all new code
- Define proper interfaces and types
- Avoid `any` type unless absolutely necessary
- Use meaningful variable and function names

### Code Style
- Follow the existing code style
- Use Prettier for formatting
- Follow ESLint rules
- Write meaningful comments for complex logic

### File Organization
- Follow the existing folder structure
- Keep files focused on single responsibilities
- Use descriptive file names
- Group related functionality together

### API Design
- Follow RESTful conventions
- Use proper HTTP status codes
- Implement proper error handling
- Document API endpoints

## 🧪 Testing

### Writing Tests
- Write unit tests for all business logic
- Include integration tests for API endpoints
- Test both success and error scenarios
- Maintain good test coverage

### Running Tests
```bash
# Run all tests
pnpm run test

# Run specific test file
pnpm run test -- --testNamePattern="your-test-name"

# Run tests in watch mode
pnpm run test:watch

# Run integration tests
pnpm run test:integration
```

## 📚 Documentation

### Code Documentation
- Document all public APIs
- Use JSDoc comments for functions and classes
- Include usage examples
- Keep documentation up to date

### API Documentation
- Update OpenAPI/Swagger specs
- Include request/response examples
- Document error responses
- Keep endpoint documentation current

## 🔍 Code Review Process

### What We Look For
- **Functionality**: Does the code work as intended?
- **Code Quality**: Is the code clean, readable, and maintainable?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Tests**: Are there adequate tests?
- **Documentation**: Is the documentation updated?

### Review Timeline
- We aim to review PRs within 2-3 business days
- Complex changes may take longer
- We'll provide constructive feedback
- Address review comments promptly

## 🎯 Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types
- `feat`: New features
- `fix`: Bug fixes
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(auth): add OAuth2 Google integration
fix(api): resolve user registration validation error
docs(readme): update installation instructions
test(auth): add unit tests for JWT validation
```

## 🏷️ Issue Labels

We use labels to categorize and prioritize issues:

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Documentation needs improvement
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested
- `wontfix`: This will not be worked on

## 🎉 Recognition

### Contributors
- All contributors are recognized in our README
- Significant contributors may be invited to join the core team
- We celebrate contributions in our community channels

### Hall of Fame
Outstanding contributors may be featured in:
- Monthly contributor highlights
- Project documentation
- Community announcements

## 🤝 Community Guidelines

### Communication
- Be respectful and inclusive
- Use welcoming and inclusive language
- Be patient with newcomers
- Provide constructive feedback

### Getting Help
- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Join our community chat
- **Issues**: Report bugs and request features
- **Email**: Contact maintainers directly for sensitive issues

## 📞 Contact

- **Project Maintainers**: [@harsh-kumar-jha](https://github.com/Harsh-kumar-jha)
- **Discord**: [Join our server](#)
- **Email**: #

## 📄 License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the IELTS EdTech Platform! 🚀 Together, we're helping students worldwide achieve their study abroad dreams.