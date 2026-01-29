# Requirements Document: Firebase Authentication Migration

## Introduction

This document specifies the requirements for migrating the MLH TTU application from a custom JWT-based authentication system with Supabase/PostgreSQL to Firebase Authentication with Google SSO. This migration is the first phase of a broader architectural shift to Next.js and Firebase, with the primary focus on establishing a working authentication system.

## Glossary

- **Firebase_Auth**: Firebase Authentication service that handles user authentication and session management
- **Google_SSO**: Google Single Sign-On authentication provider integrated with Firebase Auth
- **Next_App**: Next.js 14+ application using the App Router architecture
- **Auth_Context**: React context providing authentication state and methods throughout the application
- **Protected_Route**: Application route that requires user authentication to access
- **Session_Token**: Firebase ID token stored in HTTP-only cookies for server-side authentication verification in Next.js
- **Onboarding_Flow**: Multi-step user registration process collecting profile information
- **Auth_Middleware**: Next.js middleware that validates authentication before route access
- **Firebase_Config**: Configuration object containing Firebase project credentials and settings
- **Next_Firebase_Auth_Edge**: Library for Firebase authentication in Next.js Edge Runtime and middleware
- **User_Profile**: User data stored in Firestore including email, name, and onboarding status
- **TTU_Email**: Texas Tech University email address used for account verification and duplicate prevention
- **Email_Verification**: Process of verifying TTU email ownership through a verification code or link
- **Verification_Attempt**: A single attempt to enter the correct verification code
- **Pending_Account**: A Firebase account that has been created but not yet verified with a TTU email

## Requirements

### Requirement 1: Firebase Authentication Setup

**User Story:** As a developer, I want to configure Firebase Authentication with Google SSO, so that users can authenticate securely using their Google accounts.

#### Acceptance Criteria

1. THE Firebase_Config SHALL be initialized with valid project credentials from environment variables
2. WHEN Firebase_Auth is configured, THE System SHALL enable Google as an authentication provider
3. THE Firebase_Config SHALL be accessible to both client-side and server-side code
4. WHEN environment variables are missing or invalid, THE System SHALL fail gracefully with descriptive error messages
5. THE System SHALL use Firebase's built-in session management with ID tokens stored in HTTP-only cookies for Next.js server-side verification
6. THE System SHALL use next-firebase-auth-edge library for server-side authentication in Next.js middleware and Edge Runtime

### Requirement 2: Google SSO Authentication Flow

**User Story:** As a user, I want to sign in with my Google account, so that I can access the application without creating a separate password.

#### Acceptance Criteria

1. WHEN a user clicks the Google sign-in button, THE System SHALL redirect to Google's OAuth consent screen
2. WHEN Google authentication succeeds, THE System SHALL create or retrieve the user's Firebase account
3. WHEN a new user authenticates, THE System SHALL redirect to the Onboarding_Flow
4. WHEN an existing user authenticates, THE System SHALL redirect to the profile page
5. WHEN Google authentication fails, THE System SHALL display an error message and allow retry
6. THE System SHALL store the Firebase ID token in an HTTP-only secure cookie for Next.js server-side authentication

### Requirement 3: Authentication State Management

**User Story:** As a developer, I want a centralized authentication context, so that all components can access the current user's authentication state.

#### Acceptance Criteria

1. THE Auth_Context SHALL provide the current user object or null if unauthenticated
2. THE Auth_Context SHALL provide a loading state during authentication checks
3. THE Auth_Context SHALL provide sign-in and sign-out methods
4. WHEN the application loads, THE Auth_Context SHALL check for an existing valid session
5. WHEN authentication state changes, THE Auth_Context SHALL notify all subscribed components
6. THE Auth_Context SHALL handle Firebase authentication errors and expose them to components

### Requirement 4: Protected Routes and Middleware

**User Story:** As a developer, I want to protect certain routes from unauthenticated access, so that sensitive pages require authentication.

#### Acceptance Criteria

1. THE Auth_Middleware SHALL use next-firebase-auth-edge to verify Firebase ID tokens from cookies
2. WHEN an unauthenticated user accesses a Protected_Route, THE System SHALL redirect to the login page
3. WHEN an authenticated user without completed onboarding accesses a Protected_Route, THE System SHALL redirect to the Onboarding_Flow
4. THE Auth_Middleware SHALL run on the server side in Next.js Edge Runtime for security and performance
5. THE System SHALL define public routes that bypass authentication checks (landing page, login page)

### Requirement 5: User Profile Storage in Firestore

**User Story:** As a developer, I want to store user profile data in Firestore, so that user information persists across sessions.

#### Acceptance Criteria

1. WHEN a user authenticates for the first time, THE System SHALL create a User_Profile document in Firestore
2. THE User_Profile SHALL include email, display name, and hasCompletedOnboarding flag
3. WHEN a user completes onboarding, THE System SHALL update the User_Profile with onboarding data
4. THE System SHALL use the Firebase UID as the document ID for User_Profile documents
5. WHEN retrieving user data, THE System SHALL query Firestore using the authenticated user's UID

### Requirement 6: TTU Email Verification and Duplicate Prevention

**User Story:** As a system administrator, I want to verify users with their TTU email addresses, so that each student can only create one account and we can track attendance accurately.

#### Acceptance Criteria

1. WHEN a user completes Google authentication for the first time, THE Onboarding_Flow SHALL require a TTU_Email address
2. WHEN a TTU_Email is entered, THE System SHALL validate it matches the pattern *@ttu.edu
3. WHEN a TTU_Email is submitted, THE System SHALL check if it already exists in Firestore
4. WHEN a duplicate TTU_Email is detected, THE System SHALL reject the submission with an error message indicating the email is already registered
5. THE System SHALL send a verification code to the TTU_Email address
6. WHEN the verification code is entered correctly, THE System SHALL mark the TTU_Email as verified
7. THE System SHALL store the verified TTU_Email in the User_Profile document
8. WHEN a user attempts to change their TTU_Email after verification, THE System SHALL require re-verification
9. THE System SHALL create a unique index on TTU_Email in Firestore to prevent race conditions
10. THE System SHALL track the number of Verification_Attempts for each Pending_Account
11. WHEN a user enters an incorrect verification code 3 times, THE System SHALL immediately delete the Firebase account and User_Profile document
12. WHEN a Pending_Account is created, THE System SHALL set a 10-minute expiration timer
13. WHEN the expiration timer expires without successful verification, THE System SHALL delete the Firebase account and User_Profile document
14. WHEN a Firebase account is deleted due to failed verification, THE System SHALL allow the user to sign up again with Google SSO

### Requirement 7: Onboarding Flow Integration

**User Story:** As a new user, I want to complete an onboarding process after first sign-in, so that I can provide my profile information and verify my TTU email.

#### Acceptance Criteria

1. WHEN a new user completes Google authentication, THE System SHALL check if hasCompletedOnboarding is false
2. WHEN hasCompletedOnboarding is false, THE System SHALL redirect to the Onboarding_Flow
3. THE Onboarding_Flow SHALL collect firstName, lastName, major, rNumber, universityLevel, aspiredPosition, and TTU_Email
4. THE Onboarding_Flow SHALL validate the TTU_Email format and check for duplicates before proceeding
5. THE Onboarding_Flow SHALL send a verification code to the TTU_Email
6. WHEN the verification code is validated, THE Onboarding_Flow SHALL allow submission
7. WHEN onboarding is submitted, THE System SHALL update the User_Profile in Firestore
8. WHEN onboarding is complete, THE System SHALL set hasCompletedOnboarding to true and redirect to the profile page

### Requirement 8: Sign-Out Functionality

**User Story:** As a user, I want to sign out of the application, so that my session is terminated and my account is secure.

#### Acceptance Criteria

1. WHEN a user clicks sign out, THE System SHALL call Firebase Auth signOut method
2. WHEN sign-out succeeds, THE System SHALL clear the Firebase ID token cookie
3. WHEN sign-out succeeds, THE System SHALL clear the Auth_Context user state
4. WHEN sign-out succeeds, THE System SHALL redirect to the landing page
5. WHEN sign-out fails, THE System SHALL log the error and still clear local authentication state

### Requirement 9: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages when authentication fails, so that I understand what went wrong and how to proceed.

#### Acceptance Criteria

1. WHEN Firebase authentication fails, THE System SHALL display a user-friendly error message
2. WHEN network errors occur during authentication, THE System SHALL inform the user and suggest retry
3. WHEN session expires, THE System SHALL redirect to login with a session expired message
4. THE System SHALL log detailed error information for debugging without exposing sensitive data to users
5. WHEN authentication errors occur, THE System SHALL provide a way to retry authentication
6. WHEN TTU_Email verification fails, THE System SHALL display specific error messages (invalid code, expired code, network error)

### Requirement 10: Migration from Existing Auth System

**User Story:** As a developer, I want to cleanly remove the old authentication system, so that there are no conflicts or security vulnerabilities.

#### Acceptance Criteria

1. THE System SHALL remove all Passport.js OAuth strategy configurations
2. THE System SHALL remove custom JWT token generation and validation logic
3. THE System SHALL remove Supabase authentication client initialization
4. THE System SHALL remove Express session middleware configuration
5. THE System SHALL remove all custom auth routes (/auth/google, /auth/microsoft, /auth/magic-link)
6. THE System SHALL remove the custom AuthenticationService class
7. THE System SHALL remove database session storage logic

### Requirement 11: Next.js App Router Structure

**User Story:** As a developer, I want the application to use Next.js App Router conventions, so that routing and data fetching follow modern Next.js patterns.

#### Acceptance Criteria

1. THE Next_App SHALL use the app directory structure for routing
2. THE Next_App SHALL use Server Components by default for improved performance
3. THE Next_App SHALL use Client Components only when necessary (interactive UI, hooks)
4. THE Next_App SHALL implement layouts for shared UI elements across routes
5. THE Next_App SHALL use Next.js middleware for authentication checks
6. THE Next_App SHALL use Server Actions for form submissions and mutations where appropriate
