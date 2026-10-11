'use strict';
// Account administration (FR-22). Every change is audited (FR-23, NFR-10).
const { ROLES } = require('../config/roles');
const { USER, VERIFY, ID_PROOF } = require('../config/statuses');
const userModel = require('../models/user.model');
const proofModel = require('../models/identityProof.model');
const audit = require('./audit.service');
const notifications = require('./notification.service');
const realtime = require('./realtime.service');

class UserError extends Error {
  constructor(code) { super(code); this.name = 'UserError'; this.code = code; }
}

const list = (filters) => userModel.list(filters);

async function approve(admin, id, ip = '') {
  const user = await userModel.findById(id);
  if (!user) throw new UserError('NOT_FOUND');
  if (user.status !== USER.PENDING || !user.emailVerified) throw new UserError('NOT_PENDING');
  // An ID-card account is opened only by deciding on its photo (AUTH-10), never by this shortcut.
  if (user.verificationMethod === VERIFY.ID_CARD) throw new UserError('ID_REVIEW_REQUIRED');
  await userModel.update(user.id, { status: USER.ACTIVE });
  await notifications.notify(user.id, 'notif_account_approved', {}, '/dashboard', { email: true });
  await audit.record(admin, 'admin.user_approved', user.email, '', ip);
}

async function suspend(admin, id, ip = '') {
  const user = await userModel.findById(id);
  if (!user) throw new UserError('NOT_FOUND');
  if (user.id === admin.id) throw new UserError('SELF');
  if (user.role === ROLES.ADMIN && user.status === USER.ACTIVE) {
    const active = (await userModel.listByRole(ROLES.ADMIN)).length;
    if (active <= 1) throw new UserError('LAST_ADMIN');
  }
  await userModel.update(user.id, { status: USER.SUSPENDED });
  realtime.disconnectUser(user.id);
  await audit.record(admin, 'admin.user_suspended', user.email, '', ip);
}

async function reactivate(admin, id, ip = '') {
  const user = await userModel.findById(id);
  if (!user) throw new UserError('NOT_FOUND');
  if (user.status !== USER.SUSPENDED) throw new UserError('NOT_SUSPENDED');
  // A person who never finished verification or setting a password stays pending. So does an ID-card
  // account whose photo was never approved: suspending and reactivating must not skip the check (AUTH-10).
  let identityOk = true;
  if (user.verificationMethod === VERIFY.ID_CARD) {
    const proof = await proofModel.latestByUser(user.id);
    identityOk = Boolean(proof && proof.status === ID_PROOF.APPROVED);
  }
  const status = user.emailVerified && user.passwordHash && identityOk ? USER.ACTIVE : USER.PENDING;
  await userModel.update(user.id, { status });
  await audit.record(admin, 'admin.user_reactivated', user.email, '', ip);
}

async function updateProfile(user, { name, phone, lang }, ip = '') {
  const patch = { name, phone: phone || null };
  if (lang === 'bn' || lang === 'en') patch.lang = lang;
  const updated = await userModel.update(user.id, patch);
  await audit.record(user, 'account.profile_updated', user.email, '', ip);
  return updated;
}

async function counts() {
  const [members, security, approver, admin, pending, suspended] = await Promise.all([
    userModel.count({ role: ROLES.MEMBER }), userModel.count({ role: ROLES.SECURITY }),
    userModel.count({ role: ROLES.APPROVER }), userModel.count({ role: ROLES.ADMIN }),
    userModel.count({ status: USER.PENDING }), userModel.count({ status: USER.SUSPENDED })
  ]);
  return { members, security, approver, admin, pending, suspended, total: members + security + approver + admin };
}

module.exports = { UserError, list, approve, suspend, reactivate, updateProfile, counts };
