const mysql = require('mysql2');
require('dotenv').config();

const createConnection = (database = null) => {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    multipleStatements: true
  };

  if (database) {
    config.database = database;
  }

  return mysql.createConnection(config);
};

const createPool = (database = null) => {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
  };

  if (database) {
    config.database = database;
  }

  return mysql.createPool(config);
};

module.exports = { createConnection, createPool };
