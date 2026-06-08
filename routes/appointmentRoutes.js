const express = require('express');
const router = express.Router();
const {
    getAllAppointments,
    getAppointmentById,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    getUpcomingReminders,
    sendReminderEmail
} = require('../controllers/appointmentController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/upcoming-reminders', authorize('Admin', 'Manager', 'Receptionist'), getUpcomingReminders);
router.get('/', getAllAppointments);
router.get('/:id', getAppointmentById);

router.post('/', authorize('Admin', 'Manager', 'Doctor', 'Receptionist'), createAppointment);
router.put('/:id', authorize('Admin', 'Manager', 'Doctor', 'Receptionist'), updateAppointment);
// Soft delete (cancel) appointment
router.delete('/:id', authorize('Admin', 'Manager', 'Doctor', 'Receptionist'), deleteAppointment);
router.post('/:id/send-reminder', authorize('Admin', 'Manager', 'Receptionist'), sendReminderEmail);

module.exports = router;
