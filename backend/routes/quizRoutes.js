const express = require('express');
const router = express.Router();
const { getQuizzes, getQuiz, submitQuiz, getQuizAttempt } = require('../controllers/quizController');
const { protect } = require('../middleware/auth');

router.get('/', getQuizzes);
router.get('/:id', getQuiz);
router.post('/submit', protect, submitQuiz);
router.get('/attempt/:id', protect, getQuizAttempt);

module.exports = router;
