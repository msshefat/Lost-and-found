'use strict';
const { createCollection } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({
  name: d.name, nameBn: d.nameBn || '', description: d.description || '', icon: d.icon || 'box',
  sensitive: !!d.sensitive, highValue: !!d.highValue, requiresApproval: !!d.requiresApproval, active: d.active !== false
});
const get = async (id) => col.get(id);
const update = async (id, patch) => col.update(id, patch);
const list = async ({ activeOnly = false } = {}) =>
  col.filter((c) => !activeOnly || c.active).sort((a, b) => a.name.localeCompare(b.name));
const findByName = async (name) => col.find((c) => c.name.toLowerCase() === String(name).trim().toLowerCase());

module.exports = { create, get, update, list, findByName, _col: col };
