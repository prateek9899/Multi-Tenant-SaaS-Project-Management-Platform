const mongoose = require('mongoose');
const slugify = require('slugify');
const { PLANS, PLAN_LIMITS } = require('../config/constants');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: String,
      enum: Object.values(PLANS),
      default: PLANS.FREE,
    },
    stripeCustomerId: {
      type: String,
      default: '',
    },
    stripeSubscriptionId: {
      type: String,
      default: '',
    },
    maxMembers: {
      type: Number,
      default: PLAN_LIMITS.free.maxMembers,
    },
    maxProjects: {
      type: Number,
      default: PLAN_LIMITS.free.maxProjects,
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

organizationSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true }) + '-' + Math.random().toString(36).substring(2, 6);
  }
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);

