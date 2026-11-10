const mongoose = require('mongoose');
const { ROLES } = require('../config/constants');

const organizationMembershipSchema = new mongoose.Schema(
  {
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.MEMBER,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

organizationMembershipSchema.index({ organization: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationMembership', organizationMembershipSchema);

