import React, { useState } from 'react';
import { SYNTHETIC_CONVERSATIONS } from '../data/syntheticConversations';
import { SyntheticConversation, TurnMessage } from '../types';
import { MessageSquare, Download, ShieldCheck, User, Bot, Sparkles, Filter, Code, FileCode, Check } from 'lucide-react';

export const DatasetExplorer: React.FC = () => {
  const [selectedConvId, setSelectedConvId] = useState<string>(SYNTHETIC_CONVERSATIONS[0].id);
  const [activeTagFilter, setActiveTagFilter] = useState<string>('all');
  const [exportFormat, setExportFormat] = useState<'json' | 'jsonl' | 'chatml' | 'sharegpt'>('json');
  const [copiedDataset, setCopiedDataset] = useState<boolean>(false);

  const selectedConv = SYNTHETIC_CONVERSATIONS.find((c) => c.id === selectedConvId) || SYNTHETIC_CONVERSATIONS[0];

  const allSafetyTags = Array.from(
    new Set(
      SYNTHETIC_CONVERSATIONS.flatMap((c) =>
        c.messages.flatMap((m) => m.safetyTags || [])
      )
    )
  );

  const filteredMessages = selectedConv.messages.filter((m) => {
    if (activeTagFilter === 'all') return true;
    return m.safetyTags?.includes(activeTagFilter);
  });

  const generateExportContent = () => {
    if (exportFormat === 'json') {
      return JSON.stringify(SYNTHETIC_CONVERSATIONS, null, 2);
    }

    if (exportFormat === 'jsonl') {
      return SYNTHETIC_CONVERSATIONS.map((conv) =>
        JSON.stringify({
          id: conv.id,
          messages: conv.messages.map((m) => ({ role: m.role, content: m.content }))
        })
      ).join('\n');
    }

    if (exportFormat === 'chatml') {
      return SYNTHETIC_CONVERSATIONS.map((conv) => {
        return conv.messages
          .map((m) => `<|im_start|>${m.role}\n${m.content}\n<|im_end|>`)
          .join('\n');
      }).join('\n\n=== NEXT CONVERSATION ===\n\n');
    }

    if (exportFormat === 'sharegpt') {
      return JSON.stringify(
        SYNTHETIC_CONVERSATIONS.map((conv) => ({
          id: conv.id,
          conversations: conv.messages.map((m) => ({
            from: m.role === 'user' ? 'human' : m.role === 'assistant' ? 'gpt' : 'system',
            value: m.content
          }))
        })),
        null,
        2
      );
    }

    return '';
  };

  const handleDownloadDataset = () => {
    const content = generateExportContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vedic_astrologer_dataset_${exportFormat}.${exportFormat === 'jsonl' ? 'jsonl' : exportFormat === 'json' ? 'json' : 'txt'}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(generateExportContent());
    setCopiedDataset(true);
    setTimeout(() => setCopiedDataset(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-mono border border-purple-500/30">
              Training Dataset Specification
            </span>
            <span className="text-xs text-slate-400 font-mono">
              5 Full Conversations (15–20 Turns Each)
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Synthetic Training Dataset Explorer
          </h2>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Inspect all 5 original, manually crafted multi-turn dialogues demonstrating Vedic Astrology depth, empathy, Kundli pauses, and strict safety guardrails.
          </p>
        </div>

        {/* Download & Format Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg text-xs font-mono">
            {(['json', 'jsonl', 'chatml', 'sharegpt'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setExportFormat(fmt)}
                className={`px-2.5 py-1 rounded transition-colors uppercase cursor-pointer ${
                  exportFormat === fmt ? 'bg-purple-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyExport}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedDataset ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copiedDataset ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownloadDataset}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Explorer Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Conversation Picker */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Select Conversation Set
          </h3>

          <div className="space-y-3">
            {SYNTHETIC_CONVERSATIONS.map((conv, idx) => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 border-purple-500/60 shadow-lg shadow-purple-500/10 ring-1 ring-purple-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-purple-500/20 text-purple-300 font-semibold' : 'bg-slate-800 text-slate-400'}`}>
                      Set 0{idx + 1} • {conv.turnCount} Turns
                    </span>
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-purple-400" />
                      {conv.messages.length} msgs
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mb-1">
                    {conv.title}
                  </h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                    {conv.topic}
                  </p>

                  {/* Persona Tag */}
                  <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg font-sans">
                    👤 <strong>User:</strong> {conv.userPersona}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Turn Inspector & Message Feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Selected Set Summary Header */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-purple-400 uppercase tracking-wider">
                  Active Dataset Inspector
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {selectedConv.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-amber-300 text-xs font-mono font-semibold">
                  {selectedConv.turnCount} Total Turns
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedConv.summary}
            </p>

            {/* Safety Traits Badges */}
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-2">
                Demonstrated Safety & Astrological Traits:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedConv.keySafetyTraitsDemonstrated.map((trait, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-[11px] bg-slate-800 text-slate-200 border border-slate-700 px-2.5 py-1 rounded-md font-medium"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{trait}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Safety Tag Filter */}
            <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1 shrink-0">
                <Filter className="w-3.5 h-3.5 text-purple-400" /> Filter Tag:
              </span>
              <button
                onClick={() => setActiveTagFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
                  activeTagFilter === 'all' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Messages ({selectedConv.messages.length})
              </button>
              {allSafetyTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTagFilter(tag)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 cursor-pointer ${
                    activeTagFilter === tag ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Conversation Messages Feed */}
          <div className="space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-xs">
                No messages found with the tag "{activeTagFilter}".
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isAssistant = msg.role === 'assistant';
                const isSystem = msg.role === 'system';

                return (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isAssistant
                        ? 'bg-slate-900/90 border-slate-800 shadow-md ml-0 sm:ml-4'
                        : isSystem
                        ? 'bg-amber-950/20 border-amber-500/30'
                        : 'bg-indigo-950/30 border-indigo-800/40 mr-0 sm:mr-4'
                    }`}
                  >
                    {/* Turn Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800/60 mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            isAssistant
                              ? 'bg-gradient-to-tr from-purple-600 to-amber-500 text-white shadow-sm'
                              : 'bg-indigo-600 text-white'
                          }`}
                        >
                          {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white capitalize font-sans">
                            {isAssistant ? 'AI Vedic Astrologer' : 'User (Client)'}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            Turn #{msg.turnNumber} • {msg.content.length} chars
                          </span>
                        </div>
                      </div>

                      {/* Safety Tags Badges */}
                      {msg.safetyTags && msg.safetyTags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {msg.safetyTags.map((st, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            >
                              {st}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Turn Content Text */}
                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                      {msg.content}
                    </p>

                    {/* Astrological Notes if any */}
                    {msg.notes && (
                      <div className="mt-3 pt-2 border-t border-slate-800/60 text-xs text-amber-300/90 font-mono italic flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Annotated Note: {msg.notes}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
