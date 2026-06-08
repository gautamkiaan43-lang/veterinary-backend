const express = require('express');
const router = express.Router();
const treatmentNoteController = require('../controllers/treatmentNoteController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(treatmentNoteController.getNotes)
    .post(treatmentNoteController.createNote);

module.exports = router;
