const Quiz = require('../models/Quiz');
const User = require('../models/User');
const Payment = require('../models/Payment');
const Certificate = require('../models/Certificate');

// @desc    Add a new quiz
// @route   POST /api/admin/quizzes
// @access  Private/Admin
exports.addQuiz = async (req, res) => {
  try {
    const { title, description, category, timer, questions } = req.body;

    const quiz = await Quiz.create({
      title,
      description,
      category,
      timer,
      questions
    });

    res.status(201).json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update an existing quiz
// @route   PUT /api/admin/quizzes/:id
// @access  Private/Admin
exports.updateQuiz = async (req, res) => {
  try {
    let quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/admin/quizzes/:id
// @access  Private/Admin
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    await quiz.deleteOne();

    res.json({ success: true, message: 'Quiz deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}).sort('-createdAt');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all payments
// @route   GET /api/admin/payments
// @access  Private/Admin
exports.getPayments = async (req, res) => {
  try {
    const payments = await Payment.find({})
      .populate('userId', 'name email')
      .populate({
        path: 'quizAttemptId',
        populate: { path: 'quizId', select: 'title' }
      })
      .sort('-createdAt');
      
    res.json({ success: true, data: payments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get all certificates
// @route   GET /api/admin/certificates
// @access  Private/Admin
exports.getCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({})
      .populate('userId', 'name email')
      .populate('quizId', 'title category')
      .sort('-generatedDate');

    res.json({ success: true, data: certificates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single quiz details with correct answers (for editing)
// @route   GET /api/admin/quizzes/:id
// @access  Private/Admin
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }
    res.json({ success: true, data: quiz });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

