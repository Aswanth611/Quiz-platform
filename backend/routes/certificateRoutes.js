const express = require('express');
const router = express.Router();
const { getCertificate, downloadCertificate, verifyCertificate } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

router.get('/verify/:certId', verifyCertificate);
router.get('/:id/download', downloadCertificate);
router.get('/:id', protect, getCertificate);

module.exports = router;
