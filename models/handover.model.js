'use strict';
const { createCollection } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({
  claimId: d.claimId, caseId: d.caseId, nonce: d.nonce, expiresAt: d.expiresAt, status: 'pending',
  completedAt: null, completedBy: null, idChecked: false, createdAt: new Date()
});
const get = async (id) => col.get(id);
const update = async (id, patch) => col.update(id, patch);
// Check and update in one synchronous step, so two scans of the same code cannot both succeed.
// The PostgreSQL version is: UPDATE handovers SET ... WHERE id = $1 AND status = 'pending' RETURNING *.
const completeIfPending = async (id, patch) => {
  const row = col.get(id);
  if (!row || row.status !== 'pending') return null;
  return col.update(id, { ...patch, status: 'completed' });
};
const byClaim = async (claimId) => col.find((h) => h.claimId === claimId);
const listByStatus = async (status) => col.filter((h) => h.status === status).sort((a, b) => a.expiresAt - b.expiresAt);
const all = async () => col.filter(() => true);

module.exports = { create, get, update, completeIfPending, byClaim, listByStatus, all, _col: col };
