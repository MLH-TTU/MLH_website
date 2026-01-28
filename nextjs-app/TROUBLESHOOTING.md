# Troubleshooting: RS256 Algorithm Error

## 🐛 The Error

**Error:** `Key for the RS256 algorithm must be one of type CryptoKey or JSON Web Key. Received an instance of Uint8Array`

## 🔍 Root Cause

This error occurs when there's a mismatch between:
1. The cookie signature format expected by `next-firebase-auth-edge`
2. The actual cookie stored in your browser from a previous session

## ✅ Quick Fix: Clear Your Cookies

### Method 1: Clear Cookies in Browser (Recommended)

1. **Open DevTools:**
   - Press `F12` or `Ctrl+Shift+I` (Windows/Linux)
   - Or `Cmd+Option+I` (Mac)

2. **Go to Application Tab:**
   - Click "Application" in the top menu
   - If you don't see it, click the `>>` icon

3. **Clear Cookies:**
   - In the left sidebar, expand "Cookies"
   - Click on `http://localhost:3000`
   - Right-click and select "Clear"
   - Or select all cookies and press Delete

4. **Refresh the page:**
   - Press `Ctrl+R` or `F5`

### Method 2: Clear All Site Data

1. **Open DevTools** (`F12`)
2. **Go to Application Tab**
3. **Click "Clear site data"** button at the top
4. **Refresh the page**

### Method 3: Use Incognito/Private Window

1. Open a new Incognito/Private window
2. Navigate to `http://localhost:3000/login`
3. Try signing in

## 🎯 Why This Happens

When you were testing earlier, a cookie was set with a different format. Now the middleware is trying to read that old cookie with the new configuration, causing a format mismatch.

## 🔄 After Clearing Cookies

1. Go to `http://localhost:3000/login`
2. You should see the login page (not auto-redirect)
3. Click "Sign in with Google"
4. Complete authentication
5. You'll be redirected to onboarding (if new user) or profile (if existing)

## 🚨 If Error Persists

### Check 1: Verify Environment Variables

Make sure your `.env.local` has:
```bash
FIREBASE_API_KEY="AIzaSyDzVNllNH_X2ShyKtZfVbX0AUJJN_JhP-k"
FIREBASE_AUTH_COOKIE_SECRET="a8f3c9e2b7d4f1a6c8e5b2d9f7a4c1e8b5d2f9a6c3e0b7d4f1a8c5e2b9f6a3c0"
```

### Check 2: Restart Dev Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Check 3: Check Browser Console

1. Open DevTools → Console tab
2. Look for any error messages
3. Share the full error stack trace if needed

## 📋 Current Workaround

I've temporarily added `/onboarding` to the public routes so you can access it without middleware validation. This lets you:
1. Clear cookies
2. Test the flow
3. Debug any issues

Once everything works, we can remove `/onboarding` from public routes and let the middleware protect it properly.

## 🎓 Understanding the Flow

### Normal Flow (After Cookies Cleared):

```
1. Visit /login
   ↓
2. No auth cookie → Show login page
   ↓
3. Click "Sign in with Google"
   ↓
4. Google OAuth → Get Firebase token
   ↓
5. Store token in cookie (correct format)
   ↓
6. Redirect to onboarding or profile
```

### What Was Happening (With Old Cookie):

```
1. Visit /login
   ↓
2. Old auth cookie exists (wrong format)
   ↓
3. AuthContext tries to validate
   ↓
4. Middleware tries to validate
   ↓
5. Format mismatch → RS256 error
   ↓
6. Redirect to onboarding (but error shows)
```

## ✅ Next Steps

1. **Clear your browser cookies** for localhost:3000
2. **Refresh the page**
3. **Try signing in again**
4. **Let me know if you see any errors**

The authentication should work smoothly once the old cookies are cleared! 🎉
