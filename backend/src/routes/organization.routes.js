const express = require('express');
const router = express.Router();
const {
  createOrganization,
  getUserOrganizations,
  getOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/organization.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect);

router.route('/')
  .post(createOrganization)
  .get(getUserOrganizations);

router.get('/members', tenantMiddleware, getMembers);
router.post(
  '/members/invite',
  tenantMiddleware,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  inviteMember
);
router.delete(
  '/members/:userId',
  tenantMiddleware,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  removeMember
);
router.put(
  '/members/:userId/role',
  tenantMiddleware,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  updateMemberRole
);

router.route('/:idOrSlug')
  .get(getOrganization)
  .put(tenantMiddleware, requireRole(ROLES.OWNER, ROLES.ADMIN), updateOrganization);

module.exports = router;

