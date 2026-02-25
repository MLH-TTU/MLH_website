/**
 * Make Admin Script
 * 
 * This script promotes a user to admin by setting their isAdmin flag to true.
 * 
 * Usage:
 * npm run make-admin <email>
 * 
 * Example:
 * npm run make-admin user@example.com
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
 * Make a user an admin
 */
async function makeAdmin(email: string): Promise<void> {
  try {
    console.log('='.repeat(60));
    console.log('Make User Admin');
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
      console.log();
      console.log('Make sure the email is correct and the user has an account.');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userData = userDoc.data();

    console.log(`Found user: ${userId}`);
    console.log(`Display Name: ${userData.displayName || 'N/A'}`);
    console.log(`Current Admin Status: ${userData.isAdmin || false}`);
    console.log();

    // Check if already admin
    if (userData.isAdmin === true) {
      console.log('✓ User is already an admin. No changes needed.');
      process.exit(0);
    }

    // Update user to admin
    console.log('Updating user to admin...');
    await db.collection('users').doc(userId).update({
      isAdmin: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log();
    console.log('='.repeat(60));
    console.log(`✓ Successfully made ${email} an admin!`);
    console.log('='.repeat(60));
    console.log();
    console.log('Next steps:');
    console.log('1. Have the user log out of the application');
    console.log('2. Have the user log back in to refresh their session');
    console.log('3. The user should now see admin navigation and features');
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('✗ Error making user admin:', error);
    process.exit(1);
  }
}

/**
 * Remove admin privileges from a user
 */
async function removeAdmin(email: string): Promise<void> {
  try {
    console.log('='.repeat(60));
    console.log('Remove Admin Privileges');
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

    console.log(`Found user: ${userId}`);
    console.log(`Display Name: ${userData.displayName || 'N/A'}`);
    console.log(`Current Admin Status: ${userData.isAdmin || false}`);
    console.log();

    // Check if not admin
    if (userData.isAdmin !== true) {
      console.log('✓ User is not an admin. No changes needed.');
      process.exit(0);
    }

    // Update user to remove admin
    console.log('Removing admin privileges...');
    await db.collection('users').doc(userId).update({
      isAdmin: false,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log();
    console.log('='.repeat(60));
    console.log(`✓ Successfully removed admin privileges from ${email}`);
    console.log('='.repeat(60));
    console.log();

    process.exit(0);
  } catch (error) {
    console.error('✗ Error removing admin privileges:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const email = args[1];

// Show usage if no arguments
if (!command || !email) {
  console.log('Usage:');
  console.log('  Make user admin:    npm run make-admin add <email>');
  console.log('  Remove admin:       npm run make-admin remove <email>');
  console.log();
  console.log('Examples:');
  console.log('  npm run make-admin add user@example.com');
  console.log('  npm run make-admin remove user@example.com');
  process.exit(1);
}

// Execute command
if (command === 'add') {
  makeAdmin(email);
} else if (command === 'remove') {
  removeAdmin(email);
} else {
  console.error(`Unknown command: ${command}`);
  console.log('Valid commands: add, remove');
  process.exit(1);
}
