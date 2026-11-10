const ApiError = require('../utils/ApiError');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.membership) {
      return next(new ApiError(403, 'Organization membership context required'));
    }

    if (!allowedRoles.includes(req.membership.role)) {
      return next(
        new ApiError(
          403,
          `Permission denied: Requires one of [${allowedRoles.join(', ')}] role. Your role is ${req.membership.role}.`
        )
      );
    }
    next();
  };
};

module.exports = { requireRole };

