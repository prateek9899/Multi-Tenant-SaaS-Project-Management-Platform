const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/audit.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect, tenantMiddleware);

router.get('/', requireRole(ROLES.OWNER, ROLES.ADMIN), getAuditLogs);

module.exports = router;

