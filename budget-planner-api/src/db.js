require('dotenv').config();
const { Pool } = require('pg');

let pool;

if (process.env.NODE_ENV === 'production') {
  // Production configuration (Neon PostgreSQL)
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      require: true
    }
  });
} else {
  // Development configuration (local PostgreSQL)
  pool = new Pool({
    user: 'richardsugianto',
    host: 'localhost',
    database: 'budget_planner',
    password: '',
    port: 5432,
  });
}

// Test the database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to the database');
    release();
  }
});

module.exports = pool; 