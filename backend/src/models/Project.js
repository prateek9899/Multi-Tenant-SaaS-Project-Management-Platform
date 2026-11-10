const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      uppercase: true,
      trim: true,
      minlength: 2,
      maxlength: 10,
    },
    description: {
      type: String,
      default: '',
    },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
    },
    projectType: {
      type: String,
      enum: ['kanban', 'scrum'],
      default: 'kanban',
    },
    issueCounter: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ organization: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Project', projectSchema);

