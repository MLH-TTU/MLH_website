# Implementation Plan: MLH TTU Backend and Onboarding System

## Overview

This implementation plan breaks down the MLH TTU backend and onboarding system into discrete, manageable coding tasks. Each task builds incrementally on previous work, ensuring a robust authentication system with comprehensive onboarding, duplicate account detection, and profile management capabilities.

The implementation follows a backend-first approach, establishing core services and APIs before building the frontend components that consume them.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - Set up Node.js/Express/TypeScript backend project structure
  - Configure Prisma ORM with PostgreSQL database
  - Set up React/TypeScript frontend project with Tailwind CSS
  - Configure development environment and build tools
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Database Schema and Models
  - [x] 2.1 Create Prisma schema with all data models
    - Define User, Technology, File, Session, and AccountLinkingToken models
    - Set up relationships and constraints (unique email, unique R Number)
    - Configure enums for AuthProvider, UniversityLevel, TechnologyCategory, FileType
    - _Requirements: 2.1, 2.9, 2.10, 11.2_
  
  - [x] 2.2 Write property test for database constraints
    - **Property 3: Email Uniqueness Enforcement**
    - **Property 4: R Number Uniqueness and Duplicate Detection**
    - **Validates: Requirements 2.1, 2.9, 2.10, 2.11**
  
  - [x] 2.3 Create database migration and seed data
    - Generate initial migration for all models
    - Create seed data for predefined technologies list
    - _Requirements: 4.11_

- [x] 3. Authentication System Backend
  - [x] 3.1 Implement OAuth configuration for Google and Microsoft
    - Set up Passport.js or Auth.js with OAuth strategies
    - Configure OAuth provider credentials and callback URLs
    - _Requirements: 1.1, 1.2_
  
  - [x] 3.2 Implement Magic Link authentication
    - Create magic link generation and email sending functionality
    - Implement magic link validation and user authentication
    - _Requirements: 1.3, 1.4_
  
  - [x] 3.3 Write property tests for authentication flows
    - **Property 1: OAuth Authentication Flow Consistency**
    - **Property 2: Magic Link Authentication Round Trip**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
  
  - [x] 3.4 Implement session management
    - Create secure session creation, validation, and destruction
    - Implement session-based route protection middleware
    - _Requirements: 1.6, 3.3, 3.4_

- [x] 4. User Profile Service Backend
  - [x] 4.1 Create Profile Service with CRUD operations
    - Implement getUserProfile, updateUserProfile, completeOnboarding methods
    - Add validation for all user data fields
    - _Requirements: 6.1, 6.7, 6.8, 6.9_
  
  - [x] 4.2 Implement duplicate detection service
    - Create checkRNumberExists and linkAccountByRNumber methods
    - Implement account linking token generation and validation
    - _Requirements: 2.11, 5.1, 5.7_
  
  - [x] 4.3 Write property tests for profile operations
    - **Property 13: Complete Profile Data Persistence**
    - **Property 12: Account Linking Flow Integrity**
    - **Validates: Requirements 2.4, 2.5, 2.6, 2.7, 5.3, 5.5, 5.6, 5.7, 6.7, 6.8**
  
  - [x] 4.4 Add comprehensive input validation
    - Implement R Number format validation
    - Add social media URL validation for GitHub, LinkedIn, X
    - Create technology skills selection validation
    - _Requirements: 4.4, 4.7, 4.8, 4.9, 6.2, 6.3, 6.6_

- [x] 5. File Upload Service Backend
  - [x] 5.1 Implement secure file upload functionality
    - Create file upload handlers for profile pictures and resumes
    - Add file type and size validation
    - Implement secure file storage with unique naming
    - _Requirements: 8.1, 8.2, 8.3, 8.5_
  
  - [x] 5.2 Add file security and validation
    - Implement malicious content scanning
    - Create secure URL generation for file access
    - Add comprehensive error handling for file operations
    - _Requirements: 8.4, 8.6, 8.7_
  
  - [x] 5.3 Write property tests for file operations
    - **Property 11: File Upload Validation and Security**
    - **Validates: Requirements 6.4, 6.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6**

- [x] 6. API Routes and Endpoints
  - [x] 6.1 Create authentication API routes
    - Implement OAuth callback routes and magic link verification
    - Add session management endpoints (/auth/me, /auth/logout)
    - Create post-authentication routing logic
    - _Requirements: 3.1, 3.2, 1.1, 1.2, 1.3, 1.4_
  
  - [x] 6.2 Create user profile API routes
    - Implement POST /api/user/onboard with duplicate detection
    - Create GET /api/user/me for profile retrieval
    - Add account linking endpoints for duplicate scenarios
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
  
  - [x] 6.3 Create file upload API routes
    - Implement file upload endpoints with validation
    - Add secure file access endpoints
    - Create file deletion endpoints
    - _Requirements: File upload and access functionality_
  
  - [x] 6.4 Write property tests for API endpoints
    - **Property 14: API Response Consistency**
    - **Property 5: Onboarding Status-Based Routing**
    - **Property 6: Route Protection for Unauthenticated Access**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 7.3, 7.4, 7.5, 7.6, 7.7, 10.4**

- [x] 7. Checkpoint - Backend Core Complete
  - Ensure all backend tests pass and APIs are functional
  - Test authentication flows and profile operations manually
  - Verify database operations and file uploads work correctly
  - Ask the user if questions arise about backend implementation

- [x] 8. Frontend Authentication Components
  - [x] 8.1 Create authentication provider selection component
    - Build OAuth provider buttons (Google, Microsoft)
    - Implement magic link email form
    - Add loading states and error handling
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 8.2 Implement authentication flow integration
    - Connect frontend auth components to backend APIs
    - Handle OAuth redirects and magic link verification
    - Implement session management on frontend
    - _Requirements: 1.4, 1.6, 3.4_
  
  - [x] 8.3 Write unit tests for authentication components
    - Test provider selection and form submission
    - Test error handling and loading states
    - _Requirements: 10.1, 10.5_

- [x] 9. Frontend Onboarding Form Components
  - [x] 9.1 Create basic onboarding form structure
    - Build form layout with MLH branding and Tailwind CSS
    - Implement required fields (name, major, R Number, university level, aspired position)
    - Add form validation with real-time feedback
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.15_
  
  - [x] 9.2 Add optional social media links section
    - Create URL input fields for GitHub, LinkedIn, X
    - Implement URL format validation with platform-specific patterns
    - Add optional field styling and user guidance
    - _Requirements: 4.7, 4.8, 4.9_
  
  - [x] 9.3 Implement technology skills selector
    - Create multi-select interface for technology skills
    - Load predefined technologies from backend API
    - Organize technologies by categories with search/filter functionality
    - _Requirements: 4.10, 4.11_
  
  - [x] 9.4 Write property tests for form validation
    - **Property 7: Comprehensive Form Validation**
    - **Property 8: R Number Format Validation**
    - **Property 9: Social Media URL Validation**
    - **Property 10: Technology Skills Selection Validation**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.6, 4.7, 4.8, 4.9, 4.10, 6.1, 6.2, 6.3, 6.6**

- [x] 10. Frontend File Upload Components
  - [x] 10.1 Create profile picture upload component
    - Implement drag-and-drop file upload with preview
    - Add file type and size validation on frontend
    - Create image cropping/resizing functionality
    - _Requirements: 4.12, 8.1, 8.2_
  
  - [x] 10.2 Create resume upload component
    - Implement drag-and-drop PDF upload
    - Add file validation and upload progress indicators
    - Create file preview and removal functionality
    - _Requirements: 4.13, 8.1, 8.3_
  
  - [x] 10.3 Write unit tests for file upload components
    - Test drag-and-drop functionality and file validation
    - Test upload progress and error handling
    - _Requirements: 10.3, 10.5_

- [x] 11. Frontend Duplicate Account Detection
  - [x] 11.1 Create account linking modal component
    - Build modal for duplicate R Number warning
    - Implement account linking options (password/reset)
    - Add password entry form and reset request functionality
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [x] 11.2 Integrate duplicate detection with onboarding flow
    - Connect onboarding form to duplicate detection API
    - Handle duplicate account responses and show linking modal
    - Implement account linking completion flow
    - _Requirements: 5.1, 5.7, 5.8_
  
  - [x] 11.3 Write unit tests for account linking flow
    - Test modal display and user interactions
    - Test account linking completion scenarios
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [x] 12. Frontend Profile Display Components
  - [x] 12.1 Create user profile display page
    - Build profile layout with user information sections
    - Display basic info, social links, and technology skills
    - Implement secure file access for profile pictures and resumes
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [x] 12.2 Add interactive profile features
    - Make social media links clickable with new tab opening
    - Organize technology skills by categories with visual indicators
    - Add profile editing capabilities
    - _Requirements: 12.6, 12.7_
  
  - [x] 12.3 Write property tests for profile display
    - **Property 17: Profile Display Completeness**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7**

- [x] 13. Accessibility and Error Handling
  - [x] 13.1 Implement comprehensive accessibility features
    - Add ARIA labels to all form elements and interactive components
    - Implement keyboard navigation for all user interfaces
    - Test with screen readers and accessibility tools
    - _Requirements: 9.5, 9.6_
  
  - [x] 13.2 Add comprehensive error handling and user feedback
    - Implement user-friendly error messages for all failure scenarios
    - Add loading states and success confirmations throughout the application
    - Create error boundary components for React error handling
    - _Requirements: 10.1, 10.2, 10.3, 10.5, 10.6_
  
  - [x] 13.3 Write property tests for accessibility and error handling
    - **Property 15: Accessibility and Keyboard Navigation**
    - **Property 16: Error Handling and User Feedback**
    - **Validates: Requirements 9.5, 9.6, 10.1, 10.2, 10.3, 10.5, 10.6**

- [x] 14. Integration and End-to-End Testing
  - [x] 14.1 Create integration tests for complete user flows
    - Test full authentication and onboarding flow
    - Test duplicate account detection and linking scenarios
    - Test file upload and profile management workflows
    - _Requirements: Complete user journey validation_
  
  - [x] 14.2 Add responsive design testing
    - Test onboarding flow on desktop, tablet, and mobile viewports
    - Verify MLH branding consistency across screen sizes
    - Test touch interactions and mobile-specific functionality
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 12.8_
  
  - [x] 14.3 Write comprehensive integration tests
    - Test API integration between frontend and backend
    - Test database operations and data consistency
    - Test file storage and security features

- [x] 15. Final Integration and Deployment Preparation
  - [x] 15.1 Wire all components together
    - Connect authentication flow to onboarding and profile systems
    - Ensure proper error handling and user feedback throughout
    - Test all user scenarios and edge cases
    - _Requirements: All requirements integration_
  
  - [x] 15.2 Add production configuration and security hardening
    - Configure environment variables and production settings
    - Add rate limiting, CORS, and security headers
    - Implement logging and monitoring for production deployment
    - _Requirements: Security and production readiness_
  
  - [x] 15.3 Create deployment documentation and scripts
    - Document environment setup and configuration requirements
    - Create database migration and deployment scripts
    - Add API documentation and usage examples
    - _Requirements: Deployment and maintenance documentation_

- [ ] 16. Final Checkpoint - Complete System Validation
  - Ensure all tests pass (unit, property, and integration tests)
  - Verify all requirements are implemented and functional
  - Test complete user journeys from authentication through profile management
  - Ask the user if questions arise about the complete implementation

## Notes

- Each task references specific requirements for traceability and validation
- Property tests validate universal correctness properties with 100+ iterations each
- Unit tests focus on specific examples, edge cases, and component interactions
- Integration tests ensure end-to-end functionality and user experience
- Checkpoints provide opportunities for validation and user feedback during development