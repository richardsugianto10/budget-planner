const { Pool } = require('pg');

const pool = new Pool({
  user: 'richardsugianto',
  host: 'localhost',
  database: 'budget_planner',
  password: '',
  port: 5432,
});

module.exports = pool; 