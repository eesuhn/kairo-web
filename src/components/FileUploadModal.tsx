import React from 'react';
import { FileUpload } from './FileUpload';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUpload,
  isProcessing,
}) => {
  // Close modal when clicking outside of it
  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };
  // Close modal when pressing Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 backdrop-blur-sm"
      onClick={handleOutsideClick}
    >
      <div className="max-h-[120vh] w-full max-w-2xl overflow-auto rounded-2xl bg-gray-200 shadow-2xl backdrop-blur-sm">
        {/* Content */}
        <div className="p-4">
          <FileUpload onFileUpload={onFileUpload} isProcessing={isProcessing} />
        </div>
      </div>
    </div>
  );
};
