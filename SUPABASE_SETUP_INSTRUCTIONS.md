# Supabase Setup Instructions

## 🔍 Current Status
- ✅ **API Connection**: Working perfectly
- ✅ **Auth Service**: Accessible  
- ❌ **Database Tables**: Not created yet
- ❌ **Direct PostgreSQL**: Connection blocked/restricted

## 🎯 Issue Identified
The Supabase project is active and accessible via API, but:
1. No database tables exist yet
2. Direct PostgreSQL connection (port 5432) is not accessible
3. Need to create schema using Supabase Dashboard or service key

## 📋 Next Steps Required

### Option 1: Manual Setup via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Navigate to project: `sfdpvvdlfyyngjnkowgj`

2. **Create Tables via SQL Editor**
   - Go to "SQL Editor" in the left sidebar
   - Click "New Query"
   - Copy and paste the SQL below
   - Click "Run"

3. **SQL to Create All Tables**
```sql
-- Create users table
CREATE TABLE users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,
  "hasCompletedOnboarding" BOOLEAN DEFAULT false,
  "firstName" TEXT,
  "lastName" TEXT,
  major TEXT,
  "rNumber" TEXT UNIQUE,
  "universityLevel" TEXT,
  "aspiredPosition" TEXT,
  "githubUrl" TEXT,
  "linkedinUrl" TEXT,
  "twitterUrl" TEXT,
  "profilePictureId" TEXT,
  "resumeId" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  "lastLoginAt" TIMESTAMP
);

-- Create technologies table
CREATE TABLE technologies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  "iconUrl" TEXT,
  color TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Create user_technologies junction table
CREATE TABLE user_technologies (
  "userId" TEXT NOT NULL,
  "technologyId" TEXT NOT NULL,
  PRIMARY KEY ("userId", "technologyId"),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("technologyId") REFERENCES technologies(id) ON DELETE CASCADE
);

-- Create files table
CREATE TABLE files (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "originalName" TEXT NOT NULL,
  "fileName" TEXT UNIQUE NOT NULL,
  "mimeType" TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  "storageUrl" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "lastAccessedAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create account_linking_tokens table
CREATE TABLE account_linking_tokens (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "existingUserId" TEXT NOT NULL,
  "newEmail" TEXT NOT NULL,
  "newProvider" TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY ("existingUserId") REFERENCES users(id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_linking_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid()::text = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid()::text = id);
CREATE POLICY "Anyone can read technologies" ON technologies FOR SELECT TO authenticated;
CREATE POLICY "Users can manage own files" ON files FOR ALL USING (auth.uid()::text = "userId");
```

### Option 2: Get Service Key (Alternative)

1. **Get Service Key from Dashboard**
   - Go to Settings → API
   - Copy the "service_role" key (secret key)
   - This allows full database access

2. **Update Environment Variables**
   - Add `SUPABASE_SERVICE_KEY` to `.env`
   - Use service key for admin operations

## 🧪 Test After Setup

Run this command to test the setup:
```bash
cd server && node test-supabase-complete.js
```

Expected results after setup:
- ✅ API connectivity working
- ✅ Database tables accessible
- ✅ CRUD operations working
- ✅ Ready for application integration

## 🚀 After Database Setup

Once tables are created:
1. Update application to use Supabase client
2. Test authentication flows
3. Test file upload integration
4. Deploy to Vercel with Supabase configuration

## 📞 Current Configuration

```bash
SUPABASE_URL="https://sfdpvvdlfyyngjnkowgj.supabase.co"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD"
```

The API connection is working perfectly - we just need to create the database schema!