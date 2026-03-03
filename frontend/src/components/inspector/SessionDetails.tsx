import {useState} from 'react';
import {ChevronDown, ChevronRight} from 'lucide-react';

interface SessionDetailsProps {
  transport: string | null;
  inputModes: string[];
  outputModes: string[];
  contextId: string | null;
}

function ModalityTag({mode}: {mode: string}) {
  const getIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.startsWith('video/')) return '🎬';
    if (mimeType.startsWith('text/')) return '📝';
    if (mimeType.includes('pdf')) return '📄';
    return '📎';
  };

  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-0.5 text-xs">
      {getIcon(mode)} {mode}
    </span>
  );
}

export function SessionDetails({
  transport,
  inputModes,
  outputModes,
  contextId,
}: SessionDetailsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-md border border-border">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        Session Details
      </button>

      {isOpen && (
        <div className="space-y-3 border-t border-border px-3 py-3">
          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Transport
            </span>
            <div className="mt-1">
              <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {transport || 'Not connected'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Input Modalities
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {inputModes.map(mode => (
                <ModalityTag key={mode} mode={mode} />
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Output Modalities
            </span>
            <div className="mt-1 flex flex-wrap gap-1">
              {outputModes.map(mode => (
                <ModalityTag key={mode} mode={mode} />
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">
              Context ID
            </span>
            <div className="mt-1">
              <code className="block break-all rounded-md border border-border bg-muted px-2 py-1 font-mono text-xs">
                {contextId || 'No active session'}
              </code>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
