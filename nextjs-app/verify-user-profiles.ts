/**
 * Verification script for user profile creation and storage
 * This script tests the core user profile functionality
 */

import { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile,
  checkTTUEmailExists,
  deleteUserProfile,
  UserProfile 
} from './lib/services/userProfile.server';

// ANSI color codes for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verifyUserProfileCreation() {
  log('\n=== Testing User Profile Creation ===', 'blue');
  
  const testUid = `test-user-${Date.now()}`;
  const testData = {
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    provider: 'google',
  };

  try {
    // Test 1: Create user profile
    log('\n1. Creating user profile...', 'yellow');
    await createUserProfile(testUid, testData);
    log('✓ User profile created successfully', 'green');

    // Test 2: Retrieve user profile
    log('\n2. Retrieving user profile...', 'yellow');
    const profile = await getUserProfile(testUid);
    
    if (!profile) {
      throw new Error('Profile not found after creation');
    }
    
    log('✓ User profile retrieved successfully', 'green');
    
    // Test 3: Verify profile data
    log('\n3. Verifying profile data...', 'yellow');
    if (profile.uid !== testUid) {
      throw new Error(`UID mismatch: expected ${testUid}, got ${profile.uid}`);
    }
    if (profile.email !== testData.email) {
      throw new Error(`Email mismatch: expected ${testData.email}, got ${profile.email}`);
    }
    if (profile.displayName !== testData.displayName) {
      throw new Error(`Display name mismatch: expected ${testData.displayName}, got ${profile.displayName}`);
    }
    if (profile.hasCompletedOnboarding !== false) {
      throw new Error(`hasCompletedOnboarding should be false, got ${profile.hasCompletedOnboarding}`);
    }
    log('✓ Profile data verified correctly', 'green');

    // Test 4: Update user profile
    log('\n4. Updating user profile...', 'yellow');
    await updateUserProfile(testUid, {
      firstName: 'John',
      lastName: 'Doe',
      hasCompletedOnboarding: true,
    });
    log('✓ User profile updated successfully', 'green');

    // Test 5: Verify updated data
    log('\n5. Verifying updated data...', 'yellow');
    const updatedProfile = await getUserProfile(testUid);
    if (!updatedProfile) {
      throw new Error('Profile not found after update');
    }
    if (updatedProfile.firstName !== 'John') {
      throw new Error(`First name not updated: expected John, got ${updatedProfile.firstName}`);
    }
    if (updatedProfile.hasCompletedOnboarding !== true) {
      throw new Error(`hasCompletedOnboarding not updated: expected true, got ${updatedProfile.hasCompletedOnboarding}`);
    }
    log('✓ Updated data verified correctly', 'green');

    // Test 6: Clean up
    log('\n6. Cleaning up test data...', 'yellow');
    await deleteUserProfile(testUid);
    log('✓ Test data cleaned up successfully', 'green');

    // Test 7: Verify deletion
    log('\n7. Verifying deletion...', 'yellow');
    const deletedProfile = await getUserProfile(testUid);
    if (deletedProfile !== null) {
      throw new Error('Profile still exists after deletion');
    }
    log('✓ Profile deleted successfully', 'green');

    return true;
  } catch (error: any) {
    log(`✗ Error: ${error.message}`, 'red');
    
    // Clean up on error
    try {
      await deleteUserProfile(testUid);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return false;
  }
}

async function verifyTTUEmailCheck() {
  log('\n=== Testing TTU Email Duplicate Check ===', 'blue');
  
  const testUid = `test-user-ttu-${Date.now()}`;
  const testTTUEmail = `test${Date.now()}@ttu.edu`;

  try {
    // Test 1: Check non-existent TTU email
    log('\n1. Checking non-existent TTU email...', 'yellow');
    const exists1 = await checkTTUEmailExists(testTTUEmail);
    if (exists1) {
      throw new Error('TTU email should not exist yet');
    }
    log('✓ Non-existent TTU email check passed', 'green');

    // Test 2: Create profile with TTU email
    log('\n2. Creating profile with TTU email...', 'yellow');
    await createUserProfile(testUid, {
      email: 'test@example.com',
      displayName: 'Test User',
      photoURL: null,
      ttuEmail: testTTUEmail,
    });
    log('✓ Profile with TTU email created', 'green');

    // Test 3: Check existing TTU email
    log('\n3. Checking existing TTU email...', 'yellow');
    const exists2 = await checkTTUEmailExists(testTTUEmail);
    if (!exists2) {
      throw new Error('TTU email should exist now');
    }
    log('✓ Existing TTU email check passed', 'green');

    // Test 4: Clean up
    log('\n4. Cleaning up test data...', 'yellow');
    await deleteUserProfile(testUid);
    log('✓ Test data cleaned up successfully', 'green');

    return true;
  } catch (error: any) {
    log(`✗ Error: ${error.message}`, 'red');
    
    // Clean up on error
    try {
      await deleteUserProfile(testUid);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  User Profile Verification Script                     ║', 'blue');
  log('║  Testing user profile creation and storage            ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const results = {
    profileCreation: false,
    ttuEmailCheck: false,
  };

  // Run verification tests
  results.profileCreation = await verifyUserProfileCreation();
  results.ttuEmailCheck = await verifyTTUEmailCheck();

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  Verification Summary                                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');
  
  log(`\nUser Profile Creation: ${results.profileCreation ? '✓ PASSED' : '✗ FAILED'}`, 
    results.profileCreation ? 'green' : 'red');
  log(`TTU Email Check: ${results.ttuEmailCheck ? '✓ PASSED' : '✗ FAILED'}`, 
    results.ttuEmailCheck ? 'green' : 'red');

  const allPassed = results.profileCreation && results.ttuEmailCheck;
  
  if (allPassed) {
    log('\n✓ All verification tests passed!', 'green');
    log('User profiles are being created and stored correctly.', 'green');
  } else {
    log('\n✗ Some verification tests failed.', 'red');
    log('Please review the errors above and fix any issues.', 'red');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the verification
main().catch((error) => {
  log(`\nFatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
