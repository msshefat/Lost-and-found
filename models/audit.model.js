'use strict';
const { createCollection, paginate } = require('./collection');
const col = createCollection();
const CAP = 5000; // in-memory cap so a long-running demo cannot grow without bound

async function append(d) {
  const row = col.insert({
    userId: d.userId || null, actor: d.actor || 'system', role: d.role || null, action: d.action,
    entity: d.entity || '', detail: d.detail || '', ip: d.ip || '', at: new Date()
  });
  if (col.count() > CAP) {
    const oldest = col.filter(() => true).sort((a, b) => a.id - b.id)[0];
    if (oldest) col.remove(oldest.id);
  }
  return row;
}
async function list({ action, q, page = 1, pageSize = 25 } = {}) {
  const needle = q ? String(q).toLowerCase() : '';
  const rows = col.filter((r) =>
    (!action || r.action === action) &&
    (!needle || r.actor.toLowerCase().includes(needle) || r.entity.toLowerCase().includes(needle) || r.detail.toLowerCase().includes(needle))
  ).sort((a, b) => b.id - a.id);
  return paginate(rows, page, pageSize);
}
const actions = async () => [...new Set(col.filter(() => true).map((r) => r.action))].sort();

module.exports = { append, list, actions, _col: col };
