const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  organization,
  user,
  action,
  entityType,
  entityId,
  entityName = '',
  changes = {},
  req = null,
}) => {
  try {
    const ipAddress = req ? req.ip || req.connection?.remoteAddress || '' : '';
    const userAgent = req ? req.headers['user-agent'] || '' : '';

    await AuditLog.create({
      organization,
      user: user?._id || user,
      action,
      entityType,
      entityId,
      entityName,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('Audit log creation error:', err.message);
  }
};

module.exports = { logAudit };

