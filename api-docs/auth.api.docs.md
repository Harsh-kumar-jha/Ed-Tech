# 🔐 Auth Module API Documentation

## Overview
This document provides comprehensive documentation for the Authentication Module API endpoints, including request/response formats and Postman setup instructions.

**Base URL**: `http://localhost:3000/api/v1/auth`

## 🔄 Authentication Flow

### Two-Step Authentication Process
1. **Registration**: Creates user account only (no tokens returned)
2. **Login**: Returns JWT access and refresh tokens for API access

### Important Notes
- **Registration** only creates the user account - no authentication tokens are provided
- **Login** is required after registration to obtain JWT tokens
- Use the `accessToken` from login response for authenticated API requests
- Use the `refreshToken` to get new access tokens when they expire

### 🔄 What Changed?
| **Old Behavior** | **New Behavior** |
|---|---|
| Registration returns tokens immediately | Registration only creates account |
| Single-step registration → access | Two-step: Registration → Login → access |
| Potential security risk | Enhanced security separation |

**Migration Guide**: If you were using tokens from registration, you now need to call login after registration.

---

## Table of Contents
1. [User Registration](#1-user-registration)
2. [Email/Username Login](#2-emailusername-login)
3. [Phone Login (OTP)](#3-phone-login-otp)
4. [OTP Verification](#4-otp-verification)
5. [Forgot Password](#5-forgot-password)
6. [Reset Password](#6-reset-password)
7. [Refresh Token](#7-refresh-token)
8. [Logout](#8-logout)
9. [Postman Collection Setup](#postman-collection-setup)
10. [Error Responses](#error-responses)
11. [Testing Flow](#testing-flow)

---

## 1. User Registration

### Endpoint
**POST** `/api/v1/auth/register`

### Description
Register a new user account with email, username, and password. **Note**: Registration only creates the user account. You must log in separately to receive authentication tokens.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "email": "john.doe@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "phone": "+1234567890",
  "role": "student"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address (must be unique) |
| username | string | Yes | Unique username (must be unique) |
| firstName | string | Yes | User's first name (min 2 chars) |
| lastName | string | Yes | User's last name (min 2 chars) |
| password | string | Yes | Strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 number) |
| phone | string | No | Phone number with country code |
| role | string | No | User role (student/instructor, defaults to student) |

### Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully. Please log in to get access tokens.",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "student",
      "isActive": true,
      "isEmailVerified": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Error Responses for Registration

#### 409 Conflict - Email Already Exists
```json
{
  "success": false,
  "error": {
    "message": "Email already exists",
    "code": "EMAIL_EXISTS"
  }
}
```

#### 409 Conflict - Username Already Exists
```json
{
  "success": false,
  "error": {
    "message": "Username already exists",
    "code": "USERNAME_EXISTS"
  }
}
```

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      "Valid email is required",
      "Password must be at least 8 characters with uppercase, lowercase, and number"
    ]
  }
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/register`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)

---

## 2. Email/Username Login

### Endpoint
**POST** `/api/v1/auth/login`

### Description
Authenticate user with email/username and password. **This endpoint returns JWT tokens** for accessing protected resources. Use this after registration to obtain authentication tokens.

### Request Headers
```
Content-Type: application/json
```

### Request Body (Option 1 - Email)
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

### Request Body (Option 2 - Username)
```json
{
  "username": "johndoe",
  "password": "SecurePassword123!"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes* | User's email address |
| username | string | Yes* | User's username |
| password | string | Yes | User's password |

*Either email or username is required, not both.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "phone": "+1234567890",
      "role": "student",
      "isActive": true,
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600
    }
  }
}
```

### Error Responses for Login

#### 401 Unauthorized - Invalid Credentials
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "AUTHENTICATION_FAILED"
  }
}
```

#### 401 Unauthorized - Account Disabled
```json
{
  "success": false,
  "error": {
    "message": "Account is disabled",
    "code": "AUTHENTICATION_FAILED"
  }
}
```

#### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": [
      "Either email or username is required",
      "Password is required"
    ]
  }
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/login`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)
5. **Tests**: Save access token to environment variable for subsequent requests

---

## 3. Phone Login (OTP)

### Endpoint
**POST** `/api/v1/auth/phone-login`

### Description
Initiate phone number login by sending OTP to the provided phone number.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "phone": "+1234567890"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes | Phone number with country code |

### Response (200 OK)
```json
{
  "success": true,
  "message": "OTP sent to your phone",
  "data": {
    "otpId": "uuid-string",
    "expiresIn": 300,
    "message": "OTP sent successfully"
  }
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/phone-login`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)

---

## 4. OTP Verification

### Endpoint
**POST** `/api/v1/auth/verify-otp`

### Description
Verify OTP for login or password reset purposes.

### Request Headers
```
Content-Type: application/json
```

### Request Body (Phone Login)
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "type": "login"
}
```

### Request Body (Email Password Reset)
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "type": "password_reset"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| phone | string | Yes* | Phone number with country code |
| email | string | Yes* | User's email address |
| otp | string | Yes | 6-digit OTP code |
| type | string | Yes | Purpose: "login" or "password_reset" |

*Either phone or email is required based on the verification type.

### Response (200 OK) - Login Type
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "john.doe@example.com",
      "username": "johndoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT",
      "isActive": true
    },
    "tokens": {
      "accessToken": "jwt-access-token",
      "refreshToken": "jwt-refresh-token",
      "expiresIn": 604800
    }
  }
}
```

### Response (200 OK) - Password Reset Type
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "verified": true,
    "canResetPassword": true
  }
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/verify-otp`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)

---

## 5. Forgot Password

### Endpoint
**POST** `/api/v1/auth/forgot-password`

### Description
Initiate password reset process by sending OTP to email or phone.

### Request Headers
```
Content-Type: application/json
```

### Request Body (Email)
```json
{
  "email": "john.doe@example.com"
}
```

### Request Body (Phone)
```json
{
  "phone": "+1234567890"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes* | User's email address |
| phone | string | Yes* | User's phone number |

*Either email or phone is required.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Password reset OTP sent",
  "data": {
    "otpId": "uuid-string",
    "expiresIn": 300,
    "message": "Reset OTP sent successfully"
  }
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/forgot-password`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)

---

## 6. Reset Password

### Endpoint
**POST** `/api/v1/auth/reset-password`

### Description
Reset user password using OTP verification.

### Request Headers
```
Content-Type: application/json
```

### Request Body (Email)
```json
{
  "email": "john.doe@example.com",
  "otp": "123456",
  "password": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

### Request Body (Phone)
```json
{
  "phone": "+1234567890",
  "otp": "123456",
  "password": "NewSecurePassword123!",
  "confirmPassword": "NewSecurePassword123!"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes* | User's email address |
| phone | string | Yes* | User's phone number |
| otp | string | Yes | 6-digit OTP code |
| password | string | Yes | New password (min 8 chars) |
| confirmPassword | string | Yes | Confirm new password |

*Either email or phone is required.

### Response (200 OK)
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/reset-password`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)

---

## 7. Refresh Token

### Endpoint
**POST** `/api/auth/refresh-token`

### Description
Refresh expired access token using refresh token.

### Request Headers
```
Content-Type: application/json
```

### Request Body
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token |

### Response (200 OK)
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "new-jwt-access-token",
      "refreshToken": "new-jwt-refresh-token",
      "expiresIn": 604800
    }
  }
}
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/refresh-token`
3. **Headers**: `Content-Type: application/json`
4. **Body**: Raw JSON (see request body above)

---

## 8. Logout

### Endpoint
**POST** `/api/v1/auth/logout`

### Description
Logout user and invalidate tokens. **Two methods available**: refresh token in body (recommended) OR access token in Authorization header.

### 🔒 Method 1: Logout with Refresh Token (Recommended)

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Request Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refreshToken | string | Yes* | User's current refresh token |

### 🚀 Method 2: Logout with Access Token (Simple)

#### Request Headers
```
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Request Body
```json
{}
```

*Either refreshToken in body OR Authorization header is required.

### Response (200 OK) - Method 1 (Refresh Token)
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "loggedOut": true,
    "method": "refresh_token",
    "message": "Refresh token invalidated. Please log in again to get new tokens."
  }
}
```

### Response (200 OK) - Method 2 (Access Token)
```json
{
  "success": true,
  "message": "Logout successful",
  "data": {
    "loggedOut": true,
    "method": "access_token",
    "message": "Access token invalidated. Refresh token (if any) may still be valid."
  }
}
```

### Error Responses for Logout

#### 400 Bad Request - No Token Provided
```json
{
  "success": false,
  "error": {
    "message": "Either refresh token in body or access token in Authorization header is required for logout",
    "code": "VALIDATION_ERROR",
    "details": [
      "Option 1: Send refreshToken in request body",
      "Option 2: Send access token in Authorization header as \"Bearer <token>\""
    ]
  }
}
```

#### 401 Unauthorized - Invalid Token
```json
{
  "success": false,
  "error": {
    "message": "Invalid refresh token",
    "code": "INVALID_REFRESH_TOKEN"
  }
}
```

### ⚡ Quick Test Examples

#### Method 1: Logout with Refresh Token
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

#### Method 2: Logout with Access Token  
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token_here"
```

### Postman Setup
1. **Method**: `POST`
2. **URL**: `{{baseUrl}}/auth/logout`
3. **Option A**: Headers: `Content-Type: application/json`, Body: `{"refreshToken": "{{refreshToken}}"}`
4. **Option B**: Headers: `Content-Type: application/json`, `Authorization: Bearer {{accessToken}}`

---

## Postman Collection Setup

### Environment Variables
Create a new environment in Postman with these variables:

```json
{
  "baseUrl": "http://localhost:3000/api/v1",
  "accessToken": "",
  "refreshToken": ""
}
```

### Global Pre-request Script
Add this script to automatically include authentication headers:

```javascript
// Add Authorization header for protected routes
const protectedRoutes = [
  '/profile',
  '/tests',
  '/admin'
];

const currentUrl = pm.request.url.toString();
const isProtectedRoute = protectedRoutes.some(route => 
  currentUrl.includes(route)
);

if (isProtectedRoute) {
  const token = pm.environment.get('accessToken');
  if (token) {
    pm.request.headers.add({
      key: 'Authorization',
      value: 'Bearer ' + token
    });
  }
}
```

### Test Scripts for Token Management
Add this test script to login/register requests:

```javascript
// Save tokens from successful authentication
if (pm.response.code === 200 || pm.response.code === 201) {
  const response = pm.response.json();
  
  if (response.success && response.data && response.data.tokens) {
    pm.environment.set('accessToken', response.data.tokens.accessToken);
    pm.environment.set('refreshToken', response.data.tokens.refreshToken);
    
    console.log('✅ Tokens saved successfully');
    console.log('Access Token:', response.data.tokens.accessToken.substring(0, 20) + '...');
  }
}

// Test response structure
pm.test("Response has correct structure", function () {
  const jsonData = pm.response.json();
  pm.expect(jsonData).to.have.property('success');
  pm.expect(jsonData).to.have.property('message');
});

pm.test("Status code is success", function () {
  pm.expect(pm.response.code).to.be.oneOf([200, 201]);
});
```

### Auto Token Refresh Script
Add this pre-request script for automatic token refresh:

```javascript
// Auto refresh token if access token is expired
const accessToken = pm.environment.get('accessToken');
const refreshToken = pm.environment.get('refreshToken');

if (accessToken && refreshToken) {
  // Decode JWT to check expiration (basic check)
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    if (payload.exp < currentTime) {
      // Token expired, refresh it
      pm.sendRequest({
        url: pm.environment.get('baseUrl') + '/auth/refresh-token',
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            refreshToken: refreshToken
          })
        }
      }, function (err, response) {
        if (!err && response.code === 200) {
          const data = response.json();
          pm.environment.set('accessToken', data.data.tokens.accessToken);
          pm.environment.set('refreshToken', data.data.tokens.refreshToken);
          console.log('🔄 Token refreshed automatically');
        }
      });
    }
  } catch (error) {
    console.log('⚠️ Token validation error:', error);
  }
}
```

---

## Error Responses

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Email is required",
      "code": "REQUIRED"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters",
      "code": "MIN_LENGTH"
    }
  ]
}
```

### Authentication Error (401 Unauthorized)
```json
{
  "success": false,
  "error": {
    "message": "Invalid credentials",
    "code": "AUTHENTICATION_FAILED"
  }
}
```

### Forbidden Error (403 Forbidden)
```json
{
  "success": false,
  "error": {
    "message": "Insufficient permissions",
    "code": "FORBIDDEN"
  }
}
```

### Not Found Error (404 Not Found)
```json
{
  "success": false,
  "error": {
    "message": "User not found",
    "code": "USER_NOT_FOUND"
  }
}
```

### Rate Limit Error (429 Too Many Requests)
```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later",
    "code": "RATE_LIMIT_EXCEEDED",
    "retryAfter": 900
  }
}
```

### Server Error (500 Internal Server Error)
```json
{
  "success": false,
  "error": {
    "message": "Internal server error",
    "code": "SERVER_ERROR"
  }
}
```

---

## Testing Flow

### Complete Authentication Flow Example

#### 🆕 Recommended Registration + Login Flow
1. **User Registration** (Creates account only)
   ```
   POST /api/v1/auth/register
   → Receive user data (NO tokens)
   → User account created successfully
   ```

2. **User Login** (Required to get tokens)
   ```
   POST /api/v1/auth/login
   → Receive user data + JWT tokens
   → Save accessToken and refreshToken in environment
   ```

#### Alternative Authentication Methods

3. **Direct Login** (For existing users)
   ```
   POST /api/v1/auth/login
   → Receive user data + tokens
   → Save tokens in environment
   ```

4. **Phone Login Flow** (Alternative authentication)
   ```
   POST /api/v1/auth/phone-login
   → Receive OTP confirmation
   
   POST /api/v1/auth/verify-otp
   → Receive user data + tokens
   → Save tokens in environment
   ```

#### Additional Flows

5. **Password Reset Flow**
   ```
   POST /api/v1/auth/forgot-password
   → Receive OTP confirmation
   
   POST /api/v1/auth/verify-otp (type: password_reset)
   → Receive verification confirmation
   
   POST /api/v1/auth/reset-password
   → Receive success confirmation
   ```

6. **Token Management**
   ```
   Use accessToken for protected routes
   → When token expires (401 error)
   
   POST /api/v1/auth/refresh-token
   → Receive new accessToken
   → Update environment variables
   ```

7. **Logout**
   ```
   POST /api/v1/auth/logout
   → Invalidate tokens
   → Clear tokens from environment
   ```

### Protected Routes Testing
Once authenticated, you can test protected routes by including the Authorization header:

```
Authorization: Bearer {{accessToken}}
```

### ⚡ Quick Test Guide

#### Test the New Registration + Login Flow
```bash
# 1. Register user (no tokens returned)
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User",
    "password": "TestPass123!"
  }'

# 2. Login to get tokens (tokens returned)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Common Test Scenarios

1. **✅ Valid Registration + Login Flow**
   - Register user (expect 201, no tokens)
   - Login with same credentials (expect 200, with tokens)
   - Verify user data structure matches

2. **❌ Duplicate Registration**
   - Register user successfully
   - Try registering same email again (expect 409 conflict)
   - Try registering same username again (expect 409 conflict)

3. **❌ Invalid Login Credentials**
   - Test with wrong password (expect 401)
   - Test with non-existent email (expect 401)
   - Verify error response format

4. **❌ Validation Errors**
   - Test registration with missing fields (expect 400)
   - Test with invalid email format (expect 400)
   - Test with weak passwords (expect 400)

5. **🔄 Token Management**
   - Use access token for protected routes
   - Test token refresh when expired
   - Test logout functionality

---

## Security Notes

1. **Always use HTTPS in production**
2. **Store tokens securely** (not in localStorage for web apps)
3. **Implement proper rate limiting**
4. **Validate all input data**
5. **Use strong passwords** (minimum 8 characters with complexity)
6. **Implement account lockout** after failed attempts
7. **Log security events** for monitoring

---

## Support

For issues or questions regarding the Auth API:
- Check server logs for detailed error information
- Verify environment variables are properly set
- Ensure database connectivity
- Validate request format and required fields

---

**Last Updated**: 2024-01-01  
**API Version**: v1  
**Documentation Version**: 1.0
