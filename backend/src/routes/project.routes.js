const express = require('express');
const router = express.Router();
const {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/project.controller');
const { getProjectBoards } = require('../controllers/board.controller');
const { protect } = require('../middleware/auth.middleware');
const { tenantMiddleware } = require('../middleware/tenant.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { ROLES } = require('../config/constants');

router.use(protect, tenantMiddleware);

router.route('/')
  .get(getProjects)
  .post(requireRole(ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER), createProject);

router.route('/:id')
  .get(getProject)
  .put(requireRole(ROLES.OWNER, ROLES.ADMIN), updateProject)
  .delete(requireRole(ROLES.OWNER, ROLES.ADMIN), deleteProject);

router.get('/:projectId/boards', getProjectBoards);

module.exports = router;

