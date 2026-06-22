const express = require('express');
const router = express.Router();
const {
  addQuiz,
  updateQuiz,
  deleteQuiz,
  getUsers,
  getPayments,
  getCertificates,
  getQuizById
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// Protect all routes within this router with both JWT validation and admin check
router.use(protect);
router.use(admin);

router.post('/quizzes', addQuiz);
router.get('/quizzes/:id', getQuizById);
router.put('/quizzes/:id', updateQuiz);
router.delete('/quizzes/:id', deleteQuiz);
router.get('/users', getUsers);
router.get('/payments', getPayments);
router.get('/certificates', getCertificates);

module.exports = router;
