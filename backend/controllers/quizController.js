const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Public
exports.getQuizzes = async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    
    // Select metadata, exclude questions arrays to keep payload light
    const quizzes = await Quiz.find(query).select('title description category timer questions');
    
    // Exclude correct answers from questions
    const sanitizedQuizzes = quizzes.map(quiz => {
      const sanitizedQuestions = quiz.questions.map(q => ({
        _id: q._id,
        questionText: q.questionText,
        options: q.options
      }));
      return {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timer: quiz.timer,
        questionsCount: quiz.questions.length,
        questions: sanitizedQuestions
      };
    });

    res.json({ success: true, data: sanitizedQuizzes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Get single quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Exclude correctAnswer field from the questions before returning to frontend
    const sanitizedQuestions = quiz.questions.map(q => ({
      _id: q._id,
      questionText: q.questionText,
      options: q.options
    }));

    res.json({
      success: true,
      data: {
        _id: quiz._id,
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        timer: quiz.timer,
        questions: sanitizedQuestions
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Submit quiz answers and score it (locks result immediately)
// @route   POST /api/quizzes/submit
// @access  Private (Requires Login)
exports.submitQuiz = async (req, res) => {
  try {
    const { quizId, answers } = req.body; // answers: [ { questionId, selectedOption } ]
    const userId = req.user.id;

    // Fetch quiz with correct answers from DB
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Quiz not found' });
    }

    // Evaluate answers
    let score = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach(question => {
      const submitted = answers.find(a => a.questionId.toString() === question._id.toString());
      if (submitted && submitted.selectedOption === question.correctAnswer) {
        score++;
      }
    });

    // Create QuizAttempt (default paymentStatus is 'pending')
    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      answers,
      score,
      totalQuestions,
      paymentStatus: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Quiz submitted successfully. Results are locked.',
      attemptId: attempt._id,
      paymentStatus: attempt.paymentStatus
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Fetch a specific quiz attempt
// @route   GET /api/quizzes/attempt/:id
// @access  Private (Requires Login)
exports.getQuizAttempt = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id)
      .populate('quizId', 'title description category questions')
      .populate('userId', 'name email');

    if (!attempt) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    // Ensure the request user matches the attempt owner
    if (attempt.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Paywall Enforcement:
    // If not paid, do NOT send the score, and do NOT send correct answers
    if (attempt.paymentStatus === 'pending') {
      return res.status(402).json({
        success: false,
        message: 'Payment required to view results.',
        paymentStatus: 'pending',
        attempt: {
          _id: attempt._id,
          quizTitle: attempt.quizId.title,
          totalQuestions: attempt.totalQuestions,
          attemptedAt: attempt.attemptedAt
        }
      });
    }

    // If paid, provide full detailed analysis including question details and correct answers
    const detailedAnswers = attempt.answers.map(ans => {
      const question = attempt.quizId.questions.find(q => q._id.toString() === ans.questionId.toString());
      return {
        questionId: ans.questionId,
        questionText: question ? question.questionText : 'Question Deleted',
        options: question ? question.options : [],
        selectedOption: ans.selectedOption,
        correctAnswer: question ? question.correctAnswer : '',
        isCorrect: question ? question.correctAnswer === ans.selectedOption : false
      };
    });

    res.json({
      success: true,
      paymentStatus: 'paid',
      attempt: {
        _id: attempt._id,
        quizTitle: attempt.quizId.title,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        attemptedAt: attempt.attemptedAt,
        details: detailedAnswers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
