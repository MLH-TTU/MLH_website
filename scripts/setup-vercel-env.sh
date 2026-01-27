#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this after linking your project with: vercel link

echo "🚀 Setting up Vercel Environment Variables..."

# Database
vercel env add DATABASE_URL production
echo "Enter: postgresql://postgres:[Appstore@2026]@db.sfdpvvdlfyyngjnkowgj.supabase.co:5432/postgres"

# Supabase
vercel env add SUPABASE_URL production
echo "Enter: https://sfdpvvdlfyyngjnkowgj.supabase.co"

vercel env add SUPABASE_PUBLISHABLE_KEY production
echo "Enter: sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD"

# Authentication (Generate strong secrets for production)
vercel env add SESSION_SECRET production
echo "Enter a strong random string for SESSION_SECRET"

vercel env add JWT_SECRET production
echo "Enter a strong random string for JWT_SECRET"

# OAuth
vercel env add GOOGLE_CLIENT_ID production
echo "Enter: 392800648913-djjai0spf7gnf7gc6i6ridt24f2ndub4.apps.googleusercontent.com"

vercel env add GOOGLE_CLIENT_SECRET production
echo "Enter: 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"

# Email
vercel env add SMTP_HOST production
echo "Enter: smtp.gmail.com"

vercel env add SMTP_PORT production
echo "Enter: 587"

vercel env add SMTP_USER production
echo "Enter: ttumajorleaguehacking@gmail.com"

vercel env add SMTP_PASS production
echo "Enter: rzrudorbqdvolzpd"

vercel env add FROM_EMAIL production
echo "Enter: ttumajorleaguehacking@gmail.com"

# Application URLs (will be set after first deployment)
vercel env add CLIENT_URL production
echo "Enter your Vercel app URL (e.g., https://your-app.vercel.app)"

vercel env add SERVER_URL production
echo "Enter your Vercel app URL (e.g., https://your-app.vercel.app)"

# File Upload
vercel env add MAX_FILE_SIZE production
echo "Enter: 10485760"

vercel env add UPLOAD_DIR production
echo "Enter: uploads"

# Environment
vercel env add NODE_ENV production
echo "Enter: production"

echo "✅ Environment variables setup complete!"
echo "💡 Remember to update CLIENT_URL and SERVER_URL after your first deployment"