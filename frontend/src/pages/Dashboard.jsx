import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import { BookOpen, Clock, Play, Award, Loader2, Trophy, Eye } from 'lucide-react';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [quizzesRes, leaderboardRes] = await Promise.all([
          API.get('/quizzes'),
          API.get('/leaderboard')
        ]);

        if (quizzesRes.data.success) {
          setQuizzes(quizzesRes.data.data);
          
          // Extract unique categories
          const cats = ['All', ...new Set(quizzesRes.data.data.map(q => q.category))];
          setCategories(cats);
        }

        if (leaderboardRes.data.success) {
          setLeaderboard(leaderboardRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredQuizzes = selectedCategory === 'All'
    ? quizzes
    : quizzes.filter(q => q.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-6">
      {/* Welcome Banner */}
      <div className="mb-10 p-8 glass-panel rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h1 className="text-3xl font-extrabold text-white mb-2">Quiz Catalog</h1>
          <p className="text-slate-400 max-w-lg">
            Test your expertise. Complete any quiz for free, pass the paywall to secure your certified credential and review detailed solutions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Categories and Quiz List */}
        <div className="lg:col-span-3 space-y-8">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Quiz Grid */}
          {filteredQuizzes.length === 0 ? (
            <div className="text-center py-16 glass-panel rounded-2xl">
              <p className="text-slate-400">No quizzes available in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredQuizzes.map(quiz => (
                <div key={quiz._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between glass-panel-hover relative overflow-hidden group">
                  <div>
                    {/* Category tag */}
                    <span className="inline-block px-2.5 py-1 text-xs font-semibold rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
                      {quiz.category}
                    </span>
                    
                    <h3 className="text-xl font-bold text-slate-100 mb-2 group-hover:text-indigo-400 transition-colors">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                      {quiz.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-900/50 text-slate-400 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4 text-indigo-400" />
                        {quiz.questionsCount} Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-indigo-400" />
                        {quiz.timer} Mins
                      </span>
                    </div>

                    <Link
                      to={`/quiz/${quiz._id}`}
                      className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-white transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      Start
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard / Statistics Panel */}
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-900">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-200">Global Leaderboard</h2>
            </div>

            {leaderboard.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">
                No certified records found yet.
              </p>
            ) : (
              <div className="space-y-4">
                {leaderboard.map((item, index) => (
                  <div key={item._id} className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-950/40 border border-slate-900/40">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-amber-500/20 text-amber-400' :
                        index === 1 ? 'bg-slate-400/20 text-slate-300' :
                        index === 2 ? 'bg-amber-700/20 text-amber-600' :
                        'bg-slate-900 text-slate-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="truncate">
                        <p className="font-bold text-slate-300 truncate">{item.userName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.quizTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        {item.scorePercentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
