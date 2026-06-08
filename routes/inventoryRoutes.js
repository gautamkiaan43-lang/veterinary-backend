const express = require('express');
const router = express.Router();
const {
    getInventory,
    getInventoryItem,
    createInventoryItem,
    updateInventoryItem,
    deleteInventoryItem
} = require('../controllers/inventoryController');

const { protect, authorize } = require('../middlewares/authMiddleware');

// Apply JWT protection to all routes in this file
router.use(protect);

// GET routes (Accessible to all authenticated staff)
router.get('/', getInventory);
router.get('/:id', getInventoryItem);

// POST/PUT/DELETE routes (Restricted to Admin & Manager roles only)
router.post('/', authorize('Admin', 'Manager'), createInventoryItem);
router.put('/:id', authorize('Admin', 'Manager'), updateInventoryItem);
router.delete('/:id', authorize('Admin', 'Manager'), deleteInventoryItem);

module.exports = router;
