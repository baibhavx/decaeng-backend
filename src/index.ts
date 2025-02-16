import express from 'express';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// PostgreSQL Connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'incident_db',
  password: process.env.POSTGRES_PASSWORD,
  port: 5432,
});

app.use(express.json());

// Test Route
app.get('/', (req, res) => {
  res.send('Incident Management API is running!');
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});

