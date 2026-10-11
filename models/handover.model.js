'use strict';
const { query, one } = require('../db');
const { id, dt } = require('../db/shape');

function toHandover(row) {
  if (!row) return null;
  return {
    id: id(row.id), claimId: id(row.claim_id), caseId: id(row.case_id), nonce: row.nonce,
    expiresAt: dt(row.expires_at), status: row.status, completedAt: dt(row.completed_at),
    completedBy: id(row.completed_by), idChecked: Boolean(row.id_checked), createdAt: dt(row.created_at)
  };
}

async function create(d) {
  const row = await one(
    `INSERT INTO handovers (claim_id, case_id, nonce, expires_at, status)
     VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [Number(d.claimId), Number(d.caseId), d.nonce, d.expiresAt]
  );
  return toHandover(row);
}

const get = async (n) => toHandover(await one('SELECT * FROM handovers WHERE id = $1', [Number(n)]));

const COLUMNS = {
  nonce: 'nonce', expiresAt: 'expires_at', status: 'status', completedAt: 'completed_at',
  completedBy: 'completed_by', idChecked: 'id_checked'
};

async function update(n, patch) {
  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(COLUMNS)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) continue;
    params.push(key === 'idChecked' ? !!patch[key] : patch[key]);
    sets.push(`${column} = $${params.length}`);
  }
  if (!sets.length) return get(n);
  params.push(Number(n));
  return toHandover(await one(`UPDATE handovers SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params));
}

// One statement, so two staff members scanning the same code cannot both succeed.
async function completeIfPending(n, patch) {
  const row = await one(
    `UPDATE handovers
     SET status = 'completed', completed_at = $2, completed_by = $3, id_checked = true
     WHERE id = $1 AND status = 'pending' AND expires_at > now()
     RETURNING *`,
    [Number(n), patch.completedAt || new Date(), patch.completedBy]
  );
  return toHandover(row);
}

// The live code when there is one; otherwise the newest cancelled row (so it can be renewed).
async function byClaim(claimId) {
  return toHandover(await one(
    `SELECT * FROM handovers WHERE claim_id = $1
     ORDER BY CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END, id DESC
     LIMIT 1`,
    [Number(claimId)]
  ));
}

const listByStatus = async (status) => (await query(
  'SELECT * FROM handovers WHERE status = $1 ORDER BY expires_at ASC',
  [status]
)).map(toHandover);

const all = async () => (await query('SELECT * FROM handovers ORDER BY id')).map(toHandover);

module.exports = { create, get, update, completeIfPending, byClaim, listByStatus, all };
