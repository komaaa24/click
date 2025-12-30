const crypto = require('crypto');

function sha1Hex(input) {
  return crypto.createHash('sha1').update(String(input), 'utf8').digest('hex');
}

function md5Hex(input) {
  return crypto.createHash('md5').update(String(input), 'utf8').digest('hex');
}

function buildClickMd5Signature({
  clickTransId,
  serviceId,
  secretKey,
  merchantTransId,
  merchantPrepareId,
  amount,
  action,
  signTime
}) {
  const content = `${clickTransId}${serviceId}${secretKey}${merchantTransId}${merchantPrepareId || ''}${amount}${action}${signTime}`;
  return md5Hex(content);
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
  md5Hex,
  buildClickMd5Signature,
  buildClickAuthHeader
};
