# Firebase Storage Setup

## Overview

Firebase Storage security rules have been configured to protect user files (profile pictures and resumes). The rules ensure that:
- Users can only access their own files
- Profile pictures must be images under 5MB
- Resumes must be PDF or DOCX files under 10MB

## Storage Rules

The storage rules are defined in `storage.rules` and include:

1. **Profile Pictures** (`users/{uid}/profile-picture/{fileName}`)
   - Read: User must be authenticated and accessing their own files
   - Write: User must be authenticated, accessing their own files, file must be an image, and under 5MB

2. **Resumes** (`users/{uid}/resume/{fileName}`)
   - Read: User must be authenticated and accessing their own files
   - Write: User must be authenticated, accessing their own files, file must be PDF or DOCX, and under 10MB

## Deployment

### Prerequisites

Install Firebase CLI globally:
```bash
npm install -g firebase-tools
```

### Deploy Storage Rules

1. Login to Firebase:
```bash
firebase login
```

2. Deploy storage rules only:
```bash
firebase deploy --only storage
```

3. Or deploy all Firebase resources:
```bash
firebase deploy
```

## Testing with Firebase Emulator

### Setup

1. Install Firebase CLI (if not already installed):
```bash
npm install -g firebase-tools
```

2. Start the Firebase Emulator Suite:
```bash
firebase emulators:start
```

This will start:
- Auth Emulator on port 9099
- Firestore Emulator on port 8080
- Storage Emulator on port 9199
- Emulator UI on port 4000

### Testing Storage Rules

1. Open the Emulator UI at http://localhost:4000

2. Navigate to the Storage tab

3. Test file uploads with different scenarios:
   - Upload a profile picture as an authenticated user
   - Try to upload a file larger than 5MB (should fail)
   - Try to upload a non-image file as profile picture (should fail)
   - Upload a resume (PDF or DOCX) as an authenticated user
   - Try to upload a file larger than 10MB (should fail)
   - Try to access another user's files (should fail)

### Automated Testing

You can also write automated tests using the Firebase Emulator and the `@firebase/rules-unit-testing` package:

```bash
npm install --save-dev @firebase/rules-unit-testing
```

Then create tests in `__tests__/storage.rules.test.ts` to verify:
- Authenticated users can upload valid files
- File size limits are enforced
- File type restrictions are enforced
- Users cannot access other users' files

## Environment Configuration

Ensure your `.env.local` file includes the Firebase Storage configuration:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## File Upload Service

The file upload service is implemented in `lib/services/fileUpload.ts` and provides:

- `uploadProfilePicture(file, uid)` - Upload profile pictures with validation
- `uploadResume(file, uid)` - Upload resumes with validation
- `deleteFile(fileId)` - Delete files from storage
- `getFileUrl(fileId)` - Get download URLs for files

All functions include proper error handling and validation.

## Verification

To verify the storage rules are deployed correctly:

1. Check the Firebase Console:
   - Go to https://console.firebase.google.com
   - Select your project
   - Navigate to Storage > Rules
   - Verify the rules match the content in `storage.rules`

2. Test in production:
   - Deploy your application
   - Try uploading a profile picture
   - Try uploading a resume
   - Verify files are stored in the correct paths
   - Verify download URLs work correctly

## Troubleshooting

### Rules not taking effect
- Ensure you've deployed the rules: `firebase deploy --only storage`
- Check the Firebase Console to verify the rules are deployed
- Clear your browser cache and try again

### Upload failures
- Check browser console for detailed error messages
- Verify file size and type meet requirements
- Ensure user is authenticated
- Check Firebase Storage quota limits

### Permission denied errors
- Verify the user is authenticated
- Check that the user is accessing their own files (UID matches)
- Verify the file path matches the rules pattern
- Check the Firebase Console for detailed error logs
