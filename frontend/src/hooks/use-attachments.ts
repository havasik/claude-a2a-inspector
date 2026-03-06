import {useCallback, useState} from 'react';
import type {Attachment} from '../lib/types';

export function useAttachments(supportedMimeTypes: string[]) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const addFiles = useCallback(
    async (files: FileList | File[]) => {
      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        // Validate MIME type
        const isSupported =
          supportedMimeTypes.length === 0 ||
          supportedMimeTypes.some(mime => {
            if (mime === '*/*') return true;
            if (mime.endsWith('/*')) {
              return file.type.startsWith(mime.replace('/*', '/'));
            }
            return file.type === mime;
          });

        if (!isSupported) {
          console.warn(`Unsupported file type: ${file.type} (${file.name})`);
          continue;
        }

        const data = await fileToBase64(file);
        newAttachments.push({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          data,
          size: file.size,
        });
      }

      setAttachments(prev => [...prev, ...newAttachments]);
    },
    [supportedMimeTypes]
  );

  const remove = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => setAttachments([]), []);

  return {attachments, addFiles, remove, clear};
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
