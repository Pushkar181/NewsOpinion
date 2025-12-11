const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/history', authMiddleware, userController.getSearchHistory);
router.get('/recommendations', authMiddleware, userController.getRecommendations);

module.exports = router; 