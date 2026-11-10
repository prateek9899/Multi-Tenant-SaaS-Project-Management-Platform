const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    statuses: [
      {
        name: { type: String, required: true },
        category: {
          type: String,
          enum: ['todo', 'in_progress', 'done'],
          required: true,
        },
        position: { type: Number, default: 0 },
        color: { type: String, default: '#3b82f6' },
      },
    ],
    transitions: [
      {
        fromStatus: { type: String, required: true },
        toStatus: { type: String, required: true },
        name: { type: String, default: 'Move' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Workflow', workflowSchema);

