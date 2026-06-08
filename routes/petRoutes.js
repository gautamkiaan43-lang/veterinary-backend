const express = require('express');
const router = express.Router();
const {
    getPets,
    getPet,
    createPet,
    updatePet,
    deletePet,
    uploadPetPhoto
} = require('../controllers/petController');

const { protect, authorize } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getPets);
router.get('/:id', getPet);

router.post('/upload', authorize('Admin', 'Manager', 'Doctor', 'Receptionist'), uploadPetPhoto);
router.post('/', authorize('Admin', 'Manager', 'Doctor', 'Receptionist'), createPet);
router.put('/:id', authorize('Admin', 'Manager', 'Doctor', 'Receptionist'), updatePet);
router.delete('/:id', authorize('Admin', 'Manager', 'Doctor'), deletePet);

module.exports = router;
