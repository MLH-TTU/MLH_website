const { PrismaClient } = require('../server/node_modules/@prisma/client');

async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Successfully connected to Supabase!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}`);
    
    // Test database info
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('🗄️  Database version:', result[0].version);
    
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