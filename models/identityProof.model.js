'use strict';
// ID card photos sent by people who register without a university e-mail address (AUTH-8 to AUTH-12).
// One row per photo. A person who is rejected and sends a new photo gets a new row, so the history of
// decisions stays. The image file itself is removed some days after the decision (`file` becomes null).
const { createCollection, paginate } = require('./collection');
const col = createCollection();

async function create({ userId, file }) {
  return col.insert({
    userId, file, status: 'submitted', submittedAt: new Date(),
    reviewedBy: null, reviewedAt: null, rejectCode: null, rejectNote: '', final: false,
    purgeAfter: null, purgedAt: null
  });
}
const findById = async (id) => col.get(id);
const update = async (id, patch) => col.update(id, patch);

const byUser = (userId) => col.filter((p) => p.userId === userId).sort((a, b) => b.id - a.id);
const latestByUser = async (userId) => byUser(userId)[0] || null;
const countByUser = async (userId) => col.count((p) => p.userId === userId);

// `eligible` is a Set of user ids allowed in the list (used to leave out people who have not confirmed
// their e-mail address yet); null means everyone.
async function list({ status, eligible = null, page = 1, pageSize = 15 } = {}) {
  const rows = col.filter((p) => (!status || p.status === status) && (!eligible || eligible.has(p.userId)))
    .sort((a, b) => (status === 'submitted' ? a.submittedAt - b.submittedAt : b.id - a.id));
  return paginate(rows, page, pageSize);
}
const all = async () => col.filter(() => true);

// Photos whose retention time has passed and that are still stored.
const listDue = async (now = new Date()) => col.filter((p) => p.file && p.purgeAfter && new Date(p.purgeAfter) <= now);

module.exports = { create, findById, update, latestByUser, countByUser, list, all, listDue, _col: col };
