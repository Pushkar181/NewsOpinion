const express = require('express');
const router = express.Router();
const summarizeController = require('../controllers/summarizeController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, summarizeController.summarizeArticles);

module.exports = router; 