import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import API from '../services/api';
import confetti from 'canvas-confetti';
import { Award, Download, ArrowRight, CheckCircle, XCircle, Calendar, RefreshCw, Loader2, Sparkles } from 'lucide-react';

export default function CertificateScreen() {
  const { attemptId } = useParams();
  const [searchParams] = useSearchParams();

  const [attempt, setAttempt] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Trigger confetti if navigated with ?confetti=true
    if (searchParams.get('confetti') === 'true') {
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 }
      });
    }

    const fetchResultData = async () => {
      try {
        const [attemptRes, certRes] = await Promise.all([
          API.get(`/quizzes/attempt/${attemptId}`),
          API.get(`/certificate/${attemptId}`)
        ]);

        if (attemptRes.data.success) {
          setAttempt(attemptRes.data.attempt);
        }

        if (certRes.data.success) {
          setCertificate(certRes.data.certificate);
        }
      } catch (err) {
        console.error('Failed to load certificate screen data:', err);
        setError('Could not fetch quiz results or certificate details.');
      } finally {
        setLoading(false);
      }
    };

    fetchResultData();
  }, [attemptId, searchParams]);

  const handleDownload = () => {
    if (!certificate) return;
    const downloadUrl = `${API.defaults.baseURL || 'http://localhost:5000/api'}/certificate/${certificate.certificateId}/download`;
    // Open in a new tab or trigger a window redirect to start direct binary download
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !attempt || !certificate) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-panel rounded-2xl text-center">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Access Denied</h3>
        <p className="text-slate-400 mb-6">You must pay for this quiz attempt before accessing results and certificates.</p>
        <Link
          to={`/paywall/${attemptId}`}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white text-sm"
        >
          Go to Checkout
        </Link>
      </div>
    );
  }

  const scorePercentage = Math.round((attempt.score / attempt.totalQuestions) * 100);

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10">
      {/* Top Congratulatory Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-semibold animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400/20" />
          Certified Professional Achievement
        </div>
        <h1 className="text-4xl font-extrabold text-white">Congratulations, {certificate.userId.name}!</h1>
        <p className="text-slate-400 max-w-md mx-auto text-sm">
          You passed the <strong className="text-slate-200">{attempt.quizTitle}</strong> examination and earned your official credential.
        </p>
      </div>

      {/* Grid: Certificate Preview & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle: HTML Certificate Preview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative border-4 border-slate-900 rounded-3xl p-8 bg-slate-950/80 shadow-2xl overflow-hidden min-h-[360px] flex flex-col justify-between">
            {/* Gold accents and corners */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500"></div>
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500"></div>
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500"></div>
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500"></div>
            
            {/* Logo */}
            <div className="text-center mt-4">
              <span className="font-bold text-xs tracking-widest text-slate-500 block uppercase mb-1">
                Q U I Z C E R T
              </span>
              <div className="w-6 h-6 bg-amber-500 mx-auto rounded-full flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-slate-950" />
              </div>
            </div>

            {/* Cert Title */}
            <div className="text-center my-6">
              <h2 className="text-2xl font-serif italic text-slate-250">Certificate of Achievement</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5">This is proudly presented to</p>
              <h3 className="text-xl font-bold text-amber-500 uppercase tracking-wide mt-2">{certificate.userId.name}</h3>
            </div>

            {/* Verification & Bottom Details */}
            <div className="text-center text-xs text-slate-400 leading-relaxed px-4">
              for successfully completing the online examination and demonstrating proficiency in <br />
              <strong className="text-slate-200 text-sm">{attempt.quizTitle}</strong> with a score of <strong className="text-amber-500">{scorePercentage}%</strong>.
            </div>

            {/* ID & Date Footer */}
            <div className="flex justify-between items-end border-t border-slate-900/60 pt-4 mt-6 text-[10px] text-slate-500 font-mono">
              <div>
                <p>CERTIFICATE ID: {certificate.certificateId}</p>
                <p>DATE: {new Date(certificate.generatedDate).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="italic text-slate-400">QuizCert Engine Verified</p>
              </div>
            </div>
          </div>

          {/* Download & Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 font-bold text-white rounded-2xl shadow-lg shadow-indigo-650/15 hover:scale-[1.01] transition-all cursor-pointer"
            >
              <Download className="w-5 h-5" />
              Download PDF Certificate
            </button>
            <Link
              to="/dashboard"
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-slate-300 hover:text-white rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              Try Another Quiz
              <RefreshCw className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Panel: Scoring Summary */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-200 pb-3 border-b border-slate-900">Attempt Summary</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Raw Score:</span>
                <span className="font-bold text-slate-200">{attempt.score} / {attempt.totalQuestions} correct</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Percentage:</span>
                <span className="font-extrabold text-indigo-400 text-lg">{scorePercentage}%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Date Completed:</span>
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  {new Date(attempt.attemptedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">ID Verification:</span>
                <span className="font-mono text-xs text-amber-500 font-bold">{certificate.certificateId}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-900 text-center">
            <Link
              to={`/verify-certificate?id=${certificate.certificateId}`}
              className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              Go to public verification page
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* detailed reviews */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-slate-200">Review Questions & Solutions</h3>
        
        <div className="space-y-6">
          {attempt.details && attempt.details.map((detail, idx) => (
            <div
              key={idx}
              className={`p-6 rounded-2xl border transition-all ${
                detail.isCorrect
                  ? 'bg-emerald-500/5 border-emerald-500/10'
                  : 'bg-rose-500/5 border-rose-500/10'
              }`}
            >
              <div className="flex items-start gap-4">
                {detail.isCorrect ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                )}
                
                <div className="space-y-4 w-full">
                  <h4 className="font-bold text-slate-200 text-base leading-relaxed">
                    Question {idx + 1}: {detail.questionText}
                  </h4>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {detail.options.map((opt, oIdx) => {
                      const isSelected = detail.selectedOption === opt;
                      const isCorrectAnswer = detail.correctAnswer === opt;
                      
                      let optionStyle = 'bg-slate-950/40 border-slate-900 text-slate-400';
                      if (isSelected) {
                        optionStyle = detail.isCorrect
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300 font-semibold'
                          : 'bg-rose-500/15 border-rose-500/30 text-rose-350 font-semibold';
                      } else if (isCorrectAnswer) {
                        optionStyle = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-semibold';
                      }

                      return (
                        <div
                          key={oIdx}
                          className={`p-4 rounded-xl border text-sm flex items-center gap-3 ${optionStyle}`}
                        >
                          <span className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? (detail.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white')
                              : (isCorrectAnswer ? 'bg-emerald-600/30 text-emerald-400' : 'bg-slate-900 text-slate-600')
                          }`}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {!detail.isCorrect && (
                    <div className="text-xs text-slate-500">
                      You selected: <span className="text-rose-450 font-bold">{detail.selectedOption || '[Skipped]'}</span>. Correct answer: <span className="text-emerald-500 font-bold">{detail.correctAnswer}</span>.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
