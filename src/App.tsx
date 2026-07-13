import React from 'react';
import BibleEmulator from './components/BibleEmulator';
import umnLogo from './assets/images/umn_logo_1783706606382.jpg';
import { 
  ExternalLink,
  Smartphone
} from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Main Ribbon / Header */}
      <header className="bg-slate-950 border-b border-slate-800 py-5 px-6 shrink-0 shadow-md">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center bg-slate-900 shadow-lg">
              <img 
                src={umnLogo} 
                alt="UMN Ministry Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight text-white">UMN Tamil Bible</h1>
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Material 3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Offline-First Tamil Bible App • Clean Architecture with Daily Verse & Status Maker
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <a 
              href="https://bibleonlineumnministry.blogspot.com/" 
              target="_blank" 
              rel="noreferrer"
              className="flex-1 md:flex-none text-center inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-850 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all cursor-pointer"
            >
              <span>blogspot Website</span> <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      {/* Main split workarea */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-6 flex flex-col items-center justify-center gap-6 overflow-hidden">
        
        {/* Beautiful Centered Bible Emulator */}
        <div className="w-full flex flex-col items-center gap-4">
          <div className="text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center justify-center gap-1.5">
              <Smartphone size={12} /> Interactive Mobile App & Status Maker
            </div>
            <p className="text-[11px] text-slate-400">அதிகாரங்களை வாசிக்கவும், தினசரி வசனங்கள் மூலம் உயர்தர வாட்ஸ்அப் ஸ்டேட்டஸ் கார்டுகள் உருவாக்கவும்</p>
          </div>
          
          <BibleEmulator />
        </div>

      </main>

      {/* Footer information bar */}
      <footer className="bg-slate-950/30 border-t border-slate-900 py-4 text-center text-[11px] text-slate-500 select-none">
        Developed for <span className="text-slate-400 font-bold">UMN Ministry</span> • Built with React & Flutter Template Architecture • © 2026.
      </footer>

    </div>
  );
}
