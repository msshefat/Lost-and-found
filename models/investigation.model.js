'use strict';
// Staff-only notes on a case, including CCTV review (an optional step, per the use case diagram).
const { createCollection } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({
  caseId: d.caseId, userId: d.userId, kind: d.kind || 'note', camera: d.camera || '',
  windowFrom: d.windowFrom || null, windowTo: d.windowTo || null, findings: d.findings, createdAt: d.createdAt || new Date()
});
const forCase = async (caseId) => col.filter((n) => n.caseId === caseId).sort((a, b) => b.createdAt - a.createdAt);

module.exports = { create, forCase, _col: col };
