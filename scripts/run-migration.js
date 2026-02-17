const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting migration...');
    console.log(`📦 Database: ${process.env.DATABASE_URL.split('@')[1]}`);
    
    // Get migration file from command line argument or default to 001
    const migrationNumber = process.argv[2] || '001';
    const migrationPath = path.join(__dirname, `../migrations/${migrationNumber}_*.sql`);
    
    // Find the migration file
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir);
    const migrationFile = files.find(f => f.startsWith(migrationNumber));
    
    if (!migrationFile) {
      console.error(`❌ Migration file ${migrationNumber}_*.sql not found`);
      process.exit(1);
    }
    
    const fullPath = path.join(migrationsDir, migrationFile);
    const migrationSQL = fs.readFileSync(fullPath, 'utf8');
    
    console.log(`📄 Executing migration: ${migrationFile}`);
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ Migration completed successfully!');
    console.log('📊 Database schema updated.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
