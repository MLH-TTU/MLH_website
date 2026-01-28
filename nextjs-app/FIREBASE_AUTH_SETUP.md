# Firebase Authentication Setup Guide

## Error: `auth/configuration-not-found`

This error occurs when Google Sign-In is not properly configured in your Firebase Console.

## Step-by-Step Fix

### 1. Go to Firebase Console
Visit: https://console.firebase.google.com/

### 2. Select Your Project
Click on your project: **mlhwebsite**

### 3. Enable Google Sign-In Provider

1. In the left sidebar, click **"Build"** → **"Authentication"**
2. Click the **"Get Started"** button (if you haven't set up Authentication yet)
3. Click on the **"Sign-in method"** tab at the top
4. Find **"Google"** in the list of providers
5. Click on **"Google"** to open the configuration

### 4. Configure Google Provider

In the Google provider settings:

1. **Enable the provider:**
   - Toggle the **"Enable"** switch to ON

2. **Set Project Support Email:**
   - Enter a support email (this is required)
   - Use your email or a project support email
   - Example: `your-email@example.com`

3. **Click "Save"**

### 5. Verify Configuration

After saving, you should see:
- ✅ Google provider showing as **"Enabled"** in the Sign-in method tab
- ✅ A green checkmark or "Enabled" status

### 6. Optional: Add Authorized Domains

If you're testing on localhost, Firebase should automatically allow it. But if you have issues:

1. In the **"Sign-in method"** tab, scroll down to **"Authorized domains"**
2. Make sure `localhost` is in the list
3. If deploying, add your production domain here

### 7. Test Again

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

2. Visit http://localhost:3000/login

3. Click "Sign in with Google"

4. You should now see the Google OAuth consent screen

## Common Issues

### Issue: "This app is not verified"
**Solution:** This is normal for development. Click "Advanced" → "Go to [your app] (unsafe)" to continue.

### Issue: "redirect_uri_mismatch"
**Solution:** 
1. Go to Firebase Console → Authentication → Settings
2. Add your redirect URI to the authorized domains
3. For local development: `http://localhost:3000`

### Issue: Still getting configuration-not-found
**Solution:**
1. Double-check that Google provider is **enabled** (toggle should be ON)
2. Make sure you clicked **"Save"** after enabling
3. Wait 1-2 minutes for changes to propagate
4. Clear your browser cache and try again
5. Check that your `.env.local` has the correct `NEXT_PUBLIC_FIREBASE_API_KEY`

## Verify Your Firebase Configuration

Your current Firebase project details:
- **Project ID:** mlhwebsite
- **Auth Domain:** mlhwebsite.firebaseapp.com
- **API Key:** AIzaSyDzVNllNH_X2ShyKtZfVbX0AUJJN_JhP-k

Make sure these match what you see in Firebase Console:
1. Go to Project Settings (gear icon) → General
2. Scroll down to "Your apps"
3. Verify the Web API Key matches your `.env.local`

## Additional Setup (Optional but Recommended)

### Set Up OAuth Consent Screen (for Production)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Go to **APIs & Services** → **OAuth consent screen**
4. Fill in the required information:
   - App name
   - User support email
   - Developer contact information
5. Add scopes (email, profile are usually sufficient)
6. Save and continue

### Add Test Users (for Development)

If your OAuth consent screen is in "Testing" mode:
1. Go to OAuth consent screen → Test users
2. Add your Google account email
3. This allows you to test without app verification

## Need More Help?

If you're still having issues:
1. Check the browser console for detailed error messages
2. Check the Firebase Console → Authentication → Users tab to see if any users were created
3. Verify your Firebase project is on the Blaze (pay-as-you-go) plan if needed for production features

## Quick Checklist

- [ ] Firebase Console → Authentication → Sign-in method
- [ ] Google provider is **Enabled** (toggle ON)
- [ ] Support email is set
- [ ] Changes are **Saved**
- [ ] Waited 1-2 minutes for propagation
- [ ] Restarted Next.js dev server
- [ ] Cleared browser cache
- [ ] Verified API key in `.env.local` matches Firebase Console

Once Google Sign-In is enabled, the authentication flow should work perfectly! 🎉
