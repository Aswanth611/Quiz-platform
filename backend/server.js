const dotenv = require('dotenv');
// Load env vars before database modules require it
dotenv.config();

const express = require('express');
const cors = require('cors');
const mongoose = require('./utils/db');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://quiz-platform-ivory.vercel.app",
    "https://quiz-platform-mail63is4-ai-lms-project.vercel.app"
  ],
  credentials: true
}));

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/quizcert');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Seed default quizzes if collection is empty
    await seedDefaultQuizzes();
    // Seed an admin user if not exists
    await seedAdminUser();
  } catch (err) {
    console.error(`Database connection error: ${err.message}`);
    process.exit(1);
  }
};

// Route files
const authRoutes = require('./routes/authRoutes');
const quizRoutes = require('./routes/quizRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const QuizAttempt = require('./models/QuizAttempt');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/admin', adminRoutes);

// Public leaderboard route
app.get('/api/leaderboard', async (req, res) => {
  try {
    // Fetch top 10 scores from paid attempts, populated with user and quiz info
    const attempts = await QuizAttempt.find({ paymentStatus: 'paid' })
      .populate('userId', 'name')
      .populate('quizId', 'title category')
      .sort('-score attemptedAt')
      .limit(10);

    const data = attempts.map(attempt => {
      const scorePct = Math.round((attempt.score / attempt.totalQuestions) * 100);
      return {
        _id: attempt._id,
        userName: attempt.userId ? attempt.userId.name : 'Anonymous',
        quizTitle: attempt.quizId ? attempt.quizId.title : 'Deleted Quiz',
        category: attempt.quizId ? attempt.quizId.category : 'N/A',
        scorePercentage: scorePct,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        date: attempt.attemptedAt
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Basic check route
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'QuizCert API is up and running' });
});

// Database seeding functions
async function seedDefaultQuizzes() {
  const Quiz = require('./models/Quiz');
  const count = await Quiz.countDocuments();
  if (count === 0) {
    console.log('Seeding default quizzes...');
    const defaultQuizzes = [
      {
        title: 'Full Stack Web Development Essentials',
        description: 'Test your knowledge on modern frontend and backend architectures, HTTP protocols, databases, and general web design principles.',
        category: 'Technology',
        timer: 5,
        questions: [
          {
            questionText: 'Which HTTP method is typically used to create a new resource on the server?',
            options: ['GET', 'POST', 'PUT', 'DELETE'],
            correctAnswer: 'POST'
          },
          {
            questionText: 'What does the CORS acronym stand for in web development?',
            options: [
              'Cross-Origin Resource Sharing',
              'Consumer-Oriented Request Security',
              'Client-Output Routing Server',
              'Common-Object Relational Schema'
            ],
            correctAnswer: 'Cross-Origin Resource Sharing'
          },
          {
            questionText: 'Which of the following database types uses structured tables with relations?',
            options: ['MongoDB', 'Redis', 'PostgreSQL', 'Cassandra'],
            correctAnswer: 'PostgreSQL'
          },
          {
            questionText: 'In React, what hook is primarily used to perform side effects like data fetching?',
            options: ['useState', 'useContext', 'useEffect', 'useMemo'],
            correctAnswer: 'useEffect'
          }
        ]
      },
      {
        title: 'JavaScript & Modern ES6+ Concepts',
        description: 'Advance your understanding of closures, asynchronous events, event loops, promises, and scoping mechanics.',
        category: 'Technology',
        timer: 4,
        questions: [
          {
            questionText: 'What is the output of "typeof null" in JavaScript?',
            options: ['"null"', '"undefined"', '"object"', '"boolean"'],
            correctAnswer: '"object"'
          },
          {
            questionText: 'Which keyword defines a block-scoped variable that can be re-assigned?',
            options: ['var', 'let', 'const', 'define'],
            correctAnswer: 'let'
          },
          {
            questionText: 'What is the correct way to handle rejection in a promise chain?',
            options: ['.then()', '.finally()', '.catch()', '.resolve()'],
            correctAnswer: '.catch()'
          },
          {
            questionText: 'What value does a function return by default if no return statement is specified?',
            options: ['null', 'undefined', 'false', '0'],
            correctAnswer: 'undefined'
          }
        ]
      },
      {
        title: 'Basic Science & Physics Trivia',
        description: 'Test your knowledge about elementary physics, solar systems, molecules, and biological processes.',
        category: 'Science',
        timer: 5,
        questions: [
          {
            questionText: 'Which planet in our solar system is known for its prominent rings?',
            options: ['Mars', 'Saturn', 'Jupiter', 'Neptune'],
            correctAnswer: 'Saturn'
          },
          {
            questionText: 'What is the speed of light in a vacuum (approximate)?',
            options: ['300,000 km/s', '150,000 km/s', '3,000 km/s', '3,000,000 km/s'],
            correctAnswer: '300,000 km/s'
          },
          {
            questionText: 'What cell organelle is commonly referred to as the powerhouse of the cell?',
            options: ['Nucleus', 'Ribosome', 'Mitochondria', 'Golgi Apparatus'],
            correctAnswer: 'Mitochondria'
          }
        ]
      }
    ];

    await Quiz.insertMany(defaultQuizzes);
    console.log('Default quizzes successfully seeded!');
  }
}

async function seedAdminUser() {
  const User = require('./models/User');
  const adminEmail = 'admin@quizcert.com';
  const adminExists = await User.findOne({ email: adminEmail });
  
  if (!adminExists) {
    console.log('Seeding default administrator...');
    await User.create({
      name: 'Platform Admin',
      email: adminEmail,
      password: 'adminpassword123',
      role: 'admin'
    });
    console.log('Admin user seeded: admin@quizcert.com / adminpassword123');
  }
}

// Start Server
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server executing in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
