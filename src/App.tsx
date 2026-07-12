import React, { useState } from 'react';
import BibleEmulator from './components/BibleEmulator';
import CodeExplorer from './components/CodeExplorer';
import umnLogo from './assets/images/umn_logo_1783706606382.jpg';
import { 
  Church, 
  Terminal, 
  BookOpen, 
  Sparkles, 
  Download, 
  Code2, 
  Compass, 
  Info,
  ExternalLink,
  Smartphone,
  CheckCircle2,
  ListFilter
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'emulator' | 'code'>('emulator');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      
      {/* Top Main Ribbon / Header */}
      <header className="bg-slate-950 border-b border-slate-800 py-5 px-6 shrink-0 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
                Offline-First Tamil Bible App • Clean Architecture with Provider & Hive
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
            
            <button 
              onClick={() => setActiveTab(activeTab === 'emulator' ? 'code' : 'emulator')}
              className="md:hidden flex-1 text-center inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Code2 size={14} />
              <span>{activeTab === 'emulator' ? 'View Flutter Code' : 'View Live App'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main split workarea */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start overflow-hidden">
        
        {/* Left column: Live interactive phone preview (Desktop-first split, responsive layout) */}
        <div className={`lg:col-span-4 flex flex-col items-center gap-4 ${activeTab === 'code' ? 'hidden lg:flex' : 'flex'}`}>
          <div className="text-center space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center justify-center gap-1.5">
              <Smartphone size={12} /> Interactive Mobile App
            </div>
            <p className="text-[11px] text-slate-400">Try books navigation, search, bookmarks, & notes live</p>
          </div>
          
          <BibleEmulator />
        </div>

        {/* Right column: Flutter Production Code repository */}
        <div className={`lg:col-span-8 flex flex-col gap-4 ${activeTab === 'emulator' ? 'hidden lg:flex' : 'flex'}`}>
          {/* Dashboard Summary Widget */}
          <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 size={12} className="text-green-500" /> App Core Architecture Summary
              </span>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                This app is structured using <strong>Flutter Clean Architecture</strong> with <strong>Provider</strong> state management, <strong>Go Router</strong> navigation, and <strong>Hive</strong> lightweight offline database. All 66 books load offline from pre-bundled assets.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold px-2 py-1 rounded">
                Hive Box Storage
              </span>
              <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold px-2 py-1 rounded">
                Null Safety
              </span>
              <span className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-bold px-2 py-1 rounded">
                Go Router V13
              </span>
            </div>
          </div>

          <CodeExplorer />
        </div>

      </main>

      {/* Footer information bar */}
      <footer className="bg-slate-950/30 border-t border-slate-900 py-4 text-center text-[11px] text-slate-500 select-none">
        Developed for <span className="text-slate-400 font-bold">UMN Ministry</span> • Built with React & Flutter Template Architecture • © 2026.
      </footer>

    </div>
  );
}
