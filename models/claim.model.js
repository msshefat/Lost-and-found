'use strict';
const { createCollection } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({
  foundCaseId: d.foundCaseId, lostCaseId: d.lostCaseId || null, userId: d.userId, statement: d.statement,
  lostAt: d.lostAt || null, locationId: d.locationId || null, status: 'submitted',
  proof: null, proofNote: '', proofRequestedNote: '', verification: null, events: d.events || [],
  createdAt: d.createdAt || new Date(), updatedAt: new Date()
});
const get = async (id) => col.get(id);
const update = async (id, patch) => col.update(id, { ...patch, updatedAt: new Date() });
const forCase = async (caseId) => col.filter((c) => c.foundCaseId === caseId).sort((a, b) => b.createdAt - a.createdAt);
const forUser = async (userId) => col.filter((c) => c.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
const listByStatuses = async (statuses) => col.filter((c) => statuses.includes(c.status)).sort((a, b) => a.createdAt - b.createdAt);
const all = async () => col.filter(() => true);
const findByProof = async (file) => col.find((c) => c.proof && c.proof.file === file);

module.exports = { create, get, update, forCase, forUser, listByStatuses, all, findByProof, _col: col };
