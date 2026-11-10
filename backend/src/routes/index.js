const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const organizationRoutes = require('./organization.routes');
const projectRoutes = require('./project.routes');
const boardRoutes = require('./board.routes');
const issueRoutes = require('./issue.routes');
const sprintRoutes = require('./sprint.routes');
const workflowRoutes = require('./workflow.routes');
const webhookRoutes = require('./webhook.routes');
const billingRoutes = require('./billing.routes');
const auditRoutes = require('./audit.routes');
const notificationRoutes = require('./notification.routes');

router.use('/auth', authRoutes);
router.use('/organizations', organizationRoutes);
router.use('/projects', projectRoutes);
router.use('/boards', boardRoutes);
router.use('/issues', issueRoutes);
router.use('/sprints', sprintRoutes);
router.use('/workflows', workflowRoutes);
router.use('/webhooks', webhookRoutes);
router.use('/billing', billingRoutes);
router.use('/audit', auditRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;

