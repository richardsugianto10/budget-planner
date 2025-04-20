require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true
  }
});

async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to Neon database!');
    
    // Test query
    const result = await client.query('SELECT current_timestamp');
    console.log('Database time:', result.rows[0].current_timestamp);
    
    client.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  } finally {
    await pool.end();
  }
}

testConnection(); 