'use strict';
const router = require('express').Router();
const { requireRole } = require('../middleware/auth');
const approver = require('../controllers/approver.controller');
const { ROLES } = require('../config/roles');

router.use(requireRole(ROLES.APPROVER));
router.get('/', approver.queue);
router.get('/history', approver.queue);
router.get('/cases/:ref', approver.caseDetail);
router.post('/cases/:ref/decision', approver.decide);

module.exports = router;
