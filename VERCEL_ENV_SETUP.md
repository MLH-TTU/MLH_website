# Vercel Environment Variables Setup

## 🔐 **SECURITY NOTICE**
Never commit actual environment variables to Git! This file contains instructions for setting up environment variables securely.

## 📋 **Required Environment Variables for Production**

### **Database & Supabase**
```bash
DATABASE_URL="postgresql://postgres:[Appstore@2026]@db.sfdpvvdlfyyngjnkowgj.supabase.co:5432/postgres"
SUPABASE_URL="https://sfdpvvdlfyyngjnkowgj.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD"
```

### **Authentication (Generate Strong Secrets)**
```bash
SESSION_SECRET="[GENERATE-STRONG-SECRET]"
JWT_SECRET="[GENERATE-STRONG-SECRET]"
```

### **OAuth Providers**
```bash
GOOGLE_CLIENT_ID="your-google-client-id-here"
GOOGLE_CLIENT_SECRET="your-google-client-secret-here"
```

### **Email Configuration**
```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="ttumajorleaguehacking@gmail.com"
SMTP_PASS="rzrudorbqdvolzpd"
FROM_EMAIL="ttumajorleaguehacking@gmail.com"
```

### **Application URLs (Update After Deployment)**
```bash
CLIENT_URL="https://your-app-name.vercel.app"
SERVER_URL="https://your-app-name.vercel.app"
```

### **File Upload & Environment**
```bash
MAX_FILE_SIZE="10485760"
UPLOAD_DIR="uploads"
NODE_ENV="production"
```

## 🚀 **Setup Methods**

### **Method 1: Using Vercel CLI (Recommended)**

1. **Login and Link Project:**
```bash
vercel login
vercel link
```

2. **Add Environment Variables:**
```bash
# Run the automated setup script
./scripts/setup-vercel-env.sh

# Or add manually:
vercel env add DATABASE_URL production
vercel env add SUPABASE_URL production
# ... continue for all variables
```

3. **List Environment Variables:**
```bash
vercel env ls
```

### **Method 2: Using Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with the values above

## 🔧 **After First Deployment**

Update the application URLs:
```bash
vercel env add CLIENT_URL production
# Enter: https://your-actual-vercel-url.vercel.app

vercel env add SERVER_URL production  
# Enter: https://your-actual-vercel-url.vercel.app
```

## 🛡️ **Security Best Practices**

1. **Never commit .env files to Git**
2. **Use strong, unique secrets for production**
3. **Rotate secrets regularly**
4. **Use different secrets for different environments**
5. **Limit access to environment variables**

## 🎯 **Generate Strong Secrets**

For SESSION_SECRET and JWT_SECRET, use:
```bash
# Generate random secrets
openssl rand -base64 32
# or
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## ✅ **Verification**

After setup, verify with:
```bash
vercel env ls
```

All variables should be listed for the production environment.