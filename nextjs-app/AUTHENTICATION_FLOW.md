# Complete Authentication Flow Explanation

## 🔄 The Full Authentication Journey

### Step-by-Step Flow When User Clicks "Sign in with Google"

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "SIGN IN WITH GOOGLE" BUTTON                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. LoginPage.tsx → handleGoogleSignIn()                         │
│    - Sets isSigningIn = true (shows loading spinner)            │
│    - Calls: await signInWithGoogle()                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. AuthContext.tsx → signInWithGoogle()                         │
│    Step 3a: Create Google Auth Provider                         │
│       const provider = new GoogleAuthProvider()                 │
│                                                                  │
│    Step 3b: Open Google OAuth Popup                             │
│       const result = await signInWithPopup(auth, provider)      │
│       ↓                                                          │
│       [Google OAuth popup opens]                                │
│       - User selects Google account                             │
│       - User grants permissions                                 │
│       - Google returns authentication result                    │
│       ↓                                                          │
│       result.user = Firebase User object with:                  │
│         - uid (unique user ID)                                  │
│         - email                                                 │
│         - displayName                                           │
│         - photoURL                                              │
│         - ID token (JWT)                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. AuthContext.tsx → storeAuthToken(result.user)                │
│    Step 4a: Get Firebase ID Token                               │
│       const idToken = await firebaseUser.getIdToken()           │
│                                                                  │
│    Step 4b: ⭐ POST REQUEST TO /api/auth/session ⭐             │
│       await fetch('/api/auth/session', {                        │
│         method: 'POST',                                         │
│         headers: { 'Content-Type': 'application/json' },        │
│         body: JSON.stringify({ idToken })                       │
│       })                                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. api/auth/session/route.ts → POST()                           │
│    Step 5a: Receive ID token from request body                  │
│       const { idToken } = await request.json()                  │
│                                                                  │
│    Step 5b: Get cookies store (Next.js 16)                      │
│       const cookieStore = await cookies()                       │
│                                                                  │
│    Step 5c: Verify token with next-firebase-auth-edge           │
│       const tokens = await getTokens(cookieStore, {...})        │
│       (This validates the token is legitimate)                  │
│                                                                  │
│    Step 5d: Set HTTP-only secure cookie                         │
│       response.cookies.set('AuthToken', idToken, {              │
│         httpOnly: true,    // JavaScript can't access           │
│         secure: true,      // HTTPS only in production          │
│         sameSite: 'lax',   // CSRF protection                   │
│         maxAge: 432000,    // 5 days                            │
│         path: '/'                                               │
│       })                                                        │
│                                                                  │
│    Step 5e: Return success response                             │
│       return NextResponse.json({ success: true })               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. AuthContext.tsx → fetchUserProfile(result.user)              │
│    Step 6a: Query Firestore for user document                   │
│       const userDocRef = doc(firestore, 'users', uid)           │
│       const userDoc = await getDoc(userDocRef)                  │
│                                                                  │
│    Step 6b: Check if user exists                                │
│       if (userDoc.exists()) {                                   │
│         // Existing user - load their profile                   │
│         return userData with hasCompletedOnboarding flag        │
│       } else {                                                  │
│         // New user - create profile                            │
│         await setDoc(userDocRef, {                              │
│           uid, email, displayName, photoURL,                    │
│           provider: 'google',                                   │
│           hasCompletedOnboarding: false,                        │
│           createdAt: Timestamp.now()                            │
│         })                                                      │
│         return new user object                                  │
│       }                                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. AuthContext.tsx → Update State                               │
│    setUser(userProfile)                                         │
│    setLoading(false)                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. LoginPage.tsx → useEffect Detects User Change                │
│    useEffect(() => {                                            │
│      if (user && !loading) {                                    │
│        if (!user.hasCompletedOnboarding) {                      │
│          router.push('/onboarding')  // New user                │
│        } else {                                                 │
│          router.push('/profile')     // Existing user           │
│        }                                                        │
│      }                                                          │
│    }, [user, loading])                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ✅ USER IS AUTHENTICATED!
```

---

## 🎯 Key Points About the POST Request

### When is `/api/auth/session` POST called?

The POST request is called **twice** in the authentication flow:

1. **During initial sign-in** (in `signInWithGoogle()`)
   - After Google OAuth succeeds
   - Before fetching user profile from Firestore

2. **On page load/refresh** (in `onAuthStateChanged` listener)
   - When Firebase detects an existing session
   - Ensures cookie is always up-to-date

### Why do we need this POST request?

The POST request to `/api/auth/session` serves several critical purposes:

1. **Server-Side Authentication:**
   - Stores the Firebase ID token in an HTTP-only cookie
   - Allows Next.js middleware to verify authentication on the server
   - Protects against XSS attacks (JavaScript can't access the cookie)

2. **Session Persistence:**
   - Cookie lasts 5 days (configurable)
   - User stays logged in across browser sessions
   - No need to re-authenticate on every page load

3. **Security:**
   - HTTP-only flag prevents JavaScript access
   - Secure flag ensures HTTPS-only transmission (in production)
   - SameSite flag provides CSRF protection

---

## 🔐 What Happens in the Background?

### Firebase Authentication (Client-Side)
```javascript
// This happens in the browser
signInWithPopup(auth, provider)
  ↓
Google OAuth popup opens
  ↓
User authenticates with Google
  ↓
Firebase receives Google token
  ↓
Firebase creates/retrieves Firebase user
  ↓
Returns Firebase User object with ID token
```

### Cookie Storage (Server-Side)
```javascript
// This happens on the Next.js server
POST /api/auth/session
  ↓
Receives ID token from client
  ↓
Validates token with Firebase Admin SDK
  ↓
Sets HTTP-only secure cookie
  ↓
Returns success response
```

### Firestore Profile (Database)
```javascript
// This happens after authentication
fetchUserProfile(firebaseUser)
  ↓
Query Firestore: users/{uid}
  ↓
If exists: Load profile data
If not: Create new profile with hasCompletedOnboarding: false
  ↓
Return user object to React state
```

---

## 🔄 Subsequent Page Loads

When the user returns to the site or refreshes the page:

```
1. App loads → AuthProvider mounts
   ↓
2. useEffect runs → onAuthStateChanged listener activates
   ↓
3. Firebase checks for existing session
   ↓
4. If session exists:
   - Calls storeAuthToken() → POST /api/auth/session
   - Calls fetchUserProfile() → Gets data from Firestore
   - Updates user state
   ↓
5. User is automatically logged in (no popup needed!)
```

---

## 🚪 Sign Out Flow

When user clicks sign out:

```
1. signOut() called
   ↓
2. Firebase signOut() → Clears Firebase session
   ↓
3. DELETE /api/auth/session → Clears cookie
   ↓
4. setUser(null) → Clears React state
   ↓
5. Redirect to landing page
```

---

## 📊 Data Flow Summary

| Step | Location | Purpose | Data |
|------|----------|---------|------|
| 1 | Browser | User clicks button | - |
| 2 | Client | Open Google OAuth | - |
| 3 | Google | User authenticates | Google account info |
| 4 | Firebase | Create/get user | Firebase User + ID token |
| 5 | **POST /api/auth/session** | **Store token in cookie** | **ID token → Cookie** |
| 6 | Firestore | Get/create profile | User profile data |
| 7 | React State | Update UI | User object |
| 8 | Router | Navigate | Redirect to onboarding/profile |

---

## 🎓 Why This Architecture?

### Client-Side (Firebase Auth)
- ✅ Easy OAuth integration
- ✅ Automatic token refresh
- ✅ Real-time auth state changes

### Server-Side (HTTP-only Cookies)
- ✅ Secure token storage
- ✅ Server-side route protection (middleware)
- ✅ Protection against XSS attacks

### Database (Firestore)
- ✅ Store additional user data
- ✅ Track onboarding status
- ✅ Scalable and real-time

This hybrid approach gives you the best of all worlds: easy client-side auth with Firebase, secure server-side verification with cookies, and flexible data storage with Firestore! 🎉

---

## 🐛 Debugging Tips

### Check if POST request is being called:
1. Open browser DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Click "Sign in with Google"
4. Look for POST request to `/api/auth/session`
5. Check the request payload (should contain `idToken`)
6. Check the response (should be `{ success: true }`)

### Check if cookie is set:
1. Open browser DevTools → Application tab
2. Go to Cookies → http://localhost:3000
3. Look for `AuthToken` cookie
4. Verify it has `HttpOnly` and `SameSite` flags

### Check Firestore:
1. Go to Firebase Console → Firestore Database
2. Look for `users` collection
3. Find document with your user ID
4. Verify `hasCompletedOnboarding` field exists
