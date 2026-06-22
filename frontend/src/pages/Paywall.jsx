import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Lock, CreditCard, ShieldCheck, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2 } from 'lucide-react';

export default function Paywall() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [mockOrder, setMockOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAttemptStatus = async () => {
      try {
        const res = await API.get(`/quizzes/attempt/${attemptId}`);
        // If this succeeds, the quiz is already paid for. Redirect to Certificate.
        if (res.data.success && res.data.paymentStatus === 'paid') {
          navigate(`/certificate/${attemptId}`);
        }
      } catch (err) {
        // We expect a 402 error when it is unpaid. Let's capture the basic attempt info.
        if (err.response && err.response.status === 402) {
          setAttempt(err.response.data.attempt);
        } else {
          setError('Failed to retrieve quiz attempt data. Please try again.');
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    checkAttemptStatus();
  }, [attemptId, navigate]);

  // Dynamically load Razorpay SDK Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setError('');
    setPaying(true);

    try {
      // 1. Create order on backend
      const res = await API.post('/payment/create-order', { attemptId });
      if (!res.data.success) {
        throw new Error('Order creation failed');
      }

      const { order, bypass } = res.data;

      // 2. Handle Simulation/Bypass Mode
      if (bypass) {
        setMockOrder(order);
        setShowSimulateModal(true);
        setPaying(false);
        return;
      }

      // 3. Handle Live Razorpay Mode
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you offline?');
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mockkeyid123',
        amount: order.amount,
        currency: order.currency,
        name: 'QuizCert Platform',
        description: `Unlock credentials for: ${attempt.quizTitle}`,
        order_id: order.id,
        handler: async function (response) {
          setPaying(true);
          try {
            // Verify payment on backend
            const verifyRes = await API.post('/payment/verify', {
              attemptId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            if (verifyRes.data.success) {
              navigate(`/certificate/${attemptId}?confetti=true`);
            }
          } catch (verErr) {
            setError('Payment verification failed on the server.');
            console.error(verErr);
          } finally {
            setPaying(false);
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem('user'))?.name || '',
          email: JSON.parse(localStorage.getItem('user'))?.email || ''
        },
        theme: {
          color: '#4f46e5'
        },
        modal: {
          ondismiss: function () {
            setPaying(false);
          }
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      setError(err.message || 'Payment initiation failed.');
      setPaying(false);
    }
  };

  const handleSimulatedSuccess = async () => {
    setShowSimulateModal(false);
    setPaying(true);

    try {
      const verifyRes = await API.post('/payment/verify', {
        attemptId,
        razorpayOrderId: mockOrder.id,
        razorpayPaymentId: `pay_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });

      if (verifyRes.data.success) {
        // Successfully verified, route to certificate page with confetti trigger
        navigate(`/certificate/${attemptId}?confetti=true`);
      }
    } catch (err) {
      setError('Simulated payment verification failed on server.');
      console.error(err);
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 glass-panel rounded-2xl text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Error Encountered</h3>
        <p className="text-slate-400 mb-6">{error}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Title */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-600/25 rounded-2xl text-indigo-400 mb-4 animate-bounce">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Quiz Completed!</h1>
        <p className="text-sm text-slate-400">
          Your attempt on <strong className="text-slate-200">{attempt?.quizTitle}</strong> has been saved.
        </p>
      </div>

      {/* Paywall Container */}
      <div className="glass-panel p-8 rounded-3xl shadow-xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-widest font-semibold mb-1">
            Unlock Results & Certificate
          </p>
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-extrabold text-white">₹49</span>
            <span className="text-sm text-slate-500">one-time charge</span>
          </div>
        </div>

        {/* Benefits Checkbox Grid */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-900/60">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-200">Instant Performance Grade</h4>
              <p className="text-xs text-slate-400 mt-0.5">Reveal your final score and percentage rating.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-900/60">
            <FileText className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-200">Detailed Answer Analysis</h4>
              <p className="text-xs text-slate-400 mt-0.5">Review what answers you selected compared to correct answers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-900/60">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-200">Dynamic PDF Certificate</h4>
              <p className="text-xs text-slate-400 mt-0.5">Auto-generate a download-ready landscape credential with a unique ID.</p>
            </div>
          </div>

          <div className="flex items-start gap-3.5 p-4 rounded-2xl bg-slate-950/40 border border-slate-900/60">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-slate-200">Public Verification Link</h4>
              <p className="text-xs text-slate-400 mt-0.5">Includes a permanent hosted ID page for verification.</p>
            </div>
          </div>
        </div>

        {/* Payment CTA Button */}
        <button
          onClick={handlePayment}
          disabled={paying}
          className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-650/20 hover:scale-[1.01] transition-all cursor-pointer"
        >
          {paying ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay ₹49 & Unlock Now
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-500 text-center mt-4 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Transactions secured by Razorpay Checkout. Fully refundable.
        </p>
      </div>

      {/* Sandbox Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-indigo-500/20 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <h3 className="text-xl font-bold">Simulated Sandbox Mode</h3>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              QuizCert is executing in development mode (`BYPASS_PAYMENT=true`). A live Razorpay checkout is not required. You can complete the demo flow by triggering a simulated payment.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSimulatedSuccess}
                className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Simulate Successful Payment
              </button>
              
              <button
                onClick={() => {
                  setShowSimulateModal(false);
                  setPaying(false);
                }}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
