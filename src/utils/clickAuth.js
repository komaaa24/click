const crypto = require('crypto');

function sha1Hex(input) {
  return crypto.createHash('sha1').update(String(input), 'utf8').digest('hex');
}

function buildClickAuthHeader({ merchantUserId, secretKey, timestamp }) {
  if (!timestamp) timestamp = Math.floor(Date.now() / 1000);
  const digest = sha1Hex(`${timestamp}${secretKey}`);
  return {
    authHeaderValue: `${merchantUserId}:${digest}:${timestamp}`,
    timestamp,
    digest
  };
}

module.exports = {
  sha1Hex,
  buildClickAuthHeader
};

