# Email Verification Improvements

## Overview
This document outlines the improvements made to the email verification system for better UX and security.

## Changes Implemented

### 1. Custom Domain Email Sender
- **Old**: `onboarding@resend.dev`
- **New**: `noreply@mlhttu.org`
- **Benefit**: Professional branding and better email deliverability

### 2. Rate Limiting Instead of Account Deletion
- **Old Behavior**: After 3 failed verification attempts, the user's account was permanently deleted
- **New Behavior**: After 3 failed attempts, user is rate-limited for 5 minutes
- **Benefits**:
  - More forgiving UX
  - Users don't lose their account due to typos
  - Still prevents brute force attacks

### 3. Auto-populate Name from Google SSO
- **Feature**: First and last name fields are automatically populated from Google account
- **Implementation**: Uses `displayName` from Google OAuth
- **Benefit**: Reduces friction during onboarding

## Technical Details

### Rate Limiting Implementation
```typescript
// After 3 failed attempts:
- Set `rateLimitedUntil` timestamp (5 minutes from now)
- Reset attempts counter to 0
- Return 429 status code with appropriate message
```

### Email Configuration
```typescript
from: 'MLH TTU <noreply@mlhttu.org>'
to: ttuEmail // Must end with @ttu.edu
```

### Auto-population Logic
```typescript
// Splits displayName on spaces
// First part = firstName
// Remaining parts = lastName (handles middle names)
```

## Environment Variables Required

### Resend Configuration
```env
RESEND_API_KEY=your_resend_api_key
```

### DNS Records (Cloudflare)
For `noreply@mlhttu.org` to work, ensure these DNS records are configured in Cloudflare:
- SPF record
- DKIM record
- DMARC record
- MX records (if needed)

## User Flow

### Verification Process
1. User enters TTU email (@ttu.edu)
2. System sends 6-digit code to email
3. User has 3 attempts to enter correct code
4. If 3 attempts fail:
   - User is rate-limited for 5 minutes
   - Attempts counter resets
   - User can try again after cooldown
5. Code expires after 10 minutes

### Error Messages
- **Invalid code**: "Invalid verification code. Please try again." (Shows remaining attempts)
- **Rate limited**: "Too many failed attempts. Please wait 5 minutes before trying again."
- **Expired code**: "Verification code has expired. Please request a new code."

## Testing Checklist

- [ ] Verify email sends from `noreply@mlhttu.org`
- [ ] Test rate limiting after 3 failed attempts
- [ ] Confirm 5-minute cooldown works
- [ ] Test auto-population of first/last name from Google
- [ ] Verify email only accepts @ttu.edu addresses
- [ ] Test code expiration (10 minutes)
- [ ] Verify attempts counter resets after rate limit

## Future Improvements

1. **Email Templates**: Create branded HTML email templates
2. **Resend Code**: Add "Resend Code" button with cooldown
3. **SMS Verification**: Add SMS as alternative verification method
4. **Admin Dashboard**: View verification attempts and rate limits
5. **Analytics**: Track verification success rates

## Related Files

- `lib/services/ttuEmailVerification.ts` - Core verification logic
- `app/api/verification/verify-code/route.ts` - Verification endpoint
- `app/api/verification/send-code/route.ts` - Send code endpoint
- `components/onboarding/ProfileInfoStep.tsx` - Auto-population logic
- `app/onboarding/page.tsx` - Onboarding flow

## Notes

- Rate limiting is stored in Firestore `verificationCodes` collection
- `rateLimitedUntil` field contains the timestamp when rate limit expires
- Old `cleanupFailedVerification` function is kept for potential future use
- Email validation ensures only @ttu.edu addresses are accepted
