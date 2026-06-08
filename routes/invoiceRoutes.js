const express = require('express');
const router = express.Router();
const {
    getInvoices,
    getInvoice,
    getUnbilled,
    createInvoice,
    updateStatus
} = require('../controllers/invoiceController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', authorize('Admin', 'Manager', 'Receptionist', 'Doctor'), getInvoices);
router.get('/unbilled', authorize('Admin', 'Manager', 'Receptionist', 'Doctor'), getUnbilled);
router.get('/:id', authorize('Admin', 'Manager', 'Receptionist', 'Doctor'), getInvoice);
router.post('/', authorize('Admin', 'Manager', 'Receptionist', 'Doctor'), createInvoice);
router.put('/:id/status', authorize('Admin', 'Manager', 'Receptionist'), updateStatus);

module.exports = router;
