const express = require('express');
const router = express.Router();
const {
  getPlans,
  subscribePlan,
  getInvoices,
  handleStripeWebhook,
} = require('../controllers/billing.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.get('/plans', getPlans);
router.post('/webhook', handleStripeWebhook);

router.post(
  '/subscribe',
  protect,
  tenantMiddleware,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  subscribePlan
);

router.get(
  '/invoices',
  protect,
  tenantMiddleware,
  requireRole(ROLES.OWNER, ROLES.ADMIN),
  getInvoices
);

module.exports = router;

