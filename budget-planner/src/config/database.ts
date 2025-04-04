import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.VITE_DB_USER,
  host: process.env.VITE_DB_HOST,
  database: process.env.VITE_DB_NAME,
  password: process.env.VITE_DB_PASSWORD,
  port: parseInt(process.env.VITE_DB_PORT || '5432'),
});

export default pool; 