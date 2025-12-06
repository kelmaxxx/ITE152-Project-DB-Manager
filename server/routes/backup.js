const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { createConnection } = require('../config/db');

const backupsDir = path.join(__dirname, '..', '..', 'backups');

// Get all backups
router.get('/list', (req, res) => {
  fs.readdir(backupsDir, (err, files) => {
    if (err) {
      console.error('Error reading backups directory:', err);
      return res.status(500).json({ error: err.message });
    }
    
    const backups = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          filename: file,
          size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
          sizeBytes: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified);
    
    res.json(backups);
  });
});

// Backup database
router.post('/database', (req, res) => {
  const { dbName } = req.body;
  
  if (!dbName) {
    return res.status(400).json({ error: 'Database name is required' });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
  const filename = `${dbName}_${timestamp[0]}_${timestamp[1].split('Z')[0]}.sql`;
  const filepath = path.join(backupsDir, filename);
  
  const mysqldumpPath = process.env.MYSQL_DUMP_PATH || 'mysqldump';
  const password = process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : '';
  
  const command = `"${mysqldumpPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${password} --databases ${dbName} --result-file="${filepath}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const stats = fs.statSync(filepath);
    
    res.json({
      message: `Database '${dbName}' backed up successfully`,
      filename: filename,
      size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
      path: filepath
    });
  });
});

// Backup table
router.post('/table', (req, res) => {
  const { dbName, tableName } = req.body;
  
  if (!dbName || !tableName) {
    return res.status(400).json({ error: 'Database name and table name are required' });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
  const filename = `${dbName}_${tableName}_${timestamp[0]}_${timestamp[1].split('Z')[0]}.sql`;
  const filepath = path.join(backupsDir, filename);
  
  const mysqldumpPath = process.env.MYSQL_DUMP_PATH || 'mysqldump';
  const password = process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : '';
  
  const command = `"${mysqldumpPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${password} ${dbName} ${tableName} --result-file="${filepath}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Backup error:', error);
      return res.status(500).json({ error: error.message });
    }
    
    const stats = fs.statSync(filepath);
    
    res.json({
      message: `Table '${tableName}' from database '${dbName}' backed up successfully`,
      filename: filename,
      size: (stats.size / 1024 / 1024).toFixed(2) + ' MB',
      path: filepath
    });
  });
});

// Delete backup
router.delete('/:filename', (req, res) => {
  const { filename } = req.params;
  const filepath = path.join(backupsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }
  
  fs.unlink(filepath, (err) => {
    if (err) {
      console.error('Error deleting backup:', err);
      return res.status(500).json({ error: err.message });
    }
    
    res.json({ message: `Backup '${filename}' deleted successfully` });
  });
});

module.exports = router;
