/**
 * Check User Script
 * 
 * This script checks a user's data in Firestore to verify their admin status and fields.
 * 
 * Usage:
 * npm run check-user <email>
 * 
 * Example:
 * npm run check-user user@example.com
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

/**
 * Check user data
 */
async function checkUser(email: string): Promise<void> {
  try {
    console.log('='.repeat(60));
    console.log('User Data Check');
    console.log('='.repeat(60));
    console.log();
    console.log(`Looking for user with email: ${email}`);
    console.log();

    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.error(`✗ User with email ${email} not found`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log('User Found!');
    console.log('='.repeat(60));
    console.log(`UID:                ${userId}`);
    console.log(`Email:              ${userData.email || 'N/A'}`);
    console.log(`Display Name:       ${userData.displayName || 'N/A'}`);
    console.log(`First Name:         ${userData.firstName || 'N/A'}`);
    console.log(`Last Name:          ${userData.lastName || 'N/A'}`);
    console.log();
    console.log('TTU Verification:');
    console.log(`  TTU Email:        ${userData.ttuEmail || 'N/A'}`);
    console.log(`  Verified:         ${userData.ttuEmailVerified || false}`);
    console.log(`  Onboarded:        ${userData.hasCompletedOnboarding || false}`);
    console.log();
    console.log('Admin & Events:');
    console.log(`  Is Admin:         ${userData.isAdmin !== undefined ? userData.isAdmin : 'NOT SET'}`);
    console.log(`  Points:           ${userData.points !== undefined ? userData.points : 'NOT SET'}`);
    console.log(`  Attended Events:  ${userData.attendedEvents !== undefined ? userData.attendedEvents.length : 'NOT SET'}`);
    console.log();
    console.log('Metadata:');
    console.log(`  Created At:       ${userData.createdAt?.toDate?.() || 'N/A'}`);
    console.log(`  Updated At:       ${userData.updatedAt?.toDate?.() || 'N/A'}`);
    console.log('='.repeat(60));
    console.log();

    // Check for missing fields
    const missingFields = [];
    if (userData.isAdmin === undefined) missingFields.push('isAdmin');
    if (userData.points === undefined) missingFields.push('points');
    if (userData.attendedEvents === undefined) missingFields.push('attendedEvents');

    if (missingFields.length > 0) {
      console.log('⚠️  Missing Fields:');
      missingFields.forEach(field => console.log(`  - ${field}`));
      console.log();
      console.log('Run migration to add missing fields:');
      console.log('  npm run migrate:users');
    } else {
      console.log('✓ All required fields are present!');
      
      if (userData.isAdmin) {
        console.log();
        console.log('🎉 This user is an ADMIN!');
        console.log();
        console.log('To see admin features:');
        console.log('  1. Log out of the application');
        console.log('  2. Log back in');
        console.log('  3. You should see "Admin" link in the navbar');
        console.log('  4. Navigate to /admin/events or /admin/users');
      }
    }

    console.log();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error checking user:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('Usage: npm run check-user <email>');
  console.log();
  console.log('Example:');
  console.log('  npm run check-user user@example.com');
  process.exit(1);
}

checkUser(email);
