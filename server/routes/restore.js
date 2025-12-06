const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const backupsDir = path.join(__dirname, '..', '..', 'backups');

// Restore database from backup
router.post('/', (req, res) => {
  const { filename, targetDb, createNew } = req.body;
  
  if (!filename) {
    return res.status(400).json({ error: 'Backup filename is required' });
  }
  
  const filepath = path.join(backupsDir, filename);
  
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Backup file not found' });
  }
  
  const mysqlPath = process.env.MYSQL_PATH || 'mysql';
  const password = process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : '';
  
  let command;
  
  if (createNew && targetDb) {
    // Create new database and restore
    const createDbCommand = `"${mysqlPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${password} -e "CREATE DATABASE IF NOT EXISTS \`${targetDb}\`"`;
    
    exec(createDbCommand, (error) => {
      if (error) {
        console.error('Error creating database:', error);
        return res.status(500).json({ error: error.message });
      }
      
      command = `"${mysqlPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${password} ${targetDb} < "${filepath}"`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Restore error:', error);
          return res.status(500).json({ error: error.message });
        }
        
        res.json({
          message: `Database restored successfully to '${targetDb}'`,
          target: targetDb
        });
      });
    });
  } else {
    // Restore to existing or use default
    command = `"${mysqlPath}" -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${password} < "${filepath}"`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Restore error:', error);
        return res.status(500).json({ error: error.message });
      }
      
      res.json({
        message: 'Database restored successfully',
        source: filename
      });
    });
  }
});

module.exports = router;
