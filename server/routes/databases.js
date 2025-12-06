const express = require('express');
const router = express.Router();
const { createConnection } = require('../config/db');

// Get all databases
router.get('/', (req, res) => {
  const connection = createConnection();
  
  connection.query('SHOW DATABASES', (err, results) => {
    if (err) {
      console.error('Error fetching databases:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const databases = results
      .map(row => row.Database)
      .filter(db => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db));
    
    res.json(databases);
  });
  
  connection.end();
});

// Get database size and info
router.get('/:dbName/info', (req, res) => {
  const { dbName } = req.params;
  const connection = createConnection();
  
  const query = `
    SELECT 
      table_schema AS 'database_name',
      COUNT(*) AS 'table_count',
      ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'size_mb'
    FROM information_schema.tables 
    WHERE table_schema = ?
    GROUP BY table_schema
  `;
  
  connection.query(query, [dbName], (err, results) => {
    if (err) {
      console.error('Error fetching database info:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(results[0] || { database_name: dbName, table_count: 0, size_mb: 0 });
  });
  
  connection.end();
});

// Create database
router.post('/create', (req, res) => {
  const { dbName } = req.body;
  
  if (!dbName) {
    return res.status(400).json({ error: 'Database name is required' });
  }
  
  const connection = createConnection();
  
  connection.query(`CREATE DATABASE \`${dbName}\``, (err) => {
    if (err) {
      console.error('Error creating database:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `Database '${dbName}' created successfully` });
  });
  
  connection.end();
});

// Drop database
router.delete('/:dbName', (req, res) => {
  const { dbName } = req.params;
  const connection = createConnection();
  
  connection.query(`DROP DATABASE \`${dbName}\``, (err) => {
    if (err) {
      console.error('Error dropping database:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `Database '${dbName}' dropped successfully` });
  });
  
  connection.end();
});

module.exports = router;
