# TTU Email Verification Service - Setup Guide

## Overview

The TTU Email Verification Service has been successfully implemented. This service handles verification of Texas Tech University email addresses during the onboarding process, including:

- Sending 6-digit verification codes via email
- Validating codes with attempt tracking
- Automatic account cleanup after failed attempts or expiration

## What Was Implemented

### 1. Resend Email Service Integration

**Package Installed:** `resend` (v2.x)

**Environment Variable Added:**
```env
RESEND_API_KEY=your_resend_api_key_here
```

**Setup Required:**
1. Sign up for a Resend account at https://resend.com
2. Get your API key from https://resend.com/api-keys
3. Configure a sender domain at https://resend.com/domains
4. Update the `from` field in `lib/services/ttuEmailVerification.ts` with your verified domain

### 2. Verification Service Functions

**File:** `lib/services/ttuEmailVerification.ts`

**Functions Implemented:**

#### `sendVerificationCode(ttuEmail: string, uid: string): Promise<void>`
- Generates a random 6-digit verification code
- Stores code in Firestore `verificationCodes` collection with 10-minute expiration
- Sends formatted HTML email with the code using Resend
- Initializes attempt counter to 0

#### `verifyCode(uid: string, code: string): Promise<boolean>`
- Validates the entered code against stored code
- Checks if code has expired
- Marks TTU email as verified in user profile on success
- Deletes verification code document after successful verification
- Returns `true` if valid, `false` if incorrect

#### `incrementAttempts(uid: string): Promise<number>`
- Increments the failed attempt counter
- Returns the updated attempt count
- Used to track failed verification attempts

#### `cleanupFailedVerification(uid: string): Promise<void>`
- Deletes user profile from Firestore
- Deletes verification code document
- Deletes Firebase Authentication account
- Called after 3 failed verification attempts

#### `setupExpirationTimer(uid: string): Promise<void>`
- Sets `verificationExpiresAt` timestamp in user profile
- Expires 10 minutes after creation
- Used for automatic cleanup of pending accounts

#### `cleanupExpiredAccounts(): Promise<number>`
- Queries for expired unverified accounts
- Deletes expired accounts and their data
- Returns count of cleaned accounts
- Should be called periodically via cron job

### 3. Cleanup API Route

**File:** `app/api/cleanup-expired-accounts/route.ts`

**Endpoints:**
- `POST /api/cleanup-expired-accounts` - Triggers cleanup of expired accounts
- `GET /api/cleanup-expired-accounts` - Same as POST (for testing)

**Usage:**
```bash
# Manual trigger
curl -X POST http://localhost:3000/api/cleanup-expired-accounts

# Or set up a cron job to call this endpoint periodically
```

**Security Note:** In production, add authentication to this endpoint (e.g., secret token in Authorization header).

## Firestore Data Structure

### verificationCodes Collection

```typescript
{
  code: string;              // 6-digit verification code
  email: string;             // TTU email address
  uid: string;               // Firebase user ID
  createdAt: Timestamp;      // When code was created
  expiresAt: Timestamp;      // When code expires (10 min)
  attempts: number;          // Number of failed attempts
}
```

**Document ID:** Firebase UID

### users Collection Updates

The following fields are added/updated during verification:

```typescript
{
  ttuEmailVerified: boolean;           // Set to true on successful verification
  verificationExpiresAt: Timestamp;    // Set when verification starts
  verificationAttempts: number;        // Tracked in verificationCodes collection
}
```

## Email Template

The verification email includes:
- Professional HTML formatting
- Large, centered 6-digit code
- 10-minute expiration notice
- 3-attempt limit warning
- MLH TTU branding

**Customization:** Update the email template in `sendVerificationCode()` function to match your branding.

## Integration with Onboarding Flow

### Typical Flow:

1. User completes Google authentication
2. User enters TTU email in onboarding form
3. Call `sendVerificationCode(ttuEmail, uid)` to send code
4. Call `setupExpirationTimer(uid)` to set expiration
5. User enters code in verification step
6. Call `verifyCode(uid, code)` to validate
7. If incorrect:
   - Call `incrementAttempts(uid)` to track failure
   - Check if attempts >= 3
   - If yes, call `cleanupFailedVerification(uid)`
8. If correct:
   - User profile is automatically marked as verified
   - Continue with onboarding completion

### Example Usage:

```typescript
// Step 1: Send verification code
try {
  await sendVerificationCode(ttuEmail, user.uid);
  await setupExpirationTimer(user.uid);
  // Show verification code input to user
} catch (error) {
  // Handle error (show message to user)
}

// Step 2: Verify code
try {
  const isValid = await verifyCode(user.uid, enteredCode);
  
  if (isValid) {
    // Code is correct, proceed with onboarding
  } else {
    // Code is incorrect
    const attempts = await incrementAttempts(user.uid);
    
    if (attempts >= 3) {
      // Max attempts reached, cleanup account
      await cleanupFailedVerification(user.uid);
      // Show message: "Account removed, please sign up again"
    } else {
      // Show message: "Incorrect code, X attempts remaining"
    }
  }
} catch (error) {
  // Handle error (expired code, etc.)
}
```

## Testing

### Manual Testing:

1. **Test Code Generation:**
   ```typescript
   await sendVerificationCode('test@ttu.edu', 'test-uid');
   // Check email inbox for code
   ```

2. **Test Code Verification:**
   ```typescript
   const isValid = await verifyCode('test-uid', '123456');
   console.log('Valid:', isValid);
   ```

3. **Test Attempt Tracking:**
   ```typescript
   const attempts = await incrementAttempts('test-uid');
   console.log('Attempts:', attempts);
   ```

4. **Test Cleanup:**
   ```typescript
   await cleanupFailedVerification('test-uid');
   // Verify account is deleted from Firebase Auth and Firestore
   ```

5. **Test Expired Cleanup:**
   ```bash
   curl -X POST http://localhost:3000/api/cleanup-expired-accounts
   ```

### Automated Testing:

Unit tests and property-based tests are marked as optional in the task list. If you want to implement them, create test files in:
- `lib/services/__tests__/ttuEmailVerification.test.ts`

## Security Considerations

1. **Email Sending:** Resend API key should be kept secret (server-side only)
2. **Rate Limiting:** Consider adding rate limiting to prevent abuse
3. **Cleanup Endpoint:** Add authentication in production
4. **Code Generation:** Uses cryptographically secure random numbers
5. **Expiration:** 10-minute expiration prevents code reuse
6. **Attempt Limiting:** 3-attempt limit prevents brute force

## Next Steps

1. **Configure Resend:**
   - Sign up and get API key
   - Add verified sender domain
   - Update email template with your domain

2. **Implement Onboarding UI:**
   - Create TTU email input step (Task 9.5)
   - Create verification code input step (Task 9.6)
   - Integrate verification service calls

3. **Set Up Cron Job:**
   - Configure periodic cleanup of expired accounts
   - Options: Vercel Cron, GitHub Actions, external service

4. **Update Firestore Indexes:**
   - Create index on `verificationExpiresAt` for cleanup queries
   - Create unique index on `ttuEmail` for duplicate prevention

5. **Test End-to-End:**
   - Complete onboarding flow with real email
   - Test all error scenarios
   - Verify cleanup works correctly

## Troubleshooting

### Email Not Sending:
- Check RESEND_API_KEY is set correctly
- Verify sender domain is configured in Resend
- Check Resend dashboard for error logs

### Code Verification Failing:
- Check Firestore rules allow server-side access
- Verify verificationCodes collection exists
- Check code hasn't expired (10 minutes)

### Cleanup Not Working:
- Verify Firestore indexes are created
- Check Firebase Admin permissions
- Review API route logs for errors

## Documentation References

- Resend API: https://resend.com/docs
- Firebase Admin SDK: https://firebase.google.com/docs/admin/setup
- Firestore Queries: https://firebase.google.com/docs/firestore/query-data/queries
