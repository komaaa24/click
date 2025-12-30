function nowIso() {
  return new Date().toISOString();
}

function serializeError(err) {
  if (!err) return undefined;
  return {
    name: err.name,
    message: err.message,
    stack: err.stack
  };
}

function log(level, message, meta) {
  const entry = {
    ts: nowIso(),
    level,
    message
  };

  if (meta && meta instanceof Error) entry.error = serializeError(meta);
  else if (meta && typeof meta === 'object') entry.meta = meta;

  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = {
  info: (msg, meta) => log('info', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  error: (msg, meta) => log('error', msg, meta)
};

