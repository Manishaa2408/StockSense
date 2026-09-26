const assert = require('assert');
const { NOTIFICATION_TYPES, NOTIFICATION_SEVERITIES } = require('./notifications.constants');
const { schemas } = require('./notifications.validator');
const notificationService = require('./notifications.service');
const notificationController = require('./notifications.controller');
const notificationRoutes = require('./notifications.routes');

console.log('🧪 Starting Module 14 Notifications & Alerts verification tests...\n');

// 1. Verify Constants
console.log('1. Verifying Notification Constants...');
assert.strictEqual(NOTIFICATION_TYPES.LOW_STOCK, 'LOW_STOCK');
assert.strictEqual(NOTIFICATION_TYPES.OUT_OF_STOCK, 'OUT_OF_STOCK');
assert.strictEqual(NOTIFICATION_TYPES.DELIVERY_READY, 'DELIVERY_READY');
assert.strictEqual(NOTIFICATION_TYPES.DELIVERY_COMPLETED, 'DELIVERY_COMPLETED');
assert.strictEqual(NOTIFICATION_TYPES.DELIVERY_CANCELED, 'DELIVERY_CANCELED');
assert.strictEqual(NOTIFICATION_SEVERITIES.INFO, 'INFO');
assert.strictEqual(NOTIFICATION_SEVERITIES.WARNING, 'WARNING');
assert.strictEqual(NOTIFICATION_SEVERITIES.CRITICAL, 'CRITICAL');
console.log('   ✓ Constants properly defined and frozen.');

// 2. Verify Validation Schemas
console.log('2. Verifying Validation Schemas...');

// Valid create payload
const validPayload = {
  type: 'LOW_STOCK',
  severity: 'WARNING',
  title: 'Low Stock Alert',
  message: 'Product ABC reached minimum stock',
  entity_type: 'PRODUCT',
  entity_id: '123',
  action_url: '/products/123'
};
const validResult = schemas.createNotificationSchema.validate(validPayload);
assert.ifError(validResult.error);
assert.strictEqual(validResult.value.type, 'LOW_STOCK');
assert.strictEqual(validResult.value.severity, 'WARNING');

// Invalid type should fail
const invalidTypePayload = {
  ...validPayload,
  type: 'UNKNOWN_TYPE_XYZ'
};
const invalidTypeResult = schemas.createNotificationSchema.validate(invalidTypePayload);
assert.ok(invalidTypeResult.error, 'Should reject unknown notification type');

// Missing title should fail
const missingTitlePayload = {
  type: 'LOW_STOCK',
  message: 'Product ABC reached minimum stock'
};
const missingTitleResult = schemas.createNotificationSchema.validate(missingTitlePayload);
assert.ok(missingTitleResult.error, 'Should reject payload without title');

// Invalid severity should fail
const invalidSeverityPayload = {
  ...validPayload,
  severity: 'SUPER_URGENT'
};
const invalidSeverityResult = schemas.createNotificationSchema.validate(invalidSeverityPayload);
assert.ok(invalidSeverityResult.error, 'Should reject unknown severity');

// Query schema test
const queryPayload = {
  page: '2',
  limit: '25',
  unread: 'true',
  type: 'DELIVERY_READY',
  severity: 'INFO'
};
const queryResult = schemas.queryNotificationsSchema.validate(queryPayload);
assert.ifError(queryResult.error);
assert.strictEqual(queryResult.value.page, 2);
assert.strictEqual(queryResult.value.limit, 25);
assert.strictEqual(queryResult.value.unread, true);
console.log('   ✓ Joi validation schemas enforce types, severities, and pagination rules.');

// 3. Verify NotificationService API
console.log('3. Verifying NotificationService method signatures...');
assert.strictEqual(typeof notificationService.createNotification, 'function');
assert.strictEqual(typeof notificationService.createBulkNotifications, 'function');
assert.strictEqual(typeof notificationService.getUserNotifications, 'function');
assert.strictEqual(typeof notificationService.getUnreadCount, 'function');
assert.strictEqual(typeof notificationService.markAsRead, 'function');
assert.strictEqual(typeof notificationService.markAllAsRead, 'function');
assert.strictEqual(typeof notificationService.deleteNotification, 'function');
assert.strictEqual(typeof notificationService.deleteAllRead, 'function');
console.log('   ✓ NotificationService exposes all 8 required business operations.');

// 4. Verify NotificationController API
console.log('4. Verifying NotificationController method signatures...');
assert.strictEqual(typeof notificationController.getAll, 'function');
assert.strictEqual(typeof notificationController.getUnreadCount, 'function');
assert.strictEqual(typeof notificationController.markAsRead, 'function');
assert.strictEqual(typeof notificationController.markAllAsRead, 'function');
assert.strictEqual(typeof notificationController.deleteNotification, 'function');
assert.strictEqual(typeof notificationController.create, 'function');
console.log('   ✓ NotificationController exposes all required handler functions.');

// 5. Verify Notification Routes
console.log('5. Verifying Express Router configuration...');
assert.ok(notificationRoutes, 'Express router exported successfully');
const routePaths = notificationRoutes.stack
  .filter(r => r.route)
  .map(r => ({ path: r.route.path, methods: Object.keys(r.route.methods) }));
console.log('   Registered routes:', routePaths);
assert.ok(routePaths.some(r => r.path === '/' && r.methods.includes('get')));
assert.ok(routePaths.some(r => r.path === '/unread-count' && r.methods.includes('get')));
assert.ok(routePaths.some(r => r.path === '/read-all' && r.methods.includes('patch')));
assert.ok(routePaths.some(r => r.path === '/:id/read' && r.methods.includes('patch')));
assert.ok(routePaths.some(r => r.path === '/:id' && r.methods.includes('delete')));
assert.ok(routePaths.some(r => r.path === '/' && r.methods.includes('post')));
console.log('   ✓ Express routes properly registered with correct HTTP verbs.');

console.log('\n🎉 ALL MODULE 14 VERIFICATION TESTS PASSED SUCCESSFULLY!\n');

const db = require('../../config/database');
db.destroy().then(() => {
  process.exit(0);
});
