# TTU Email Verification Flow Changes

## Overview

Updated the verification flow to enforce immediate completion - users must verify their TTU email in one session or their account will be deleted.

## Changes Made

### 1. Removed Expiration Timer Logic

**Removed:**
- `setupExpirationTimer()` function
- `cleanupExpiredAccounts()` function
- Time-based account cleanup
- `verificationExpiresAt` field tracking

**Reason:** No longer needed since accounts are deleted immediately when users leave onboarding.

### 2. Added Immediate Cleanup on Exit

**New API Route:** `app/api/cleanup-incomplete/route.ts`
- Checks if user has completed onboarding
- Deletes Firebase account if onboarding is incomplete
- Called when user leaves onboarding page

**New Helper Function:** `hasCompletedOnboarding(uid)`
- Checks if user has both `hasCompletedOnboarding` and `ttuEmailVerified` set to true
- Used to determine if account should be cleaned up

### 3. Updated Onboarding Page

**Added Cleanup Triggers:**
- `beforeunload` event - Warns user before closing tab/window
- `visibilitychange` event - Cleanup when user switches tabs
- Component unmount - Cleanup when navigating away
- Uses `keepalive: true` to ensure cleanup completes even if page is closing

**Added State Tracking:**
- `onboardingComplete` state - Prevents cleanup after successful verification
- Set to `true` only after profile is fully updated

**User Experience:**
- Browser warns: "If you leave now, your account will be deleted and you'll need to start over"
- Account is deleted if they proceed to leave
- No "Complete Setup" button on landing page for incomplete users

### 4. Updated Landing Page

**Removed:**
- "Complete Setup" button for users with incomplete onboarding
- Users can no longer return to onboarding after leaving

**New Behavior:**
- Completed users see "Profile" button
- Incomplete users see "Completing setup..." (but can't actually complete it)
- Forces users to start fresh if they leave onboarding

### 5. Simplified Verification Service

**Updated:** `lib/services/ttuEmailVerification.ts`
- Removed expiration timer setup
- Removed periodic cleanup function
- Kept core verification functions:
  - `sendVerificationCode()`
  - `verifyCode()`
  - `incrementAttempts()`
  - `cleanupFailedVerification()`
  - `hasCompletedOnboarding()` (new)

**Updated:** `app/api/verification/send-code/route.ts`
- Removed call to `setupExpirationTimer()`
- Simplified to just send verification code

## User Flow

### Happy Path:
1. User signs in with Google
2. Redirected to onboarding
3. Fills out profile info
4. Enters TTU email
5. Receives verification code
6. Enters correct code
7. Profile saved, account complete ✅

### Unhappy Paths:

**User Leaves Before Verification:**
1. User signs in with Google
2. Starts onboarding
3. Closes tab/navigates away
4. Browser warns about losing account
5. Account deleted immediately ❌
6. Must sign in again and start over

**User Fails Verification (3 attempts):**
1. User enters wrong code 3 times
2. Account deleted immediately ❌
3. Redirected to login with error message
4. Must sign in again and start over

**User Switches Tabs:**
1. User is in onboarding
2. Switches to another tab
3. Account deleted in background ❌
4. Must sign in again and start over

## Benefits

1. **Cleaner Database:** No orphaned incomplete accounts
2. **Simpler Logic:** No time-based cleanup needed
3. **Clear UX:** Users know they must complete in one session
4. **Security:** Prevents account squatting
5. **Efficiency:** Immediate cleanup vs. periodic batch cleanup

## Trade-offs

1. **Less Forgiving:** Users can't take breaks during onboarding
2. **More Aggressive:** Switching tabs deletes account
3. **Potential Frustration:** Users might lose progress if distracted

## Recommendations

### For Production:
1. **Add Progress Saving:** Consider allowing users to save partial progress
2. **Adjust Tab Switch Behavior:** Maybe only cleanup on actual navigation, not tab switches
3. **Add Warning Modal:** Show a modal before cleanup with countdown
4. **Email Reminder:** Send email with link to complete setup (but still require fresh start)

### For Testing:
1. Test with slow internet connections
2. Test with email delays
3. Test browser back button behavior
4. Test mobile browser behavior (backgrounding app)

## Environment Variables

No changes to environment variables needed. Still requires:
- `RESEND_API_KEY` - For sending verification emails
- Firebase credentials - For authentication and Firestore

## Database Schema

No changes to Firestore schema needed. The `verificationExpiresAt` field is no longer used but can remain in existing documents (will be ignored).

## Migration Notes

If deploying to production with existing incomplete accounts:
1. Run a one-time cleanup of incomplete accounts
2. Or let them naturally expire (if old logic is still running)
3. New accounts will use the immediate cleanup logic
