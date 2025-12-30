function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function requireNumber(value, fieldName) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.publicMessage = `Invalid ${fieldName}`;
    throw err;
  }
  return n;
}

function requireInt(value, fieldName) {
  const n = requireNumber(value, fieldName);
  if (!Number.isInteger(n)) {
    const err = new Error(`Invalid ${fieldName}`);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.publicMessage = `Invalid ${fieldName}`;
    throw err;
  }
  return n;
}

function requireNonEmptyString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    const err = new Error(`Invalid ${fieldName}`);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    err.publicMessage = `Invalid ${fieldName}`;
    throw err;
  }
  return value.trim();
}

module.exports = {
  isPlainObject,
  requireNumber,
  requireInt,
  requireNonEmptyString
};

