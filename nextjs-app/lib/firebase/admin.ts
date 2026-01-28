import 'server-only';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

// Firebase Admin configuration interface
interface FirebaseAdminConfig {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

// Validate required environment variables for Admin SDK
function validateAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  const missingVars: string[] = [];

  if (!projectId) missingVars.push('FIREBASE_PROJECT_ID');
  if (!clientEmail) missingVars.push('FIREBASE_CLIENT_EMAIL');
  if (!privateKey) missingVars.push('FIREBASE_PRIVATE_KEY');

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missingVars.join(', ')}. ` +
      'Please check your .env.local file and ensure all Firebase Admin credentials are set. ' +
      'You can obtain these from your Firebase project settings > Service accounts.'
    );
  }

  // Replace escaped newlines in private key
  const formattedPrivateKey = privateKey!.replace(/\\n/g, '\n');

  return {
    projectId: projectId!,
    clientEmail: clientEmail!,
    privateKey: formattedPrivateKey,
  };
}

// Initialize Firebase Admin app
let adminApp: App;
let adminAuth: Auth;
let adminFirestore: Firestore;

try {
  const config = validateAdminConfig();

  // Check if Firebase Admin app is already initialized
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
    });
  } else {
    adminApp = getApps()[0];
  }

  // Initialize Firebase Admin services
  adminAuth = getAuth(adminApp);
  adminFirestore = getFirestore(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

// Export Firebase Admin services
export { adminApp, adminAuth, adminFirestore };

// Export getter functions for use in server components and API routes
export const getAdminAuth = () => adminAuth;
export const getAdminFirestore = () => adminFirestore;
