const express = require('express');
const router = express.Router();
const {
    getOwners,
    getOwner,
    createOwner,
    updateOwner,
    deleteOwner
} = require('../controllers/petOwnerController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply JWT protection to all routes in this file
router.use(protect);

// GET routes (Accessible to all authenticated staff)
router.get('/', getOwners);
router.get('/:id', getOwner);

// POST/PUT/DELETE routes (Restricted by Role)
router.post('/', authorize('Admin', 'Manager', 'Receptionist'), createOwner);
router.put('/:id', authorize('Admin', 'Manager', 'Receptionist'), updateOwner);
router.delete('/:id', authorize('Admin', 'Manager'), deleteOwner);

module.exports = router;
