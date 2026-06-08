const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.route('/')
    .get(protect, settingsController.getSettings)
    .put(protect, authorize('Admin'), settingsController.updateSettings);

module.exports = router;
