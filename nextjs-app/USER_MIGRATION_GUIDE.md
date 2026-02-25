# User Migration Guide

## Overview

This guide explains how to migrate existing users to include the new admin and event management fields, and how to manage admin roles.

## Migration Script

The migration script (`scripts/migrate-users.ts`) adds the following fields to all existing user documents:

- `isAdmin`: boolean (default: false)
- `points`: number (default: 0)
- `attendedEvents`: array (default: [])

### Running the Migration

To migrate all existing users, run:

```bash
npm run migrate:users
```

The script will:
1. Fetch all users from Firestore
2. Check which users need migration
3. Add missing fields with default values
4. Update the `updatedAt` timestamp
5. Print a summary of the migration

### Migration Output

```
============================================================
Starting User Migration
============================================================

Fetching all users from Firestore...
Found 4 users to process

Processing user: abc123... (user@example.com)
  - Adding isAdmin: false
  - Adding points: 0
  - Adding attendedEvents: []
✓ Successfully migrated user abc123...

============================================================
Migration Complete
============================================================
Total users:    4
Updated:        4
Skipped:        0
Errors:         0
============================================================

✓ All users migrated successfully!
```

### Safe to Run Multiple Times

The migration script is idempotent - it's safe to run multiple times. It will:
- Skip users that already have all required fields
- Only update users that are missing fields
- Never overwrite existing values

## Making a User an Admin

Admin privileges must be granted manually through direct Firestore access for security reasons. The application interface does not allow role modification.

### Option 1: Firebase Console (Recommended)

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database**
4. Find the user document in the `users` collection
5. Click on the document to edit it
6. Find the `isAdmin` field
7. Change the value from `false` to `true`
8. Click **Update**

### Option 2: Firebase CLI

You can also use the Firebase CLI to update a user:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Use the Firebase Firestore shell
firebase firestore:shell

# In the shell, run:
db.collection('users').doc('USER_UID_HERE').update({ isAdmin: true })
```

### Option 3: Admin Script

Create a simple script to promote a user to admin:

```typescript
// scripts/make-admin.ts
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

async function makeAdmin(email: string) {
  try {
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();

    if (usersSnapshot.empty) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;

    // Update user to admin
    await db.collection('users').doc(userId).update({
      isAdmin: true,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    console.log(`✓ Successfully made ${email} an admin`);
    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run make-admin <email>');
  process.exit(1);
}

makeAdmin(email);
```

Then add to package.json:
```json
"make-admin": "tsx --env-file=.env.local scripts/make-admin.ts"
```

Run with:
```bash
npm run make-admin user@example.com
```

## Verifying Admin Status

After making a user an admin, they need to:

1. **Log out** of the application
2. **Log back in** to refresh their session and load the new role
3. Navigate to the admin pages (e.g., `/admin/events`, `/admin/users`)

The admin should now see:
- Admin navigation links in the navbar
- Access to admin-only pages
- Admin controls on event cards
- User management features

## Managing Points and Attendance

### Manual Point Adjustments

Admins can manually add points to users through the admin users page:

1. Navigate to `/admin/users`
2. Click on a user to view their details
3. Use the "Add Points" form
4. Enter the number of points and a reason
5. Submit

This creates a `PointAdjustment` record for audit purposes.

### Manual Attendance Addition

Admins can manually add attendance records:

1. Navigate to `/admin/users`
2. Click on a user to view their details
3. Use the "Add Attendance" form
4. Select an event
5. Submit

This updates both:
- The event's `attendees` array
- The user's `attendedEvents` array

## Troubleshooting

### User still doesn't have admin access after migration

1. Check Firestore to verify the `isAdmin` field exists and is set to `true`
2. Have the user log out and log back in
3. Clear browser cache and cookies
4. Check browser console for any errors

### Migration script fails

1. Verify your `.env.local` file has correct Firebase Admin credentials
2. Check that you have write permissions to Firestore
3. Review the error messages in the console output
4. Try running the script again (it's safe to run multiple times)

### Points not updating

1. Verify the user document has the `points` field
2. Check that attendance submission is working correctly
3. Review the event's `pointsValue` field
4. Check browser console and server logs for errors

## Security Considerations

### Admin Role Protection

- Admin role can only be modified through direct Firestore access
- The application interface prevents role modification
- Server-side validation checks admin status for all admin operations
- Firestore security rules enforce admin-only write access to events

### Audit Trail

All point adjustments are logged in the `pointAdjustments` collection with:
- User ID
- Points added
- Reason
- Admin who made the adjustment
- Timestamp

This provides a complete audit trail for accountability.

## Future Enhancements

Potential improvements for user management:

1. **Admin Management UI**: Create a dedicated admin management page for promoting/demoting users
2. **Role Hierarchy**: Add different admin levels (super admin, event admin, etc.)
3. **Bulk Operations**: Add ability to bulk update users or points
4. **Activity Logs**: Track all admin actions for security auditing
5. **Automated Promotions**: Automatically promote users based on criteria (e.g., attendance count)

## Related Documentation

- [Admin and Event Management Design](./design.md)
- [Admin and Event Management Requirements](./requirements.md)
- [User Profile Service Summary](./USER_PROFILE_SERVICE_SUMMARY.md)
- [Firebase Setup](./FIREBASE_SETUP.md)
