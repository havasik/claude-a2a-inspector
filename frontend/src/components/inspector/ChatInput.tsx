import {useState, useCallback, useRef} from 'react';
import {ChevronDown, ChevronRight, Paperclip, Plus, X, Send} from 'lucide-react';
import {Button} from '@/components/ui/button';
import type {Attachment} from '@/types/a2a';

interface ChatInputProps {
  isConnected: boolean;
  inputModes: string[];
  onSendMessage: (
    text: string,
    attachments: Attachment[],
    metadata: Record<string, string>,
  ) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatInput({isConnected, inputModes, onSendMessage}: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataEntries, setMetadataEntries] = useState<{id: string; key: string; value: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleFileSelect = useCallback(
    async (files: FileList) => {
      const newAttachments: Attachment[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate against supported input modes
        const isSupported = inputModes.some(mode => {
          if (mode === '*/*') return true;
          if (mode.endsWith('/*')) {
            return file.type.startsWith(mode.split('/')[0] + '/');
          }
          return file.type === mode;
        });

        if (!isSupported) {
          alert(`File type ${file.type} is not supported. Supported: ${inputModes.join(', ')}`);
          continue;
        }

        const base64 = await fileToBase64(file);
        const attachment: Attachment = {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          data: base64,
        };

        if (file.type.startsWith('image/')) {
          attachment.thumbnail = URL.createObjectURL(file);
        }

        newAttachments.push(attachment);
      }
      setAttachments(prev => [...prev, ...newAttachments]);
    },
    [inputModes],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  }, []);

  const handleSend = useCallback(() => {
    if (!text.trim() && attachments.length === 0) return;
    if (!isConnected) return;

    const metadata: Record<string, string> = {};
    for (const entry of metadataEntries) {
      if (entry.key.trim() && entry.value.trim()) {
        metadata[entry.key.trim()] = entry.value.trim();
      }
    }

    onSendMessage(text, attachments, metadata);
    setText('');
    setAttachments([]);
  }, [text, attachments, metadataEntries, isConnected, onSendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const addMetadata = useCallback(() => {
    setMetadataEntries(prev => [...prev, {id: crypto.randomUUID(), key: '', value: ''}]);
  }, []);

  return (
    <div className="space-y-2">
      {/* Metadata toggle */}
      <div>
        <button
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          onClick={() => setShowMetadata(!showMetadata)}
        >
          {showMetadata ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          Message Metadata
        </button>
        {showMetadata && (
          <div className="mt-2 space-y-2">
            {metadataEntries.map(entry => (
              <div key={entry.id} className="flex gap-2">
                <input
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                  placeholder="Key"
                  value={entry.key}
                  onChange={e =>
                    setMetadataEntries(prev =>
                      prev.map(m => (m.id === entry.id ? {...m, key: e.target.value} : m)),
                    )
                  }
                />
                <input
                  className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs"
                  placeholder="Value"
                  value={entry.value}
                  onChange={e =>
                    setMetadataEntries(prev =>
                      prev.map(m => (m.id === entry.id ? {...m, value: e.target.value} : m)),
                    )
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => setMetadataEntries(prev => prev.filter(m => m.id !== entry.id))}
                >
                  <X className="size-3" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="text-xs" onClick={addMetadata}>
              <Plus className="mr-1 size-3" /> Add Metadata
            </Button>
          </div>
        )}
      </div>

      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attachments.map(a => (
            <div
              key={a.id}
              className="flex items-center gap-2 rounded-md border border-border bg-muted px-2 py-1"
            >
              {a.thumbnail && (
                <img src={a.thumbnail} alt="" className="size-8 rounded object-cover" />
              )}
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{a.name}</div>
                <div className="text-xs text-muted-foreground">{formatFileSize(a.size)}</div>
              </div>
              <button
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeAttachment(a.id)}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2 rounded-lg border border-input bg-background p-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={e => {
            if (e.target.files) handleFileSelect(e.target.files);
            e.target.value = '';
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          disabled={!isConnected}
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
        >
          <Paperclip className="size-4" />
        </Button>
        <textarea
          ref={textareaRef}
          className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          placeholder={isConnected ? 'Type a message...' : 'Connect to an agent to start chatting'}
          disabled={!isConnected}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <Button
          size="icon"
          className="size-8 shrink-0"
          disabled={!isConnected || (!text.trim() && attachments.length === 0)}
          onClick={handleSend}
        >
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
