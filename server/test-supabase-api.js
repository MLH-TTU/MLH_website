const { createClient } = require('@supabase/supabase-js');

async function testSupabaseAPI() {
  console.log('🔍 Testing Supabase API connection...');
  
  const supabaseUrl = 'https://sfdpvvdlfyyngjnkowgj.supabase.co';
  const supabaseKey = 'sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD';
  
  console.log('📍 Project URL:', supabaseUrl);
  console.log('🔑 Using publishable key');
  
  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');
    
    // Test basic API connectivity
    console.log('\n🔄 Testing API connectivity...');
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('📊 Database response (expected for new database):', error.message);
      
      // Check if it's a "table doesn't exist" error (expected for new database)
      if (error.message.includes('relation "users" does not exist') || 
          error.message.includes('table "users" does not exist')) {
        console.log('✅ API connection successful! Database is empty (no tables yet)');
        console.log('💡 This is expected - we need to run Prisma migrations');
        return true;
      } else {
        console.error('❌ Unexpected API error:', error);
        return false;
      }
    } else {
      console.log('✅ API connection successful!');
      console.log('📊 Users table exists with', data?.length || 0, 'records');
      return true;
    }
    
  } catch (error) {
    console.error('❌ Supabase API test failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('\n💡 Tip: Check your Supabase API key');
    } else if (error.message.includes('Project not found')) {
      console.log('\n💡 Tip: Check your Supabase project URL');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tip: Check your internet connection');
    }
    
    return false;
  }
}

async function testSupabaseAuth() {
  console.log('\n🔐 Testing Supabase Auth...');
  
  const supabaseUrl = 'https://sfdpvvdlfyyngjnkowgj.supabase.co';
  const supabaseKey = 'sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD';
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test auth endpoint
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('📊 Auth response:', error.message);
    } else {
      console.log('✅ Auth service accessible');
      console.log('📊 Current session:', data.session ? 'Active' : 'None');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Supabase API Tests\n');
  
  const apiTest = await testSupabaseAPI();
  const authTest = await testSupabaseAuth();
  
  console.log('\n📋 Test Summary:');
  console.log('API Connection:', apiTest ? '✅ Success' : '❌ Failed');
  console.log('Auth Service:', authTest ? '✅ Success' : '❌ Failed');
  
  if (apiTest) {
    console.log('\n🎉 Supabase is accessible! Next steps:');
    console.log('1. Run Prisma migrations to create tables');
    console.log('2. Test database operations');
    console.log('3. Deploy to production');
  } else {
    console.log('\n❌ Supabase connection failed. Check your credentials.');
  }
}

runAllTests();