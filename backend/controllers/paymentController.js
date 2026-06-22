const crypto = require('crypto');
const QuizAttempt = require('../models/QuizAttempt');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const { sendCertificateEmail } = require('../utils/emailService');
const { client, paypal } = require('../utils/paypalClient');

// @desc    Create a PayPal order
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

    const quiz = await Quiz.findById(attempt.quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz metadata not found' });
    }

    const bypassMode = process.env.BYPASS_PAYMENT === 'true' || 
                        process.env.PAYPAL_CLIENT_ID === 'already_configured' || 
                        !process.env.PAYPAL_CLIENT_ID;

    const amountValue = '0.99'; // Charge $0.99 USD (approx ₹80-85, matching small charge)
    const currency = 'USD';

    if (bypassMode) {
      // Simulation/Bypass Mode
      const mockOrderId = `order_paypal_mock_${crypto.randomBytes(8).toString('hex')}`;
      
      // Save Payment as created
      await Payment.create({
        userId: req.user.id,
        quizAttemptId: attemptId,
        paypalOrderId: mockOrderId,
        amount: 99, // 99 cents
        status: 'created'
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const mockApprovalUrl = `${frontendUrl}/payment-success?token=${mockOrderId}&attemptId=${attemptId}`;

      return res.json({
        success: true,
        bypass: true,
        orderID: mockOrderId,
        approvalUrl: mockApprovalUrl
      });
    }

    // Live PayPal SDK Order Creation
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amountValue
        },
        description: `QuizCert Credentials: ${quiz.title}`
      }],
      application_context: {
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment-success?attemptId=${attemptId}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/paywall/${attemptId}`,
        brand_name: 'QuizCert Platform',
        user_action: 'PAY_NOW'
      }
    });

    const order = await client().execute(request);
    
    // Create database payment transaction
    await Payment.create({
      userId: req.user.id,
      quizAttemptId: attemptId,
      paypalOrderId: order.result.id,
      amount: 99,
      status: 'created'
    });

    // Find approval url link
    const approvalLink = order.result.links.find(link => link.rel === 'approve');

    res.json({
      success: true,
      bypass: false,
      orderID: order.result.id,
      approvalUrl: approvalLink ? approvalLink.href : ''
    });
  } catch (err) {
    console.error('PayPal Order Creation Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Capture PayPal Order and generate certificate
// @route   POST /api/payment/capture-order
// @access  Private
exports.captureOrder = async (req, res) => {
  try {
    const { orderID, attemptId } = req.body;

    if (!orderID) {
      return res.status(400).json({ success: false, message: 'Please provide a valid PayPal orderID' });
    }

    // Retrieve payment transaction
    const payment = await Payment.findOne({ paypalOrderId: orderID });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const targetAttemptId = attemptId || payment.quizAttemptId;

    const attempt = await QuizAttempt.findById(targetAttemptId);
    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Quiz attempt not found' });
    }

    const bypassMode = process.env.BYPASS_PAYMENT === 'true' || 
                        orderID.startsWith('order_paypal_mock_') || 
                        !process.env.PAYPAL_CLIENT_ID || 
                        process.env.PAYPAL_CLIENT_ID === 'already_configured';

    let captureId = '';

    if (bypassMode) {
      // Simulation/Bypass Mode Success
      captureId = `pay_paypal_mock_${crypto.randomBytes(8).toString('hex')}`;
      payment.status = 'success';
      payment.transactionId = captureId;
      await payment.save();
    } else {
      // Live capture using SDK
      try {
        const request = new paypal.orders.OrdersCaptureRequest(orderID);
        request.requestBody({});
        const capture = await client().execute(request);

        if (capture.result.status !== 'COMPLETED') {
          payment.status = 'failed';
          await payment.save();
          return res.status(400).json({ success: false, message: 'PayPal transaction not completed' });
        }

        captureId = capture.result.purchase_units[0].payments.captures[0].id;
        payment.status = 'success';
        payment.transactionId = captureId;
        await payment.save();
      } catch (sdkErr) {
        console.error('PayPal Capture SDK Error:', sdkErr.message);
        payment.status = 'failed';
        await payment.save();
        return res.status(400).json({ success: false, error: 'Failed to capture PayPal order' });
      }
    }

    // Mark QuizAttempt as paid
    attempt.paymentStatus = 'paid';
    await attempt.save();

    // Retrieve User and Quiz details for certificate and email
    const user = await User.findById(attempt.userId);
    const quiz = await Quiz.findById(attempt.quizId);

    // Calculate score percentage
    const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

    // Generate unique Certificate ID
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

    // Send confirmation email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const downloadUrl = `${frontendUrl}/certificate/${attempt._id}`;
    
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
      message: 'PayPal payment captured and certificate generated successfully.',
      attemptId: attempt._id,
      certificateId,
      certificate
    });
  } catch (err) {
    console.error('PayPal Order Capture Error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get PayPal Client config details
// @route   GET /api/payment/config
// @access  Private
exports.getPaymentConfig = (req, res) => {
  res.json({
    success: true,
    clientId: process.env.PAYPAL_CLIENT_ID === 'already_configured' ? '' : (process.env.PAYPAL_CLIENT_ID || ''),
    bypass: process.env.BYPASS_PAYMENT === 'true' || !process.env.PAYPAL_CLIENT_ID || process.env.PAYPAL_CLIENT_ID === 'already_configured'
  });
};
