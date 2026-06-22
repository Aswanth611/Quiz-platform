import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const orderID = searchParams.get('token') || searchParams.get('orderID');
  const attemptId = searchParams.get('attemptId');

  useEffect(() => {
    const capturePaymentAndUnlock = async () => {
      if (!orderID) {
        setError('PayPal transaction order ID is missing.');
        setLoading(false);
        return;
      }

      try {
        // Trigger server-side capture and certificate generation
        const res = await API.post('/payment/capture-order', {
          orderID,
          attemptId
        });

        if (res.data.success) {
          // Delay briefly to allow database persistence and redirect
          setTimeout(() => {
            navigate(`/certificate/${res.data.attemptId || attemptId}?confetti=true`);
          }, 1500);
        } else {
          setError(res.data.message || 'Payment capture failed.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Capture Payment API Error:', err);
        setError(
          err.response && err.response.data.message
            ? err.response.data.message
            : 'Server failed to verify and capture your PayPal transaction.'
        );
        setLoading(false);
      }
    };

    capturePaymentAndUnlock();
  }, [orderID, attemptId, navigate]);

  return (
    <div className="max-w-md mx-auto my-16 text-center">
      <div className="glass-panel p-8 rounded-3xl shadow-xl space-y-6">
        {loading ? (
          <>
            <div className="flex justify-center">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white">Verifying Transaction</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Payment was approved! Capturing PayPal order and dynamically generating your certificate. Please do not close or refresh this page...
            </p>
          </>
        ) : error ? (
          <>
            <div className="flex justify-center text-rose-500">
              <AlertCircle className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white">Capture Failed</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
            {orderID && (
              <p className="text-[10px] text-slate-600 font-mono">
                Order Reference: {orderID}
              </p>
            )}
            <div className="pt-4 space-y-2">
              <button
                onClick={() => navigate(attemptId ? `/paywall/${attemptId}` : '/dashboard')}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-505 text-white font-bold rounded-xl cursor-pointer"
              >
                Return to Payment Screen
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl cursor-pointer"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-center text-emerald-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Confirmed!</h2>
            <p className="text-slate-400 text-sm">
              Redirecting you to your certificate board...
            </p>
          </>
        )}
      </div>
    </div>
  );
}
