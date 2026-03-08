import React, {useCallback, useRef, useState} from 'react';

interface SplitPaneProps {
  left: React.ReactNode;
  right: React.ReactNode;
  defaultSplit?: number; // percentage for left pane
}

export function SplitPane({left, right, defaultSplit = 55}: SplitPaneProps) {
  const [splitPercent, setSplitPercent] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPercent(Math.min(80, Math.max(20, percent)));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div ref={containerRef} className="flex flex-1 overflow-hidden">
      <div
        className="overflow-hidden flex flex-col h-full"
        style={{width: `${splitPercent}%`}}
      >
        {left}
      </div>
      <div
        onMouseDown={handleMouseDown}
        className="w-1 cursor-col-resize bg-[var(--color-border)] hover:bg-[var(--color-button-bg)] transition-colors flex-shrink-0"
      />
      <div
        className="overflow-hidden flex flex-col h-full"
        style={{width: `${100 - splitPercent}%`}}
      >
        {right}
      </div>
    </div>
  );
}
