# Firebase Setup Guide

This guide walks you through setting up Firebase for the MLH TTU Next.js application.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `mlh-ttu-chapter` (or your preferred name)
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Enable Google Authentication

1. In Firebase Console, navigate to **Authentication** from the left sidebar
2. Click "Get started" if this is your first time
3. Go to the **Sign-in method** tab
4. Click on **Google** in the providers list
5. Toggle the **Enable** switch
6. Set a project support email (required)
7. Click **Save**

### Add Authorized Domains

1. In the **Sign-in method** tab, scroll down to **Authorized domains**
2. `localhost` should already be there for development
3. Add your production domain when deploying (e.g., `mlh-ttu.vercel.app`)

## Step 3: Create Firestore Database

1. In Firebase Console, navigate to **Firestore Database** from the left sidebar
2. Click "Create database"
3. Select **Start in production mode** (we'll add security rules later)
4. Choose a location for your database:
   - For US-based users: `us-central1` or `us-east1`
   - Choose the location closest to your users
5. Click **Enable**

## Step 4: Enable Firebase Storage

1. In Firebase Console, navigate to **Storage** from the left sidebar
2. Click "Get started"
3. Review the security rules (we'll customize them later)
4. Click **Next**
5. Choose the same location as your Firestore database
6. Click **Done**

## Step 5: Get Firebase Web App Configuration

1. In Firebase Console, go to **Project Settings** (gear icon in left sidebar)
2. Scroll down to "Your apps" section
3. Click the **Web** icon (`</>`) to add a web app
4. Register app:
   - App nickname: `MLH TTU Web App`
   - (Optional) Check "Also set up Firebase Hosting"
   - Click **Register app**
5. Copy the configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Click **Continue to console**

## Step 6: Get Firebase Admin SDK Credentials

1. In Firebase Console, go to **Project Settings** > **Service accounts** tab
2. Click **Generate new private key**
3. A dialog will appear warning you to keep the key secure
4. Click **Generate key**
5. A JSON file will download - **KEEP THIS SECURE!**
6. The JSON file contains:
   - `project_id`
   - `client_email`
   - `private_key`

## Step 7: Configure Environment Variables

1. In your `nextjs-app` directory, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Open `.env.local` and fill in the values:

### From Firebase Web App Config (Step 5):
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### From Service Account JSON (Step 6):
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour_Private_Key_Here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes
- Keep the `\n` characters in the private key
- Never commit `.env.local` to version control
- Never share your service account JSON file

### For next-firebase-auth-edge:
```env
FIREBASE_API_KEY=your_api_key_here
```

## Step 8: Verify Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Try building the project:
   ```bash
   npm run build
   ```

3. If successful, start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

## Step 9: Set Up Firestore Security Rules (Later)

After implementing authentication, you'll need to update Firestore security rules. This will be done in a later task.

## Step 10: Set Up Storage Security Rules (Later)

After implementing file uploads, you'll need to update Storage security rules. This will be done in a later task.

## Troubleshooting

### Error: Missing Firebase environment variables

**Problem:** You see an error about missing environment variables when starting the app.

**Solution:**
1. Make sure `.env.local` exists in the `nextjs-app` directory
2. Verify all required variables are set
3. Restart the development server after adding variables

### Error: Firebase initialization failed

**Problem:** Firebase fails to initialize with authentication errors.

**Solution:**
1. Verify your API key is correct
2. Check that Google authentication is enabled in Firebase Console
3. Ensure authorized domains include `localhost`

### Error: Private key format invalid

**Problem:** Firebase Admin SDK fails to initialize.

**Solution:**
1. Make sure the private key is wrapped in double quotes in `.env.local`
2. Verify the `\n` characters are preserved
3. Don't remove the BEGIN/END PRIVATE KEY lines

### Error: Permission denied on Firestore

**Problem:** Can't read/write to Firestore.

**Solution:**
1. Check that Firestore is created and enabled
2. Verify security rules allow the operation
3. For development, you can temporarily use test mode rules (not recommended for production)

## Security Checklist

- [ ] `.env.local` is in `.gitignore`
- [ ] Service account JSON file is stored securely (not in project directory)
- [ ] Firebase Admin credentials are only used server-side
- [ ] Authorized domains are configured correctly
- [ ] Firestore security rules will be implemented before production
- [ ] Storage security rules will be implemented before production

## Next Steps

After completing this setup:
1. Implement Authentication Context (Task 2.1)
2. Create login page with Google SSO (Task 2.2)
3. Set up Next.js middleware for route protection (Task 4)
4. Implement user profile service (Task 5)

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Next.js Documentation](https://nextjs.org/docs)
- [next-firebase-auth-edge](https://next-firebase-auth-edge.vercel.app/)
