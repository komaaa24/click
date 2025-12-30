const http = require('http');
const app = require('./app');
const { config } = require('./config');
const logger = require('./logger');
const { initDb } = require('./db');

async function main() {
  await initDb();

  const server = http.createServer(app);

  server.listen(config.port, '0.0.0.0', () => {
    logger.info(`Server listening on 0.0.0.0:${config.port}`);
  });

  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((err) => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});

