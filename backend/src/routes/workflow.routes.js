const express = require('express');
const router = express.Router();
const {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
} = require('../controllers/workflow.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect, tenantMiddleware);

router.route('/')
  .get(getWorkflows)
  .post(requireRole(ROLES.OWNER, ROLES.ADMIN), createWorkflow);

router.put('/:id', requireRole(ROLES.OWNER, ROLES.ADMIN), updateWorkflow);

module.exports = router;

