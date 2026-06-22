import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Award, Zap, Shield, CheckCircle2, ArrowRight, Play } from 'lucide-react';

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="max-w-6xl mx-auto py-12 flex flex-col items-center">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mb-20 animate-fade-in">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-6">
          <Zap className="w-4 h-4 fill-indigo-400/20" />
          QuizCert Freemium Certificate Engine v1.0
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Take Quizzes for{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-200 to-indigo-500 bg-clip-text text-transparent">
            Free
          </span>
          .<br />
          Unlock Verified{' '}
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
            Certificates
          </span>{' '}
          Instantly.
        </h1>
        <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
          Test your skills across programming, database management, and science completely free. Pay only ₹49 to download your official PDF credentials.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={user ? '/dashboard' : '/register'}
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 font-bold text-white hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 hover:scale-[1.02] transition-all"
          >
            Start Quiz Now
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/verify-certificate"
            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-slate-900 border border-slate-800 font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
          >
            Verify Credentials
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-row-1 lg:grid-cols-3 gap-8 w-full mb-24">
        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/10 rounded-full blur-2xl group-hover:bg-indigo-600/20 transition-all"></div>
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl w-fit text-indigo-400 mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-200">Interactive Quiz Runner</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Take timed multiple-choice assessments with real-time progress indicators, slide pagination, and quick answer submission.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-all"></div>
          <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl w-fit text-amber-400 mb-6">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-200">PDF Certificate Generator</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Instantly render high-quality, landscape A4 PDF completion certificates detailing your exact performance, issued instantly.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all"></div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl w-fit text-emerald-400 mb-6">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-200">Public Verification</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            Employers or viewers can input your unique Certificate ID on our lookup portal to verify your exam completion details dynamically.
          </p>
        </div>
      </div>

      {/* How it works Section */}
      <div className="w-full glass-panel p-12 rounded-3xl mb-12">
        <h2 className="text-3xl font-bold mb-12 text-center text-slate-200">
          How the Freemium Model Works
        </h2>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-indigo-400 text-lg mb-4">
              1
            </div>
            <h4 className="font-bold text-slate-200 mb-2">Select & Attempt</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Register an account and choose any test. Answer the questions at no charge.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-indigo-400 text-lg mb-4">
              2
            </div>
            <h4 className="font-bold text-slate-200 mb-2">Hit the Paywall</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your score is evaluated instantly. View the payment prompt to unlock your results.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-indigo-400 text-lg mb-4">
              3
            </div>
            <h4 className="font-bold text-slate-200 mb-2">Secure Checkout</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Complete a small transaction of ₹49 via Razorpay order verification API.
            </p>
          </div>

          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-indigo-400 text-lg mb-4">
              4
            </div>
            <h4 className="font-bold text-slate-200 mb-2">Instant Certificate</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Download your signed, verified PDF credential and view detailed metrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
