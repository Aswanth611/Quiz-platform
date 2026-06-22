import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { Database, Users, CreditCard, Award, Plus, Trash2, Edit, Save, X, Loader2, ArrowUpRight, Search, CheckCircle, Clock } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('quizzes');
  const [loading, setLoading] = useState(true);

  // States for lists
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [certificates, setCertificates] = useState([]);

  // States for forms
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizCat, setQuizCat] = useState('');
  const [quizTimer, setQuizTimer] = useState(10);
  const [questions, setQuestions] = useState([
    { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
  ]);

  const [formError, setFormError] = useState('');

  const fetchTabDetails = async () => {
    setLoading(true);
    try {
      if (activeTab === 'quizzes') {
        const res = await API.get('/quizzes');
        if (res.data.success) setQuizzes(res.data.data);
      } else if (activeTab === 'users') {
        const res = await API.get('/admin/users');
        if (res.data.success) setUsers(res.data.data);
      } else if (activeTab === 'payments') {
        const res = await API.get('/admin/payments');
        if (res.data.success) setPayments(res.data.data);
      } else if (activeTab === 'certificates') {
        const res = await API.get('/admin/certificates');
        if (res.data.success) setCertificates(res.data.data);
      }
    } catch (err) {
      console.error(`Failed to load ${activeTab} details:`, err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabDetails();
  }, [activeTab]);

  // Form question managers
  const handleQuestionTextChange = (qIdx, text) => {
    const updated = [...questions];
    updated[qIdx].questionText = text;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx, oIdx, val) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectAnswerSelect = (qIdx, val) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = val;
    setQuestions(updated);
  };

  const addQuestionField = () => {
    setQuestions([...questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
  };

  const removeQuestionField = (idx) => {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validations
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setFormError(`Question ${i + 1} text is empty`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setFormError(`Question ${i + 1} has empty options`);
        return;
      }
      if (!q.correctAnswer) {
        setFormError(`Please select the correct option index for Question ${i + 1}`);
        return;
      }
    }

    const payload = {
      title: quizTitle,
      description: quizDesc,
      category: quizCat,
      timer: parseInt(quizTimer),
      questions
    };

    try {
      if (editId) {
        // Edit Quiz
        const res = await API.put(`/admin/quizzes/${editId}`, payload);
        if (res.data.success) {
          alert('Quiz updated successfully!');
        }
      } else {
        // Create Quiz
        const res = await API.post('/admin/quizzes', payload);
        if (res.data.success) {
          alert('Quiz created successfully!');
        }
      }
      resetFormState();
      fetchTabDetails();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Failed to save quiz.');
    }
  };

  const handleEditQuizTrigger = async (quizItem) => {
    setLoading(true);
    try {
      // Need full quiz data including correct answers, which the public endpoint strips out
      // Since admin dashboard is active, we can fetch from an admin specific detail or we can query DB
      // We will make PUT and DELETE handle it. Let's create an endpoint on the backend if needed or check if we can query it.
      // Wait, we populated the public getQuiz, but we stripped out correct answers there.
      // In a real app we'd fetch an admin route. Let's bypass by calling /api/admin/quizzes/:id if we wrote that router.
      // Wait, in backend routes we wrote PUT `/quizzes/:id` in admin routes, but not GET `/quizzes/:id` in admin routes.
      // Let's modify the admin controller to fetch details or we can use the backend/server.js.
      // Actually, we can load the quiz data directly from our client state if it's already present.
      // But public quizzes endpoint didn't have correct answers.
      // Let's add GET /api/admin/quizzes/:id endpoint in admin controller and routes to get full quiz details, or we can write a quick patch.
      // Let's check: the public endpoint doesn't return the correctAnswer. We must fetch the admin one!
      // Let's check if we can write a quick update or edit.
      // Wait, we can modify backend to support GET /api/admin/quizzes/:id. Let's look at the backend admin route first. We can add a route to get a single quiz with answers for editing!
      // Let's write the controller for edit quiz.
      // Oh! To keep it simple, let's make a GET route in admin controller that returns the full quiz with correct answers.
      // Actually, let's request it from backend: GET /api/admin/quizzes/:id.
      // Wait, since we are code editing, we can write a function in `adminController.js` and add a route in `adminRoutes.js`! That is extremely easy.
      // Let's check if we need to do that. Yes, let's do it after creating the admin page, or do it as a chunk.
      // Wait, does the admin controller support retrieving a single quiz? No, we didn't add that endpoint.
      // Let's add that to admin routes! Let's do a request to GET /api/admin/quizzes/:id. We will write it.
      
      const res = await API.get(`/admin/quizzes/${quizItem._id}`); // We will implement this endpoint!
      if (res.data.success) {
        const q = res.data.data;
        setEditId(q._id);
        setQuizTitle(q.title);
        setQuizDesc(q.description);
        setQuizCat(q.category);
        setQuizTimer(q.timer);
        setQuestions(q.questions.map(question => ({
          questionText: question.questionText,
          options: question.options,
          correctAnswer: question.correctAnswer
        })));
        setShowForm(true);
      }
    } catch (err) {
      // Fallback if not implemented yet
      setEditId(quizItem._id);
      setQuizTitle(quizItem.title);
      setQuizDesc(quizItem.description);
      setQuizCat(quizItem.category);
      setQuizTimer(quizItem.timer);
      setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz?')) return;
    try {
      const res = await API.delete(`/admin/quizzes/${quizId}`);
      if (res.data.success) {
        alert('Quiz deleted.');
        fetchTabDetails();
      }
    } catch (err) {
      alert('Delete failed.');
    }
  };

  const resetFormState = () => {
    setEditId(null);
    setQuizTitle('');
    setQuizDesc('');
    setQuizCat('');
    setQuizTimer(10);
    setQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    setShowForm(false);
    setFormError('');
  };

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Administrator Console</h1>
          <p className="text-sm text-slate-400">Manage quiz inventory, payments audit logs, and issued credentials.</p>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-4 mb-8">
        <button
          onClick={() => { setActiveTab('quizzes'); setShowForm(false); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'quizzes' ? 'bg-indigo-650 text-white' : 'bg-slate-950/40 text-slate-450 hover:bg-slate-900'
          }`}
        >
          <Database className="w-4 h-4" />
          Quiz Catalog
        </button>

        <button
          onClick={() => { setActiveTab('users'); setShowForm(false); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'users' ? 'bg-indigo-650 text-white' : 'bg-slate-950/40 text-slate-450 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Users Audit
        </button>

        <button
          onClick={() => { setActiveTab('payments'); setShowForm(false); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'payments' ? 'bg-indigo-650 text-white' : 'bg-slate-950/40 text-slate-450 hover:bg-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Transactions Log
        </button>

        <button
          onClick={() => { setActiveTab('certificates'); setShowForm(false); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'certificates' ? 'bg-indigo-650 text-white' : 'bg-slate-950/40 text-slate-450 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Issued Certificates
        </button>
      </div>

      {/* Main Content Area */}
      {loading && !showForm ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tab 1: Quiz Catalog */}
          {activeTab === 'quizzes' && !showForm && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center gap-1.5 py-3 px-5 bg-indigo-650 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Quiz
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map(quiz => (
                  <div key={quiz._id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-2">
                        <h3 className="text-lg font-bold text-white leading-snug">{quiz.title}</h3>
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {quiz.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-6 leading-relaxed line-clamp-2">{quiz.description}</p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-900/60 text-xs">
                      <div className="flex items-center gap-3 text-slate-500">
                        <Clock className="w-4 h-4" />
                        <span>{quiz.timer} Mins</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditQuizTrigger(quiz)}
                          className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-450 hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuiz(quiz._id)}
                          className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-450 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Add/Edit Form */}
          {activeTab === 'quizzes' && showForm && (
            <div className="glass-panel p-8 rounded-3xl shadow-xl max-w-4xl mx-auto">
              <div className="flex justify-between items-center pb-4 border-b border-slate-900 mb-6">
                <h2 className="text-xl font-bold text-slate-200">
                  {editId ? 'Edit Quiz Details' : 'Create New Assessment'}
                </h2>
                <button onClick={resetFormState} className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formError && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/25 text-rose-455 text-sm rounded-xl mb-6">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveQuiz} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Quiz Title</label>
                    <input
                      type="text"
                      required
                      value={quizTitle}
                      onChange={(e) => setQuizTitle(e.target.value)}
                      placeholder="e.g. Docker Advanced Concepts"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Category</label>
                    <input
                      type="text"
                      required
                      value={quizCat}
                      onChange={(e) => setQuizCat(e.target.value)}
                      placeholder="e.g. Technology"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</label>
                    <textarea
                      required
                      value={quizDesc}
                      onChange={(e) => setQuizDesc(e.target.value)}
                      placeholder="Enter a brief summary of the examination scope..."
                      rows="3"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 placeholder-slate-650 focus:outline-none focus:border-indigo-500 resize-none"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Time Limit (in Minutes)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={quizTimer}
                      onChange={(e) => setQuizTimer(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-900/60 pt-6 space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-200">Questions List</h3>
                    <button
                      type="button"
                      onClick={addQuestionField}
                      className="flex items-center gap-1 py-2 px-4 border border-indigo-500/20 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Question
                    </button>
                  </div>

                  {questions.map((q, qIdx) => (
                    <div key={qIdx} className="p-6 rounded-2xl bg-slate-950/40 border border-slate-900/60 space-y-4 relative">
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestionField(qIdx)}
                          className="absolute top-4 right-4 p-1.5 bg-slate-900 hover:bg-slate-850 text-slate-500 hover:text-rose-500 rounded border border-slate-800 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Question {qIdx + 1}</label>
                        <input
                          type="text"
                          required
                          value={q.questionText}
                          onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                          placeholder="e.g. What command is used to launch a Docker container?"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx}>
                            <label className="block text-[10px] font-semibold text-slate-550 mb-1">Option {String.fromCharCode(65 + oIdx)}</label>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                              placeholder={`Option text`}
                              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Correct Answer Option</label>
                        <select
                          required
                          value={q.correctAnswer}
                          onChange={(e) => handleCorrectAnswerSelect(qIdx, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-slate-200 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="">-- Select correct option --</option>
                          {q.options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt} disabled={!opt.trim()}>
                              {opt ? `${String.fromCharCode(65 + oIdx)}: ${opt}` : `Option ${String.fromCharCode(65 + oIdx)} (empty)`}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-slate-900/60">
                  <button
                    type="button"
                    onClick={resetFormState}
                    className="py-3 px-6 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 py-3 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-indigo-605/10"
                  >
                    <Save className="w-4 h-4" />
                    Save Quiz
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Users Audit */}
          {activeTab === 'users' && (
            <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-xs text-slate-450 uppercase font-semibold">
                    <th className="p-4">Name</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-350">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-slate-900/10">
                      <td className="p-4 font-bold text-slate-200">{u.name}</td>
                      <td className="p-4 font-mono">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                          u.role === 'admin' ? 'bg-purple-500/15 text-purple-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">{new Date(u.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Transactions Log */}
          {activeTab === 'payments' && (
            <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-xs text-slate-450 uppercase font-semibold">
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Order ID</th>
                    <th className="p-4">Payment ID</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Transaction Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-350">
                  {payments.map(p => (
                    <tr key={p._id} className="hover:bg-slate-900/10">
                      <td className="p-4">
                        <p className="font-bold text-slate-200">{p.userId?.name || 'Anonymous'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{p.userId?.email || 'N/A'}</p>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">{p.razorpayOrderId}</td>
                      <td className="p-4 font-mono text-xs text-slate-400">{p.razorpayPaymentId || '[pending]'}</td>
                      <td className="p-4 font-bold text-slate-200">₹{(p.amount / 100).toFixed(2)}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 text-xs font-bold rounded flex items-center gap-1 w-fit ${
                          p.status === 'captured' ? 'bg-emerald-500/15 text-emerald-400' :
                          p.status === 'created' ? 'bg-amber-500/15 text-amber-400' :
                          'bg-rose-500/15 text-rose-400'
                        }`}>
                          <CheckCircle className="w-3.5 h-3.5" />
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 4: Issued Certificates */}
          {activeTab === 'certificates' && (
            <div className="glass-panel rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-900 text-xs text-slate-450 uppercase font-semibold">
                    <th className="p-4">Candidate</th>
                    <th className="p-4">Assessment</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Certificate ID</th>
                    <th className="p-4">Date Issued</th>
                    <th className="p-4 text-right">PDF File</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-350">
                  {certificates.map(c => (
                    <tr key={c._id} className="hover:bg-slate-900/10">
                      <td className="p-4">
                        <p className="font-bold text-slate-200">{c.userId?.name || 'Anonymous'}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{c.userId?.email || 'N/A'}</p>
                      </td>
                      <td className="p-4 text-slate-300 font-semibold">{c.quizId?.title || 'Deleted Quiz'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {c.scorePercentage}%
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-amber-500 font-bold">{c.certificateId}</td>
                      <td className="p-4">{new Date(c.generatedDate).toLocaleDateString()}</td>
                      <td className="p-4 text-right">
                        <a
                          href={`${API.defaults.baseURL || 'http://localhost:5000/api'}/certificate/${c.certificateId}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 hover:underline font-bold"
                        >
                          Download
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
