'use strict';
const { createCollection } = require('./collection');
const col = createCollection();

const create = async (d) => col.insert({
  building: d.building, buildingBn: d.buildingBn || '', name: d.name, nameBn: d.nameBn || '',
  lat: d.lat ?? null, lng: d.lng ?? null, active: d.active !== false
});
const get = async (id) => col.get(id);
const update = async (id, patch) => col.update(id, patch);
const list = async ({ activeOnly = false } = {}) =>
  col.filter((l) => !activeOnly || l.active).sort((a, b) => (a.building + a.name).localeCompare(b.building + b.name));

module.exports = { create, get, update, list, _col: col };
