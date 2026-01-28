# MLH TTU Next.js Application

This is the Next.js 14 application for the MLH TTU Chapter, featuring Firebase Authentication with Google SSO.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Google OAuth configured in Firebase Console

### Firebase Setup

1. **Create a Firebase Project**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or select an existing one
   - Enable Google Analytics (optional)

2. **Enable Google Authentication**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Google as a sign-in provider
   - Add authorized domains (localhost for development)

3. **Create Firestore Database**
   - In Firebase Console, go to Firestore Database
   - Click "Create database"
   - Start in production mode (we'll add security rules later)
   - Choose a location for your database

4. **Get Firebase Configuration**
   - In Firebase Console, go to Project Settings
   - Under "Your apps", click the web icon (</>)
   - Register your app and copy the configuration values

5. **Get Firebase Admin Credentials**
   - In Firebase Console, go to Project Settings > Service accounts
   - Click "Generate new private key"
   - Save the JSON file securely (DO NOT commit to git)

### Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase credentials in `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_*` values from Firebase web app configuration
   - `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` from service account JSON

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Build

```bash
npm run build
npm start
```

## Project Structure

```
nextjs-app/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── lib/                   # Utility libraries
│   └── firebase/          # Firebase configuration
│       ├── config.ts      # Client SDK configuration
│       └── admin.ts       # Admin SDK configuration
├── components/            # React components (to be added)
├── contexts/              # React contexts (to be added)
└── middleware.ts          # Next.js middleware (to be added)
```

## Firebase Configuration Files

### Client Configuration (`lib/firebase/config.ts`)
- Initializes Firebase client SDK
- Exports Auth, Firestore, and Storage instances
- Validates environment variables
- Used in client-side components

### Admin Configuration (`lib/firebase/admin.ts`)
- Initializes Firebase Admin SDK
- Exports Admin Auth and Firestore instances
- Used in server-side code (API routes, middleware)
- Requires service account credentials

## Next Steps

1. Implement Authentication Context
2. Create login page with Google SSO
3. Set up Next.js middleware for route protection
4. Implement user profile service
5. Create onboarding flow

## Security Notes

- Never commit `.env.local` or service account JSON files
- Keep Firebase Admin credentials secure
- Use environment variables for all sensitive data
- Implement proper Firestore security rules before production
