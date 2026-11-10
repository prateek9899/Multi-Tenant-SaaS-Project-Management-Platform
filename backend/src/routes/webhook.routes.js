const express = require('express');
const router = express.Router();
const {
  getWebhooks,
  createWebhook,
  getWebhookDeliveries,
  deleteWebhook,
} = require('../controllers/webhook.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect, tenantMiddleware);

router.route('/')
  .get(requireRole(ROLES.OWNER, ROLES.ADMIN), getWebhooks)
  .post(requireRole(ROLES.OWNER, ROLES.ADMIN), createWebhook);

router.get('/:id/deliveries', requireRole(ROLES.OWNER, ROLES.ADMIN), getWebhookDeliveries);
router.delete('/:id', requireRole(ROLES.OWNER, ROLES.ADMIN), deleteWebhook);

module.exports = router;

