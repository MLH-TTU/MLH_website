# OAuth Setup Guide for Development

This guide will help you set up OAuth authentication for local development.

## Google OAuth Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "MLH TTU App" (or your preferred name)
4. Click "Create"

### 2. Enable Google+ API

1. In the Google Cloud Console, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the required fields:
     - App name: "MLH TTU App"
     - User support email: your email
     - Developer contact information: your email
   - Add scopes: `../auth/userinfo.email` and `../auth/userinfo.profile`
   - Add test users: your email address
4. Create OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "MLH TTU Web Client"
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:5001/auth/google/callback`
5. Click "Create"
6. Copy the Client ID and Client Secret

### 4. Update Environment Variables

Update your `server/.env` file:

```bash
# Replace these with your actual Google OAuth credentials
GOOGLE_CLIENT_ID="your-actual-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret-here"
```

## Microsoft OAuth Setup (Optional)

### 1. Register Application in Azure

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: "MLH TTU App"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: Web → `http://localhost:5001/auth/microsoft/callback`
5. Click "Register"

### 2. Configure API Permissions

1. In your app registration, go to "API permissions"
2. Click "Add a permission" → "Microsoft Graph" → "Delegated permissions"
3. Add: `User.Read`
4. Click "Add permissions"

### 3. Create Client Secret

1. Go to "Certificates & secrets"
2. Click "New client secret"
3. Add description: "Development Secret"
4. Choose expiration: "24 months"
5. Click "Add"
6. Copy the secret value immediately (it won't be shown again)

### 4. Update Environment Variables

Update your `server/.env` file:

```bash
# Replace these with your actual Microsoft OAuth credentials
MICROSOFT_CLIENT_ID="your-actual-microsoft-client-id-here"
MICROSOFT_CLIENT_SECRET="your-actual-microsoft-client-secret-here"
```

## Testing OAuth Setup

1. Start your server: `cd server && npm run dev`
2. Start your client: `cd client && npm run dev`
3. Go to `http://localhost:3000/login`
4. Click "Sign in with Google" or "Sign in with Microsoft"
5. You should be redirected to the OAuth provider's login page

## Troubleshooting

### Common Issues

1. **"OAuth not configured" error**
   - Make sure you've replaced the placeholder values in `.env`
   - Restart your server after updating environment variables

2. **"Redirect URI mismatch" error**
   - Ensure the redirect URI in your OAuth app matches exactly: `http://localhost:5001/auth/google/callback`
   - Check for trailing slashes or typos

3. **"This app isn't verified" warning**
   - This is normal for development
   - Click "Advanced" → "Go to MLH TTU App (unsafe)" to continue

4. **"Access blocked" error**
   - Make sure you've added your email as a test user in the OAuth consent screen
   - Ensure the app is in "Testing" mode, not "Production"

### Environment Variables Checklist

Make sure these are set in your `server/.env` file:

```bash
# Required for OAuth
GOOGLE_CLIENT_ID="your-actual-google-client-id"
GOOGLE_CLIENT_SECRET="your-actual-google-client-secret"
CLIENT_URL="http://localhost:3000"
SERVER_URL="http://localhost:5001"
JWT_SECRET="your-jwt-secret"
SESSION_SECRET="your-session-secret"

# Database (make sure this is correct)
DATABASE_URL="postgresql://username:password@localhost:5432/mlh_ttu_db?schema=public"
```

## Security Notes

- Never commit your actual OAuth credentials to version control
- Use different OAuth apps for development, staging, and production
- Regularly rotate your client secrets
- Keep your OAuth consent screen information up to date

## Next Steps

After setting up OAuth:

1. Test the authentication flow
2. Set up your database (see SETUP.md)
3. Run database migrations
4. Test the complete onboarding flow

If you encounter any issues, check the server logs for detailed error messages.