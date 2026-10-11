'use strict';
// Sessions. A PostgreSQL store is used when DATABASE_URL is set (as in the proposal); otherwise
// the in-memory store is used, which is fine for development and loses sessions on restart.
// saveUninitialized is false and nothing writes to the session on anonymous page views, so a
// visitor who only reads the public board never receives a cookie.
const session = require('express-session');
const config = require('../config');

const COOKIE_NAME = 'sf.sid';

function buildStore() {
  if (config.databaseUrl) {
    const { Pool } = require('pg');
    const PgSession = require('connect-pg-simple')(session);
    return new PgSession({ pool: new Pool({ connectionString: config.databaseUrl }), tableName: 'session', createTableIfMissing: true });
  }
  if (config.isProd) console.warn('[SafeFind] DATABASE_URL is not set: using the in-memory session store. Sessions are lost on restart and this is not suitable for production.');
  return undefined;
}

module.exports = () => session({
  name: COOKIE_NAME,
  secret: config.sessionSecret,
  store: buildStore(),
  resave: false,
  saveUninitialized: false,
  rolling: true, // the idle timeout restarts on every request
  cookie: { httpOnly: true, sameSite: 'lax', secure: config.cookieSecure, maxAge: config.auth.sessionIdleMs }
});
module.exports.COOKIE_NAME = COOKIE_NAME;
