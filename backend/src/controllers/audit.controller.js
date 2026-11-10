const AuditLog = require('../models/AuditLog');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get audit logs for organization
// @route   GET /api/v1/audit
// @access  Private (Owner/Admin)
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action, entityType, limit = 50, page = 1 } = req.query;

  const query = { organization: req.organization._id };
  if (action) query.action = action;
  if (entityType) query.entityType = entityType;

  const logs = await AuditLog.find(query)
    .populate('user', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  const total = await AuditLog.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

module.exports = { getAuditLogs };

