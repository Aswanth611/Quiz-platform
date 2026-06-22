import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { Search, ShieldCheck, ShieldAlert, Award, Calendar, Check, Download, AlertCircle, Loader2 } from 'lucide-react';

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [certId, setCertId] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  // Auto-verify if "id" query param is present (e.g. /verify-certificate?id=CERT-2026-ABCD)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setCertId(idParam);
      performVerification(idParam);
    }
  }, [searchParams]);

  const performVerification = async (idToVerify) => {
    if (!idToVerify || idToVerify.trim() === '') return;
    
    setLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const res = await API.get(`/certificate/verify/${idToVerify.trim()}`);
      if (res.data.success && res.data.verified) {
        setVerificationResult(res.data.data);
      }
    } catch (err) {
      setError(
        err.response && err.response.data.message
          ? err.response.data.message
          : 'Certificate ID could not be verified. It may be invalid or expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performVerification(certId);
  };

  const handleDownload = () => {
    if (!verificationResult) return;
    const downloadUrl = `${API.defaults.baseURL || 'http://localhost:5000/api'}/certificate/${verificationResult.certificateId}/download`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Title */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-white mb-2">Verify Credentials</h1>
        <p className="text-sm text-slate-400">
          Enter a Certificate ID to verify its authenticity and check candidate scores.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="glass-panel p-6 rounded-2xl mb-8">
        <form onSubmit={handleSearchSubmit} className="flex gap-3">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              required
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="e.g. CERT-2026-F98BA1C"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Verify'
            )}
          </button>
        </form>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}

      {/* Error / Not Found Banner */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center flex flex-col items-center">
          <ShieldAlert className="w-12 h-12 text-rose-500 mb-3" />
          <h3 className="text-lg font-bold text-slate-200 mb-1">Invalid Certificate</h3>
          <p className="text-sm text-slate-400">{error}</p>
        </div>
      )}

      {/* Verification Result Card */}
      {verificationResult && !loading && (
        <div className="glass-panel p-8 rounded-3xl border border-emerald-500/25 relative overflow-hidden animate-fade-in shadow-2xl">
          {/* Decorative Corner Badge */}
          <div className="absolute top-0 right-0 bg-emerald-500/10 border-b border-l border-emerald-500/20 px-4 py-2 text-xs font-bold text-emerald-400 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            Verified Authentic
          </div>

          <div className="flex items-start gap-5 mb-8">
            <div className="bg-emerald-500/10 border border-emerald-500/25 p-3.5 rounded-2xl text-emerald-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">{verificationResult.recipientName}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Certificate ID: {verificationResult.certificateId}</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-900 pb-3.5 text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                Examination:
              </span>
              <span className="font-bold text-slate-350 text-right">{verificationResult.quizTitle}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-900 pb-3.5 text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                Category:
              </span>
              <span className="font-bold text-slate-350 text-right">{verificationResult.category}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-slate-900 pb-3.5 text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                Score Percentage:
              </span>
              <span className="font-extrabold text-emerald-400 text-right">{verificationResult.scorePercentage}%</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-indigo-400" />
                Date of Issue:
              </span>
              <span className="font-bold text-slate-350 text-right">
                {new Date(verificationResult.generatedDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Download pdf */}
          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-605/10 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Download PDF Copy
          </button>
        </div>
      )}
    </div>
  );
}
