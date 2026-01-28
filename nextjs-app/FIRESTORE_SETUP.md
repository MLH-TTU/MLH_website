# Firestore Setup Guide

## 🎯 Current Status

### ✅ Already Using Firestore!

Good news! Your code is **already using Firestore** in two places:

1. **AuthContext.tsx** - Creating and reading user profiles
2. **middleware.ts** - Checking onboarding status

However, you need to **enable Firestore in Firebase Console** before it will work.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable Firestore Database

1. **Go to Firebase Console:**
   - Visit: https://console.firebase.google.com/
   - Select your project: **mlhwebsite**

2. **Navigate to Firestore:**
   - In the left sidebar, click **"Build"** → **"Firestore Database"**

3. **Create Database:**
   - Click **"Create database"** button
   
4. **Choose Starting Mode:**
   - Select **"Start in production mode"** (we'll add security rules next)
   - Click **"Next"**

5. **Choose Location:**
   - Select a location close to your users (e.g., `us-central1` for US)
   - **Important:** This cannot be changed later!
   - Click **"Enable"**

6. **Wait for Creation:**
   - Takes 1-2 minutes to provision
   - You'll see "Cloud Firestore is being created..."
   - When done, you'll see an empty database

---

## 🔒 Step 2: Set Up Security Rules

### Why Security Rules?

Firestore security rules control who can read/write data. Without proper rules, your database is either:
- **Too open:** Anyone can read/write everything (security risk)
- **Too closed:** Your app can't access data (functionality broken)

### Apply These Rules:

1. In Firestore Database, click the **"Rules"** tab at the top

2. Replace the default rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(uid) {
      return isAuthenticated() && request.auth.uid == uid;
    }
    
    // Users collection
    match /users/{uid} {
      // Anyone authenticated can read their own profile
      allow read: if isOwner(uid);
      
      // Users can create their own profile (first-time auth)
      allow create: if isOwner(uid);
      
      // Users can update their own profile
      // But cannot change uid or email (immutable fields)
      allow update: if isOwner(uid) 
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['uid', 'email']);
      
      // Users cannot delete their own profile
      // (Only admins via server-side can delete)
      allow delete: if false;
    }
    
    // Verification codes collection (for TTU email verification)
    match /verificationCodes/{uid} {
      // Only server-side (Firebase Admin) can read/write
      // Client-side cannot access these directly
      allow read, write: if false;
    }
    
    // Default: Deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. Click **"Publish"** to save the rules

4. You should see: "Rules published successfully"

---

## 📊 Step 3: Verify Setup

### Test Firestore Connection

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Sign in with Google:**
   - Go to http://localhost:3000/login
   - Click "Sign in with Google"
   - Complete authentication

3. **Check Firestore Console:**
   - Go back to Firebase Console → Firestore Database
   - Click on the **"Data"** tab
   - You should see a new collection: **`users`**
   - Inside, you should see a document with your user ID
   - Click on it to see your profile data:
     ```
     uid: "your-firebase-uid"
     email: "your-email@gmail.com"
     displayName: "Your Name"
     photoURL: "https://..."
     provider: "google"
     hasCompletedOnboarding: false
     createdAt: Timestamp
     updatedAt: Timestamp
     ```

### If You See This Data:
✅ **Firestore is working correctly!**

### If You Don't See Data:
1. Check browser console for errors
2. Verify security rules are published
3. Make sure you completed Google sign-in
4. Check that `.env.local` has correct Firebase credentials

---

## 🗂️ Step 4: Understand the Data Structure

### Collections We're Using:

#### 1. `users` Collection
**Purpose:** Store user profiles and onboarding status

**Document ID:** Firebase User UID (e.g., `abc123xyz`)

**Fields:**
```typescript
{
  uid: string;                    // Firebase user ID
  email: string;                  // User's email
  displayName: string;            // User's name from Google
  photoURL: string;               // Profile picture URL
  provider: string;               // "google"
  hasCompletedOnboarding: boolean; // Onboarding status
  
  // Added during onboarding:
  ttuEmail?: string;              // TTU email (e.g., user@ttu.edu)
  ttuEmailVerified?: boolean;     // Email verification status
  firstName?: string;
  lastName?: string;
  major?: string;
  rNumber?: string;
  universityLevel?: string;       // freshman, sophomore, etc.
  aspiredPosition?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  profilePictureId?: string;      // Firebase Storage reference
  resumeId?: string;              // Firebase Storage reference
  
  // Metadata:
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### 2. `verificationCodes` Collection (Task 7)
**Purpose:** Store TTU email verification codes

**Document ID:** Firebase User UID

**Fields:**
```typescript
{
  code: string;           // 6-digit verification code
  email: string;          // TTU email being verified
  uid: string;            // User ID
  createdAt: Timestamp;
  expiresAt: Timestamp;   // 10 minutes from creation
  attempts: number;       // Failed verification attempts
}
```

---

## 🔍 Step 5: Create Indexes (Optional but Recommended)

Indexes improve query performance. You'll need these for Task 5 and beyond.

### Create Indexes:

1. In Firestore Console, click the **"Indexes"** tab

2. Click **"Create Index"**

3. Create these indexes:

#### Index 1: TTU Email (for duplicate detection)
- **Collection ID:** `users`
- **Fields to index:**
  - Field: `ttuEmail`, Order: `Ascending`
- **Query scope:** `Collection`
- Click **"Create"**

#### Index 2: Onboarding Status (for analytics)
- **Collection ID:** `users`
- **Fields to index:**
  - Field: `hasCompletedOnboarding`, Order: `Ascending`
  - Field: `createdAt`, Order: `Descending`
- **Query scope:** `Collection`
- Click **"Create"**

**Note:** Indexes take a few minutes to build. You'll see "Building..." status.

---

## 🎓 What's Already Working

### In Your Code:

#### 1. AuthContext.tsx
```typescript
// Already using Firestore to:
- Create user profile on first sign-in
- Read user profile data
- Update user profile after onboarding
```

#### 2. middleware.ts
```typescript
// Already using Firestore to:
- Check hasCompletedOnboarding status
- Redirect users based on onboarding status
```

#### 3. Firebase Config
```typescript
// Already initialized:
- Client SDK (lib/firebase/config.ts)
- Admin SDK (lib/firebase/admin.ts)
- Firestore instances ready to use
```

---

## ✅ Checklist Before Task 5

Before starting Task 5 (User Profile Service), make sure:

- [ ] Firestore Database is created in Firebase Console
- [ ] Security rules are published
- [ ] You can sign in with Google successfully
- [ ] User document is created in Firestore (check Data tab)
- [ ] No errors in browser console related to Firestore
- [ ] Middleware is checking onboarding status (check Network tab)

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"
**Solution:** Check security rules are published correctly

### Error: "PERMISSION_DENIED"
**Solution:** 
1. Verify user is authenticated
2. Check security rules allow the operation
3. Make sure you're accessing your own user document (uid matches)

### Error: "Firestore has not been initialized"
**Solution:** Check `.env.local` has all Firebase credentials

### No user document created after sign-in
**Solution:**
1. Check browser console for errors
2. Verify Firestore is enabled in Firebase Console
3. Check security rules allow `create` operation
4. Make sure AuthContext is properly wrapped around your app

---

## 🎉 You're Ready!

Once you've completed these steps:

1. ✅ Firestore is enabled
2. ✅ Security rules are set
3. ✅ User profiles are being created
4. ✅ Middleware is checking onboarding status

**You're ready to proceed with Task 5!** 🚀

Task 5 will create a dedicated User Profile Service to make Firestore operations cleaner and more maintainable, but the basic Firestore functionality is already working in your app.

---

## 📚 Additional Resources

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Security Rules Guide](https://firebase.google.com/docs/firestore/security/get-started)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Firestore Indexes](https://firebase.google.com/docs/firestore/query-data/indexing)
