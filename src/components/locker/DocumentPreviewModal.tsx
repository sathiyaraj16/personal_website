import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import { LockerDocument } from '../../types/locker';
import { lockerService } from '../../services/lockerService';

interface DocumentPreviewModalProps {
  userId: string;
  document: LockerDocument;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  userId,
  document: doc,
  onClose,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let createdUrl: string | null = null;

    const decrypt = async () => {
      try {
        setIsDecrypting(true);
        setError(null);

        const res = await lockerService.downloadAndDecryptDocument(userId, doc);
        if (!active) return;

        // If it's a text file or JSON, decode and show readable text
        if (
          res.mimeType.startsWith('text/') ||
          res.mimeType.includes('json') ||
          res.mimeType.includes('csv')
        ) {
          const text = await res.blob.text();
          if (active) setTextContent(text);
        }

        // Ephemeral in-memory blob URL
        createdUrl = URL.createObjectURL(res.blob);
        if (active) setBlobUrl(createdUrl);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Decryption failed.');
        }
      } finally {
        if (active) setIsDecrypting(false);
      }
    };

    decrypt();

    // Revoke Blob URL when closing modal to prevent RAM accumulation or leaks
    return () => {
      active = false;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [userId, doc]);

  const handleDownloadPlaintext = () => {
    if (!blobUrl) return;
    const a = window.document.createElement('a');
    a.href = blobUrl;
    a.download = doc.filename;
    a.click();
  };

  const isPdf = doc.mime_type === 'application/pdf';
  const isImage = doc.mime_type.startsWith('image/');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#081426]/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-[#112541] rounded-2xl border border-[#263F63] shadow-2xl flex flex-col text-[#F8FAFC] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#263F63] bg-[#162D4D]/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#112541] border border-[#263F63] flex items-center justify-center text-[#75A7FF]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-['Plus_Jakarta_Sans',sans-serif] truncate max-w-md">
                  {doc.title}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  DECRYPTED IN RAM
                </span>
              </div>
              <p className="text-xs text-[#A9BAD4] font-mono mt-0.5">
                {doc.filename} • {(doc.file_size / (1024 * 1024)).toFixed(2)} MB • {doc.mime_type}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {blobUrl && (
              <button
                type="button"
                onClick={handleDownloadPlaintext}
                className="py-1.5 px-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save File</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#112541] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center bg-[#081426]/50 min-h-[350px]">
          {isDecrypting && (
            <div className="flex flex-col items-center gap-3 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#75A7FF]" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-[#F8FAFC]">Decrypting Document In-Memory...</p>
                <p className="text-xs text-[#A9BAD4]">
                  Unwrapping DEK with KEK and verifying AES-256-GCM authentication tag
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 max-w-md text-center space-y-2">
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
              <p className="text-sm font-semibold text-red-200">Decryption Error</p>
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {!isDecrypting && !error && blobUrl && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {isPdf && (
                <iframe
                  src={blobUrl}
                  title={doc.title}
                  className="w-full h-[600px] rounded-xl border border-[#263F63] bg-white"
                />
              )}

              {isImage && (
                <div className="max-h-[600px] flex items-center justify-center p-2">
                  <img
                    src={blobUrl}
                    alt={doc.title}
                    className="max-h-[580px] max-w-full object-contain rounded-xl border border-[#263F63] shadow-lg"
                  />
                </div>
              )}

              {textContent !== null && (
                <div className="w-full max-h-[550px] p-4 rounded-xl bg-[#081426] border border-[#263F63] font-mono text-xs text-[#F8FAFC] overflow-auto whitespace-pre-wrap">
                  {textContent}
                </div>
              )}

              {!isPdf && !isImage && textContent === null && (
                <div className="text-center space-y-3 p-8">
                  <div className="w-14 h-14 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mx-auto">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#F8FAFC]">{doc.filename}</h4>
                    <p className="text-xs text-[#A9BAD4] mt-1">
                      This file format cannot be rendered inline in the browser. You can safely download the
                      decrypted plaintext file below.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPlaintext}
                    className="py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Decrypted File</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#263F63] bg-[#162D4D]/60 flex items-center justify-between text-xs text-[#A9BAD4] shrink-0">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            <span>Ephemeral RAM decryption only. Zero persistent caching in browser storage.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[#A9BAD4] hover:text-[#F8FAFC] cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
