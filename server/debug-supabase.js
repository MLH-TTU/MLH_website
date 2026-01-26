const { createClient } = require('@supabase/supabase-js');

async function debugSupabase() {
  console.log('🔍 Debugging Supabase Connection...\n');
  
  const supabaseUrl = 'https://sfdpvvdlfyyngjnkowgj.supabase.co';
  const supabaseKey = 'sb_publishable_qEK4Q1GvztMU9QU6l6eIGg_RzyESOXD';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Test 1: Check what tables exist
    console.log('1️⃣ Checking existing tables...');
    
    // Try different approaches to list tables
    const approaches = [
      {
        name: 'Direct users query',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1);
          return { data, error };
        }
      },
      {
        name: 'Users count query',
        test: async () => {
          const { data, error } = await supabase
            .from('users')
            .select('count', { count: 'exact', head: true });
          return { data, error };
        }
      },
      {
        name: 'Information schema query',
        test: async () => {
          const { data, error } = await supabase
            .rpc('get_tables');
          return { data, error };
        }
      }
    ];

    for (const approach of approaches) {
      console.log(`\n🔄 Testing: ${approach.name}`);
      try {
        const result = await approach.test();
        if (result.error) {
          console.log('❌ Error:', result.error.message);
          console.log('   Code:', result.error.code);
          console.log('   Details:', result.error.details);
        } else {
          console.log('✅ Success:', result.data);
        }
      } catch (err) {
        console.log('❌ Exception:', err.message);
      }
    }

    // Test 2: Try to create a simple table
    console.log('\n2️⃣ Testing table creation...');
    
    const { data: createData, error: createError } = await supabase
      .from('test_table')
      .insert([{ name: 'test' }]);

    if (createError) {
      console.log('📊 Create test result:', createError.message);
    } else {
      console.log('✅ Table creation/insert successful');
    }

    // Test 3: Check auth capabilities
    console.log('\n3️⃣ Testing auth capabilities...');
    
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    console.log('Auth user:', authUser);
    console.log('Auth error:', authError);

    // Test 4: Check project info
    console.log('\n4️⃣ Project information...');
    console.log('Project URL:', supabaseUrl);
    console.log('Using publishable key (first 20 chars):', supabaseKey.substring(0, 20) + '...');

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugSupabase();