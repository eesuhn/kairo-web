import React, { useCallback, useState, useMemo } from 'react';
import { Upload, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUpload,
  isProcessing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedTypes = useMemo(
    () => [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
      'text/csv',
      'audio/mpeg',
      'audio/wav',
    ],
    []
  );

  const validateAndUpload = useCallback(
    (file: File) => {
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }

      if (!allowedTypes.includes(file.type)) {
        setError(
          'Unsupported file type. Please upload PDF, DOC, DOCX, or Audio files.'
        );
        return;
      }

      onFileUpload(file);
    },
    [onFileUpload, allowedTypes]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError(null);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        validateAndUpload(file);
      }
    },
    [validateAndUpload]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      setError(null);

      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        validateAndUpload(file);
      }
    },
    [validateAndUpload]
  );

  return (
    <div className="w-full">
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          dragActive
            ? 'border-purple-400 bg-purple-500/10'
            : 'border-gray-600 hover:border-gray-500'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''} `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={handleChange}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
              <div className="font-medium text-white">
                Processing your file...
              </div>
              <div className="text-sm text-gray-400">
                This may take a few moments
              </div>
            </>
          ) : (
            <>
              <div className="rounded-full bg-gray-800 p-4">
                <Upload className="h-8 w-8 text-purple-400" />
              </div>
              <div className="font-medium text-white">
                Drop your file or Click to browse
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
