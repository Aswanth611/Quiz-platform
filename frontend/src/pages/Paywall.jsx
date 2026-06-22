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
  const [config, setConfig] = useState(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaywallData = async () => {
      try {
        // 1. Fetch attempt info (expect 402 if unpaid, 200 if paid)
        try {
          const res = await API.get(`/quizzes/attempt/${attemptId}`);
          if (res.data.success && res.data.paymentStatus === 'paid') {
            navigate(`/certificate/${attemptId}`);
            return;
          }
        } catch (err) {
          if (err.response && err.response.status === 402) {
            setAttempt(err.response.data.attempt);
          } else {
            throw err;
          }
        }

        // 2. Fetch payment config details
        const configRes = await API.get('/payment/config');
        if (configRes.data.success) {
          setConfig(configRes.data);
        }
      } catch (err) {
        setError('Failed to retrieve quiz attempt data or server config.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPaywallData();
  }, [attemptId, navigate]);

  // PayPal JS SDK dynamic loader
  useEffect(() => {
    if (!config || config.bypass || sdkReady) return;

    const loadPayPalScript = () => {
      // If already loaded in window
      if (window.paypal) {
        setSdkReady(true);
        return;
      }
      const script = document.createElement('script');
      // Default client-id is 'sb' (PayPal Sandbox default ID) if none is configured
      script.src = `https://www.paypal.com/sdk/js?client-id=${config.clientId || 'sb'}&currency=USD`;
      script.async = true;
      script.onload = () => setSdkReady(true);
      script.onerror = () => {
        setError('Failed to load PayPal Smart Payment Buttons SDK.');
      };
      document.body.appendChild(script);
    };

    loadPayPalScript();
  }, [config, sdkReady]);

  // Render PayPal buttons once SDK is ready
  useEffect(() => {
    if (!sdkReady || !config || config.bypass) return;

    const renderPayPalButtons = () => {
      const container = document.getElementById('paypal-button-container');
      if (container && window.paypal) {
        container.innerHTML = ''; // clear previous instances
        window.paypal.Buttons({
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          },
          createOrder: async () => {
            setError('');
            setPaying(true);
            try {
              const res = await API.post('/payment/create-order', { attemptId });
              if (res.data.success) {
                return res.data.orderID;
              } else {
                throw new Error('Failed to create orderID');
              }
            } catch (err) {
              setError(err.response?.data?.message || 'Failed to initialize PayPal transaction.');
              setPaying(false);
              throw err;
            }
          },
          onApprove: (data) => {
            // Redirect to success page to capture transaction
            navigate(`/payment-success?token=${data.orderID}&attemptId=${attemptId}`);
          },
          onError: (err) => {
            setError('PayPal checkout encountered an error. Please try again.');
            console.error('PayPal Smart Buttons error:', err);
            setPaying(false);
          },
          onCancel: () => {
            setPaying(false);
          }
        }).render('#paypal-button-container');
      }
    };

    renderPayPalButtons();
  }, [sdkReady, config, attemptId, navigate]);

  // Trigger simulated payment for bypass mode
  const handleSimulatedPaymentTrigger = async () => {
    setError('');
    setPaying(true);
    try {
      const res = await API.post('/payment/create-order', { attemptId });
      if (res.data.success) {
        setMockOrder({ id: res.data.orderID });
        setShowSimulateModal(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order.');
    } finally {
      setPaying(false);
    }
  };

  const handleSimulatedSuccess = async () => {
    setShowSimulateModal(false);
    setPaying(true);
    try {
      // Trigger simulation capture call on /payment-success direct path
      const token = mockOrder?.id || `order_paypal_mock_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      navigate(`/payment-success?token=${token}&attemptId=${attemptId}`);
    } catch (err) {
      setError('Simulated checkout navigation failed.');
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
        <div className="inline-flex p-3 bg-indigo-600/10 border border-indigo-600/25 rounded-2xl text-indigo-400 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Quiz Completed!</h1>
        <p className="text-sm text-slate-400">
          Your attempt on <strong className="text-slate-200">{attempt?.quizTitle}</strong> has been saved.
        </p>
      </div>

      {/* Paywall Container */}
      <div className="glass-panel p-8 rounded-3xl shadow-xl relative overflow-hidden">
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
            {/* Display in approx USD value matching small charge */}
            <span className="text-4xl font-extrabold text-white">$0.99</span>
            <span className="text-sm text-slate-500">(~ ₹80 INR)</span>
          </div>
        </div>

        {/* Benefits Checklist */}
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

        {/* Payment CTA Section */}
        {config?.bypass ? (
          <button
            onClick={handleSimulatedPaymentTrigger}
            disabled={paying}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-amber-600 to-indigo-650 hover:from-amber-500 hover:to-indigo-550 text-white font-bold rounded-2xl shadow-xl transition-all cursor-pointer"
          >
            {paying ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Pay $0.99 (Simulated Sandbox)
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            {!sdkReady && (
              <div className="flex items-center justify-center gap-2 text-slate-400 text-sm py-4">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Loading PayPal Payment Buttons...
              </div>
            )}
            <div id="paypal-button-container" className="relative z-10"></div>
          </div>
        )}

        <p className="text-[10px] text-slate-500 text-center mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Transactions secured by PayPal Sandbox. Fully encrypted.
        </p>
      </div>

      {/* Sandbox Simulation Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full shadow-2xl border border-indigo-500/20 relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4 text-amber-400">
              <Sparkles className="w-6 h-6 animate-pulse" />
              <h3 className="text-xl font-bold">Simulated Sandbox Mode</h3>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              QuizCert is executing in developer sandbox mode (`BYPASS_PAYMENT=true` or placeholder client credentials). Click "Simulate Successful Checkout" to proceed.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleSimulatedSuccess}
                className="w-full py-3.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-all cursor-pointer"
              >
                Simulate Successful Checkout
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
