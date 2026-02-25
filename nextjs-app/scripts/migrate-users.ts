/**
 * Migration Script: Add Admin and Event Management Fields to Existing Users
 * 
 * This script updates all existing user documents in Firestore to include:
 * - isAdmin: boolean (default: false)
 * - points: number (default: 0)
 * - attendedEvents: array (default: [])
 * 
 * Run this script once to migrate existing users:
 * npm run migrate:users
 */

import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

interface MigrationStats {
  total: number;
  updated: number;
  skipped: number;
  errors: number;
}

/**
 * Check if user document needs migration
 */
function needsMigration(userData: any): boolean {
  return (
    userData.isAdmin === undefined ||
    userData.points === undefined ||
    userData.attendedEvents === undefined
  );
}

/**
 * Migrate a single user document
 */
async function migrateUser(
  userId: string,
  userData: any,
  stats: MigrationStats
): Promise<void> {
  try {
    // Check if migration is needed
    if (!needsMigration(userData)) {
      console.log(`✓ User ${userId} already has all required fields, skipping...`);
      stats.skipped++;
      return;
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: admin.firestore.Timestamp.now(),
    };

    // Add missing fields with defaults
    if (userData.isAdmin === undefined) {
      updateData.isAdmin = false;
      console.log(`  - Adding isAdmin: false`);
    }

    if (userData.points === undefined) {
      updateData.points = 0;
      console.log(`  - Adding points: 0`);
    }

    if (userData.attendedEvents === undefined) {
      updateData.attendedEvents = [];
      console.log(`  - Adding attendedEvents: []`);
    }

    // Update the user document
    await db.collection('users').doc(userId).update(updateData);
    
    console.log(`✓ Successfully migrated user ${userId}`);
    stats.updated++;
  } catch (error) {
    console.error(`✗ Error migrating user ${userId}:`, error);
    stats.errors++;
  }
}

/**
 * Main migration function
 */
async function migrateAllUsers(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Starting User Migration');
  console.log('='.repeat(60));
  console.log();

  const stats: MigrationStats = {
    total: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all users
    console.log('Fetching all users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    stats.total = usersSnapshot.size;

    console.log(`Found ${stats.total} users to process`);
    console.log();

    // Process each user
    for (const doc of usersSnapshot.docs) {
      const userId = doc.id;
      const userData = doc.data();
      
      console.log(`Processing user: ${userId} (${userData.email || 'no email'})`);
      await migrateUser(userId, userData, stats);
      console.log();
    }

    // Print summary
    console.log('='.repeat(60));
    console.log('Migration Complete');
    console.log('='.repeat(60));
    console.log(`Total users:    ${stats.total}`);
    console.log(`Updated:        ${stats.updated}`);
    console.log(`Skipped:        ${stats.skipped}`);
    console.log(`Errors:         ${stats.errors}`);
    console.log('='.repeat(60));

    if (stats.errors > 0) {
      console.log();
      console.log('⚠️  Some users failed to migrate. Check the errors above.');
      process.exit(1);
    } else {
      console.log();
      console.log('✓ All users migrated successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Fatal error during migration:', error);
    process.exit(1);
  }
}

// Run migration
migrateAllUsers();
