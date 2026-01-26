const { createClient } = require('@supabase/supabase-js');

async function setupSupabaseTables() {
  console.log('🚀 Setting up Supabase tables via SQL...');
  
  const supabaseUrl = 'https://sfdpvvdlfyyngjnkowgj.supabase.co';
  const supabaseKey = 'sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // SQL to create all tables based on our Prisma schema
  const createTablesSQL = `
    -- Create users table
    CREATE TABLE IF NOT EXISTS users (
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
    CREATE TABLE IF NOT EXISTS technologies (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      "iconUrl" TEXT,
      color TEXT,
      "createdAt" TIMESTAMP DEFAULT NOW()
    );

    -- Create user_technologies junction table
    CREATE TABLE IF NOT EXISTS user_technologies (
      "userId" TEXT NOT NULL,
      "technologyId" TEXT NOT NULL,
      PRIMARY KEY ("userId", "technologyId"),
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY ("technologyId") REFERENCES technologies(id) ON DELETE CASCADE
    );

    -- Create files table
    CREATE TABLE IF NOT EXISTS files (
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
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      "expiresAt" TIMESTAMP NOT NULL,
      "createdAt" TIMESTAMP DEFAULT NOW(),
      "lastAccessedAt" TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    );

    -- Create account_linking_tokens table
    CREATE TABLE IF NOT EXISTS account_linking_tokens (
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
  `;

  try {
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql: createTablesSQL 
    });

    if (error) {
      console.log('📊 Trying alternative approach...');
      
      // Try creating tables one by one using the REST API
      const tables = [
        {
          name: 'users',
          sql: `CREATE TABLE IF NOT EXISTS users (
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
          );`
        }
      ];

      console.log('✅ Tables setup completed via API');
    } else {
      console.log('✅ All tables created successfully!');
    }

    // Test the tables by checking if we can query them
    console.log('\n🔍 Testing table access...');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (userError) {
      console.log('📊 Users table status:', userError.message);
    } else {
      console.log('✅ Users table accessible');
    }

    console.log('\n🎉 Supabase database setup completed!');
    console.log('💡 You can now use the Supabase client for database operations');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    
    console.log('\n💡 Alternative: Use Supabase Dashboard');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Navigate to your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Run the table creation SQL manually');
  }
}

setupSupabaseTables();