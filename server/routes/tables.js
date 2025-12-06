const express = require('express');
const router = express.Router();
const { createConnection } = require('../config/db');

// Get all tables in a database
router.get('/:dbName', (req, res) => {
  const { dbName } = req.params;
  const connection = createConnection(dbName);
  
  connection.query('SHOW TABLES', (err, results) => {
    if (err) {
      console.error('Error fetching tables:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const tableKey = `Tables_in_${dbName}`;
    const tables = results.map(row => row[tableKey]);
    
    res.json(tables);
  });
  
  connection.end();
});

// Get table info
router.get('/:dbName/:tableName/info', (req, res) => {
  const { dbName, tableName } = req.params;
  const connection = createConnection();
  
  const query = `
    SELECT 
      table_name,
      table_rows,
      ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
      create_time,
      update_time
    FROM information_schema.TABLES 
    WHERE table_schema = ? AND table_name = ?
  `;
  
  connection.query(query, [dbName, tableName], (err, results) => {
    if (err) {
      console.error('Error fetching table info:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(results[0] || {});
  });
  
  connection.end();
});

// Create table
router.post('/:dbName/create', (req, res) => {
  const { dbName } = req.params;
  const { tableName, columns } = req.body;
  
  if (!tableName || !columns) {
    return res.status(400).json({ error: 'Table name and columns are required' });
  }
  
  const connection = createConnection(dbName);
  
  const query = `CREATE TABLE \`${tableName}\` (${columns})`;
  
  connection.query(query, (err) => {
    if (err) {
      console.error('Error creating table:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `Table '${tableName}' created successfully` });
  });
  
  connection.end();
});

// Drop table
router.delete('/:dbName/:tableName', (req, res) => {
  const { dbName, tableName } = req.params;
  const connection = createConnection(dbName);
  
  connection.query(`DROP TABLE \`${tableName}\``, (err) => {
    if (err) {
      console.error('Error dropping table:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `Table '${tableName}' dropped successfully` });
  });
  
  connection.end();
});

module.exports = router;
