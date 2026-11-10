const Workflow = require('../models/Workflow');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get organization workflows
// @route   GET /api/v1/workflows
// @access  Private (tenant member)
const getWorkflows = asyncHandler(async (req, res) => {
  const workflows = await Workflow.find({
    organization: req.organization._id,
  });

  res.status(200).json({
    success: true,
    data: workflows,
  });
});

// @desc    Create custom workflow
// @route   POST /api/v1/workflows
// @access  Private (Owner/Admin)
const createWorkflow = asyncHandler(async (req, res, next) => {
  const { name, statuses, transitions } = req.body;

  if (!name || !statuses || statuses.length === 0) {
    return next(new ApiError(400, 'Workflow name and statuses are required'));
  }

  const workflow = await Workflow.create({
    organization: req.organization._id,
    name,
    statuses,
    transitions: transitions || [],
  });

  res.status(201).json({
    success: true,
    data: workflow,
    message: 'Workflow created successfully',
  });
});

// @desc    Update workflow
// @route   PUT /api/v1/workflows/:id
// @access  Private (Owner/Admin)
const updateWorkflow = asyncHandler(async (req, res, next) => {
  const { name, statuses, transitions } = req.body;

  const workflow = await Workflow.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!workflow) {
    return next(new ApiError(404, 'Workflow not found'));
  }

  if (name) workflow.name = name;
  if (statuses) workflow.statuses = statuses;
  if (transitions) workflow.transitions = transitions;

  await workflow.save();

  res.status(200).json({
    success: true,
    data: workflow,
    message: 'Workflow updated successfully',
  });
});

module.exports = {
  getWorkflows,
  createWorkflow,
  updateWorkflow,
};

