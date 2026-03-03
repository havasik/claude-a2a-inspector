import {useState, useCallback, useRef, useEffect} from 'react';
import {Trash2, ChevronUp, ChevronDown} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block';
import {cn} from '@/lib/utils';
import type {DebugLogEntry} from '@/hooks/useA2ADebugLog';

interface DebugConsoleProps {
  logs: DebugLogEntry[];
  onClear: () => void;
}

const typeColors: Record<string, string> = {
  request: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30',
  response: 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-800/30',
  error: 'border-l-red-500 bg-red-50/50 dark:bg-red-950/30',
  validation_error: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/30',
};

const typeLabels: Record<string, string> = {
  request: 'REQUEST',
  response: 'RESPONSE',
  error: 'ERROR',
  validation_error: 'VALIDATION',
};

const typeLabelColors: Record<string, string> = {
  request: 'text-blue-700 dark:text-blue-300',
  response: 'text-gray-600 dark:text-gray-400',
  error: 'text-red-700 dark:text-red-300',
  validation_error: 'text-yellow-700 dark:text-yellow-300',
};

export function DebugConsole({logs, onClear}: DebugConsoleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    if (contentRef.current && isVisible) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [logs, isVisible]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return;
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 40 && newHeight < window.innerHeight * 0.9) {
        setHeight(newHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      className="fixed bottom-0 left-0 z-40 w-full shadow-[0_-2px_10px_rgba(0,0,0,0.15)] transition-transform duration-300"
      style={{
        height: `${height}px`,
        transform: isVisible ? 'translateY(0)' : `translateY(calc(100% - 40px))`,
      }}
    >
      {/* Handle */}
      <div
        className="flex h-10 cursor-ns-resize select-none items-center justify-between bg-card px-4 border-t border-border"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-medium">Debug Console</span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onClear}>
            <Trash2 className="mr-1 size-3" /> Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setIsVisible(!isVisible)}
          >
            {isVisible ? (
              <>
                <ChevronDown className="mr-1 size-3" /> Hide
              </>
            ) : (
              <>
                <ChevronUp className="mr-1 size-3" /> Show
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={contentRef}
        className="h-[calc(100%-40px)] overflow-y-auto bg-card p-3 font-mono text-xs"
      >
        {logs.length === 0 && (
          <p className="text-center text-muted-foreground">No debug logs yet.</p>
        )}
        {logs.map((log, i) => (
          <div
            key={i}
            className={cn(
              'mb-2 rounded border-l-3 p-2',
              typeColors[log.type] || 'border-l-gray-300',
            )}
          >
            <div className="mb-1 flex items-center gap-2">
              <span className="text-muted-foreground">{log.timestamp}</span>
              <span className={cn('font-bold', typeLabelColors[log.type])}>
                {typeLabels[log.type] || log.type.toUpperCase()}
              </span>
            </div>
            <CodeBlock code={JSON.stringify(log.data, null, 2)} language="json">
              <div className="flex justify-end p-1">
                <CodeBlockCopyButton />
              </div>
            </CodeBlock>
          </div>
        ))}
      </div>
    </div>
  );
}
