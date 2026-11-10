const Board = require('../models/Board');
const Column = require('../models/Column');
const Project = require('../models/Project');
const Issue = require('../models/Issue');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get boards for a project
// @route   GET /api/v1/projects/:projectId/boards
// @access  Private (tenant member)
const getProjectBoards = asyncHandler(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findOne({
    _id: projectId,
    organization: req.organization._id,
  });

  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  const boards = await Board.find({ project: projectId });

  res.status(200).json({
    success: true,
    data: boards,
  });
});

// @desc    Get single board with columns and populated issues
// @route   GET /api/v1/boards/:id
// @access  Private (tenant member)
const getBoard = asyncHandler(async (req, res, next) => {
  const board = await Board.findById(req.params.id);
  if (!board) {
    return next(new ApiError(404, 'Board not found'));
  }

  // Verify project belongs to organization
  const project = await Project.findOne({
    _id: board.project,
    organization: req.organization._id,
  });

  if (!project) {
    return next(new ApiError(403, 'Unauthorized access to board'));
  }

  const columns = await Column.find({ board: board._id }).sort({ position: 1 });

  // Get issues for board
  const issues = await Issue.find({
    project: project._id,
    column: { $in: columns.map((c) => c._id) },
  })
    .populate('assignee', 'firstName lastName email avatar')
    .populate('reporter', 'firstName lastName email avatar')
    .populate('sprint', 'name status')
    .sort({ position: 1 });

  // Group issues by column for Kanban rendering
  const columnsWithIssues = columns.map((col) => {
    const colIssues = issues.filter(
      (issue) => issue.column && issue.column.toString() === col._id.toString()
    );
    return {
      ...col.toObject(),
      issues: colIssues,
      issueCount: colIssues.length,
    };
  });

  res.status(200).json({
    success: true,
    data: {
      board,
      project,
      columns: columnsWithIssues,
    },
  });
});

// @desc    Create a column on board
// @route   POST /api/v1/boards/:id/columns
// @access  Private (Owner/Admin)
const createColumn = asyncHandler(async (req, res, next) => {
  const { name, color, wipLimit, columnType = 'custom' } = req.body;
  const boardId = req.params.id;

  const board = await Board.findById(boardId);
  if (!board) {
    return next(new ApiError(404, 'Board not found'));
  }

  const count = await Column.countDocuments({ board: boardId });

  const column = await Column.create({
    board: boardId,
    name,
    position: count,
    color: color || '#6B7280',
    wipLimit: wipLimit || null,
    columnType,
  });

  res.status(201).json({
    success: true,
    data: column,
    message: 'Column created successfully',
  });
});

// @desc    Update column
// @route   PUT /api/v1/boards/columns/:columnId
// @access  Private (Owner/Admin)
const updateColumn = asyncHandler(async (req, res, next) => {
  const { name, color, wipLimit } = req.body;
  const column = await Column.findById(req.params.columnId);

  if (!column) {
    return next(new ApiError(404, 'Column not found'));
  }

  if (name) column.name = name;
  if (color) column.color = color;
  if (wipLimit !== undefined) column.wipLimit = wipLimit;

  await column.save();

  res.status(200).json({
    success: true,
    data: column,
  });
});

// @desc    Delete column
// @route   DELETE /api/v1/boards/columns/:columnId
// @access  Private (Owner/Admin)
const deleteColumn = asyncHandler(async (req, res, next) => {
  const column = await Column.findById(req.params.columnId);

  if (!column) {
    return next(new ApiError(404, 'Column not found'));
  }

  // Check if column has issues
  const issueCount = await Issue.countDocuments({ column: column._id });
  if (issueCount > 0) {
    return next(
      new ApiError(
        400,
        `Cannot delete column with ${issueCount} existing issues. Move issues before deleting.`
      )
    );
  }

  await Column.findByIdAndDelete(column._id);

  res.status(200).json({
    success: true,
    message: 'Column deleted successfully',
  });
});

module.exports = {
  getProjectBoards,
  getBoard,
  createColumn,
  updateColumn,
  deleteColumn,
};

