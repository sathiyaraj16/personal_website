import React, { useState } from 'react';
import {
  FileText,
  Eye,
  Download,
  Trash2,
  Search,
  Lock,
  Calendar,
  KeyRound,
  FileKey,
  Shield,
} from 'lucide-react';
import { LockerDocument, LockerCategory } from '../../types/locker';

interface LockerDocumentListProps {
  documents: LockerDocument[];
  onViewDocument: (doc: LockerDocument) => void;
  onDownloadDocument: (doc: LockerDocument) => void;
  onDeleteDocument: (docId: string) => void;
  onOpenUpload: () => void;
}

export const LockerDocumentList: React.FC<LockerDocumentListProps> = ({
  documents,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredDocuments = documents.filter((doc) => {
    const matchesCategory =
      selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryBadge = (category: LockerCategory) => {
    switch (category) {
      case 'credential':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <KeyRound className="w-3 h-3" />
            Credential
          </span>
        );
      case 'recovery_phrase':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <FileKey className="w-3 h-3" />
            Recovery Phrase
          </span>
        );
      case 'identity':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-300 border border-sky-500/30">
            <Shield className="w-3 h-3" />
            Identity
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-[#162D4D] text-[#75A7FF] border border-[#263F63]">
            <FileText className="w-3 h-3" />
            Document
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'document', label: 'Documents' },
            { id: 'credential', label: 'Credentials' },
            { id: 'recovery_phrase', label: 'Recovery Keys' },
            { id: 'identity', label: 'Identity' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                selectedCategory === cat.id
                  ? 'bg-[#1B365B] text-[#F8FAFC] border-[#75A7FF]/60 shadow-xs'
                  : 'bg-[#112541] text-[#A9BAD4] border-[#263F63] hover:bg-[#162D4D] hover:text-[#F8FAFC]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#7890B2] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search encrypted items..."
            className="w-full pl-9 pr-3.5 py-1.5 rounded-xl bg-[#112541] border border-[#263F63] text-xs text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:border-[#3B82F6]"
          />
        </div>
      </div>

      {/* Items List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-12 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-base font-bold text-[#F8FAFC]">No Encrypted Items Found</h4>
            <p className="text-xs text-[#A9BAD4]">
              {documents.length === 0
                ? 'Your secure locker is currently empty. Upload sensitive documents or credentials with client-side AES-256-GCM encryption.'
                : 'No items match your selected filter or search term.'}
            </p>
          </div>
          {documents.length === 0 && (
            <button
              type="button"
              onClick={onOpenUpload}
              className="py-2.5 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Encrypt First Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#112541] rounded-2xl border border-[#263F63] hover:border-[#75A7FF]/50 p-4 transition-all duration-150 flex flex-col justify-between space-y-3 shadow-md group"
            >
              {/* Card Header */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#F8FAFC] truncate" title={doc.title}>
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-[#A9BAD4] font-mono truncate" title={doc.filename}>
                        {doc.filename}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 flex-wrap">
                  {getCategoryBadge(doc.category)}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#081426] text-[#7890B2] border border-[#263F63]">
                    {(doc.file_size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#081426] text-emerald-400 border border-emerald-500/20">
                    AES-GCM
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-2 border-t border-[#263F63]/60 flex items-center justify-between text-xs text-[#A9BAD4]">
                <div className="flex items-center gap-1 text-[11px] text-[#7890B2]">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onViewDocument(doc)}
                    title="Decrypt & View in RAM"
                    className="p-1.5 rounded-lg text-[#A9BAD4] hover:text-[#F8FAFC] hover:bg-[#162D4D] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDownloadDocument(doc)}
                    title="Download Plaintext"
                    className="p-1.5 rounded-lg text-[#A9BAD4] hover:text-[#75A7FF] hover:bg-[#162D4D] transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete "${doc.title}"?`)) {
                        onDeleteDocument(doc.id);
                      }
                    }}
                    title="Delete Encrypted Document"
                    className="p-1.5 rounded-lg text-[#A9BAD4] hover:text-red-400 hover:bg-[#162D4D] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
