'use strict';
// Staff-only notes on a case, including CCTV review (an optional step, per the use case diagram).
const { query, one } = require('../db');
const { id, dt } = require('../db/shape');

function toNote(row) {
  if (!row) return null;
  return {
    id: id(row.id), caseId: id(row.case_id), userId: id(row.user_id), kind: row.kind,
    camera: row.camera || '', windowFrom: dt(row.window_from), windowTo: dt(row.window_to),
    findings: row.findings, createdAt: dt(row.created_at)
  };
}

async function create(d) {
  const row = await one(
    `INSERT INTO investigations (case_id, user_id, kind, camera, window_from, window_to, findings, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [
      Number(d.caseId), Number(d.userId), d.kind || 'note', d.camera || '',
      d.windowFrom || null, d.windowTo || null, d.findings, d.createdAt || new Date()
    ]
  );
  return toNote(row);
}

const forCase = async (caseId) => (await query(
  'SELECT * FROM investigations WHERE case_id = $1 ORDER BY created_at DESC, id DESC',
  [Number(caseId)]
)).map(toNote);

module.exports = { create, forCase };
