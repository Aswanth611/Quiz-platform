import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../App';
import { Award, LayoutDashboard, LogOut, ShieldAlert, Search, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-slate-800 px-4 md:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsOpen(false)}>
          <div className="bg-indigo-600 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30">
            <Award className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg md:text-xl tracking-wider bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
            QuizCert
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
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

        {/* Desktop User Actions */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">
                Welcome, <strong className="text-slate-200 font-semibold">{user.name}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
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

        {/* Mobile Toggle Button */}
        <div className="flex md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-850 space-y-4 animate-fade-in">
          <div className="flex flex-col gap-3">
            <Link
              to="/verify-certificate"
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium ${
                isActive('/verify-certificate') ? 'text-indigo-400 bg-slate-900/50' : 'text-slate-300'
              }`}
            >
              <Search className="w-4 h-4" />
              Verify Certificate
            </Link>

            {user && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium ${
                    isActive('/dashboard') ? 'text-indigo-400 bg-slate-900/50' : 'text-slate-300'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-lg hover:bg-slate-900 transition-colors text-sm font-medium ${
                      isActive('/admin') ? 'text-purple-400 bg-slate-900/50' : 'text-purple-300'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4" />
                    Admin Panel
                  </Link>
                )}
              </>
            )}
          </div>

          <div className="pt-4 border-t border-slate-850">
            {user ? (
              <div className="flex flex-col gap-3">
                <span className="text-sm text-slate-400 px-2">
                  Welcome, <strong className="text-slate-200 font-semibold">{user.name}</strong>
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-center w-full py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm font-medium text-slate-300 hover:bg-slate-850 hover:text-white transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="text-center w-full py-2.5 rounded-lg bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-500 transition-all shadow-md"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
