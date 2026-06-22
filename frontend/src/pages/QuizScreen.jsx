import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { ChevronLeft, ChevronRight, Clock, HelpCircle, AlertTriangle, Loader2 } from 'lucide-react';

export default function QuizScreen() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: selectedOptionText }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [submitting, setSubmitting] = useState(false);
  const timerRef = useRef(null);

  // Fetch Quiz
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await API.get(`/quizzes/${id}`);
        if (res.data.success) {
          setQuiz(res.data.data);
          setTimeLeft(res.data.data.timer * 60); // convert minutes to seconds
        }
      } catch (err) {
        console.error('Error fetching quiz details:', err.message);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  // Timer Countdown Effect
  useEffect(() => {
    if (timeLeft <= 0 && quiz) {
      // Auto submit when time runs out
      handleAutoSubmit();
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft, quiz]);

  const handleAutoSubmit = () => {
    console.warn('Timer expired. Submitting answers automatically...');
    handleSubmit(true);
  };

  const handleOptionSelect = (qId, option) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: option
    }));
  };

  const handleSubmit = async (isAuto = false) => {
    if (!isAuto && !window.confirm('Are you sure you want to submit your answers?')) {
      return;
    }

    clearInterval(timerRef.current);
    setSubmitting(true);

    // Format answers array: [ { questionId, selectedOption } ]
    const formattedAnswers = quiz.questions.map((q) => ({
      questionId: q._id,
      selectedOption: selectedAnswers[q._id] || '' // empty string if skipped
    }));

    try {
      const res = await API.post('/quizzes/submit', {
        quizId: quiz._id,
        answers: formattedAnswers
      });

      if (res.data.success) {
        navigate(`/paywall/${res.data.attemptId}`);
      }
    } catch (err) {
      console.error('Failed to submit quiz:', err.message);
      alert('Error submitting quiz. Please try again.');
      setSubmitting(false);
    }
  };

  // Helper to format time left (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-16">
        <p className="text-rose-400">Quiz not found.</p>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentIdx];
  const totalQuestions = quiz.questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercentage = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="max-w-4xl mx-auto py-6">
      {/* Quiz Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-2 inline-block">
            {quiz.category}
          </span>
          <h1 className="text-2xl font-extrabold text-white">{quiz.title}</h1>
        </div>

        {/* Timer Box */}
        <div className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-mono font-bold text-lg shadow-md transition-colors ${
          timeLeft < 60
            ? 'bg-rose-500/15 border-rose-500/30 text-rose-400 animate-pulse'
            : 'bg-slate-900 border-slate-800 text-indigo-400'
        }`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="mb-8 space-y-2">
        <div className="flex justify-between text-xs text-slate-400 font-semibold">
          <span>Progress</span>
          <span>{answeredCount} of {totalQuestions} answered ({progressPercentage}%)</span>
        </div>
        <div className="h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-900">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Main Question Panel */}
      <div className="glass-panel p-8 rounded-3xl shadow-xl mb-6 relative">
        {submitting && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center z-20">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="font-bold text-slate-200">Evaluating your answers...</p>
          </div>
        )}

        {/* Question Counter */}
        <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold mb-4">
          <HelpCircle className="w-4 h-4" />
          <span>Question {currentIdx + 1} of {totalQuestions}</span>
        </div>

        {/* Question Text */}
        <h2 className="text-xl font-bold text-slate-100 mb-8 leading-relaxed">
          {currentQuestion.questionText}
        </h2>

        {/* Answer Options Grid */}
        <div className="space-y-4">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQuestion._id] === option;
            return (
              <button
                key={idx}
                onClick={() => handleOptionSelect(currentQuestion._id, option)}
                className={`w-full text-left p-5 rounded-2xl border text-sm font-medium transition-all flex items-center gap-4 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 text-indigo-200'
                    : 'bg-slate-950/40 border-slate-900 text-slate-350 hover:bg-slate-900/60 hover:border-slate-800'
                }`}
              >
                {/* Option Letter Icon */}
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation Actions */}
      <div className="flex justify-between items-center gap-4">
        <button
          onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
          disabled={currentIdx === 0}
          className="flex items-center gap-1.5 px-6 py-3 rounded-xl border border-slate-800 bg-slate-900 text-sm font-bold text-slate-300 hover:bg-slate-850 hover:text-white disabled:opacity-50 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {currentIdx < totalQuestions - 1 ? (
          <button
            onClick={() => setCurrentIdx((prev) => Math.min(totalQuestions - 1, prev + 1))}
            className="flex items-center gap-1.5 px-6 py-3 rounded-xl bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-500 transition-all cursor-pointer"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => handleSubmit(false)}
            className="flex items-center gap-1.5 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-sm font-bold text-white transition-all shadow-lg shadow-emerald-600/10 cursor-pointer animate-pulse"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
