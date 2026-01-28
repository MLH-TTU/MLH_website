# Firestore Indexes Documentation

This document explains the Firestore indexes configured for the MLH TTU application.

## Overview

Firestore indexes improve query performance and enable complex queries. The indexes are defined in `firestore.indexes.json` and can be deployed using the Firebase CLI.

## Configured Indexes

### 1. TTU Email Index (users collection)

**Purpose**: Enable efficient queries and duplicate detection for TTU email addresses

**Configuration**:
```json
{
  "collectionGroup": "users",
  "fields": [
    { "fieldPath": "ttuEmail", "order": "ASCENDING" }
  ]
}
```

**Use Cases**:
- Check if a TTU email already exists before registration
- Query users by TTU email
- Enforce uniqueness constraint (combined with security rules)

**Queries Enabled**:
```typescript
// Check for duplicate TTU email
const q = query(
  collection(firestore, 'users'), 
  where('ttuEmail', '==', 'student@ttu.edu')
);
```

### 2. University Level Index (users collection)

**Purpose**: Enable filtering and analytics by university level

**Configuration**:
```json
{
  "collectionGroup": "users",
  "fields": [
    { "fieldPath": "universityLevel", "order": "ASCENDING" }
  ]
}
```

**Use Cases**:
- Filter users by university level (freshman, sophomore, etc.)
- Generate analytics reports by class year
- Create targeted communications

**Queries Enabled**:
```typescript
// Get all freshmen
const q = query(
  collection(firestore, 'users'), 
  where('universityLevel', '==', 'freshman')
);
```

### 3. Major Index (users collection)

**Purpose**: Enable filtering and analytics by major

**Configuration**:
```json
{
  "collectionGroup": "users",
  "fields": [
    { "fieldPath": "major", "order": "ASCENDING" }
  ]
}
```

**Use Cases**:
- Filter users by major
- Generate analytics reports by major
- Find students in specific programs

**Queries Enabled**:
```typescript
// Get all Computer Science majors
const q = query(
  collection(firestore, 'users'), 
  where('major', '==', 'Computer Science')
);
```

### 4. Verification Expiration Index (verificationCodes collection)

**Purpose**: Enable cleanup queries for expired verification codes

**Configuration**:
```json
{
  "collectionGroup": "verificationCodes",
  "fields": [
    { "fieldPath": "expiresAt", "order": "ASCENDING" }
  ]
}
```

**Use Cases**:
- Find and delete expired verification codes
- Scheduled cleanup tasks
- Monitoring verification code lifecycle

**Queries Enabled**:
```typescript
// Find expired verification codes
const q = query(
  collection(firestore, 'verificationCodes'), 
  where('expiresAt', '<', Timestamp.now())
);
```

### 5. User Verification Expiration Index (users collection)

**Purpose**: Enable cleanup queries for users with expired verification periods

**Configuration**:
```json
{
  "collectionGroup": "users",
  "fields": [
    { "fieldPath": "verificationExpiresAt", "order": "ASCENDING" }
  ]
}
```

**Use Cases**:
- Find users whose verification period has expired
- Cleanup pending accounts that never completed verification
- Scheduled maintenance tasks

**Queries Enabled**:
```typescript
// Find users with expired verification
const q = query(
  collection(firestore, 'users'), 
  where('verificationExpiresAt', '<', Timestamp.now())
);
```

## Deploying Indexes

### Deploy All Indexes

```bash
firebase deploy --only firestore:indexes
```

### Check Index Status

After deployment, check the status in Firebase Console:
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Click on "Indexes" tab
4. Verify all indexes are "Enabled"

## Index Build Time

- Simple indexes typically build in seconds
- Large collections may take minutes to hours
- You can monitor build progress in Firebase Console

## Automatic Index Creation

Firestore may suggest additional indexes when you run queries that require them. You can:
1. Click the link in the error message to create the index automatically
2. Add the suggested index to `firestore.indexes.json` for version control

## Best Practices

1. **Only create indexes you need**: Each index adds storage overhead
2. **Test queries in emulator**: Verify indexes work before deploying
3. **Monitor index usage**: Remove unused indexes to save resources
4. **Version control**: Always commit `firestore.indexes.json` changes

## Uniqueness Constraint for TTU Email

While Firestore doesn't support unique constraints natively, we enforce uniqueness through:

1. **Index**: Enables efficient duplicate checking
2. **Security Rules**: Prevent unauthorized modifications
3. **Application Logic**: Check for duplicates before creating users
4. **Transaction**: Use transactions when creating users to prevent race conditions

Example transaction for creating user with unique TTU email:

```typescript
import { runTransaction } from 'firebase/firestore';

async function createUserWithUniqueTTUEmail(uid: string, ttuEmail: string) {
  await runTransaction(firestore, async (transaction) => {
    // Check if TTU email exists
    const exists = await checkTTUEmailExists(ttuEmail);
    if (exists) {
      throw new Error('TTU email already registered');
    }
    
    // Create user profile
    const userRef = doc(firestore, 'users', uid);
    transaction.set(userRef, {
      uid,
      ttuEmail,
      // ... other fields
    });
  });
}
```

## Troubleshooting

### Index Not Found Error

If you see "The query requires an index" error:
1. Check if the index is defined in `firestore.indexes.json`
2. Deploy indexes: `firebase deploy --only firestore:indexes`
3. Wait for index to build (check Firebase Console)

### Slow Queries

If queries are slow despite indexes:
1. Verify the correct index is being used
2. Check index status in Firebase Console
3. Consider composite indexes for complex queries
4. Review query structure and optimize if needed

## Additional Resources

- [Firestore Indexes Documentation](https://firebase.google.com/docs/firestore/query-data/indexing)
- [Index Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Query Limitations](https://firebase.google.com/docs/firestore/query-data/queries#query_limitations)
