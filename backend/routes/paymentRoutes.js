const express = require('express');
const router = express.Router();
const { createOrder, captureOrder, getPaymentConfig } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.get('/config', protect, getPaymentConfig);
router.post('/create-order', protect, createOrder);
router.post('/capture-order', protect, captureOrder);

module.exports = router;
