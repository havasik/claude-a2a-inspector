import React, {useState} from 'react';
import type {ChatMessage, DebugLogEvent} from '../../lib/types';
import {TrafficLog} from './traffic-log';
import {ValidationDisplay} from './validation-display';
import {JsonViewer} from './json-viewer';

type Tab = 'traffic' | 'validation' | 'json';

interface DebugPanelProps {
  logs: DebugLogEvent[];
  messages: ChatMessage[];
  selectedMessage: ChatMessage | null;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onClearLogs: () => void;
}

export function DebugPanel({
  logs,
  messages,
  selectedMessage,
  activeTab,
  onTabChange,
  onClearLogs,
}: DebugPanelProps) {
  const tabs: {id: Tab; label: string}[] = [
    {id: 'traffic', label: 'Traffic Log'},
    {id: 'validation', label: 'Validation'},
    {id: 'json', label: 'Raw JSON'},
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-secondary)]">
      <div className="flex items-center border-b border-[var(--color-border)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--color-button-bg)] border-b-2 border-[var(--color-button-bg)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
        {activeTab === 'traffic' && (
          <button
            onClick={onClearLogs}
            className="ml-auto mr-2 px-2 py-1 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'traffic' && <TrafficLog logs={logs} />}
        {activeTab === 'validation' && (
          <ValidationDisplay messages={messages} />
        )}
        {activeTab === 'json' && <JsonViewer message={selectedMessage} />}
      </div>
    </div>
  );
}

export type {Tab as DebugTab};
