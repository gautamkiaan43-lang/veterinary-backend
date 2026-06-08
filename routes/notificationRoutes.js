const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notifications endpoints are protected by JWT auth
router.use(protect);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;
