const express = require('express');
const router = express.Router();
const { createConnection } = require('../config/db');

// Get all MySQL users
router.get('/', (req, res) => {
  const connection = createConnection();
  
  connection.query("SELECT user, host FROM mysql.user WHERE user != 'mysql.sys' AND user != 'mysql.session' AND user != 'mysql.infoschema'", (err, results) => {
    if (err) {
      console.error('Error fetching users:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(results);
  });
  
  connection.end();
});

// Get user privileges for a database
router.get('/:username/:host/privileges/:dbName', (req, res) => {
  const { username, host, dbName } = req.params;
  const connection = createConnection();
  
  const query = `SHOW GRANTS FOR '${username}'@'${host}'`;
  
  connection.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching privileges:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json(results);
  });
  
  connection.end();
});

// Create user
router.post('/create', (req, res) => {
  const { username, host, password } = req.body;
  
  if (!username || !host || !password) {
    return res.status(400).json({ error: 'Username, host, and password are required' });
  }
  
  const connection = createConnection();
  
  const query = `CREATE USER '${username}'@'${host}' IDENTIFIED BY '${password}'`;
  
  connection.query(query, (err) => {
    if (err) {
      console.error('Error creating user:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `User '${username}'@'${host}' created successfully` });
  });
  
  connection.end();
});

// Drop user
router.delete('/:username/:host', (req, res) => {
  const { username, host } = req.params;
  const connection = createConnection();
  
  const query = `DROP USER '${username}'@'${host}'`;
  
  connection.query(query, (err) => {
    if (err) {
      console.error('Error dropping user:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `User '${username}'@'${host}' dropped successfully` });
  });
  
  connection.end();
});

// Grant privileges
router.post('/grant', (req, res) => {
  const { username, host, database, privileges } = req.body;
  
  if (!username || !host || !database || !privileges || !Array.isArray(privileges)) {
    return res.status(400).json({ error: 'Username, host, database, and privileges array are required' });
  }
  
  const connection = createConnection();
  const privList = privileges.join(', ');
  const query = `GRANT ${privList} ON \`${database}\`.* TO '${username}'@'${host}'`;
  
  connection.query(query, (err) => {
    if (err) {
      console.error('Error granting privileges:', err);
      return res.status(500).json({ error: err.message });
    }
    
    connection.query('FLUSH PRIVILEGES', (flushErr) => {
      if (flushErr) {
        console.error('Error flushing privileges:', flushErr);
      }
      
      res.json({ 
        message: `Privileges granted to '${username}'@'${host}' on database '${database}'`,
        privileges: privList
      });
    });
  });
  
  connection.end();
});

// Revoke privileges
router.post('/revoke', (req, res) => {
  const { username, host, database, privileges } = req.body;
  
  if (!username || !host || !database || !privileges || !Array.isArray(privileges)) {
    return res.status(400).json({ error: 'Username, host, database, and privileges array are required' });
  }
  
  const connection = createConnection();
  const privList = privileges.join(', ');
  const query = `REVOKE ${privList} ON \`${database}\`.* FROM '${username}'@'${host}'`;
  
  connection.query(query, (err) => {
    if (err) {
      console.error('Error revoking privileges:', err);
      return res.status(500).json({ error: err.message });
    }
    
    connection.query('FLUSH PRIVILEGES', (flushErr) => {
      if (flushErr) {
        console.error('Error flushing privileges:', flushErr);
      }
      
      res.json({ 
        message: `Privileges revoked from '${username}'@'${host}' on database '${database}'`,
        privileges: privList
      });
    });
  });
  
  connection.end();
});

module.exports = router;
