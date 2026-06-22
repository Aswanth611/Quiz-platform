import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
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
          setSuccess(true);
          setLoading(false);
          // Wait 3.5 seconds to show the complete Google Pay style animation
          setTimeout(() => {
            navigate(`/certificate/${res.data.attemptId || attemptId}?confetti=true`);
          }, 3500);
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
            <h2 className="text-2xl font-bold text-white animate-pulse">Verifying Transaction</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Payment was approved! Capturing PayPal order and dynamically generating your certificate. Please do not close or refresh this page...
            </p>
          </>
        ) : error ? (
          <>
            <div className="flex justify-center text-rose-500 animate-bounce">
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
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl cursor-pointer transition-all"
              >
                Return to Payment Screen
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl cursor-pointer transition-all"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : success ? (
          <>
            <div className="gpay-tick-wrapper">
              {/* Shimmer/Ripple rings */}
              <div className="gpay-ring ring-1"></div>
              <div className="gpay-ring ring-2"></div>
              
              {/* Main Green Circle & Tick */}
              <div className="gpay-circle">
                <svg className="gpay-svg" viewBox="0 0 52 52">
                  <circle className="gpay-svg-circle" cx="26" cy="26" r="25" fill="none" />
                  <path className="gpay-svg-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
            <p className="text-slate-400 text-sm">
              Your results are unlocked. Redirecting you to your certificate...
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
