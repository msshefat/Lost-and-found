'use strict';
// System configuration that the administrator can change at runtime (FR-22).
let settings = {
  retentionDays: 90,
  matchThreshold: 40,
  weights: { category: 30, description: 35, location: 20, time: 15 },
  handoverValidDays: 7
};
const get = async () => structuredClone(settings);
const set = async (patch) => { settings = { ...settings, ...structuredClone(patch) }; return structuredClone(settings); };

module.exports = { get, set };
