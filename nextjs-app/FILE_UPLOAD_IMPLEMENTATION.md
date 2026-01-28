# File Upload Service Implementation

## Overview

Task 8 - File Upload Service has been successfully implemented. This includes the file upload service with validation and Firebase Storage security rules.

## What Was Implemented

### 1. File Upload Service (`lib/services/fileUpload.ts`)

A complete file upload service with the following functions:

#### `uploadProfilePicture(file: File, uid: string): Promise<UploadResult>`
- Validates file type (images only: JPEG, JPG, PNG, GIF, WebP)
- Validates file size (max 5MB)
- Generates unique file ID with timestamp and random string
- Uploads to Firebase Storage at path: `users/{uid}/profile-picture/{fileId}`
- Returns upload result with file ID, download URL, file name, size, and content type

#### `uploadResume(file: File, uid: string): Promise<UploadResult>`
- Validates file type (PDF or DOCX only)
- Validates file size (max 10MB)
- Generates unique file ID with timestamp and random string
- Uploads to Firebase Storage at path: `users/{uid}/resume/{fileId}`
- Returns upload result with file ID, download URL, file name, size, and content type

#### `deleteFile(fileId: string): Promise<void>`
- Deletes a file from Firebase Storage using its storage path
- Handles errors gracefully with user-friendly messages

#### `getFileUrl(fileId: string): Promise<string>`
- Retrieves the download URL for a file
- Handles errors gracefully with user-friendly messages

### 2. Firebase Storage Security Rules (`storage.rules`)

Security rules are already properly configured with:

#### Profile Pictures Rules
- **Path**: `users/{uid}/profile-picture/{fileName}`
- **Read**: User must be authenticated and accessing their own files
- **Write**: User must be authenticated, accessing their own files, file must be an image, and under 5MB

#### Resume Rules
- **Path**: `users/{uid}/resume/{fileName}`
- **Read**: User must be authenticated and accessing their own files
- **Write**: User must be authenticated, accessing their own files, file must be PDF or DOCX, and under 10MB

#### Helper Functions
- `isAuthenticated()` - Checks if user is authenticated
- `isOwner(uid)` - Checks if user is accessing their own files
- `isValidImage()` - Validates image content types
- `isValidResume()` - Validates PDF or DOCX content types

### 3. Configuration

Firebase Storage is already configured in:
- `lib/firebase/config.ts` - Client-side storage initialization
- `firebase.json` - Storage rules deployment configuration

## Validation Features

### File Type Validation
- Profile pictures: Only image types (JPEG, JPG, PNG, GIF, WebP)
- Resumes: Only PDF and DOCX files
- Clear error messages indicating allowed types

### File Size Validation
- Profile pictures: Maximum 5MB
- Resumes: Maximum 10MB
- Error messages show both file size and maximum allowed size in MB

### Security Validation
- All uploads require authentication
- Users can only upload to their own folders
- Server-side validation through Firebase Storage rules
- Client-side validation through service functions

## Error Handling

All functions include comprehensive error handling:
- Validation errors with specific messages
- Upload failure handling with retry suggestions
- Deletion failure handling
- URL retrieval failure handling
- Console logging for debugging

## File Organization

Files are stored in user-specific paths:
```
users/
  {uid}/
    profile-picture/
      {timestamp}_{random}.{ext}
    resume/
      {timestamp}_{random}.{ext}
```

This structure:
- Prevents file name collisions
- Organizes files by user
- Makes cleanup easy when deleting user accounts
- Aligns with security rules

## Usage Example

```typescript
import { uploadProfilePicture, uploadResume, deleteFile, getFileUrl } from '@/lib/services/fileUpload';

// Upload profile picture
const profilePictureResult = await uploadProfilePicture(imageFile, user.uid);
console.log('Profile picture uploaded:', profilePictureResult.downloadUrl);

// Upload resume
const resumeResult = await uploadResume(pdfFile, user.uid);
console.log('Resume uploaded:', resumeResult.downloadUrl);

// Get file URL
const url = await getFileUrl(profilePictureResult.fileId);

// Delete file
await deleteFile(profilePictureResult.fileId);
```

## Next Steps

To use this service in the onboarding flow:

1. Import the service in onboarding components
2. Call `uploadProfilePicture()` when user selects a profile picture
3. Call `uploadResume()` when user selects a resume
4. Store the returned `fileId` in the user profile document
5. Use `getFileUrl()` to display files in the profile page
6. Use `deleteFile()` when user wants to remove a file

## Deployment

To deploy the storage rules to Firebase:

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy storage rules
firebase deploy --only storage
```

See `FIREBASE_STORAGE_SETUP.md` for detailed deployment and testing instructions.

## Testing

The storage rules can be tested using:
1. Firebase Emulator Suite (recommended for development)
2. Manual testing in Firebase Console
3. Automated tests with `@firebase/rules-unit-testing`

See `FIREBASE_STORAGE_SETUP.md` for testing instructions.

## Requirements Satisfied

This implementation satisfies the requirements from the design document:
- ✅ File upload service with validation
- ✅ Profile picture upload (5MB max, images only)
- ✅ Resume upload (10MB max, PDF/DOCX only)
- ✅ File deletion functionality
- ✅ Download URL retrieval
- ✅ User-specific storage paths
- ✅ Firebase Storage security rules
- ✅ Proper error handling
- ✅ Type safety with TypeScript
