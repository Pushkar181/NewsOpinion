const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, searchController.searchNews);

module.exports = router; 