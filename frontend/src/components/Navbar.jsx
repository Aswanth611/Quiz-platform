import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Award, LayoutDashboard, LogOut, ShieldAlert, CheckSquare, Search } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30">
            <Award className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            QuizCert
          </span>
        </Link>

        {/* Navigation links */}
        <div className="flex items-center gap-6">
          <Link
            to="/verify-certificate"
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-indigo-400 ${
              isActive('/verify-certificate') ? 'text-indigo-400' : 'text-slate-300'
            }`}
          >
            <Search className="w-4 h-4" />
            Verify Certificate
          </Link>

          {user && (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-indigo-400 ${
                  isActive('/dashboard') ? 'text-indigo-400' : 'text-slate-300'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-purple-400 ${
                    isActive('/admin') ? 'text-purple-400' : 'text-purple-300'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 hidden md:inline">
                Welcome, <strong className="text-slate-200 font-semibold">{user.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-600/20 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
