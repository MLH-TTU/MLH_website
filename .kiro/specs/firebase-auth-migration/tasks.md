# Implementation Plan: Firebase Authentication Migration

## Overview

This implementation plan breaks down the Firebase authentication migration into discrete, incremental tasks. Each task builds on previous work and includes testing to validate functionality early. The plan prioritizes getting authentication working first, then adding onboarding and verification features.

## Tasks

- [x] 1. Set up Next.js project and Firebase configuration
  - Create new Next.js 14+ project with App Router and TypeScript
  - Install dependencies: firebase, next-firebase-auth-edge, react-hook-form, zod
  - Configure Firebase project in Firebase Console (enable Google Auth, create Firestore database)
  - Create environment variable files (.env.local) with Firebase credentials
  - Initialize Firebase client SDK configuration in `lib/firebase/config.ts`
  - Initialize Firebase Admin SDK configuration in `lib/firebase/admin.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

- [ ]* 1.1 Write unit tests for Firebase configuration
  - Test configuration initialization with valid credentials
  - Test error handling for missing environment variables
  - Test config accessibility in both client and server contexts
  - _Requirements: 1.1, 1.3, 1.4_

- [x] 2. Implement Authentication Context and Google SSO
  - [x] 2.1 Create Auth Context with Firebase integration
    - Create `contexts/AuthContext.tsx` with user state management
    - Implement `signInWithGoogle()` using Firebase `signInWithPopup`
    - Implement `signOut()` using Firebase `signOut`
    - Add `onAuthStateChanged` listener for session persistence
    - Implement loading and error state management
    - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_
  
  - [x] 2.2 Create login page with Google SSO button
    - Create `app/login/page.tsx` with Google sign-in button
    - Style button according to Google branding guidelines
    - Add loading state during authentication
    - Display error messages when authentication fails
    - _Requirements: 2.1, 2.5_
  
  - [x] 2.3 Implement cookie-based session management
    - Create API route `app/api/auth/session/route.ts` to set auth cookies
    - Store Firebase ID token in HTTP-only secure cookie
    - Implement token refresh logic
    - _Requirements: 1.5, 2.6_
  
  - [ ]* 2.4 Write unit tests for Auth Context
    - Test context provides user object when authenticated
    - Test context provides null when unauthenticated
    - Test loading state during auth checks
    - Test sign-in and sign-out methods
    - Test error exposure to components
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Checkpoint - Verify basic authentication works
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Next.js middleware for route protection
  - [x] 4.1 Create authentication middleware
    - Create `middleware.ts` using next-firebase-auth-edge
    - Implement token verification from cookies
    - Define public routes (landing, login) and protected routes
    - Redirect unauthenticated users to login page
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  
  - [x] 4.2 Add onboarding status check to middleware
    - Query Firestore for user profile
    - Check `hasCompletedOnboarding` flag
    - Redirect incomplete users to onboarding flow
    - _Requirements: 4.3_
  
  - [ ]* 4.3 Write unit tests for middleware
    - Test token verification with valid tokens
    - Test unauthenticated user redirect to login
    - Test incomplete user redirect to onboarding
    - Test public route access without auth
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

- [x] 5. Implement User Profile Service and Firestore integration
  - [x] 5.1 Create User Profile Service
    - Create `lib/services/userProfile.ts` with CRUD operations
    - Implement `createUserProfile()` for new users
    - Implement `getUserProfile()` to fetch user data
    - Implement `updateUserProfile()` for profile updates
    - Implement `checkTTUEmailExists()` for duplicate detection
    - Implement `deleteUserProfile()` for cleanup
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 5.2 Set up Firestore security rules
    - Deploy security rules for users collection
    - Deploy security rules for verificationCodes collection
    - Test rules with Firebase Emulator
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 5.3 Create Firestore indexes
    - Create unique index on ttuEmail field
    - Create index on verificationExpiresAt for cleanup queries
    - Create indexes on universityLevel and major for analytics
    - _Requirements: 6.9_
  
  - [ ]* 5.4 Write unit tests for User Profile Service
    - Test profile creation on first auth
    - Test profile includes required fields
    - Test profile updates after onboarding
    - Test UID used as document ID
    - Test profile queries use correct UID
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 6. Checkpoint - Verify user profiles are created and stored
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement TTU Email Verification Service
  - [x] 7.1 Install and configure Resend
    - Install Resend package: `npm install resend`
    - Add RESEND_API_KEY to environment variables
    - Configure sender email domain in Resend dashboard
    - _Requirements: 6.5_
  
  - [x] 7.2 Create verification code generation and storage
    - Create `lib/services/ttuEmailVerification.ts`
    - Implement `sendVerificationCode()` to generate 6-digit codes
    - Store codes in Firestore with expiration (10 minutes)
    - Integrate with Resend API to send verification emails
    - Create email template for verification code
    - _Requirements: 6.5_
  
  - [x] 7.3 Implement verification code validation
    - Implement `verifyCode()` to check code correctness
    - Implement `incrementAttempts()` to track failed attempts
    - Mark TTU email as verified on successful validation
    - _Requirements: 6.6, 6.7, 6.10_
  
  - [x] 7.4 Implement account cleanup logic
    - Implement `cleanupFailedVerification()` to delete account after 3 failures
    - Implement `setupExpirationTimer()` for 10-minute timeout
    - Create API route or scheduled task for expired account cleanup
    - _Requirements: 6.11, 6.12, 6.13, 6.14_
  
  - [ ]* 7.4 Write property test for TTU email validation
    - **Property 1: TTU Email Format Validation**
    - **Validates: Requirements 6.2**
  
  - [ ]* 7.5 Write unit tests for verification service
    - Test verification code generation and sending
    - Test correct code validation
    - Test incorrect code handling
    - Test attempt tracking
    - Test account deletion after 3 failures
    - Test expiration timer setup
    - Test expired account cleanup
    - _Requirements: 6.5, 6.6, 6.10, 6.11, 6.12, 6.13_

- [x] 8. Implement File Upload Service
  - [x] 8.1 Create File Upload Service
    - Create `lib/services/fileUpload.ts`
    - Implement `uploadProfilePicture()` with validation (5MB max, images only)
    - Implement `uploadResume()` with validation (10MB max, PDF/DOCX only)
    - Implement `deleteFile()` for cleanup
    - Implement `getFileUrl()` for download URLs
    - Store files in Firebase Storage with user-specific paths
  
  - [x] 8.2 Set up Firebase Storage security rules
    - Deploy security rules for profile pictures
    - Deploy security rules for resumes
    - Test rules with Firebase Emulator
  
  - [ ]* 8.3 Write unit tests for File Upload Service
    - Test profile picture upload with valid files
    - Test resume upload with valid files
    - Test file type validation
    - Test file size validation
    - Test file deletion

- [x] 9. Implement Onboarding Flow
  - [x] 9.1 Create onboarding page structure
    - Create `app/onboarding/page.tsx` with multi-step form
    - Implement step navigation (next, back)
    - Add progress indicator
    - _Requirements: 7.1, 7.2_
  
  - [x] 9.2 Create Profile Info step
    - Create `components/onboarding/ProfileInfoStep.tsx`
    - Add form fields: firstName, lastName, major, rNumber, universityLevel, aspiredPosition
    - Implement validation with Zod schema
    - _Requirements: 7.3_
  
  - [x] 9.3 Create Social Links step
    - Create `components/onboarding/SocialLinksStep.tsx`
    - Add optional fields: githubUrl, linkedinUrl, twitterUrl
    - Implement URL validation
  
  - [x] 9.4 Create File Uploads step
    - Create `components/onboarding/FileUploadsStep.tsx`
    - Add profile picture upload with preview
    - Add resume upload with file name display
    - Implement drag-and-drop functionality
  
  - [x] 9.5 Create TTU Email step
    - Create `components/onboarding/TTUEmailStep.tsx`
    - Add TTU email input field
    - Implement format validation (*@ttu.edu)
    - Check for duplicate TTU emails
    - Send verification code on submission
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.4, 7.5_
  
  - [x] 9.6 Create Verification Code step
    - Create `components/onboarding/VerificationCodeStep.tsx`
    - Add 6-digit code input field
    - Display remaining attempts
    - Handle verification success/failure
    - Show error messages for invalid/expired codes
    - _Requirements: 6.6, 7.6, 9.6_
  
  - [x] 9.7 Implement onboarding submission
    - Upload profile picture and resume to Firebase Storage
    - Update user profile in Firestore with all collected data
    - Set `hasCompletedOnboarding` to true
    - Redirect to profile page on completion
    - _Requirements: 7.7, 7.8_
  
  - [ ]* 9.8 Write unit tests for onboarding flow
    - Test onboarding status check
    - Test redirect to onboarding for new users
    - Test form field collection
    - Test TTU email validation and duplicate check
    - Test verification code flow
    - Test profile update after completion
    - Test hasCompletedOnboarding flag update
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [ ] 10. Checkpoint - Verify complete onboarding flow works end-to-end
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Migrate existing pages to Next.js
  - [x] 11.1 Create landing page
    - Port existing landing page to `app/page.tsx`
    - Update navigation to use Next.js Link components
    - Ensure responsive design works
  
  - [x] 11.2 Create profile page
    - Create `app/profile/page.tsx` as protected route
    - Display user profile information
    - Add edit profile functionality
    - Show profile picture and resume
    - Display social links
  
  - [x] 11.3 Create navigation component
    - Create `components/Navigation.tsx`
    - Add sign-out button
    - Show user avatar when authenticated
    - Implement responsive mobile menu

- [x] 12. Implement error handling and user feedback
  - [x] 12.1 Create error boundary component
    - Create `components/ErrorBoundary.tsx`
    - Catch and display React errors gracefully
    - Log errors for debugging
    - _Requirements: 9.4_
  
  - [x] 12.2 Add toast notifications
    - Create `components/Toast.tsx` for user feedback
    - Show success messages (sign-in, profile updated, etc.)
    - Show error messages with retry options
    - _Requirements: 9.1, 9.2, 9.3, 9.5, 9.6_
  
  - [ ]* 12.3 Write unit tests for error handling
    - Test Firebase auth error messages
    - Test network error handling
    - Test session expiration handling
    - Test error logging without sensitive data
    - Test retry mechanisms
    - Test TTU email verification error messages
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 13. Remove old authentication system
  - Remove Passport.js dependencies and configurations
  - Remove custom JWT logic from server
  - Remove Supabase client initialization
  - Remove Express server and auth routes
  - Remove old AuthenticationService class
  - Remove database session storage logic
  - Clean up unused dependencies from package.json
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 14. Write integration tests
  - [ ]* 14.1 Test complete authentication flow
    - Sign in with Google → Create profile → Redirect to onboarding
    - Complete onboarding → Verify TTU email → Redirect to profile
    - Sign out → Clear session → Redirect to landing
  
  - [ ]* 14.2 Test protected route access
    - Unauthenticated access → Redirect to login
    - Authenticated but incomplete → Redirect to onboarding
    - Authenticated and complete → Access granted
  
  - [ ]* 14.3 Test TTU email verification flow
    - Enter TTU email → Receive code → Enter correct code → Verify success
    - Enter incorrect code 3 times → Account deleted → Can sign up again

- [ ] 15. Final checkpoint and deployment preparation
  - Run all tests (unit, property-based, integration)
  - Test in Firebase Emulator Suite
  - Verify all environment variables are documented
  - Create deployment documentation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests verify end-to-end flows
