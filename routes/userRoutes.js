const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { protect } = require('../middlewares/authMiddleware');

const userController = require('../controllers/userController');

router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

router.get('/', userController.getAllUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

module.exports = router;
