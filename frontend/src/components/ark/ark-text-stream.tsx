import React from 'react';
import DOMPurify from 'dompurify';
import {marked} from 'marked';

interface ArkTextStreamProps {
  assembled: string;
  isDone: boolean;
}

export function ArkTextStream({assembled, isDone}: ArkTextStreamProps) {
  if (!assembled) return null;

  if (isDone) {
    // Render as full markdown when complete
    return (
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(marked.parse(assembled) as string),
        }}
      />
    );
  }

  // Streaming — show with shimmer cursor
  return (
    <div className="text-sm text-[var(--color-text-primary)]">
      <span className="whitespace-pre-wrap">{assembled}</span>
      <span className="inline-block w-1.5 h-4 bg-[var(--color-text-primary)] animate-pulse ml-0.5 align-text-bottom" />
    </div>
  );
}
