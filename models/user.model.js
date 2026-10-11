'use strict';
const { createCollection, paginate } = require('./collection');
const col = createCollection();

const norm = (e) => String(e || '').trim().toLowerCase();

async function create(data) {
  return col.insert({
    name: data.name, email: norm(data.email), passwordHash: data.passwordHash,
    role: data.role, affiliation: data.affiliation || null, universityId: data.universityId || null,
    phone: data.phone || null, status: data.status, emailVerified: !!data.emailVerified,
    verificationMethod: data.verificationMethod === 'id_card' ? 'id_card' : 'university_email',
    lang: data.lang === 'bn' ? 'bn' : 'en', passwordChangedAt: null, createdAt: data.createdAt || new Date(), lastLoginAt: null
  });
}
const findById = async (id) => col.get(id);
const findByEmail = async (email) => col.find((u) => u.email === norm(email));
const findByUniversityId = async (uid) => col.find((u) => u.universityId && u.universityId.toLowerCase() === String(uid).toLowerCase());
const update = async (id, patch) => col.update(id, patch);

async function list({ role, status, q, page = 1, pageSize = 15 } = {}) {
  const needle = q ? String(q).toLowerCase() : '';
  const rows = col.filter((u) =>
    (!role || u.role === role) && (!status || u.status === status) &&
    (!needle || u.name.toLowerCase().includes(needle) || u.email.includes(needle) || (u.universityId || '').toLowerCase().includes(needle))
  ).sort((a, b) => b.createdAt - a.createdAt);
  return paginate(rows, page, pageSize);
}
// Ids of people who joined by `method` and have confirmed their e-mail address (used by the ID review queue).
const idsVerifiedBy = async (method) => col.filter((u) => u.verificationMethod === method && u.emailVerified).map((u) => u.id);
const count = async (filter = {}) => col.count((u) => Object.entries(filter).every(([k, v]) => u[k] === v));
const listByRole = async (role) => col.filter((u) => u.role === role && u.status === 'active');

module.exports = { create, findById, findByEmail, findByUniversityId, update, list, count, listByRole, idsVerifiedBy, _col: col };
