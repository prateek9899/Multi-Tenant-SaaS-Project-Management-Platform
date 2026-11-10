const mongoose = require('mongoose');
const { ISSUE_TYPES, ISSUE_PRIORITIES, ISSUE_STATUSES } = require('../config/constants');
const Project = require('./Project');

const issueSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    board: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      index: true,
    },
    column: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Column',
      index: true,
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
    },
    issueType: {
      type: String,
      enum: Object.values(ISSUE_TYPES),
      default: ISSUE_TYPES.TASK,
    },
    key: {
      type: String,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(ISSUE_STATUSES),
      default: ISSUE_STATUSES.TODO,
    },
    priority: {
      type: String,
      enum: Object.values(ISSUE_PRIORITIES),
      default: ISSUE_PRIORITIES.MEDIUM,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storyPoints: {
      type: Number,
      default: null,
      min: 0,
    },
    labels: {
      type: [String],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    position: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.pre('save', async function (next) {
  if (this.isNew && !this.key) {
    const project = await Project.findByIdAndUpdate(
      this.project,
      { $inc: { issueCounter: 1 } },
      { new: true }
    );
    if (project) {
      this.key = `${project.key}-${project.issueCounter}`;
    }
  }
  next();
});

issueSchema.index({ organization: 1, key: 1 });
issueSchema.index({ board: 1, column: 1, position: 1 });

module.exports = mongoose.model('Issue', issueSchema);

