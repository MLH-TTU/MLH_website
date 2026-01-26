require('dotenv').config();

// Override DATABASE_URL for testing
process.env.DATABASE_URL = "postgresql://postgres:[Appstore@2026]@db.sfdpvvdlfyyngjnkowgj.supabase.co:5432/postgres";

const { PrismaClient } = require('@prisma/client');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection via Prisma...');
  console.log('📍 DATABASE_URL:', process.env.DATABASE_URL);
  
  const prisma = new PrismaClient();
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase via Prisma!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);
    
    // Test database info
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('🗄️  Database version:', result[0].version);
    
    // List existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log('📋 Existing tables:', tables.map(t => t.table_name).join(', '));
    
    console.log('🎉 Supabase connection test passed!');
    
  } catch (error) {
    console.error('❌ Supabase connection failed:');
    console.error(error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Tip: Check your database password in the DATABASE_URL');
    }
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tip: Check your internet connection and database URL');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testSupabaseConnection();