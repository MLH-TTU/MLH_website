const { Client } = require('pg');

async function testPostgreSQLConnection() {
  console.log('🔍 Testing direct PostgreSQL connection...');
  
  // Use the exact password format provided
  const connectionConfigs = [
    {
      name: 'Direct connection format',
      config: {
        host: 'db.sfdpvvdlfyyngjnkowgj.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: '[Appstore@2026]',
        ssl: { rejectUnauthorized: false }
      }
    },
    {
      name: 'Alternative host format',
      config: {
        host: 'sfdpvvdlfyyngjnkowgj.supabase.co',
        port: 5432,
        database: 'postgres',
        user: 'postgres',
        password: '[Appstore@2026]',
        ssl: { rejectUnauthorized: false }
      }
    }
  ];
  
  for (const { name, config } of connectionConfigs) {
    console.log(`\n🔄 Trying ${name}...`);
    console.log(`📍 Host: ${config.host}`);
    
    const client = new Client(config);
    
    try {
      await client.connect();
      console.log('✅ Successfully connected to Supabase PostgreSQL!');
      
      const result = await client.query('SELECT version()');
      console.log('🗄️  Database version:', result.rows[0].version);
      
      const tableResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      console.log('📊 Tables in database:', tableResult.rows.length);
      
      console.log('🎉 PostgreSQL connection test passed!');
      return; // Success, exit function
      
    } catch (error) {
      console.error('❌ Connection failed:');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
    } finally {
      try {
        await client.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
  
  console.log('\n💡 All connection attempts failed. Possible issues:');
  console.log('   - Supabase project might be paused (check Supabase dashboard)');
  console.log('   - Database password might be incorrect');
  console.log('   - Project might need to be activated');
  console.log('   - Network connectivity issues');
}

testPostgreSQLConnection();