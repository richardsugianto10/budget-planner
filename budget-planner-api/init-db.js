require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { require: true }
});

async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('Connected to database, initializing schema...');

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'src', 'db', 'production-schema.sql'),
      'utf8'
    );

    await client.query(schemaSQL);
    console.log('Database schema initialized successfully!');

    client.release();
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initializeDatabase(); 