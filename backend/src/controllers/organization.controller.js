const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const User = require('../models/User');
const Workflow = require('../models/Workflow');
const { ROLES, PLANS, PLAN_LIMITS, AUDIT_ACTIONS } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logAudit } = require('../services/audit.service');

// @desc    Create a new organization workspace
// @route   POST /api/v1/organizations
// @access  Private
const createOrganization = asyncHandler(async (req, res, next) => {
  const { name, description } = req.body;

  if (!name) {
    return next(new ApiError(400, 'Organization name is required'));
  }

  const organization = await Organization.create({
    name,
    description: description || '',
    owner: req.user._id,
    plan: PLANS.FREE,
    maxMembers: PLAN_LIMITS.free.maxMembers,
    maxProjects: PLAN_LIMITS.free.maxProjects,
  });

  // Assign user as Owner in membership
  await OrganizationMembership.create({
    organization: organization._id,
    user: req.user._id,
    role: ROLES.OWNER,
  });

  // Create default workflow for the new organization
  await Workflow.create({
    organization: organization._id,
    name: 'Default Software Workflow',
    isDefault: true,
    statuses: [
      { name: 'To Do', category: 'todo', position: 0, color: '#94a3b8' },
      { name: 'In Progress', category: 'in_progress', position: 1, color: '#3b82f6' },
      { name: 'In Review', category: 'in_progress', position: 2, color: '#f59e0b' },
      { name: 'Done', category: 'done', position: 3, color: '#10b981' },
    ],
    transitions: [
      { fromStatus: 'To Do', toStatus: 'In Progress' },
      { fromStatus: 'In Progress', toStatus: 'In Review' },
      { fromStatus: 'In Review', toStatus: 'Done' },
      { fromStatus: 'Done', toStatus: 'In Progress' },
    ],
  });

  await logAudit({
    organization: organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.CREATE,
    entityType: 'Organization',
    entityId: organization._id,
    entityName: organization.name,
    req,
  });

  res.status(201).json({
    success: true,
    data: organization,
    message: 'Workspace created successfully',
  });
});

// @desc    Get user's organizations
// @route   GET /api/v1/organizations
// @access  Private
const getUserOrganizations = asyncHandler(async (req, res) => {
  const memberships = await OrganizationMembership.find({
    user: req.user._id,
    isActive: true,
  }).populate('organization');

  const organizations = memberships
    .filter((m) => m.organization && m.organization.isActive)
    .map((m) => ({
      ...m.organization.toObject(),
      currentUserRole: m.role,
    }));

  res.status(200).json({
    success: true,
    data: organizations,
  });
});

// @desc    Get single organization details
// @route   GET /api/v1/organizations/:idOrSlug
// @access  Private (tenant member)
const getOrganization = asyncHandler(async (req, res, next) => {
  const { idOrSlug } = req.params;

  let query = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
    ? { _id: idOrSlug }
    : { slug: idOrSlug };

  const organization = await Organization.findOne(query).populate(
    'owner',
    'firstName lastName email avatar'
  );

  if (!organization) {
    return next(new ApiError(404, 'Organization not found'));
  }

  // Count active members and projects
  const memberCount = await OrganizationMembership.countDocuments({
    organization: organization._id,
    isActive: true,
  });

  res.status(200).json({
    success: true,
    data: {
      ...organization.toObject(),
      memberCount,
    },
  });
});

// @desc    Update organization
// @route   PUT /api/v1/organizations/:idOrSlug
// @access  Private (Owner/Admin)
const updateOrganization = asyncHandler(async (req, res, next) => {
  const { name, description, logo } = req.body;
  const org = req.organization;

  if (name) org.name = name;
  if (description !== undefined) org.description = description;
  if (logo !== undefined) org.logo = logo;

  await org.save();

  await logAudit({
    organization: org._id,
    user: req.user,
    action: AUDIT_ACTIONS.UPDATE,
    entityType: 'Organization',
    entityId: org._id,
    entityName: org.name,
    changes: { name, description },
    req,
  });

  res.status(200).json({
    success: true,
    data: org,
    message: 'Organization workspace updated successfully',
  });
});

// @desc    Get organization members
// @route   GET /api/v1/organizations/members
// @access  Private (tenant member)
const getMembers = asyncHandler(async (req, res) => {
  const members = await OrganizationMembership.find({
    organization: req.organization._id,
    isActive: true,
  }).populate('user', 'firstName lastName email avatar lastLogin');

  res.status(200).json({
    success: true,
    data: members,
  });
});

// @desc    Invite member to organization
// @route   POST /api/v1/organizations/members/invite
// @access  Private (Owner/Admin)
const inviteMember = asyncHandler(async (req, res, next) => {
  const { email, role = ROLES.MEMBER } = req.body;

  if (!email) {
    return next(new ApiError(400, 'Member email is required'));
  }

  // Check plan limits
  const currentCount = await OrganizationMembership.countDocuments({
    organization: req.organization._id,
    isActive: true,
  });

  if (currentCount >= req.organization.maxMembers) {
    return next(
      new ApiError(
        403,
        `Your current plan allows up to ${req.organization.maxMembers} members. Please upgrade your subscription to add more members.`
      )
    );
  }

  let user = await User.findOne({ email });
  if (!user) {
    // Automatically create placeholder user so they can join upon login
    const tempPassword = 'TempPassword123!';
    user = await User.create({
      firstName: email.split('@')[0],
      lastName: 'Member',
      email,
      password: tempPassword,
    });
  }

  let membership = await OrganizationMembership.findOne({
    organization: req.organization._id,
    user: user._id,
  });

  if (membership) {
    if (membership.isActive) {
      return next(new ApiError(400, 'User is already a member of this workspace'));
    }
    membership.isActive = true;
    membership.role = role;
    membership.invitedBy = req.user._id;
    await membership.save();
  } else {
    membership = await OrganizationMembership.create({
      organization: req.organization._id,
      user: user._id,
      role,
      invitedBy: req.user._id,
    });
  }

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.INVITE,
    entityType: 'User',
    entityId: user._id,
    entityName: user.email,
    changes: { role },
    req,
  });

  res.status(200).json({
    success: true,
    data: membership,
    message: `User ${email} has been added to the workspace`,
  });
});

// @desc    Remove member from organization
// @route   DELETE /api/v1/organizations/members/:userId
// @access  Private (Owner/Admin)
const removeMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;

  if (userId === req.organization.owner.toString()) {
    return next(new ApiError(400, 'The organization owner cannot be removed'));
  }

  const membership = await OrganizationMembership.findOne({
    organization: req.organization._id,
    user: userId,
  });

  if (!membership) {
    return next(new ApiError(404, 'Member not found'));
  }

  membership.isActive = false;
  await membership.save();

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.REMOVE_MEMBER,
    entityType: 'User',
    entityId: userId,
    req,
  });

  res.status(200).json({
    success: true,
    message: 'Member removed from workspace',
  });
});

// @desc    Update member role
// @route   PUT /api/v1/organizations/members/:userId/role
// @access  Private (Owner/Admin)
const updateMemberRole = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { role } = req.body;

  if (!Object.values(ROLES).includes(role)) {
    return next(new ApiError(400, 'Invalid role specified'));
  }

  if (userId === req.organization.owner.toString() && role !== ROLES.OWNER) {
    return next(new ApiError(400, 'Cannot change the role of the workspace owner'));
  }

  const membership = await OrganizationMembership.findOne({
    organization: req.organization._id,
    user: userId,
  });

  if (!membership) {
    return next(new ApiError(404, 'Member not found'));
  }

  const oldRole = membership.role;
  membership.role = role;
  await membership.save();

  await logAudit({
    organization: req.organization._id,
    user: req.user,
    action: AUDIT_ACTIONS.ROLE_CHANGE,
    entityType: 'User',
    entityId: userId,
    changes: { role: { old: oldRole, new: role } },
    req,
  });

  res.status(200).json({
    success: true,
    data: membership,
    message: 'Member role updated successfully',
  });
});

module.exports = {
  createOrganization,
  getUserOrganizations,
  getOrganization,
  updateOrganization,
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
};

