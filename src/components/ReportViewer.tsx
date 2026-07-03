import React, { useState } from 'react';
import { REPORT_SECTIONS } from '../data/reportContent';
import { Search, Copy, Check, FileText, ChevronRight, Clock, ShieldCheck, Download, ExternalLink, Sparkles } from 'lucide-react';

interface ReportViewerProps {
  onNavigateToTab: (tab: string) => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ onNavigateToTab }) => {
  const [activeSectionId, setActiveSectionId] = useState<string>(REPORT_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<string | null>(null);

  const activeSection = REPORT_SECTIONS.find((s) => s.id === activeSectionId) || REPORT_SECTIONS[0];

  const handleCopyCode = (codeText: string, indexKey: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(indexKey);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  const filteredSections = REPORT_SECTIONS.filter((sec) =>
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.contentMarkdown.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Simple Markdown Parser function for rendering clean technical report formatted HTML
  const renderFormattedMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];
    const elements: React.ReactNode[] = [];
    let keyCounter = 0;

    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = () => {
      if (tableRows.length > 0) {
        const header = tableRows[0];
        const rows = tableRows.slice(2); // Skip separator row
        elements.push(
          <div key={`table-${keyCounter++}`} className="my-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-md">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-800/80 text-xs uppercase text-amber-400 font-mono tracking-wider border-b border-slate-700">
                <tr>
                  {header.map((cell, idx) => (
                    <th key={idx} className="px-4 py-3 font-semibold">{cell.trim()}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-800/30 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-3 leading-relaxed">{renderInlineFormattedText(cell.trim())}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
        inTable = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Code blocks handler
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // Closing code block
          const fullCode = codeBuffer.join('\n');
          const codeKey = `code-${keyCounter++}`;
          elements.push(
            <div key={codeKey} className="my-6 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs shadow-2xl">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400">
                <span className="text-amber-400 font-semibold uppercase tracking-wider text-[11px]">
                  {codeLanguage || 'code'}
                </span>
                <button
                  onClick={() => handleCopyCode(fullCode, codeKey)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors text-[11px] cursor-pointer"
                >
                  {copiedCodeIndex === codeKey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Snippet</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-slate-200 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800">
                <code>{fullCode}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          // Opening code block
          if (inTable) flushTable();
          inCodeBlock = true;
          codeLanguage = line.slice(3).trim();
        }
        continue;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        continue;
      }

      // Markdown Table Handler
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        inTable = true;
        const cells = line.trim().split('|').slice(1, -1);
        tableRows.push(cells);
        continue;
      } else if (inTable) {
        flushTable();
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${keyCounter++}`} className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mt-8 mb-4 font-sans pb-2 border-b border-slate-800">
            {line.slice(2)}
          </h1>
        );
        continue;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${keyCounter++}`} className="text-xl sm:text-2xl font-bold tracking-tight text-amber-300 mt-7 mb-3 font-sans">
            {line.slice(3)}
          </h2>
        );
        continue;
      }

      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${keyCounter++}`} className="text-lg font-semibold text-indigo-300 mt-5 mb-2 font-sans">
            {line.slice(4)}
          </h3>
        );
        continue;
      }

      // Blockquote
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`bq-${keyCounter++}`} className="my-4 pl-4 py-2 border-l-4 border-amber-500 bg-amber-500/10 text-amber-100 rounded-r-lg italic text-sm">
            {renderInlineFormattedText(line.slice(2))}
          </blockquote>
        );
        continue;
      }

      // Unordered list item
      if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <li key={`li-${keyCounter++}`} className="ml-5 list-disc text-slate-300 my-1 text-sm leading-relaxed">
            {renderInlineFormattedText(line.slice(2))}
          </li>
        );
        continue;
      }

      // Numbered list item
      if (/^\d+\.\s/.test(line)) {
        const text = line.replace(/^\d+\.\s/, '');
        elements.push(
          <li key={`nli-${keyCounter++}`} className="ml-5 list-decimal text-slate-300 my-1 text-sm leading-relaxed">
            {renderInlineFormattedText(text)}
          </li>
        );
        continue;
      }

      // Standard Paragraph
      if (line.trim().length > 0) {
        elements.push(
          <p key={`p-${keyCounter++}`} className="text-slate-300 text-sm leading-relaxed my-3 font-sans">
            {renderInlineFormattedText(line)}
          </p>
        );
      }
    }

    if (inTable) flushTable();

    return elements;
  };

  const renderInlineFormattedText = (text: string) => {
    // Bold, inline code, and emphasis
    const parts = text.split(/(\*\*.*?\*\*|\`.*?\`|\*.*?\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={idx} className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded font-mono text-xs">{part.slice(1, -1)}</code>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={idx} className="italic text-slate-200">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Banner Hero */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-mono font-medium border border-amber-500/30">
                Technical Assessment Submission
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> ~20 min complete read
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Vedic Astrologer: Fine-Tuning Qwen & vLLM Deployment Report
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl mt-2 leading-relaxed">
              Complete technical analysis of the multi-turn dataset, system prompts, safety guardrails, end-to-end QLoRA fine-tuning guide for Qwen2.5/Qwen3, and vLLM production VPS deployment architecture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('dataset')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <span>Explore 5 Synthetic Sets</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout: Navigation Sidebar + Markdown Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Chapter Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-xl sticky top-28">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                Report Table of Contents
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-mono">
                5 Chapters
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search report sections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            {/* Chapter List */}
            <div className="space-y-1.5">
              {filteredSections.map((sec, idx) => {
                const isActive = sec.id === activeSectionId;
                return (
                  <button
                    key={sec.id}
                    onClick={() => setActiveSectionId(sec.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-amber-500/15 border border-amber-500/40 text-amber-200 shadow-sm font-medium'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                          0{idx + 1}
                        </span>
                        <span className="font-semibold">{sec.title.replace(/^\d+\.\s*/, '')}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 pl-6">
                        {sec.subtitle}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 mt-1 ${isActive ? 'text-amber-400' : 'text-slate-600'}`} />
                  </button>
                );
              })}
            </div>

            {/* Assessment Checklist Badge */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono">
                <ShieldCheck className="w-4 h-4" />
                <span>100% Submission Ready</span>
              </div>
              <p className="leading-snug text-slate-400">
                Contains complete dataset analysis, PyTorch QLoRA training script, vLLM deployment specs, 5 synthetic sets, and suitability justification.
              </p>
            </div>
          </div>
        </div>

        {/* Right Content Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm">
            {/* Header Badge of Section */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  {activeSection.title}
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activeSection.subtitle}
                </p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{activeSection.estimatedReadTime}</span>
              </div>
            </div>

            {/* Markdown Rendered Output */}
            <div className="prose prose-invert max-w-none">
              {renderFormattedMarkdown(activeSection.contentMarkdown)}
            </div>

            {/* Next Chapter Shortcut */}
            <div className="mt-12 pt-6 border-t border-slate-800 flex items-center justify-between">
              {REPORT_SECTIONS.findIndex((s) => s.id === activeSectionId) > 0 ? (
                <button
                  onClick={() => {
                    const currIdx = REPORT_SECTIONS.findIndex((s) => s.id === activeSectionId);
                    setActiveSectionId(REPORT_SECTIONS[currIdx - 1].id);
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                >
                  ← Previous Chapter
                </button>
              ) : <div />}

              {REPORT_SECTIONS.findIndex((s) => s.id === activeSectionId) < REPORT_SECTIONS.length - 1 ? (
                <button
                  onClick={() => {
                    const currIdx = REPORT_SECTIONS.findIndex((s) => s.id === activeSectionId);
                    setActiveSectionId(REPORT_SECTIONS[currIdx + 1].id);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <span>Next Chapter</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => onNavigateToTab('dataset')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <span>Explore Synthetic Sets</span>
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
