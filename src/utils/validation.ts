import Joi from 'joi';
import { VALIDATION_PATTERNS } from '../constants';
import { ValidationResult, ValidationError as CustomValidationError } from '../interface';

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().uuid().required(),
  email: Joi.string().email().pattern(VALIDATION_PATTERNS.EMAIL).required(),
  password: Joi.string().min(8).pattern(VALIDATION_PATTERNS.PASSWORD).required(),
  name: Joi.string().min(2).max(50).pattern(VALIDATION_PATTERNS.NAME).required(),
  username: Joi.string().min(3).max(20).pattern(VALIDATION_PATTERNS.USERNAME).required(),
  phone: Joi.string().pattern(VALIDATION_PATTERNS.PHONE).optional(),
  url: Joi.string().uri().optional(),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(100).optional(),
    sortBy: Joi.string().max(50).optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  },
};

// Auth validation schemas
export const authSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    username: commonSchemas.username,
    firstName: commonSchemas.name,
    lastName: commonSchemas.name,
    password: commonSchemas.password,
    phone: commonSchemas.phone.optional(),
    role: Joi.string().valid('student', 'instructor').default('student'),
  }),

  login: Joi.object({
    email: Joi.string().email().optional(),
    username: Joi.string().optional(),
    password: Joi.string().required(),
  }).xor('email', 'username').messages({
    'object.xor': 'Either email or username is required',
  }),

  phoneLogin: Joi.object({
    phone: commonSchemas.phone.required(),
  }),

  verifyOTP: Joi.object({
    phone: commonSchemas.phone.optional(),
    email: commonSchemas.email.optional(),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).required()
      .messages({ 'string.pattern.base': 'OTP must be 6 digits' }),
    type: Joi.string().valid('login', 'password_reset').required(),
  }).or('phone', 'email').messages({
    'object.missing': 'Either phone or email is required',
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
  }).or('email', 'phone').messages({
    'object.missing': 'Either email or phone is required',
  }),

  resetPassword: Joi.object({
    token: Joi.string().optional(),
    otp: Joi.string().length(6).pattern(/^\d{6}$/).optional(),
    email: commonSchemas.email.optional(),
    phone: commonSchemas.phone.optional(),
    password: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required()
      .messages({ 'any.only': 'Passwords must match' }),
  }).or('token', 'otp')
    .when('otp', {
      is: Joi.exist(),
      then: Joi.object().or('email', 'phone'),
      otherwise: Joi.object()
    }).messages({
    'object.missing': 'Either token or OTP with email/phone is required',
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
      .messages({ 'any.only': 'Passwords must match' }),
  }),
};

// Profile validation schemas
export const profileSchemas = {
  updateProfile: Joi.object({
    firstName: commonSchemas.name.optional(),
    lastName: commonSchemas.name.optional(),
    phone: commonSchemas.phone,
    dateOfBirth: Joi.date().max('now').optional(),
    country: Joi.string().max(100).optional(),
    language: Joi.string().max(10).optional(),
    timezone: Joi.string().max(50).optional(),
    bio: Joi.string().max(500).optional(),
    targetScore: Joi.number().min(0).max(9).optional(),
    currentLevel: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    studyGoals: Joi.array().items(Joi.string().max(100)).max(10).optional(),
  }),
};

// Test validation schemas
export const testSchemas = {
  createTest: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(1000).required(),
    module: Joi.string().valid('reading', 'listening', 'writing', 'speaking').required(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    timeLimit: Joi.number().integer().min(300).max(14400).required(), // 5 min to 4 hours
    totalQuestions: Joi.number().integer().min(1).max(100).required(),
    passingScore: Joi.number().min(0).max(100).required(),
    instructions: Joi.string().max(2000).required(),
    isActive: Joi.boolean().default(true),
  }),

  updateTest: Joi.object({
    title: Joi.string().min(3).max(200).optional(),
    description: Joi.string().max(1000).optional(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').optional(),
    timeLimit: Joi.number().integer().min(300).max(14400).optional(),
    totalQuestions: Joi.number().integer().min(1).max(100).optional(),
    passingScore: Joi.number().min(0).max(100).optional(),
    instructions: Joi.string().max(2000).optional(),
    isActive: Joi.boolean().optional(),
  }),

  submitAnswer: Joi.object({
    questionId: commonSchemas.id,
    userAnswer: Joi.string().required(),
    timeSpent: Joi.number().integer().min(0).required(),
  }),

  submitTest: Joi.object({
    testAttemptId: commonSchemas.id,
    answers: Joi.array().items(Joi.object({
      questionId: commonSchemas.id,
      questionNumber: Joi.number().integer().min(1).required(),
      userAnswer: Joi.string().required(),
      timeSpent: Joi.number().integer().min(0).required(),
    })).min(1).required(),
  }),
};

// Question validation schemas
export const questionSchemas = {
  createQuestion: Joi.object({
    testId: commonSchemas.id,
    questionNumber: Joi.number().integer().min(1).required(),
    questionType: Joi.string().valid('multiple_choice', 'true_false', 'fill_blank', 'essay', 'audio_response').required(),
    questionText: Joi.string().min(10).max(2000).required(),
    options: Joi.array().items(Joi.string().max(500)).when('questionType', {
      is: Joi.string().valid('multiple_choice', 'true_false'),
        then: Joi.array().required().min(2).max(10),
      otherwise: Joi.optional(),
    }),
    correctAnswer: Joi.string().when('questionType', {
      is: 'essay',
      then: Joi.optional(),
      otherwise: Joi.required(),
    }),
    points: Joi.number().min(0.5).max(10).required(),
    explanation: Joi.string().max(1000).optional(),
    audioUrl: commonSchemas.url,
    imageUrl: commonSchemas.url,
  }),
};

// File upload validation
export const fileSchemas = {
  uploadFile: Joi.object({
    fileType: Joi.string().valid('image', 'audio', 'video', 'document').required(),
    purpose: Joi.string().valid('profile', 'test', 'question', 'answer').required(),
  }),
};

// Validation helper functions
export const validateSchema = (schema: Joi.ObjectSchema, data: any): ValidationResult => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });

  if (error) {
    const errors: CustomValidationError[] = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
      code: detail.type,
    }));

    return { isValid: false, errors };
  }

  return { isValid: true, errors: [], data: value };
};

// Express middleware for validation
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const dataToValidate = req[source];
    const result = validateSchema(schema, dataToValidate);

    if (!result.isValid) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: result.errors,
        },
      });
    }

    // Replace request data with validated and sanitized data
    req[source] = result.data;
    next();
  };
};

// Pagination validation middleware
export const validatePagination = validate(Joi.object(commonSchemas.pagination), 'query');

// ID validation middleware
export const validateId = validate(Joi.object({ id: commonSchemas.id }), 'params');

// Custom validation functions
export const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export const isValidEmail = (email: string): boolean => {
  return VALIDATION_PATTERNS.EMAIL.test(email);
};

export const isStrongPassword = (password: string): boolean => {
  return VALIDATION_PATTERNS.PASSWORD.test(password);
};

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

export const normalizeEmail = (email: string): string => {
  return email.toLowerCase().trim();
}; 