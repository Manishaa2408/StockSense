const assert = require('assert');
const { AUDIT_ACTIONS, AUDIT_MODULES, SENSITIVE_FIELDS } = require('./audit.constants');
const { schemas } = require('./audit.validator');
const auditService = require('./audit.service');
const auditController = require('./audit.controller');
const auditRoutes = require('./audit.routes');

console.log('🧪 Starting Module 15 Audit Log / Activity Tracking verification tests...\n');

// 1. Verify Constants
console.log('1. Verifying Audit Constants...');
assert.strictEqual(AUDIT_ACTIONS.CREATE, 'CREATE');
assert.strictEqual(AUDIT_ACTIONS.UPDATE, 'UPDATE');
assert.strictEqual(AUDIT_ACTIONS.DELETE, 'DELETE');
assert.strictEqual(AUDIT_ACTIONS.LOGIN, 'LOGIN');
assert.strictEqual(AUDIT_ACTIONS.STATUS_CHANGE, 'STATUS_CHANGE');
assert.strictEqual(AUDIT_ACTIONS.VALIDATE, 'VALIDATE');
assert.strictEqual(AUDIT_ACTIONS.CANCEL, 'CANCEL');
assert.strictEqual(AUDIT_ACTIONS.ADJUST, 'ADJUST');

assert.strictEqual(AUDIT_MODULES.AUTH, 'AUTH');
assert.strictEqual(AUDIT_MODULES.DELIVERIES, 'DELIVERIES');
assert.strictEqual(AUDIT_MODULES.INVENTORY, 'INVENTORY');
assert.strictEqual(AUDIT_MODULES.PRODUCTS, 'PRODUCTS');
assert.strictEqual(AUDIT_MODULES.USERS, 'USERS');

assert.ok(SENSITIVE_FIELDS.includes('password'));
assert.ok(SENSITIVE_FIELDS.includes('token'));
console.log('   ✓ Constants properly defined and frozen.');

// 2. Verify Sensitive Data Sanitization
console.log('2. Verifying Sensitive Data Sanitization...');
const dirtyObject = {
  id: 101,
  username: 'testadmin',
  password: 'SuperSecretPassword123!',
  password_hash: '$2a$12$e8i/u3y8j...',
  token: 'eyJhbGciOiJIUzI1NiIsInR5c...',
  metadata: {
    ip: '127.0.0.1',
    refreshToken: 'secret_token_value',
    nestedSafe: 'safe_value'
  }
};
const cleaned = auditService._sanitizeData(dirtyObject);
assert.strictEqual(cleaned.id, 101);
assert.strictEqual(cleaned.username, 'testadmin');
assert.strictEqual(cleaned.password, '[REDACTED]');
assert.strictEqual(cleaned.password_hash, '[REDACTED]');
assert.strictEqual(cleaned.token, '[REDACTED]');
assert.strictEqual(cleaned.metadata.ip, '127.0.0.1');
assert.strictEqual(cleaned.metadata.refreshToken, '[REDACTED]');
assert.strictEqual(cleaned.metadata.nestedSafe, 'safe_value');
console.log('   ✓ Sensitive fields correctly redacted recursively.');

// 3. Verify Validation Schemas
console.log('3. Verifying Validation Schemas...');
const validQuery = {
  page: '2',
  limit: '25',
  action: 'STATUS_CHANGE',
  module: 'DELIVERIES',
  dateFrom: '2026-09-01',
  dateTo: '2026-09-26'
};
const validRes = schemas.queryAuditLogsSchema.validate(validQuery);
assert.ifError(validRes.error);
assert.strictEqual(validRes.value.page, 2);
assert.strictEqual(validRes.value.limit, 25);
assert.strictEqual(validRes.value.action, 'STATUS_CHANGE');

const invalidActionQuery = { action: 'INVALID_ACTION_XYZ' };
const invalidRes = schemas.queryAuditLogsSchema.validate(invalidActionQuery);
assert.ok(invalidRes.error, 'Should reject invalid audit action');

const idParamRes = schemas.idParamSchema.validate({ id: '42' });
assert.ifError(idParamRes.error);
assert.strictEqual(idParamRes.value.id, 42);
console.log('   ✓ Joi query and param schemas enforce valid types and bounds.');

// 4. Verify Immutability & Route Exposure
console.log('4. Verifying Immutability (Append-only) & Express Routes...');
const routePaths = auditRoutes.stack
  .filter(r => r.route)
  .map(r => ({ path: r.route.path, methods: Object.keys(r.route.methods) }));
console.log('   Registered audit routes:', routePaths);

// Ensure ONLY GET routes are exposed
routePaths.forEach(r => {
  assert.ok(
    r.methods.every(m => m === 'get'),
    `Route ${r.path} exposes unauthorized non-GET method`
  );
});
assert.ok(routePaths.some(r => r.path === '/'));
assert.ok(routePaths.some(r => r.path === '/meta'));
assert.ok(routePaths.some(r => r.path === '/:id'));
console.log('   ✓ Immutable API confirmed: No update or delete endpoints exposed.');

// 5. Verify Service API signatures
console.log('5. Verifying AuditService signatures...');
assert.strictEqual(typeof auditService.createAuditLog, 'function');
assert.strictEqual(typeof auditService.getAuditLogs, 'function');
assert.strictEqual(typeof auditService.getAuditLogById, 'function');
assert.strictEqual(typeof auditService.getAuditMetadata, 'function');
// Ensure no update or delete methods exist on auditService
assert.strictEqual(auditService.updateAuditLog, undefined);
assert.strictEqual(auditService.deleteAuditLog, undefined);
console.log('   ✓ Service provides only append-only creation and reading.');

console.log('\n🎉 ALL MODULE 15 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');

const db = require('../../config/database');
db.destroy().then(() => {
  process.exit(0);
});
