const dotenv = require('dotenv');

dotenv.config();

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optionalEnv(name, defaultValue) {
  const value = process.env[name];
  return value == null || value === '' ? defaultValue : value;
}

function parseIntEnv(name, defaultValue) {
  const raw = optionalEnv(name, defaultValue);
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value)) throw new Error(`Invalid integer env var: ${name}`);
  return value;
}

const nodeEnv = optionalEnv('NODE_ENV', 'development');

const config = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: parseIntEnv('PORT', '8080'),
  click: {
    baseUrl: requireEnv('CLICK_BASE_URL'),
    apiBaseUrl: optionalEnv('CLICK_API_BASE_URL', 'https://api.click.uz/v2/merchant'),
    merchantId: requireEnv('CLICK_MERCHANT_ID'),
    merchantUserId: requireEnv('CLICK_MERCHANT_USER_ID'),
    serviceId: requireEnv('CLICK_SERVICE_ID'),
    secretKey: requireEnv('CLICK_SECRET_KEY'),
    returnUrl: requireEnv('CLICK_RETURN_URL'),
    cardType: optionalEnv('CLICK_CARD_TYPE', undefined)
  },
  db: {
    host: requireEnv('PGHOST'),
    port: parseIntEnv('PGPORT', '5432'),
    user: requireEnv('PGUSER'),
    password: requireEnv('PGPASSWORD'),
    database: requireEnv('PGDATABASE')
  }
};

module.exports = { config };

