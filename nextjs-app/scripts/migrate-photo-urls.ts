/**
 * Migration Script: Add photoURL to existing user profiles
 * 
 * This script updates all existing user documents in Firestore to include
 * the photoURL field from Firebase Auth.
 * 
 * Run with: npx tsx scripts/migrate-photo-urls.ts
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Initialize Firebase Admin
if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID!,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const db = getFirestore();
const auth = getAuth();

async function migratePhotoURLs() {
  console.log('Starting photoURL migration...\n');

  try {
    // Get all users from Firestore
    const usersSnapshot = await db.collection('users').get();
    console.log(`Found ${usersSnapshot.size} users in Firestore\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const userData = userDoc.data();

      try {
        // Check if photoURL already exists
        if (userData.photoURL) {
          console.log(`✓ User ${userId} already has photoURL, skipping`);
          skipped++;
          continue;
        }

        // Get user from Firebase Auth
        const authUser = await auth.getUser(userId);

        if (authUser.photoURL) {
          // Update Firestore with photoURL
          await db.collection('users').doc(userId).update({
            photoURL: authUser.photoURL,
            updatedAt: new Date(),
          });

          console.log(`✓ Updated user ${userId} with photoURL: ${authUser.photoURL}`);
          updated++;
        } else {
          console.log(`- User ${userId} has no photoURL in Auth, skipping`);
          skipped++;
        }
      } catch (error: any) {
        console.error(`✗ Error processing user ${userId}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Migration Complete ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${usersSnapshot.size}`);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migratePhotoURLs()
  .then(() => {
    console.log('\nMigration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });
