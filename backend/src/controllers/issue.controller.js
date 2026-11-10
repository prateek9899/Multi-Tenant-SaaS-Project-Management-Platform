const Issue = require('../models/Issue');
const Column = require('../models/Column');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Attachment = require('../models/Attachment');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');
const { createNotification, dispatchWebhook } = require('../services/notification.service');
const { AUDIT_ACTIONS } = require('../config/constants');

// @desc    Get all issues with filters
// @route   GET /api/v1/issues
// @access  Private (tenant member)
const getIssues = asyncHandler(async (req, res) => {
  const {
    projectId,
    status,
    priority,
    issueType,
    assignee,
    sprint,
    search,
  } = req.query;

  const query = { organization: req.organization._id };

  if (projectId) query.project = projectId;
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (issueType) query.issueType = issueType;
  if (assignee) query.assignee = assignee;
  if (sprint) query.sprint = sprint;

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { key: { $regex: search, $options: 'i' } },
    ];
  }

  const issues = await Issue.find(query)
    .populate('assignee', 'firstName lastName email avatar')
    .populate('reporter', 'firstName lastName email avatar')
    .populate('project', 'name key')
    .populate('sprint', 'name status')
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    data: issues,
  });
});

// @desc    Create new issue
// @route   POST /api/v1/issues
// @access  Private (tenant member)
const createIssue = asyncHandler(async (req, res, next) => {
  const {
    projectId,
    boardId,
    columnId,
    sprintId,
    issueType,
    title,
    description,
    priority,
    assignee,
    storyPoints,
    labels,
    dueDate,
  } = req.body;

  if (!projectId || !title) {
    return next(new ApiError(400, 'Project and title are required'));
  }

  const project = await Project.findOne({
    _id: projectId,
    organization: req.organization._id,
  });

  if (!project) {
    return next(new ApiError(404, 'Project not found'));
  }

  // Determine initial column if not provided
  let initialColumn = columnId;
  if (!initialColumn && boardId) {
    const firstCol = await Column.findOne({ board: boardId }).sort({ position: 1 });
    if (firstCol) initialColumn = firstCol._id;
  }

  // Count issues in column for positioning
  let position = 0;
  if (initialColumn) {
    position = await Issue.countDocuments({ column: initialColumn });
  }

  const issue = await Issue.create({
    project: projectId,
    organization: req.organization._id,
    board: boardId || null,
    column: initialColumn || null,
    sprint: sprintId || null,
    issueType: issueType || 'task',
    title,
    description: description || '',
    priority: priority || 'medium',
    assignee: assignee || null,
    reporter: req.user._id,
    storyPoints: storyPoints || null,
    labels: labels || [],
    dueDate: dueDate || null,
    position,
  });

  await issue.populate([
    { path: 'assignee', select: 'firstName lastName email avatar' },
    { path: 'reporter', select: 'firstName lastName email avatar' },
    { path: 'project', select: 'name key' },
  ]);

  // If assigned, send notification
  if (assignee && assignee.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: assignee,
      organizationId: req.organization._id,
      type: 'issue_assigned',
      title: 'New Issue Assigned',
      message: `${req.user.fullName} assigned you to ${issue.key}: ${issue.title}`,
      data: { issueId: issue._id, issueKey: issue.key },
    });
  }

  // Dispatch outgoing webhook & audit log
  await dispatchWebhook(req.organization._id, 'issue.created', issue);
  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Issue',
    entityId: issue._id,
    entityName: issue.key,
    req,
  });

  res.status(201).json({
    success: true,
    data: issue,
    message: 'Issue created successfully',
  });
});

// @desc    Get issue details with comments and attachments
// @route   GET /api/v1/issues/:id
// @access  Private (tenant member)
const getIssue = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  })
    .populate('assignee', 'firstName lastName email avatar')
    .populate('reporter', 'firstName lastName email avatar')
    .populate('project', 'name key')
    .populate('sprint', 'name status')
    .populate('column', 'name columnType');

  if (!issue) {
    return next(new ApiError(404, 'Issue not found'));
  }

  const comments = await Comment.find({ issue: issue._id })
    .populate('author', 'firstName lastName email avatar')
    .sort({ createdAt: 1 });

  const attachments = await Attachment.find({ issue: issue._id })
    .populate('uploadedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      ...issue.toObject(),
      comments,
      attachments,
    },
  });
});

// @desc    Update issue
// @route   PUT /api/v1/issues/:id
// @access  Private (tenant member)
const updateIssue = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!issue) {
    return next(new ApiError(404, 'Issue not found'));
  }

  const oldAssignee = issue.assignee?.toString();

  const updatableFields = [
    'title',
    'description',
    'status',
    'priority',
    'issueType',
    'assignee',
    'sprint',
    'storyPoints',
    'labels',
    'dueDate',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      issue[field] = req.body[field];
    }
  });

  await issue.save();
  await issue.populate([
    { path: 'assignee', select: 'firstName lastName email avatar' },
    { path: 'reporter', select: 'firstName lastName email avatar' },
  ]);

  // Check if assignee changed
  if (
    req.body.assignee &&
    req.body.assignee !== oldAssignee &&
    req.body.assignee !== req.user._id.toString()
  ) {
    await createNotification({
      userId: req.body.assignee,
      organizationId: req.organization._id,
      type: 'issue_assigned',
      title: 'Issue Assigned to You',
      message: `${req.user.fullName} assigned you to ${issue.key}: ${issue.title}`,
      data: { issueId: issue._id },
    });
  }

  await dispatchWebhook(req.organization._id, 'issue.updated', issue);
  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Issue',
    entityId: issue._id,
    entityName: issue.key,
    changes: req.body,
    req,
  });

  res.status(200).json({
    success: true,
    data: issue,
    message: 'Issue updated successfully',
  });
});

// @desc    Move issue (Drag and Drop in Kanban)
// @route   POST /api/v1/issues/:id/move
// @access  Private (tenant member)
const moveIssue = asyncHandler(async (req, res, next) => {
  const { targetColumnId, newPosition } = req.body;

  const issue = await Issue.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!issue) {
    return next(new ApiError(404, 'Issue not found'));
  }

  const targetColumn = await Column.findById(targetColumnId);
  if (!targetColumn) {
    return next(new ApiError(404, 'Target column not found'));
  }

  // Update WIP limit check
  if (targetColumn.wipLimit) {
    const currentCount = await Issue.countDocuments({
      column: targetColumnId,
      _id: { $ne: issue._id },
    });
    if (currentCount >= targetColumn.wipLimit) {
      return next(
        new ApiError(
          400,
          `Cannot move issue. Column WIP limit reached (${targetColumn.wipLimit} issues maximum).`
        )
      );
    }
  }

  const oldColumnId = issue.column;
  issue.column = targetColumnId;
  issue.position = typeof newPosition === 'number' ? newPosition : 0;

  // Set issue status based on column category
  if (targetColumn.columnType === 'done') {
    issue.status = 'done';
  } else if (targetColumn.columnType === 'todo') {
    issue.status = 'todo';
  } else if (targetColumn.columnType === 'in_progress') {
    issue.status = 'in_progress';
  } else if (targetColumn.columnType === 'in_review') {
    issue.status = 'in_review';
  }

  await issue.save();

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.MOVE,
    entityType: 'Issue',
    entityId: issue._id,
    entityName: issue.key,
    changes: {
      fromColumn: oldColumnId,
      toColumn: targetColumnId,
      position: newPosition,
    },
    req,
  });

  res.status(200).json({
    success: true,
    data: issue,
    message: 'Issue moved successfully',
  });
});

// @desc    Add comment to issue
// @route   POST /api/v1/issues/:id/comments
// @access  Private (tenant member)
const addComment = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return next(new ApiError(400, 'Comment content is required'));
  }

  const issue = await Issue.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!issue) {
    return next(new ApiError(404, 'Issue not found'));
  }

  const comment = await Comment.create({
    issue: issue._id,
    author: req.user._id,
    content,
  });

  await comment.populate('author', 'firstName lastName email avatar');

  // Notify assignee if someone else commented
  if (issue.assignee && issue.assignee.toString() !== req.user._id.toString()) {
    await createNotification({
      userId: issue.assignee,
      organizationId: req.organization._id,
      type: 'comment_added',
      title: 'New Comment on Issue',
      message: `${req.user.fullName} commented on ${issue.key}`,
      data: { issueId: issue._id, commentId: comment._id },
    });
  }

  res.status(201).json({
    success: true,
    data: comment,
    message: 'Comment added',
  });
});

// @desc    Upload attachment to issue
// @route   POST /api/v1/issues/:id/attachments
// @access  Private (tenant member)
const addAttachment = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'Please select a file to upload'));
  }

  const issue = await Issue.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!issue) {
    return next(new ApiError(404, 'Issue not found'));
  }

  const attachment = await Attachment.create({
    issue: issue._id,
    uploadedBy: req.user._id,
    filename: req.file.filename,
    originalName: req.file.originalname,
    filePath: `/uploads/${req.file.filename}`,
    fileSize: req.file.size,
    contentType: req.file.mimetype,
  });

  await attachment.populate('uploadedBy', 'firstName lastName');

  res.status(201).json({
    success: true,
    data: attachment,
    message: 'Attachment uploaded successfully',
  });
});

// @desc    Delete issue
// @route   DELETE /api/v1/issues/:id
// @access  Private (tenant member)
const deleteIssue = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findOne({
    _id: req.params.id,
    organization: req.organization._id,
  });

  if (!issue) {
    return next(new ApiError(404, 'Issue not found'));
  }

  await Comment.deleteMany({ issue: issue._id });
  await Attachment.deleteMany({ issue: issue._id });
  await Issue.findByIdAndDelete(issue._id);

  res.status(200).json({
    success: true,
    message: 'Issue deleted successfully',
  });
});

module.exports = {
  getIssues,
  createIssue,
  getIssue,
  updateIssue,
  moveIssue,
  addComment,
  addAttachment,
  deleteIssue,
};

