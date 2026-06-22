const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const { generateCertificatePDF } = require('../utils/pdfGenerator');

// @desc    Get certificate metadata by attemptId or certificateId
// @route   GET /api/certificate/:id
// @access  Private
exports.getCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    // Try finding by certificateId first, then try by quizAttemptId
    let certificate = await Certificate.findOne({ certificateId: id })
      .populate('userId', 'name email')
      .populate('quizId', 'title description category');

    if (!certificate) {
      certificate = await Certificate.findOne({ quizAttemptId: id })
        .populate('userId', 'name email')
        .populate('quizId', 'title description category');
    }

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    // Ensure users can only view their own certificate (unless admin)
    if (certificate.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, certificate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Download certificate PDF dynamically
// @route   GET /api/certificate/:id/download
// @access  Public (so it can be easily downloaded via direct links/emails, but verified by id)
exports.downloadCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    // Search certificate by certificateId
    const certificate = await Certificate.findOne({ certificateId: id });
    if (!certificate) {
      return res.status(404).send('Certificate not found');
    }

    const user = await User.findById(certificate.userId);
    const quiz = await Quiz.findById(certificate.quizId);

    if (!user || !quiz) {
      return res.status(404).send('Associated user or quiz not found');
    }

    // Generate PDF Buffer
    const pdfBuffer = await generateCertificatePDF(certificate, user, quiz);

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="QuizCert_Certificate_${certificate.certificateId}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send PDF buffer
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generating PDF download:', err.message);
    res.status(500).send('Error generating certificate PDF');
  }
};

// @desc    Public verification endpoint
// @route   GET /api/certificate/verify/:certId
// @access  Public
exports.verifyCertificate = async (req, res) => {
  try {
    const { certId } = req.params;

    const certificate = await Certificate.findOne({ certificateId: certId })
      .populate('userId', 'name')
      .populate('quizId', 'title category');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate is invalid or does not exist.'
      });
    }

    res.json({
      success: true,
      verified: true,
      data: {
        certificateId: certificate.certificateId,
        recipientName: certificate.userId.name,
        quizTitle: certificate.quizId.title,
        category: certificate.quizId.category,
        scorePercentage: certificate.scorePercentage,
        generatedDate: certificate.generatedDate
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
