/**
 * Database Configuration Module
 * 
 * This module handles MySQL database connections for the application.
 * It uses the mysql2 library and environment variables for secure configuration.
 * 
 * Key Features:
 * - Single connection for simple queries
 * - Connection pooling for better performance
 * - Environment-based configuration for security
 */

const mysql = require('mysql2');
require('dotenv').config();

/**
 * Create a single MySQL connection
 * 
 * @param {string|null} database - Optional database name to connect to
 * @returns {Connection} MySQL connection object
 * 
 * Use this for:
 * - Simple, one-time queries
 * - Admin operations (CREATE/DROP database)
 */
const createConnection = (database = null) => {
  // Base configuration from environment variables
  const config = {
    host: process.env.DB_HOST,           // MySQL server address
    user: process.env.DB_USER,           // MySQL username
    password: process.env.DB_PASSWORD,   // MySQL password
    port: process.env.DB_PORT || 3306,   // MySQL port (default: 3306)
    multipleStatements: true             // Allow multiple SQL statements
  };

  // If specific database is provided, add it to config
  if (database) {
    config.database = database;
  }

  return mysql.createConnection(config);
};

/**
 * Create a MySQL connection pool
 * 
 * @param {string|null} database - Optional database name
 * @returns {Pool} MySQL connection pool
 * 
 * Connection pooling benefits:
 * - Reuses connections instead of creating new ones
 * - Better performance for multiple concurrent requests
 * - Automatic connection management
 */
const createPool = (database = null) => {
  const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,      // Wait if no connections available
    connectionLimit: 10,            // Maximum 10 simultaneous connections
    queueLimit: 0,                 // No limit on queued requests
    multipleStatements: true
  };

  if (database) {
    config.database = database;
  }

  return mysql.createPool(config);
};

// Export both functions for use in route handlers
module.exports = { createConnection, createPool };
