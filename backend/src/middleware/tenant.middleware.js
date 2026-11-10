const Organization = require('../models/Organization');
const OrganizationMembership = require('../models/OrganizationMembership');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const tenantMiddleware = asyncHandler(async (req, res, next) => {
  const tenantSlug = req.headers['x-tenant-id'] || req.query.tenantId || req.body.tenantSlug;

  if (!tenantSlug) {
    return next(new ApiError(400, 'X-Tenant-ID header is required for multi-tenant endpoints'));
  }

  // Look up organization by slug or ID
  let organization;
  if (tenantSlug.match(/^[0-9a-fA-F]{24}$/)) {
    organization = await Organization.findById(tenantSlug);
  } else {
    organization = await Organization.findOne({ slug: tenantSlug });
  }

  if (!organization) {
    return next(new ApiError(404, 'Organization workspace not found'));
  }

  // Verify that the authenticated user is an active member of this organization
  const membership = await OrganizationMembership.findOne({
    organization: organization._id,
    user: req.user._id,
    isActive: true,
  });

  if (!membership) {
    return next(new ApiError(403, 'You do not have access to this organization workspace'));
  }

  req.organization = organization;
  req.membership = membership;
  next();
});

module.exports = { tenantMiddleware };

