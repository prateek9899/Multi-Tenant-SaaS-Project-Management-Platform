const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Webhook endpoint URL is required'],
      trim: true,
    },
    events: {
      type: [String],
      default: ['issue.created', 'issue.updated', 'sprint.started'],
    },
    secret: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const webhookDeliverySchema = new mongoose.Schema(
  {
    webhook: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Webhook',
      required: true,
      index: true,
    },
    event: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    responseStatus: {
      type: Number,
      default: null,
    },
    responseBody: {
      type: String,
      default: '',
    },
    deliveredAt: {
      type: Date,
      default: Date.now,
    },
    success: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Webhook = mongoose.model('Webhook', webhookSchema);
const WebhookDelivery = mongoose.model('WebhookDelivery', webhookDeliverySchema);

module.exports = { Webhook, WebhookDelivery };

