import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  ShieldCheck,
  X,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import { lockerService } from '../../services/lockerService';
import { LockerCategory } from '../../types/locker';

interface UploadDocumentModalProps {
  userId: string;
  onClose: () => void;
  onUploaded: () => void;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  userId,
  onClose,
  onUploaded,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<LockerCategory>('document');
  const [isEncryptingAndUploading, setIsEncryptingAndUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setError(null);

    // Initial size check
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('File exceeds maximum size limit of 50 MB.');
      return;
    }

    setFile(selectedFile);
    if (!title.trim()) {
      // Auto-populate title from clean filename
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a file to encrypt.');
      return;
    }

    setIsEncryptingAndUploading(true);
    setError(null);

    try {
      const res = await lockerService.uploadDocument(
        userId,
        file,
        title.trim() || file.name,
        category
      );

      if (res.error || !res.document) {
        setError(res.error || 'Failed to encrypt or upload document.');
      } else {
        onUploaded();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Encryption failed.');
    } finally {
      setIsEncryptingAndUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081426]/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg bg-[#112541] rounded-2xl border border-[#263F63] shadow-2xl p-6 sm:p-8 space-y-6 text-[#F8FAFC]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#263F63]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-['Plus_Jakarta_Sans',sans-serif]">
                Upload Encrypted Document
              </h3>
              <p className="text-xs text-[#A9BAD4]">
                Client-Side AES-256-GCM Envelope Encryption
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              file
                ? 'border-[#3B82F6] bg-[#162D4D]/50'
                : 'border-[#263F63] hover:border-[#75A7FF]/60 hover:bg-[#162D4D]/30'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#75A7FF]">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#F8FAFC] truncate max-w-xs">{file.name}</p>
                  <p className="text-xs text-[#A9BAD4]">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Binary Document'}
                  </p>
                </div>
                <span className="text-[11px] text-[#75A7FF] underline mt-1">Click to change file</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-[#F8FAFC]">Click to select a document to encrypt</p>
                <p className="text-xs text-[#7890B2]">PDF, PNG, JPG, WebP, TXT, DOCX up to 50 MB</p>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F8FAFC]">Document Label / Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Passport Scan, Tax Returns, Seed Backup"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#081426] border border-[#263F63] text-sm text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6]"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#F8FAFC]">Vault Category</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'document', label: 'Document' },
                { id: 'credential', label: 'Credential' },
                { id: 'recovery_phrase', label: 'Recovery' },
                { id: 'identity', label: 'Identity' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as LockerCategory)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    category === cat.id
                      ? 'bg-[#1B365B] border-[#75A7FF] text-[#F8FAFC] shadow-sm'
                      : 'bg-[#081426] border-[#263F63] text-[#A9BAD4] hover:bg-[#162D4D]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Security Architecture Notice */}
          <div className="p-3 rounded-xl bg-[#162D4D] border border-[#263F63] text-[11px] text-[#A9BAD4] space-y-1">
            <div className="flex items-center gap-1.5 text-[#75A7FF] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zero-Trust Processing</span>
            </div>
            <p>
              A random 256-bit DEK is generated in your browser memory. Your file is encrypted using
              AES-256-GCM before persistent transmission. Only ciphertext is sent to storage.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isEncryptingAndUploading}
              className="flex-1 py-2.5 rounded-xl border border-[#263F63] text-xs font-medium text-[#A9BAD4] hover:bg-[#162D4D] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isEncryptingAndUploading}
              className="flex-1 py-2.5 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:bg-[#1B365B] disabled:text-[#7890B2] disabled:cursor-not-allowed text-white font-semibold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              {isEncryptingAndUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Encrypting & Storing...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Encrypt & Upload</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
