const { Webhook, WebhookDelivery } = require('../models/Webhook');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

// @desc    Get webhooks for organization
// @route   GET /api/v1/webhooks
// @access  Private (Owner/Admin)
const getWebhooks = asyncHandler(async (req, res) => {
  const webhooks = await Webhook.find({
    organization: req.organization._id,
  }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: webhooks,
  });
});

// @desc    Create webhook
// @route   POST /api/v1/webhooks
// @access  Private (Owner/Admin)
const createWebhook = asyncHandler(async (req, res, next) => {
  const { url, events } = req.body;

  if (!url) {
    return next(new ApiError(400, 'Webhook URL is required'));
  }

  const secret = 'whsec_' + crypto.randomBytes(24).toString('hex');

  const webhook = await Webhook.create({
    organization: req.organization._id,
    url,
    events: events || ['issue.created', 'issue.updated', 'sprint.started'],
    secret,
  });

  res.status(201).json({
    success: true,
    data: webhook,
    message: 'Webhook created successfully',
  });
});

// @desc    Get webhook deliveries
// @route   GET /api/v1/webhooks/:id/deliveries
// @access  Private (Owner/Admin)
const getWebhookDeliveries = asyncHandler(async (req, res, next) => {
  const deliveries = await WebhookDelivery.find({
    webhook: req.params.id,
  })
    .sort({ deliveredAt: -1 })
    .limit(50);

  res.status(200).json({
    success: true,
    data: deliveries,
  });
});

// @desc    Delete webhook
// @route   DELETE /api/v1/webhooks/:id
// @access  Private (Owner/Admin)
const deleteWebhook = asyncHandler(async (req, res) => {
  await Webhook.findOneAndDelete({
    _id: req.params.id,
    organization: req.organization._id,
  });

  res.status(200).json({
    success: true,
    message: 'Webhook deleted successfully',
  });
});

module.exports = {
  getWebhooks,
  createWebhook,
  getWebhookDeliveries,
  deleteWebhook,
};

