import React, { useState } from 'react';
import { Header } from './components/Header';
import { ReportViewer } from './components/ReportViewer';
import { DatasetExplorer } from './components/DatasetExplorer';
import { FineTuningCalculator } from './components/FineTuningCalculator';
import { DeploymentConfigurator } from './components/DeploymentConfigurator';
import { AstrologerSimulator } from './components/AstrologerSimulator';
import { REPORT_SECTIONS } from './data/reportContent';
import { SYNTHETIC_CONVERSATIONS } from './data/syntheticConversations';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('report');

  // Assembles the entire technical submission report into a single Markdown file for download
  const handleDownloadFullReport = () => {
    let fullReportMarkdown = `# AI Vedic Astrologer: Technical Assessment & Qwen Fine-Tuning Submission\n\n`;
    fullReportMarkdown += `**Author:** Technical Assessment Candidate\n`;
    fullReportMarkdown += `**Date:** ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n`;
    fullReportMarkdown += `**Target Models:** Qwen2.5-7B-Instruct / Qwen2.5-14B-Instruct / Qwen3-7B-Instruct\n`;
    fullReportMarkdown += `**Serving Infrastructure:** vLLM on Ubuntu VPS with Nginx, Systemd & Certbot SSL\n\n`;
    fullReportMarkdown += `---\n\n`;

    // Append report sections 1 to 5
    REPORT_SECTIONS.forEach((section) => {
      fullReportMarkdown += `${section.contentMarkdown}\n\n---\n\n`;
    });

    // Append full synthetic conversation transcripts
    fullReportMarkdown += `# Appendix: Complete 5 Synthetic Training Conversations\n\n`;
    SYNTHETIC_CONVERSATIONS.forEach((conv, idx) => {
      fullReportMarkdown += `## Conversation Set ${idx + 1}: ${conv.title}\n`;
      fullReportMarkdown += `- **Topic:** ${conv.topic}\n`;
      fullReportMarkdown += `- **Persona:** ${conv.userPersona}\n`;
      fullReportMarkdown += `- **Total Turns:** ${conv.turnCount}\n\n`;

      conv.messages.forEach((msg) => {
        fullReportMarkdown += `### Turn ${msg.turnNumber} [${msg.role.toUpperCase()}]\n`;
        if (msg.safetyTags && msg.safetyTags.length > 0) {
          fullReportMarkdown += `*Safety Tags: ${msg.safetyTags.join(', ')}*\n\n`;
        }
        fullReportMarkdown += `${msg.content}\n\n`;
      });

      fullReportMarkdown += `---\n\n`;
    });

    const blob = new Blob([fullReportMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'AI_Vedic_Astrologer_Qwen_FineTuning_Report.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Top Header & Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadReport={handleDownloadFullReport}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {activeTab === 'report' && (
          <ReportViewer onNavigateToTab={(tab) => setActiveTab(tab)} />
        )}

        {activeTab === 'dataset' && <DatasetExplorer />}

        {activeTab === 'finetune' && <FineTuningCalculator />}

        {activeTab === 'deployment' && <DeploymentConfigurator />}

        {activeTab === 'simulator' && <AstrologerSimulator />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-6 text-center text-xs text-slate-400 font-mono mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-semibold text-slate-300">AI Vedic Astrologer Qwen Fine-Tuning Suite</span>
            <span className="text-slate-400 block sm:inline sm:ml-2">
              • Technical Assessment & Multi-Turn SFT Dataset
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>PyTorch + TRL + PEFT</span>
            <span>•</span>
            <span>vLLM + Nginx</span>
            <span>•</span>
            <span>ChatML Format</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
