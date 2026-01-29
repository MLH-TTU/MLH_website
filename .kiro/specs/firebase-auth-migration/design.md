# Design Document: Firebase Authentication Migration

## Overview

This design outlines the migration from a custom Passport.js/Supabase authentication system to Firebase Authentication with Google SSO for the MLH TTU application. The migration includes transitioning from Vite + React to Next.js 14+ with App Router, replacing PostgreSQL/Prisma with Firestore, and implementing TTU email verification for duplicate account prevention.

The design prioritizes getting authentication working correctly as the foundation for future feature development. The system will use Firebase's managed authentication service, eliminating custom JWT logic and session management while maintaining security and user experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Next.js App (React Components)                        │ │
│  │  - Landing Page                                        │ │
│  │  - Login Page (Google SSO Button)                     │ │
│  │  - Onboarding Flow (TTU Email Verification)           │ │
│  │  - Profile Page                                        │ │
│  │  - Auth Context Provider                              │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↕                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Firebase Client SDK                                   │ │
│  │  - signInWithPopup(GoogleAuthProvider)                │ │
│  │  - onAuthStateChanged()                                │ │
│  │  - signOut()                                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Server (Edge)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware (next-firebase-auth-edge)                  │ │
│  │  - Verify Firebase ID tokens from cookies             │ │
│  │  - Protect routes based on auth status                │ │
│  │  - Redirect unauthenticated users                     │ │
│  │  - Check onboarding completion status                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Server Components & API Routes                        │ │
│  │  - User profile queries                                │ │
│  │  - Onboarding data submission                          │ │
│  │  - TTU email verification                              │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↕
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Services                         │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Firebase Auth    │  │ Cloud Firestore  │                │
│  │ - Google OAuth   │  │ - User Profiles  │                │
│  │ - User Management│  │ - TTU Emails     │                │
│  │ - Token Issuance │  │ - Verification   │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### Authentication Flow

```
User clicks "Sign in with Google"
         ↓
Firebase SDK opens Google OAuth popup
         ↓
User authenticates with Google
         ↓
Firebase creates/retrieves user account
         ↓
Firebase issues ID token
         ↓
Client stores ID token in HTTP-only cookie
         ↓
Check if user exists in Firestore
         ↓
    ┌────┴────┐
    │         │
New User   Existing User
    │         │
    ↓         ↓
Onboarding  Profile Page
    │
    ↓
Collect profile data + TTU email
    │
    ↓
Send verification code to TTU email
    │
    ↓
User enters code (max 3 attempts)
    │
    ├─ Correct → Mark verified, save profile
    │
    └─ 3 failures → Delete Firebase account
```

## Components and Interfaces

### 1. Firebase Configuration

**Location:** `lib/firebase/config.ts` (client), `lib/firebase/admin.ts` (server)

**Client Configuration:**
```typescript
interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

function initializeFirebase(): FirebaseApp
function getAuth(): Auth
function getFirestore(): Firestore
```

**Server Configuration:**
```typescript
interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function initializeAdmin(): admin.app.App
function getAdminAuth(): admin.auth.Auth
function getAdminFirestore(): admin.firestore.Firestore
```

### 2. Authentication Context

**Location:** `contexts/AuthContext.tsx`

```typescript
interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  provider?: string;
  hasCompletedOnboarding: boolean;
  ttuEmail?: string;
  ttuEmailVerified?: boolean;
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string;
  universityLevel?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other';
  aspiredPosition?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  profilePictureId?: string;
  resumeId?: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

function AuthProvider({ children }: { children: ReactNode }): JSX.Element
function useAuth(): AuthContextValue
```

**Implementation Details:**
- Uses Firebase `onAuthStateChanged` to listen for auth state changes
- Fetches user profile from Firestore when authenticated
- Stores Firebase ID token in HTTP-only cookie via API route
- Provides loading state during authentication operations
- Handles errors and exposes them to components

### 3. Next.js Middleware

**Location:** `middleware.ts`

```typescript
interface MiddlewareConfig {
  publicRoutes: string[];
  protectedRoutes: string[];
  onboardingRoute: string;
  loginRoute: string;
}

async function middleware(request: NextRequest): Promise<NextResponse>
```

**Implementation Details:**
- Uses `next-firebase-auth-edge` to verify Firebase ID tokens
- Reads token from HTTP-only cookie
- Checks if route requires authentication
- Verifies onboarding completion for protected routes
- Redirects unauthenticated users to login
- Redirects incomplete users to onboarding

### 4. User Profile Service

**Location:** `lib/services/userProfile.ts`

```typescript
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider?: string; // 'google', 'microsoft', etc. (optional for future multi-provider support)
  hasCompletedOnboarding: boolean;
  
  // TTU Verification
  ttuEmail?: string;
  ttuEmailVerified?: boolean;
  
  // Profile Information
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string;
  universityLevel?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other';
  aspiredPosition?: string; // Optional career aspiration
  
  // Social Links (all optional)
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  
  // Files (optional)
  profilePictureId?: string; // Reference to Firebase Storage file
  resumeId?: string; // Reference to Firebase Storage file (PDF/DOCX)
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Verification tracking
  verificationAttempts?: number;
  verificationExpiresAt?: Timestamp;
}

async function createUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>
async function getUserProfile(uid: string): Promise<UserProfile | null>
async function updateUserProfile(uid: string, data: Partial<UserProfile>): Promise<void>
async function checkTTUEmailExists(ttuEmail: string): Promise<boolean>
async function deleteUserProfile(uid: string): Promise<void>
```

### 5. TTU Email Verification Service

**Location:** `lib/services/ttuEmailVerification.ts`

```typescript
interface VerificationCode {
  code: string;
  email: string;
  uid: string;
  expiresAt: Timestamp;
  attempts: number;
}

async function sendVerificationCode(ttuEmail: string, uid: string): Promise<void>
async function verifyCode(uid: string, code: string): Promise<boolean>
async function incrementAttempts(uid: string): Promise<number>
async function cleanupFailedVerification(uid: string): Promise<void>
async function setupExpirationTimer(uid: string): Promise<void>
```

**Implementation Details:**
- Generates 6-digit verification codes
- Sends codes via email (using Firebase Extensions or SendGrid)
- Stores codes in Firestore with expiration
- Tracks verification attempts
- Deletes Firebase account after 3 failed attempts
- Sets 10-minute expiration timer for pending accounts
- Cleans up expired accounts automatically

### 6. File Upload Service

**Location:** `lib/services/fileUpload.ts`

```typescript
interface UploadResult {
  fileId: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  contentType: string;
}

async function uploadProfilePicture(file: File, uid: string): Promise<UploadResult>
async function uploadResume(file: File, uid: string): Promise<UploadResult>
async function deleteFile(fileId: string): Promise<void>
async function getFileUrl(fileId: string): Promise<string>
```

**Implementation Details:**
- Uses Firebase Storage for file storage
- Validates file types (images for profile pictures, PDF/DOCX for resumes)
- Validates file sizes (max 5MB for images, max 10MB for resumes)
- Generates unique file IDs using Firebase Storage paths
- Stores files in user-specific folders: `users/{uid}/profile-picture/` and `users/{uid}/resume/`
- Implements security rules to restrict access
- Provides download URLs with appropriate expiration

### 7. Onboarding Flow Components

**Location:** `app/onboarding/page.tsx`, `components/onboarding/`

```typescript
interface OnboardingFormData {
  firstName: string;
  lastName: string;
  major: string;
  rNumber: string;
  universityLevel: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other';
  aspiredPosition?: string;
  ttuEmail: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  profilePicture?: File;
  resume?: File;
}

interface OnboardingStepProps {
  data: Partial<OnboardingFormData>;
  onNext: (data: Partial<OnboardingFormData>) => void;
  onBack: () => void;
}

function OnboardingPage(): JSX.Element
function ProfileInfoStep(props: OnboardingStepProps): JSX.Element
function SocialLinksStep(props: OnboardingStepProps): JSX.Element
function FileUploadsStep(props: OnboardingStepProps): JSX.Element
function TTUEmailStep(props: OnboardingStepProps): JSX.Element
function VerificationCodeStep(props: OnboardingStepProps): JSX.Element
```

## Data Models

### Firestore Collections

#### users Collection

```typescript
// Document ID: Firebase UID
{
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider?: string; // 'google', 'microsoft', etc.
  hasCompletedOnboarding: boolean;
  
  // TTU Verification
  ttuEmail?: string;
  ttuEmailVerified?: boolean;
  
  // Profile Information
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string;
  universityLevel?: 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate' | 'other';
  aspiredPosition?: string;
  
  // Social Links (all optional)
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  
  // Files (optional)
  profilePictureId?: string; // Reference to Firebase Storage file
  resumeId?: string; // Reference to Firebase Storage file (PDF/DOCX)
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  
  // Verification tracking
  verificationAttempts?: number;
  verificationExpiresAt?: Timestamp;
}

// Indexes:
// - ttuEmail (unique) - for duplicate prevention
// - verificationExpiresAt - for cleanup queries
// - universityLevel - for filtering/analytics
// - major - for filtering/analytics
```

#### verificationCodes Collection

```typescript
// Document ID: Firebase UID
{
  code: string;
  email: string;
  uid: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  attempts: number;
}

// Indexes:
// - expiresAt - for cleanup queries
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{uid} {
      // Users can read their own profile
      allow read: if request.auth != null && request.auth.uid == uid;
      
      // Users can create their own profile (first-time auth)
      allow create: if request.auth != null && request.auth.uid == uid;
      
      // Users can update their own profile
      allow update: if request.auth != null && request.auth.uid == uid
        && (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['uid', 'email']));
      
      // Only admins can delete (via server-side)
      allow delete: if false;
    }
    
    // Verification codes collection
    match /verificationCodes/{uid} {
      // Only server-side can read/write
      allow read, write: if false;
    }
  }
}
```

### Firebase Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User profile pictures
    match /users/{uid}/profile-picture/{fileName} {
      // Users can read their own profile picture
      allow read: if request.auth != null && request.auth.uid == uid;
      
      // Users can upload their own profile picture
      allow write: if request.auth != null 
        && request.auth.uid == uid
        && request.resource.size < 5 * 1024 * 1024 // 5MB max
        && request.resource.contentType.matches('image/.*');
    }
    
    // User resumes
    match /users/{uid}/resume/{fileName} {
      // Users can read their own resume
      allow read: if request.auth != null && request.auth.uid == uid;
      
      // Users can upload their own resume
      allow write: if request.auth != null 
        && request.auth.uid == uid
        && request.resource.size < 10 * 1024 * 1024 // 10MB max
        && (request.resource.contentType == 'application/pdf' 
            || request.resource.contentType == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    }
  }
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: TTU Email Format Validation

*For any* string input, when validating as a TTU email, the validation should return true if and only if the string matches the pattern `*@ttu.edu`

**Validates: Requirements 6.2**

### Property 2: Configuration Initialization with Invalid Environment Variables

*For any* set of environment variables where required Firebase credentials are missing or invalid, the configuration initialization should fail with a descriptive error message indicating which variables are problematic

**Validates: Requirements 1.4**

## Error Handling

### Error Categories

1. **Authentication Errors**
   - Google OAuth failures
   - Token verification failures
   - Session expiration
   - Network errors during auth

2. **Validation Errors**
   - Invalid TTU email format
   - Duplicate TTU email
   - Missing required onboarding fields

3. **Verification Errors**
   - Incorrect verification code
   - Expired verification code
   - Maximum attempts exceeded

4. **System Errors**
   - Firestore operation failures
   - Email sending failures
   - Configuration errors

### Error Handling Strategy

**Client-Side:**
- Display user-friendly error messages
- Provide retry mechanisms
- Log detailed errors to console (development only)
- Show loading states during operations

**Server-Side:**
- Log all errors with context
- Return appropriate HTTP status codes
- Sanitize error messages before sending to client
- Implement retry logic for transient failures

**Error Message Examples:**
```typescript
const ERROR_MESSAGES = {
  AUTH_FAILED: "Unable to sign in with Google. Please try again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  TTU_EMAIL_INVALID: "Please enter a valid TTU email address (e.g., username@ttu.edu)",
  TTU_EMAIL_DUPLICATE: "This TTU email is already registered to another account.",
  VERIFICATION_CODE_INVALID: "Invalid verification code. Please try again.",
  VERIFICATION_CODE_EXPIRED: "Verification code has expired. Please request a new one.",
  MAX_ATTEMPTS_EXCEEDED: "Maximum verification attempts exceeded. Your account has been removed. Please sign up again.",
  ONBOARDING_INCOMPLETE: "Please complete your profile to continue.",
};
```

## Testing Strategy

### Unit Tests

Unit tests will focus on specific examples, edge cases, and error conditions:

1. **Configuration Tests**
   - Test Firebase config initialization with valid credentials
   - Test error handling for missing environment variables
   - Test config accessibility in client and server contexts

2. **Authentication Flow Tests**
   - Test Google sign-in button triggers OAuth flow
   - Test successful authentication creates/retrieves user
   - Test new user redirect to onboarding
   - Test existing user redirect to profile
   - Test authentication error handling

3. **Auth Context Tests**
   - Test context provides user object when authenticated
   - Test context provides null when unauthenticated
   - Test loading state during auth checks
   - Test sign-in and sign-out methods
   - Test error exposure to components

4. **Middleware Tests**
   - Test token verification with valid tokens
   - Test unauthenticated user redirect to login
   - Test incomplete user redirect to onboarding
   - Test public route access without auth

5. **User Profile Tests**
   - Test profile creation on first auth
   - Test profile includes required fields
   - Test profile updates after onboarding
   - Test UID used as document ID
   - Test profile queries use correct UID

6. **TTU Email Verification Tests**
   - Test verification code generation and sending
   - Test correct code validation
   - Test incorrect code handling
   - Test attempt tracking
   - Test account deletion after 3 failures
   - Test expiration timer setup
   - Test expired account cleanup

7. **Onboarding Flow Tests**
   - Test onboarding status check
   - Test redirect to onboarding for new users
   - Test form field collection
   - Test TTU email validation and duplicate check
   - Test verification code flow
   - Test profile update after completion
   - Test hasCompletedOnboarding flag update

8. **Sign-Out Tests**
   - Test Firebase signOut method called
   - Test cookie cleared after signout
   - Test context state cleared
   - Test redirect to landing page
   - Test error handling during signout

9. **Error Handling Tests**
   - Test Firebase auth error messages
   - Test network error handling
   - Test session expiration handling
   - Test error logging without sensitive data
   - Test retry mechanisms
   - Test TTU email verification error messages

### Property-Based Tests

Property-based tests will verify universal properties across many generated inputs:

1. **TTU Email Validation Property**
   - Generate random strings
   - Verify validation returns true only for strings matching `*@ttu.edu`
   - Test with various edge cases (empty, special characters, multiple @, etc.)
   - **Feature: firebase-auth-migration, Property 1: TTU Email Format Validation**

2. **Configuration Error Handling Property**
   - Generate various combinations of missing/invalid environment variables
   - Verify all cases produce descriptive error messages
   - Verify error messages indicate which variables are problematic
   - **Feature: firebase-auth-migration, Property 2: Configuration Initialization with Invalid Environment Variables**

### Integration Tests

Integration tests will verify end-to-end flows:

1. **Complete Authentication Flow**
   - Sign in with Google → Create profile → Redirect to onboarding
   - Complete onboarding → Verify TTU email → Redirect to profile
   - Sign out → Clear session → Redirect to landing

2. **Protected Route Access**
   - Unauthenticated access → Redirect to login
   - Authenticated but incomplete → Redirect to onboarding
   - Authenticated and complete → Access granted

3. **TTU Email Verification Flow**
   - Enter TTU email → Receive code → Enter correct code → Verify success
   - Enter incorrect code 3 times → Account deleted → Can sign up again

### Test Configuration

- Use Vitest for unit and property-based tests
- Use fast-check for property-based testing
- Configure minimum 100 iterations per property test
- Use Firebase Emulator Suite for integration tests
- Mock external services (email sending) in unit tests

## Migration Steps

### Phase 1: Setup Next.js and Firebase

1. Create new Next.js 14+ project with App Router
2. Install Firebase SDK and next-firebase-auth-edge
3. Configure Firebase project and enable Google authentication
4. Set up Firestore database and security rules
5. Configure environment variables

### Phase 2: Implement Core Authentication

1. Create Firebase configuration files
2. Implement Auth Context with Google SSO
3. Create login page with Google sign-in button
4. Implement middleware for route protection
5. Create user profile service

### Phase 3: Implement Onboarding and Verification

1. Create onboarding flow components
2. Implement TTU email verification service
3. Set up email sending (Firebase Extensions or SendGrid)
4. Implement verification attempt tracking
5. Implement account cleanup logic

### Phase 4: Migrate Existing Components

1. Port landing page to Next.js
2. Port profile page to Next.js
3. Update navigation components
4. Migrate existing UI components
5. Update routing structure

### Phase 5: Remove Old System

1. Remove Passport.js configurations
2. Remove custom JWT logic
3. Remove Supabase client
4. Remove Express server
5. Remove old auth routes
6. Clean up unused dependencies

### Phase 6: Testing and Deployment

1. Write unit tests
2. Write property-based tests
3. Write integration tests
4. Test in Firebase Emulator
5. Deploy to staging environment
6. Perform user acceptance testing
7. Deploy to production

## Security Considerations

1. **Token Security**
   - Store Firebase ID tokens in HTTP-only cookies
   - Use secure flag in production
   - Set appropriate SameSite policy
   - Implement token refresh logic

2. **Route Protection**
   - Verify tokens server-side in middleware
   - Never trust client-side auth state alone
   - Implement proper redirect logic

3. **Data Access**
   - Use Firestore security rules
   - Validate all user inputs
   - Sanitize data before storage
   - Implement rate limiting

4. **Email Verification**
   - Generate cryptographically secure codes
   - Set short expiration times
   - Limit verification attempts
   - Clean up failed attempts

5. **Error Handling**
   - Never expose sensitive data in errors
   - Log errors securely
   - Implement proper error boundaries
   - Provide user-friendly messages

## Performance Considerations

1. **Server-Side Rendering**
   - Use Next.js Server Components for static content
   - Minimize client-side JavaScript
   - Implement proper caching strategies

2. **Authentication Checks**
   - Use Edge Runtime for fast middleware execution
   - Cache user profiles appropriately
   - Minimize Firestore reads

3. **Code Splitting**
   - Lazy load onboarding components
   - Split authentication logic from main bundle
   - Optimize Firebase SDK imports

4. **Database Queries**
   - Use Firestore indexes for common queries
   - Implement pagination for large datasets
   - Cache frequently accessed data

## Future Enhancements

1. **Additional OAuth Providers**
   - Add Microsoft SSO (if needed)
   - Add GitHub authentication
   - Support multiple linked accounts

2. **Enhanced Security**
   - Implement 2FA
   - Add device management
   - Implement suspicious activity detection

3. **User Management**
   - Admin dashboard for user management
   - Bulk user operations
   - User analytics

4. **Attendance Tracking**
   - QR code check-in system
   - Attendance reports
   - Integration with TTU email verification
