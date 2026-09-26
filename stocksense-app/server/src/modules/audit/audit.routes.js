const express = require('express');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const { schemas, validateQuery, validateParams } = require('./audit.validator');
const controller = require('./audit.controller');

const router = express.Router();

// All audit log routes require authentication
router.use(authenticate);

// List paginated audit logs with search & filters (Requires AUDIT.READ permission)
router.get(
  '/',
  authorize('AUDIT.READ'),
  validateQuery(schemas.queryAuditLogsSchema),
  controller.getAll.bind(controller)
);

// Metadata for filter options (modules, actions, actors)
router.get(
  '/meta',
  authorize('AUDIT.READ'),
  controller.getMeta.bind(controller)
);

// Get single audit log entry by ID with before/after state diff
router.get(
  '/:id',
  authorize('AUDIT.READ'),
  validateParams(schemas.idParamSchema),
  controller.getById.bind(controller)
);

module.exports = router;
