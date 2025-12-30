const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { config } = require('../config');
const logger = require('../logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

async function query(text, params) {
  return pool.query(text, params);
}

async function initDb() {
  const migrationsPath = path.join(__dirname, 'migrations.sql');
  const sql = fs.readFileSync(migrationsPath, 'utf8');
  logger.info('Running DB migrations');
  await pool.query(sql);
  logger.info('DB migrations complete');
}

module.exports = {
  pool,
  query,
  initDb
};

