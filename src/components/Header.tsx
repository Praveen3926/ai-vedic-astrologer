import React from 'react';
import { Sparkles, BookOpen, Database, Cpu, Server, MessageSquare, Download } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onDownloadReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onDownloadReport }) => {
  const tabs = [
    { id: 'report', label: 'Technical Report', icon: BookOpen },
    { id: 'dataset', label: '5 Synthetic Conversations', icon: Database },
    { id: 'finetune', label: 'Fine-Tuning Configurator', icon: Cpu },
    { id: 'deployment', label: 'vLLM VPS Deployment', icon: Server },
    { id: 'simulator', label: 'Live AI Astrologer Test', icon: MessageSquare },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
              <Sparkles className="w-5 h-5 text-amber-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white font-sans">
                  AI Vedic Astrologer
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-full font-semibold">
                  Qwen Fine-Tuning & vLLM Suite
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Technical Assessment Report & Multi-Turn SFT Dataset
              </p>
            </div>
          </div>

          {/* Quick Download Button */}
          <button
            onClick={onDownloadReport}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 scrollbar-none pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 text-amber-300 border border-indigo-500/50 shadow-inner'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
