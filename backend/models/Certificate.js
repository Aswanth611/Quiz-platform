const mongoose = require('../utils/db');

const CertificateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  quizAttemptId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  scorePercentage: {
    type: Number,
    required: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  generatedDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Certificate', CertificateSchema);
