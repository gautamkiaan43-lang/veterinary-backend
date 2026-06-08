const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', attendanceController.getDailyAttendance);
router.get('/me', attendanceController.getPersonalHistory);
router.post('/checkin', attendanceController.checkIn);
router.post('/checkout', attendanceController.checkOut);

module.exports = router;
