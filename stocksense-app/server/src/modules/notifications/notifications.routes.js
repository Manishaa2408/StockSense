const express = require('express');
const authenticate = require('../../middleware/authenticate');
const { schemas, validateBody, validateQuery } = require('./notifications.validator');
const controller = require('./notifications.controller');

const router = express.Router();

// All notification routes strictly require authentication
router.use(authenticate);

// Get user notifications (paginated + filtered)
router.get('/', validateQuery(schemas.queryNotificationsSchema), controller.getAll.bind(controller));

// Get unread notification count
router.get('/unread-count', controller.getUnreadCount.bind(controller));

// Mark all notifications as read for current user
router.patch('/read-all', controller.markAllAsRead.bind(controller));

// Mark specific notification as read
router.patch('/:id/read', controller.markAsRead.bind(controller));

// Delete all read notifications (cleanup)
router.delete('/read/all', controller.deleteAllRead.bind(controller));

// Delete/dismiss specific notification
router.delete('/:id', controller.deleteNotification.bind(controller));

// Create notification (self or administrative)
router.post('/', validateBody(schemas.createNotificationSchema), controller.create.bind(controller));

module.exports = router;
