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
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${
            dragActive
              ? 'border-purple-400 bg-purple-500/10'
              : 'border-gray-600 hover:border-gray-500'
          }
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={handleChange}
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-4">
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-purple-500 border-t-transparent" />
              <div className="text-white font-medium">
                Processing your file...
              </div>
              <div className="text-gray-400 text-sm">
                This may take a few moments
              </div>
            </>
          ) : (
            <>
              <div className="p-4 bg-gray-800 rounded-full">
                <Upload className="w-8 h-8 text-purple-400" />
              </div>
              <div className="text-white font-medium">
                Drop your file or Click to browse
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        </div>
      )}
    </div>
  );
};
