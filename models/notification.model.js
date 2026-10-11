'use strict';
// Messages are stored as a locale key plus parameters, not as finished text, so the language
// toggle also changes old notifications.
const { createCollection, paginate } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({ userId: d.userId, key: d.key, params: d.params || {}, link: d.link || null, read: false, createdAt: new Date() });
const forUser = async (userId, { page = 1, pageSize = 20 } = {}) =>
  paginate(col.filter((n) => n.userId === userId).sort((a, b) => b.createdAt - a.createdAt), page, pageSize);
const recent = async (userId, n = 5) => col.filter((x) => x.userId === userId).sort((a, b) => b.createdAt - a.createdAt).slice(0, n);
const countUnread = async (userId) => col.count((n) => n.userId === userId && !n.read);
const markAllRead = async (userId) => col.filter((n) => n.userId === userId && !n.read).forEach((n) => col.update(n.id, { read: true }));

module.exports = { create, forUser, recent, countUnread, markAllRead, _col: col };
