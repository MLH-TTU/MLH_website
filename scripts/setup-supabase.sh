#!/bin/bash

# MLH TTU - Supabase Database Setup Script

echo "🚀 Setting up Supabase database for MLH TTU..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your Supabase database URL:"
    echo "export DATABASE_URL='postgresql://postgres:[YOUR-PASSWORD]@db.sfdpvvdlfyyngjnkowgj.supabase.co:5432/postgres'"
    exit 1
fi

echo "✅ DATABASE_URL is configured"

# Navigate to server directory
cd server

echo "📦 Installing dependencies..."
npm install

echo "🔄 Generating Prisma client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database with initial data..."
npx prisma db seed

echo "✅ Supabase database setup complete!"
echo ""
echo "🎉 Your MLH TTU application is now connected to Supabase!"
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel"
echo "2. Set environment variables in Vercel dashboard"
echo "3. Update Google OAuth redirect URIs"
echo ""
echo "Database URL: https://sfdpvvdlfyyngjnkowgj.supabase.co"
echo "Project URL: https://sfdpvvdlfyyngjnkowgj.supabase.co"