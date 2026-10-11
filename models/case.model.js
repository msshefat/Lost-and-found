'use strict';
// A "case" is one report (lost or found), as in the ERD: CASE with its LOST ITEM or FOUND ITEM.
// Type-specific fields (finder, storageSlot, ...) are plain columns here; the PostgreSQL version
// may split them into lost_items / found_items tables without changing this interface.
const { createCollection, paginate } = require('./collection');
const col = createCollection();
const counters = {};

function nextRef(date) {
  const y = new Date(date).getFullYear();
  counters[y] = (counters[y] || 0) + 1;
  return `SF-${y}-${String(counters[y]).padStart(4, '0')}`;
}

async function create(d) {
  const now = d.createdAt || new Date();
  return col.insert({
    ref: nextRef(now), type: d.type, userId: d.userId, categoryId: d.categoryId, locationId: d.locationId,
    locationDetail: d.locationDetail || '', title: d.title, description: d.description, occurredAt: d.occurredAt,
    photo: d.photo || null, photoMime: d.photoMime || null, status: d.status, approvalRequired: !!d.approvalRequired,
    approval: null, review: null, finder: d.finder || null, storageSlot: d.storageSlot || null,
    retentionFlaggedAt: null, retentionResetAt: null, disposal: null, closeReason: null, closedAt: null, events: d.events || [],
    createdAt: now, updatedAt: now
  });
}
const findById = async (id) => col.get(id);
const findByRef = async (ref) => col.find((c) => c.ref === String(ref).toUpperCase());
const findByPhoto = async (file) => col.find((c) => c.photo === file);
const update = async (id, patch) => col.update(id, { ...patch, updatedAt: new Date() });

async function addEvent(id, event) {
  const c = col.get(id);
  if (!c) return null;
  c.events.push({ at: new Date(), staffOnly: false, ...event });
  return col.update(id, { events: c.events, updatedAt: new Date() });
}

// Filter + paginate. `publicSearch` matches title OR category OR location and is used only with
// public fields, so a search can never reveal text that exists only in a private description.
// It fails closed: titles are searched only in the categories listed in `titleCategoryIds`.
async function query({ type, statuses, userId, categoryId, locationId, locationIds, publicSearch, since, until, sort = 'newest', page = 1, pageSize = 20 } = {}) {
  const needle = publicSearch && publicSearch.text ? publicSearch.text.toLowerCase() : '';
  let rows = col.filter((c) =>
    (!type || c.type === type) && (!statuses || statuses.includes(c.status)) && (!userId || c.userId === userId) &&
    (!categoryId || c.categoryId === categoryId) && (!locationId || c.locationId === locationId) &&
    (!locationIds || locationIds.includes(c.locationId)) &&
    (!since || c.createdAt >= since) && (!until || c.createdAt <= until) &&
    (!needle || (c.title.toLowerCase().includes(needle) && (publicSearch.titleCategoryIds || []).includes(c.categoryId)) ||
      (publicSearch.categoryIds || []).includes(c.categoryId) ||
      (publicSearch.locationIds || []).includes(c.locationId))
  );
  rows.sort((a, b) => (sort === 'oldest' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));
  return paginate(rows, page, pageSize);
}
const count = async (f = {}) => col.count((c) =>
  (!f.type || c.type === f.type) && (!f.statuses || f.statuses.includes(c.status)) && (!f.userId || c.userId === f.userId));
const all = async () => col.filter(() => true);
const countByUserSince = async (userId, since) => col.count((c) => c.userId === userId && c.createdAt >= since);

module.exports = { create, findById, findByRef, findByPhoto, update, addEvent, query, count, all, countByUserSince, _col: col };
