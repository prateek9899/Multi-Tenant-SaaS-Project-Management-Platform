const Project = require('../models/Project');
const Board = require('../models/Board');
const Column = require('../models/Column');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');
const { AUDIT_ACTIONS } = require('../config/constants');

// @desc    Get all projects in organization
// @route   GET /api/v1/projects
// @access  Private (tenant member)
const getProjects = asyncHandler(async (req, res) => {
  const projects = await Project.find({
    organization: req.organization._id,
    status: { $ne: 'deleted' },
  })
    .populate('lead', 'firstName lastName email avatar')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: projects,
  });
});

// @desc    Create project
// @route   POST /api/v1/projects
// @access  Private (Owner/Admin)
const createProject = asyncHandler(async (req, res, next) => {
  const { name, key, description, leadId, projectType = 'kanban' } = req.body;

  if (!name || !key) {
    return next(new ApiError(400, 'Project name and key are required'));
  }

  // Check plan limits
  const currentCount = await Project.countDocuments({
    organization: req.organization._id,
    status: { $ne: 'deleted' },
  });

  if (currentCount >= req.organization.maxProjects) {
    return next(
      new ApiError(
        403,
        `Your plan limit allows maximum ${req.organization.maxProjects} projects. Upgrade your plan to create more projects.`
      )
    );
  }

  const existingProject = await Project.findOne({
    organization: req.organization._id,
    key: key.toUpperCase(),
  });

  if (existingProject) {
    return next(new ApiError(400, `Project key '${key}' is already in use in this workspace`));
  }

  const project = await Project.create({
    organization: req.organization._id,
    name,
    key: key.toUpperCase(),
    description: description || '',
    lead: leadId || req.user._id,
    projectType,
    createdBy: req.user._id,
  });

  // Auto-generate default Kanban Board with columns
  const defaultBoard = await Board.create({
    project: project._id,
    name: `${project.name} Board`,
    description: 'Main project Kanban board',
    isDefault: true,
  });

  const columnsData = [
    { name: 'To Do', position: 0, color: '#94a3b8', columnType: 'todo' },
    { name: 'In Progress', position: 1, color: '#3b82f6', columnType: 'in_progress' },
    { name: 'In Review', position: 2, color: '#f59e0b', columnType: 'in_review' },
    { name: 'Done', position: 3, color: '#10b981', columnType: 'done' },
  ];

  for (const col of columnsData) {
    await Column.create({
      board: defaultBoard._id,
      ...col,
    });
  }

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Project',
    entityId: project._id,
    entityName: project.name,
    req,
  });

  res.status(201).json({
    success: true,
    data: project,
    message: 'Project created successfully with default board',
  });
});

// @desc    Get single project details & statistics
// @route   GET /api/v1/projects/:id
// @access  Private (tenant member)
const getProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  }).populate('lead', 'firstName lastName email avatar');

  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  // Get issue stats
  const totalIssues = await Issue.countDocuments({ project: project._id });
  const doneIssues = await Issue.countDocuments({ project: project._id, status: 'done' });
  const inProgressIssues = await Issue.countDocuments({
    project: project._id,
    status: { $in: ['in_progress', 'in_review'] },
  });

  res.status(200).json({
    success: true,
    data: {
      ...project.toObject(),
      stats: {
        totalIssues,
        doneIssues,
        inProgressIssues,
        completionRate: totalIssues ? Math.round((doneIssues / totalIssues) * 100) : 0,
      },
    },
  });
});

// @desc    Update project
// @route   PUT /api/v1/projects/:id
// @access  Private (Owner/Admin)
const updateProject = asyncHandler(async (req, res, next) => {
  const { name, description, lead, status } = req.body;

  const project = await Project.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  if (name) project.name = name;
  if (description !== undefined) project.description = description;
  if (lead) project.lead = lead;
  if (status) project.status = status;

  await project.save();

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Project',
    entityId: project._id,
    entityName: project.name,
    req,
  });

  res.status(200).json({
    success: true,
    data: project,
    message: 'Project updated successfully',
  });
});

// @desc    Delete project (soft delete)
// @route   DELETE /api/v1/projects/:id
// @access  Private (Owner/Admin)
const deleteProject = asyncHandler(async (req, res, next) => {
  const project = await Project.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  project.status = 'deleted';
  await project.save();

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.DELETE,
    entityType: 'Project',
    entityId: project._id,
    entityName: project.name,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Project removed successfully',
  });
});

module.exports = {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
};

