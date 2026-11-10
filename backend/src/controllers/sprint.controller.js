const Sprint = require('../models/Sprint');
const Issue = require('../models/Issue');
const Project = require('../models/Project');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { SPRINT_STATUSES, AUDIT_ACTIONS } = require('../config/constants');
const { logAudit } = require('../services/audit.service');
const { dispatchWebhook } = require('../services/notification.service');

// @desc    Get sprints for project
// @route   GET /api/v1/sprints
// @access  Private (tenant member)
const getSprints = asyncHandler(async (req, res, next) => {
  const { projectId } = req.query;

  const query = { organization: req.organization._id };
  if (projectId) query.project = projectId;

  const sprints = await Sprint.find(query)
    .populate('project', 'name key')
    .sort({ createdAt: -1 });

  // Attach issue count stats per sprint
  const sprintWithStats = await Promise.all(
    sprints.map(async (s) => {
      const totalIssues = await Issue.countDocuments({ sprint: s._id });
      const completedIssues = await Issue.countDocuments({
        sprint: s._id,
        status: 'done',
      });
      return {
        ...s.toObject(),
        totalIssues,
        completedIssues,
        progress: totalIssues ? Math.round((completedIssues / totalIssues) * 100) : 0,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: sprintWithStats,
  });
});

// @desc    Create sprint
// @route   POST /api/v1/sprints
// @access  Private (tenant member)
const createSprint = asyncHandler(async (req, res, next) => {
  const { projectId, name, goal, startDate, endDate } = req.body;

  if (!projectId || !name) {
    return next(new ApiError(400, 'Project ID and Sprint name are required'));
  }

  const project = await Project.findOne({
    _id: projectId,
    organization: req.organization._id,
  });

  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const sprint = await Sprint.create({
    project: projectId,
    organization: req.organization._id,
    name,
    goal: goal || '',
    startDate: startDate || null,
    endDate: endDate || null,
    createdBy: req.user._id,
  });

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Sprint',
    entityId: sprint._id,
    entityName: sprint.name,
    req,
  });

  res.status(201).json({
    success: true,
    data: sprint,
    message: 'Sprint created successfully',
  });
});

// @desc    Start sprint (Set to active)
// @route   POST /api/v1/sprints/:id/start
// @access  Private (tenant member)
const startSprint = asyncHandler(async (req, res, next) => {
  const sprint = await Sprint.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!sprint) {
    return next(new ApiError(404, 'Sprint not found'));
  }

  // Ensure no other active sprint exists for this project
  const activeSprint = await Sprint.findOne({
    project: sprint.project,
    status: SPRINT_STATUSES.ACTIVE,
  });

  if (activeSprint) {
    return next(
      new ApiError(
        400,
        `Cannot start sprint. Sprint '${activeSprint.name}' is currently active.`
      )
    );
  }

  sprint.status = SPRINT_STATUSES.ACTIVE;
  sprint.startDate = sprint.startDate || new Date();
  await sprint.save();

  await dispatchWebhook(req.organization._id, 'sprint.started', sprint);
  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.START_SPRINT,
    entityType: 'Sprint',
    entityId: sprint._id,
    entityName: sprint.name,
    req,
  });

  res.status(200).json({
    success: true,
    data: sprint,
    message: `Sprint '${sprint.name}' is now active`,
  });
});

// @desc    Complete sprint
// @route   POST /api/v1/sprints/:id/complete
// @access  Private (tenant member)
const completeSprint = asyncHandler(async (req, res, next) => {
  const { moveToBacklog = true, moveToSprintId = null } = req.body;

  const sprint = await Sprint.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!sprint) {
    return next(new ApiError(404, 'Sprint not found'));
  }

  sprint.status = SPRINT_STATUSES.COMPLETED;
  sprint.endDate = new Date();
  await sprint.save();

  // Move incomplete issues to next sprint or backlog
  if (moveToSprintId) {
    await Issue.updateMany(
      { sprint: sprint._id, status: { $ne: 'done' } },
      { $set: { sprint: moveToSprintId } }
    );
  } else if (moveToBacklog) {
    await Issue.updateMany(
      { sprint: sprint._id, status: { $ne: 'done' } },
      { $unset: { sprint: '' } }
    );
  }

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.COMPLETE_SPRINT,
    entityType: 'Sprint',
    entityId: sprint._id,
    entityName: sprint.name,
    req,
  });

  res.status(200).json({
    success: true,
    data: sprint,
    message: `Sprint '${sprint.name}' completed`,
  });
});

module.exports = {
  getSprints,
  createSprint,
  startSprint,
  completeSprint,
};

