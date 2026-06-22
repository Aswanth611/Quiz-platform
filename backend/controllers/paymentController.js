const Razorpay = require('razorpay');
const crypto = require('crypto');
const QuizAttempt = require('../models/QuizAttempt');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { sendCertificateEmail } = require('../utils/emailService');

// Initialize Razorpay
let razorpay = null;
const initRazorpay = () => {
  if (razorpay) return razorpay;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.warn('Razorpay keys not configured. Running in fallback/mock mode.');
    return null;
  }
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
  return razorpay;
};

// @desc    Create a payment order
// @route   POST /api/payment/create-order
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { attemptId } = req.body;

    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }

    if (attempt.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Attempt has already been unlocked' });
    }

    const amount = 4900; // ₹49 in paise
    const currency = 'INR';

    const rzp = initRazorpay();
    const bypassMode = process.env.BYPASS_PAYMENT === 'true' || !rzp;

    if (bypassMode) {
      // Mock order for demo/bypass mode
      const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
      
      // Store in payments collection as created
      await Payment.create({
        userId: req.user.id,
        quizAttemptId: attemptId,
        razorpayOrderId: mockOrderId,
        amount: amount,
        status: 'created'
      });

      return res.json({
        success: true,
        bypass: true,
        order: {
          id: mockOrderId,
          amount: amount,
          currency: currency
        }
      });
    }

    // Live Razorpay order creation
    const options = {
      amount,
      currency,
      receipt: `receipt_attempt_${attemptId}`
    };

    const order = await rzp.orders.create(options);

    await Payment.create({
      userId: req.user.id,
      quizAttemptId: attemptId,
      razorpayOrderId: order.id,
      amount: amount,
      status: 'created'
    });

    res.json({
      success: true,
      bypass: false,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Verify payment signature and unlock certificate
// @route   POST /api/payment/verify
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const {
      attemptId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    const rzp = initRazorpay();
    const bypassMode = process.env.BYPASS_PAYMENT === 'true' || !rzp;

    // Retrieve payment transaction
    const payment = await Payment.findOne({ razorpayOrderId });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    if (!bypassMode) {
      // Validate payment signature
      const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
      hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
      const generatedSignature = hmac.digest('hex');

      if (generatedSignature !== razorpaySignature) {
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ success: false, message: 'Payment verification failed' });
      }
    }

    // Payment is valid! Update payment record
    payment.status = 'captured';
    payment.razorpayPaymentId = razorpayPaymentId || `pay_mock_${crypto.randomBytes(8).toString('hex')}`;
    await payment.save();

    // Update QuizAttempt status to 'paid'
    const attempt = await QuizAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }
    
    attempt.paymentStatus = 'paid';
    await attempt.save();

    // Retrieve User and Quiz details for certificate and email
    const user = await User.findById(attempt.userId);
    const quiz = await Quiz.findById(attempt.quizId);

    // Calculate score percentage
    const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

    // Generate unique Certificate ID (e.g. CERT-2026-XXXXXX)
    const year = new Date().getFullYear();
    const certRandom = crypto.randomBytes(4).toString('hex').toUpperCase();
    const certificateId = `CERT-${year}-${certRandom}`;

    // Create Certificate record in database
    const certificate = await Certificate.create({
      userId: attempt.userId,
      quizId: attempt.quizId,
      quizAttemptId: attempt._id,
      certificateId,
      scorePercentage,
      pdfUrl: `/api/certificate/${certificateId}/download`
    });

    // Send confirmation email containing a download link
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const downloadUrl = `${frontendUrl}/certificate/${attemptId}`;
    
    // We run email sending asynchronously, so it doesn't block the HTTP response
    sendCertificateEmail(
      user.email,
      user.name,
      quiz.title,
      scorePercentage,
      certificateId,
      downloadUrl
    );

    res.json({
      success: true,
      message: 'Payment verified and certificate generated.',
      attemptId,
      certificateId,
      certificate
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
