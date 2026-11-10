const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get user notifications in organization
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    user: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(30);

  const unreadCount = await Notification.countDocuments({
    user: req.user._id,
    isRead: false,
  });

  res.status(200).json({
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  });
});

// @desc    Mark notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: 'All notifications marked as read',
  });
});

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
};

