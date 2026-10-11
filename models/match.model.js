'use strict';
const { createCollection } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({
  lostCaseId: d.lostCaseId, foundCaseId: d.foundCaseId, score: d.score, breakdown: d.breakdown,
  reasons: d.reasons, publicReasons: d.publicReasons, status: 'suggested', createdAt: new Date()
});
const get = async (id) => col.get(id);
const update = async (id, patch) => col.update(id, patch);
const forCase = async (caseId, status) =>
  col.filter((m) => (m.lostCaseId === caseId || m.foundCaseId === caseId) && (!status || m.status === status)).sort((a, b) => b.score - a.score);
const findPair = async (lostCaseId, foundCaseId) => col.find((m) => m.lostCaseId === lostCaseId && m.foundCaseId === foundCaseId);
const listByStatus = async (status) => col.filter((m) => m.status === status).sort((a, b) => b.score - a.score);

module.exports = { create, get, update, forCase, findPair, listByStatus, _col: col };
