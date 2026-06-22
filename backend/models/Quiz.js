const mongoose = require('../utils/db');

const QuestionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Please add question text']
  },
  options: {
    type: [String],
    required: [true, 'Please add options'],
    validate: {
      validator: function(v) {
        return v && v.length >= 2;
      },
      message: 'A question must have at least 2 options.'
    }
  },
  correctAnswer: {
    type: String,
    required: [true, 'Please add correct answer']
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  timer: {
    type: Number,
    default: 10 // time in minutes
  },
  questions: [QuestionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Quiz', QuizSchema);
