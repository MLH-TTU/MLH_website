# Firebase Security Rules Deployment

This document explains how to deploy Firestore and Storage security rules to your Firebase project.

## Prerequisites

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init
   ```
   - Select "Firestore" and "Storage"
   - Choose your existing Firebase project
   - Accept default file names (firestore.rules and storage.rules)

## Security Rules Files

- **firestore.rules** - Firestore database security rules
- **storage.rules** - Firebase Storage security rules

## Deploying Rules

### Deploy All Rules

```bash
firebase deploy --only firestore:rules,storage:rules
```

### Deploy Firestore Rules Only

```bash
firebase deploy --only firestore:rules
```

### Deploy Storage Rules Only

```bash
firebase deploy --only storage:rules
```

## Testing Rules with Firebase Emulator

Before deploying to production, test your rules locally using the Firebase Emulator Suite:

1. Start the emulator:
   ```bash
   firebase emulators:start
   ```

2. The emulator will run on:
   - Firestore: http://localhost:8080
   - Storage: http://localhost:9199
   - Emulator UI: http://localhost:4000

3. Run your tests against the emulator to verify rules work correctly.

## Firestore Security Rules Overview

### Users Collection (`/users/{uid}`)

- **Read**: Users can only read their own profile
- **Create**: Users can create their own profile (uid must match auth uid)
- **Update**: Users can update their own profile (cannot modify uid or email)
- **Delete**: Not allowed from client (only server-side Admin SDK)

### Verification Codes Collection (`/verificationCodes/{uid}`)

- **All operations**: Not allowed from client (only server-side Admin SDK)

## Storage Security Rules Overview

### Profile Pictures (`/users/{uid}/profile-picture/{fileName}`)

- **Read**: Users can read their own profile picture
- **Write**: Users can upload their own profile picture
  - Must be an image file
  - Maximum size: 5MB

### Resumes (`/users/{uid}/resume/{fileName}`)

- **Read**: Users can read their own resume
- **Write**: Users can upload their own resume
  - Must be PDF or DOCX format
  - Maximum size: 10MB

## Verifying Deployment

After deployment, verify the rules are active:

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Navigate to Firestore Database > Rules
4. Navigate to Storage > Rules
5. Verify the rules match your local files

## Troubleshooting

### Rules Not Taking Effect

- Wait a few minutes after deployment for rules to propagate
- Clear your browser cache
- Check Firebase Console for any syntax errors

### Permission Denied Errors

- Verify user is authenticated
- Check that uid in request matches authenticated user
- Verify file types and sizes meet requirements
- Check Firebase Console logs for detailed error messages

## Important Notes

- Always test rules in the emulator before deploying to production
- Rules are evaluated on every read/write operation
- Rules cannot access external APIs or databases
- Keep rules simple and efficient for better performance
