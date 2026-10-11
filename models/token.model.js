'use strict';
// One-time tokens for email verification and password setup/reset. Only a hash is stored,
// so a leaked table cannot be used to take over an account.
const crypto = require('crypto');
const { createCollection } = require('./collection');
const col = createCollection();
const hash = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

async function issue(userId, purpose, ttlMs) {
  // A new token replaces any earlier one for the same purpose.
  col.filter((t) => t.userId === userId && t.purpose === purpose).forEach((t) => col.remove(t.id));
  const raw = crypto.randomBytes(32).toString('base64url');
  col.insert({ tokenHash: hash(raw), userId, purpose, expiresAt: new Date(Date.now() + ttlMs) });
  return raw;
}

// Read without using it up (so a GET can show a confirm button).
async function peek(raw, purpose) {
  if (typeof raw !== 'string' || raw.length > 100) return null;
  const t = col.find((x) => x.tokenHash === hash(raw) && x.purpose === purpose && x.expiresAt > new Date());
  return t ? { userId: t.userId } : null;
}

// Single use: the token is deleted as it is read.
async function consume(raw, purpose) {
  if (typeof raw !== 'string' || raw.length > 100) return null;
  const t = col.find((x) => x.tokenHash === hash(raw) && x.purpose === purpose);
  if (!t) return null;
  col.remove(t.id);
  return t.expiresAt > new Date() ? { userId: t.userId } : null;
}

module.exports = { issue, peek, consume, _col: col };
