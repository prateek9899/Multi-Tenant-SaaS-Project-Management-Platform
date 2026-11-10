const express = require('express');
const router = express.Router();
const {
  getBoard,
  createColumn,
  updateColumn,
  deleteColumn,
} = require('../controllers/board.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect, tenantMiddleware);

router.get('/:id', getBoard);
router.post('/:id/columns', requireRole(ROLES.OWNER, ROLES.ADMIN), createColumn);
router.put('/columns/:columnId', requireRole(ROLES.OWNER, ROLES.ADMIN), updateColumn);
router.delete('/columns/:columnId', requireRole(ROLES.OWNER, ROLES.ADMIN), deleteColumn);

module.exports = router;

