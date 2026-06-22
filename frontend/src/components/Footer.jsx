import React from 'react';
import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-6 text-center text-slate-500 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} QuizCert. All rights reserved.
        </div>
        <div className="flex items-center gap-1">
          Made with <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> by Google DeepMind team pair programming
        </div>
      </div>
    </footer>
  );
}
