const express = require('express');
const router = express.Router();
const {
  getSprints,
  createSprint,
  startSprint,
  completeSprint,
} = require('../controllers/sprint.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect, tenantMiddleware);

router.route('/')
  .get(getSprints)
  .post(requireRole(ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER), createSprint);

router.post('/:id/start', requireRole(ROLES.OWNER, ROLES.ADMIN), startSprint);
router.post('/:id/complete', requireRole(ROLES.OWNER, ROLES.ADMIN), completeSprint);

module.exports = router;

