const express = require('express');
const router = express.Router();
const encounterController = require('../controllers/encounterController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.route('/')
    .get(encounterController.getEncounters)
    .post(encounterController.createEncounter);

module.exports = router;
