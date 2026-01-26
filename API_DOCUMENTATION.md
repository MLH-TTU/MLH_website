# MLH TTU Backend API Documentation

This document provides comprehensive API documentation for the MLH TTU backend and onboarding system.

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [Data Models](#data-models)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [File Uploads](#file-uploads)
8. [Examples](#examples)

## Overview

The MLH TTU API provides endpoints for user authentication, onboarding, profile management, and file uploads. All API endpoints return JSON responses and follow RESTful conventions.

**Base URL**: `https://api.yourdomain.com`

**API Version**: v1

**Content Type**: `application/json` (except for file uploads which use `multipart/form-data`)

## Authentication

The API uses session-based authentication with secure HTTP-only cookies.

### Authentication Flow

1. **OAuth Authentication**: Users authenticate via Google or Microsoft OAuth
2. **Magic Link**: Users can authenticate via email magic links
3. **Session Management**: Successful authentication creates a secure session

### Session Management

Sessions are managed automatically through HTTP-only cookies. Include `credentials: 'include'` in your requests.

```javascript
// Example fetch with credentials
fetch('/api/user/me', {
  credentials: 'include'
})
```

## API Endpoints

### Authentication Endpoints

#### POST /auth/google
Initiate Google OAuth authentication.

**Response**: Redirects to Google OAuth consent screen

#### GET /auth/google/callback
Handle Google OAuth callback.

**Response**: Redirects to frontend with authentication status

#### POST /auth/microsoft
Initiate Microsoft OAuth authentication.

**Response**: Redirects to Microsoft OAuth consent screen

#### GET /auth/microsoft/callback
Handle Microsoft OAuth callback.

**Response**: Redirects to frontend with authentication status

#### POST /auth/magic-link
Send magic link authentication email.

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Magic link sent to your email"
}
```

#### GET /auth/magic-link/verify/:token
Verify magic link token and authenticate user.

**Parameters**:
- `token` (string): Magic link verification token

**Response**: Redirects to frontend with authentication status

#### POST /auth/logout
Logout current user and destroy session.

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /auth/me
Get current authenticated user information.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "provider": "google",
    "hasCompletedOnboarding": true,
    "firstName": "John",
    "lastName": "Doe",
    // ... other user fields
  }
}
```

### User Profile Endpoints

#### GET /api/user/me
Get current user profile (same as /auth/me).

#### PUT /api/user/profile
Update user profile information.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "major": "Computer Science",
  "aspiredPosition": "Software Engineer",
  "githubUrl": "https://github.com/johndoe",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "twitterUrl": "https://x.com/johndoe",
  "technologySkills": ["javascript", "react", "nodejs"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Updated user profile
  }
}
```

#### POST /api/user/onboard
Complete user onboarding process.

**Request Body**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "major": "Computer Science",
  "rNumber": "R12345678",
  "universityLevel": "senior",
  "aspiredPosition": "Software Engineer",
  "githubUrl": "https://github.com/johndoe",
  "linkedinUrl": "https://linkedin.com/in/johndoe",
  "twitterUrl": "https://x.com/johndoe",
  "technologySkills": ["javascript", "react", "nodejs"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Complete user profile
  }
}
```

**Duplicate R Number Response**:
```json
{
  "success": false,
  "error": "DUPLICATE_R_NUMBER",
  "data": {
    "existingUser": {
      "id": "existing_user_id",
      "email": "existing@example.com",
      "firstName": "Existing",
      "lastName": "User"
    },
    "linkingToken": "linking_token_here",
    "message": "An account with this R Number already exists"
  }
}
```

### File Upload Endpoints

#### POST /api/files/profile-picture
Upload user profile picture.

**Request**: `multipart/form-data`
- `file`: Image file (JPEG, PNG, WebP, max 5MB)

**Response**:
```json
{
  "success": true,
  "data": {
    "fileId": "file_id",
    "url": "/api/files/file_id",
    "originalName": "profile.jpg",
    "size": 1024000
  }
}
```

#### POST /api/files/resume
Upload user resume.

**Request**: `multipart/form-data`
- `file`: PDF file (max 10MB)

**Response**:
```json
{
  "success": true,
  "data": {
    "fileId": "file_id",
    "url": "/api/files/file_id",
    "originalName": "resume.pdf",
    "size": 2048000
  }
}
```

#### GET /api/files/:fileId
Download or view uploaded file.

**Parameters**:
- `fileId` (string): File identifier

**Response**: File content with appropriate headers

#### DELETE /api/files/:fileId
Delete uploaded file.

**Parameters**:
- `fileId` (string): File identifier

**Response**:
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

### Integration Endpoints

#### POST /api/integration/onboarding
Complete onboarding with file uploads and duplicate detection.

**Request**: `multipart/form-data`
- Form fields: All onboarding data
- `profilePicture` (optional): Image file
- `resume` (optional): PDF file

**Response**: Same as `/api/user/onboard` but handles file uploads

#### POST /api/integration/link-account
Handle account linking for duplicate R Numbers.

**Request Body**:
```json
{
  "linkingToken": "token_from_duplicate_response",
  "method": "password", // or "reset"
  "password": "user_password" // required if method is "password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    // Linked user profile
  }
}
```

#### PUT /api/integration/profile
Update profile with file uploads.

**Request**: `multipart/form-data`
- Form fields: Profile update data
- `profilePicture` (optional): New image file
- `resume` (optional): New PDF file

#### GET /api/integration/profile
Get complete profile with file URLs.

**Response**:
```json
{
  "success": true,
  "data": {
    // User profile with file URLs
    "profilePictureUrl": "https://domain.com/api/files/file_id",
    "resumeUrl": "https://domain.com/api/files/file_id"
  }
}
```

### System Endpoints

#### GET /api/health
System health check.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 45
    },
    "fileSystem": {
      "status": "healthy",
      "responseTime": 12
    },
    "memory": {
      "status": "healthy",
      "details": {
        "used": "256MB",
        "total": "512MB",
        "percentage": "50.0%"
      }
    }
  }
}
```

#### GET /api/metrics
System metrics (requires authentication token).

**Headers**:
- `Authorization: Bearer <metrics_token>`

**Response**:
```json
{
  "health": {
    // Health check data
  },
  "requests": {
    "total": 1000,
    "errors": 5,
    "averageResponseTime": 150
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### GET /api/hello
Simple connectivity test.

**Response**:
```json
{
  "message": "Hello World from MLH TTU Chapter!",
  "database": "Connected",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  provider: 'google' | 'microsoft' | 'email';
  hasCompletedOnboarding: boolean;
  
  // Profile information
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string; // TTU Student ID
  universityLevel?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate';
  aspiredPosition?: string;
  
  // Social media links
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  
  // File references
  profilePictureId?: string;
  resumeId?: string;
  
  // Technology skills
  technologySkills: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### Technology Model

```typescript
interface Technology {
  id: string;
  name: string;
  category: 'language' | 'framework' | 'database' | 'tool' | 'cloud' | 'other';
  iconUrl?: string;
  color?: string;
}
```

### File Model

```typescript
interface File {
  id: string;
  userId: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  type: 'profile_picture' | 'resume';
  storageUrl: string;
  createdAt: Date;
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    // Additional error details
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Request validation failed
- `AUTH_ERROR`: Authentication required
- `AUTHORIZATION_ERROR`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `DUPLICATE_ENTRY`: Unique constraint violation
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `FILE_UPLOAD_ERROR`: File upload failed
- `INTERNAL_ERROR`: Server error

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (duplicate data)
- `429`: Too Many Requests
- `500`: Internal Server Error
- `503`: Service Unavailable

## Rate Limiting

The API implements rate limiting to prevent abuse:

### General API Endpoints
- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Authentication Endpoints
- **Limit**: 10 requests per 15 minutes per IP
- **Applies to**: `/auth/*` routes

### File Upload Endpoints
- **Limit**: 20 requests per hour per IP
- **Applies to**: File upload routes

### Rate Limit Response

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}
```

## File Uploads

### Supported File Types

**Profile Pictures**:
- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- WebP (`.webp`)
- Maximum size: 5MB

**Resumes**:
- PDF (`.pdf`)
- Maximum size: 10MB

### File Upload Process

1. **Validation**: File type and size validation
2. **Security Scan**: Malicious content detection
3. **Storage**: Secure storage with unique naming
4. **URL Generation**: Secure access URL creation

### File Access

Files are served through secure URLs that include access control:

```
GET /api/files/:fileId
```

Files are automatically served with appropriate caching headers and security measures.

## Examples

### Complete Onboarding Flow

```javascript
// 1. Authenticate user (handled by OAuth redirect)

// 2. Check authentication status
const authResponse = await fetch('/auth/me', {
  credentials: 'include'
});
const authData = await authResponse.json();

if (!authData.success) {
  // Redirect to login
  window.location.href = '/login';
  return;
}

// 3. Complete onboarding
const formData = new FormData();
formData.append('firstName', 'John');
formData.append('lastName', 'Doe');
formData.append('major', 'Computer Science');
formData.append('rNumber', 'R12345678');
formData.append('universityLevel', 'senior');
formData.append('aspiredPosition', 'Software Engineer');
formData.append('technologySkills', JSON.stringify(['javascript', 'react']));

// Add files if selected
if (profilePictureFile) {
  formData.append('profilePicture', profilePictureFile);
}
if (resumeFile) {
  formData.append('resume', resumeFile);
}

const onboardingResponse = await fetch('/api/integration/onboarding', {
  method: 'POST',
  credentials: 'include',
  body: formData
});

const onboardingData = await onboardingResponse.json();

if (onboardingData.success) {
  // Onboarding completed
  window.location.href = '/profile';
} else if (onboardingData.error === 'DUPLICATE_R_NUMBER') {
  // Handle duplicate account
  showAccountLinkingModal(onboardingData.data);
} else {
  // Handle other errors
  showError(onboardingData.error);
}
```

### Handle Duplicate Account

```javascript
async function linkAccount(linkingToken, method, password) {
  const response = await fetch('/api/integration/link-account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({
      linkingToken,
      method,
      password
    })
  });

  const data = await response.json();
  
  if (data.success) {
    if (method === 'reset') {
      showMessage('Password reset email sent');
    } else {
      window.location.href = '/profile';
    }
  } else {
    showError(data.error);
  }
}
```

### File Upload

```javascript
async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/files/profile-picture', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });

  const data = await response.json();
  
  if (data.success) {
    return data.data.fileId;
  } else {
    throw new Error(data.error);
  }
}
```

### Error Handling

```javascript
async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    return data.data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}
```

## Support

For API support and questions:
- **Documentation**: This document
- **Technical Support**: [tech-support@domain.com]
- **Bug Reports**: [GitHub Issues](https://github.com/your-org/mlh-ttu-app/issues)

---

This API documentation is maintained alongside the codebase. Please refer to the latest version for accurate information.