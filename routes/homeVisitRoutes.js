const express = require('express');
const router = express.Router();
const homeVisitController = require('../controllers/homeVisitController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// GET all home visits
router.get('/', homeVisitController.getAllHomeVisits);

// GET home visit by ID
router.get('/:id', homeVisitController.getHomeVisitById);

// POST create new home visit
// Allowed roles: Admin, Receptionist, Manager
router.post('/', authorize('Admin', 'Receptionist', 'Manager'), homeVisitController.createHomeVisit);

// PUT update home visit
// Allowed roles: Admin, Receptionist, Manager, Doctor (doctors might need to update status/notes)
router.put('/:id', authorize('Admin', 'Receptionist', 'Manager', 'Doctor'), homeVisitController.updateHomeVisit);

// DELETE (cancel) home visit
// Allowed roles: Admin, Receptionist, Manager
router.delete('/:id', authorize('Admin', 'Receptionist', 'Manager'), homeVisitController.deleteHomeVisit);

module.exports = router;
