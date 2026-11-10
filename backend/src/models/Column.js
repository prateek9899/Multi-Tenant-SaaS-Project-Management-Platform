const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Column name is required'],
      trim: true,
    },
    position: {
      type: Number,
      required: true,
      default: 0,
    },
    color: {
      type: String,
      default: '#6B7280',
    },
    wipLimit: {
      type: Number,
      default: null,
    },
    columnType: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done', 'custom'],
      default: 'custom',
    },
  },
  {
    timestamps: true,
  }
);

columnSchema.index({ board: 1, position: 1 });

module.exports = mongoose.model('Column', columnSchema);

