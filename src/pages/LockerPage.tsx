import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  Plus,
  Sliders,
  History,
  Clock,
  Loader2,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { lockerService } from '../services/lockerService';
import { LockerVaultRecord, LockerDocument, LockerAuditLog, VaultStatus } from '../types/locker';
import { VaultSetupModal } from '../components/locker/VaultSetupModal';
import { VaultUnlockModal } from '../components/locker/VaultUnlockModal';
import { LockerDocumentList } from '../components/locker/LockerDocumentList';
import { UploadDocumentModal } from '../components/locker/UploadDocumentModal';
import { DocumentPreviewModal } from '../components/locker/DocumentPreviewModal';
import { AuditLogViewer } from '../components/locker/AuditLogViewer';
import { LockerSettingsModal } from '../components/locker/LockerSettingsModal';

export const LockerPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';

  const [vaultStatus, setVaultStatus] = useState<VaultStatus>('LOADING');
  const [vaultRecord, setVaultRecord] = useState<LockerVaultRecord | null>(null);
  const [documents, setDocuments] = useState<LockerDocument[]>([]);
  const [auditLogs, setAuditLogs] = useState<LockerAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'documents' | 'audit'>('documents');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<LockerDocument | null>(null);

  // Inactivity Timer
  const [remainingInactivitySeconds, setRemainingInactivitySeconds] = useState<number>(0);

  // Load vault state
  const loadVaultState = useCallback(async () => {
    if (!userId) {
      setVaultStatus('LOADING');
      return;
    }

    const record = await lockerService.getVaultRecord(userId);
    setVaultRecord(record);

    if (!record) {
      setVaultStatus('NOT_CONFIGURED');
    } else if (record.locked_until && new Date(record.locked_until).getTime() > Date.now()) {
      setVaultStatus('LOCKED_OUT');
    } else if (lockerService.isVaultUnlocked()) {
      setVaultStatus('UNLOCKED');
      // Fetch documents and audit logs
      const [docs, logs] = await Promise.all([
        lockerService.listDocuments(userId),
        lockerService.getAuditLogs(userId),
      ]);
      setDocuments(docs);
      setAuditLogs(logs);
    } else {
      setVaultStatus('LOCKED');
    }
  }, [userId]);

  useEffect(() => {
    loadVaultState();
  }, [loadVaultState]);

  // Auto-lock when component unmounts (leaving /locker for ANY other section)
  useEffect(() => {
    return () => {
      if (userId) {
        lockerService.lockVault(userId);
      }
      setDocuments([]);
      setAuditLogs([]);
      setPreviewDoc(null);
    };
  }, [userId]);

  // Lock on browser tab close or refresh
  useEffect(() => {
    const handleUnload = () => {
      if (userId) {
        lockerService.lockVault(userId);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [userId]);

  // Subscribe to auto-lock events
  useEffect(() => {
    const unsubscribe = lockerService.onAutoLock(() => {
      setDocuments([]);
      setAuditLogs([]);
      setPreviewDoc(null);
      setVaultStatus('LOCKED');
    });
    return () => unsubscribe();
  }, []);

  // Update inactivity countdown timer
  useEffect(() => {
    if (vaultStatus !== 'UNLOCKED') return;

    const updateTimer = () => {
      const remaining = lockerService.getRemainingInactivitySeconds();
      setRemainingInactivitySeconds(remaining);
      if (remaining <= 0) {
        setVaultStatus('LOCKED');
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [vaultStatus]);

  // Touch user activity on mouse and keyboard events
  useEffect(() => {
    if (vaultStatus !== 'UNLOCKED') return;

    const handleUserActivity = () => {
      lockerService.touchActivity();
      setRemainingInactivitySeconds(lockerService.getRemainingInactivitySeconds());
    };

    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);

    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
    };
  }, [vaultStatus]);

  const handleManualLock = async () => {
    await lockerService.lockVault(userId);
    setDocuments([]);
    setAuditLogs([]);
    setPreviewDoc(null);
    setVaultStatus('LOCKED');
  };

  const handleDocumentUploaded = async () => {
    const [docs, logs] = await Promise.all([
      lockerService.listDocuments(userId),
      lockerService.getAuditLogs(userId),
    ]);
    setDocuments(docs);
    setAuditLogs(logs);
  };

  const handleDownloadPlaintext = async (doc: LockerDocument) => {
    try {
      const res = await lockerService.downloadAndDecryptDocument(userId, doc);
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      a.click();
      URL.revokeObjectURL(url);

      const logs = await lockerService.getAuditLogs(userId);
      setAuditLogs(logs);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Decryption failed.');
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const res = await lockerService.deleteDocument(userId, docId);
    if (res.success) {
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      const logs = await lockerService.getAuditLogs(userId);
      setAuditLogs(logs);
    } else {
      alert(res.error || 'Failed to delete document.');
    }
  };

  if (vaultStatus === 'LOADING') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#75A7FF]" />
        <p className="text-sm font-medium text-[#A9BAD4]">Verifying Zero-Trust Vault Security Status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Vault Not Initialized Modal */}
      {vaultStatus === 'NOT_CONFIGURED' && (
        <VaultSetupModal
          userId={userId}
          onSetupComplete={() => {
            loadVaultState();
          }}
        />
      )}

      {/* 2. Vault Locked / Locked Out Modal */}
      {(vaultStatus === 'LOCKED' || vaultStatus === 'LOCKED_OUT') && vaultRecord && (
        <VaultUnlockModal
          userId={userId}
          vault={vaultRecord}
          onUnlocked={() => {
            loadVaultState();
          }}
          onVaultResetRequested={() => {
            setShowSettingsModal(true);
          }}
        />
      )}

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#112541] border border-[#263F63] flex items-center justify-center text-[#75A7FF] shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
                  Secure Locker & Secret Vault
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AES-256-GCM
                </span>
              </div>
              <p className="text-xs text-[#A9BAD4]">
                Zero-Trust Envelope Encryption. Cryptographic keys never leave client ephemeral memory.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Inactivity Countdown */}
          {vaultStatus === 'UNLOCKED' && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#112541] border border-[#263F63] text-xs text-[#A9BAD4]">
              <Clock className="w-3.5 h-3.5 text-[#75A7FF]" />
              <span>Auto-locking in:</span>
              <span className="font-mono text-[#F8FAFC] font-bold">
                {Math.floor(remainingInactivitySeconds / 60)}m {remainingInactivitySeconds % 60}s
              </span>
            </div>
          )}

          {vaultStatus === 'UNLOCKED' && (
            <>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-3.5 py-2 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Encrypt Document</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="p-2 rounded-xl bg-[#112541] hover:bg-[#162D4D] border border-[#263F63] text-[#A9BAD4] hover:text-[#F8FAFC] transition-colors cursor-pointer"
                title="Key Management & Settings"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleManualLock}
                className="px-3 py-2 rounded-xl bg-[#162D4D] hover:bg-rose-950/60 border border-[#263F63] hover:border-rose-500/50 text-[#A9BAD4] hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Vault Now</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#263F63] pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-2 border ${
            activeTab === 'documents'
              ? 'bg-[#1B365B] text-[#F8FAFC] border-[#75A7FF]/60 shadow-xs font-semibold'
              : 'bg-transparent text-[#A9BAD4] border-transparent hover:bg-[#112541] hover:text-[#F8FAFC] font-medium'
          }`}
        >
          <FileText className={`w-3.5 h-3.5 ${activeTab === 'documents' ? 'text-white' : 'text-[#75A7FF]'}`} />
          <span>Encrypted Documents ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-2 border ${
            activeTab === 'audit'
              ? 'bg-[#1B365B] text-[#F8FAFC] border-[#75A7FF]/60 shadow-xs font-semibold'
              : 'bg-transparent text-[#A9BAD4] border-transparent hover:bg-[#112541] hover:text-[#F8FAFC] font-medium'
          }`}
        >
          <History className={`w-3.5 h-3.5 ${activeTab === 'audit' ? 'text-white' : 'text-[#75A7FF]'}`} />
          <span>Security Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'documents' && (
        <LockerDocumentList
          documents={documents}
          onViewDocument={(doc) => setPreviewDoc(doc)}
          onDownloadDocument={handleDownloadPlaintext}
          onDeleteDocument={handleDeleteDocument}
          onOpenUpload={() => setShowUploadModal(true)}
        />
      )}

      {activeTab === 'audit' && <AuditLogViewer logs={auditLogs} />}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <UploadDocumentModal
          userId={userId}
          onClose={() => setShowUploadModal(false)}
          onUploaded={handleDocumentUploaded}
        />
      )}

      {/* Document Decryption & Preview Modal */}
      {previewDoc && (
        <DocumentPreviewModal
          userId={userId}
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {/* Settings & Key Rotation Modal */}
      {showSettingsModal && (
        <LockerSettingsModal
          userId={userId}
          onClose={() => setShowSettingsModal(false)}
          onPassphraseChanged={loadVaultState}
          onVaultReset={() => {
            loadVaultState();
          }}
        />
      )}
    </div>
  );
};

export default LockerPage;
