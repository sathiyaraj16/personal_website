import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  FileText,
  Clock,
  Filter,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { LockerAuditLog } from '../../types/locker';

interface AuditLogViewerProps {
  logs: LockerAuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'all') return true;
    return log.event_type === filterType;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'LOCKER_UNLOCK_SUCCESS':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'LOCKER_UNLOCK_FAILED':
      case 'LOCKOUT_TRIGGERED':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'PASSPHRASE_CHANGED':
      case 'RECOVERY_KEY_USED':
        return <KeyRound className="w-4 h-4 text-amber-400" />;
      case 'DOCUMENT_UPLOADED':
      case 'DOCUMENT_DOWNLOADED':
      case 'DOCUMENT_DELETED':
        return <FileText className="w-4 h-4 text-[#75A7FF]" />;
      default:
        return <Clock className="w-4 h-4 text-[#A9BAD4]" />;
    }
  };

  const formatEventName = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="bg-[#112541] rounded-2xl border border-[#263F63] p-6 shadow-xl space-y-5 text-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#263F63]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-['Plus_Jakarta_Sans',sans-serif]">
              Cryptographic Security Audit Log
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#162D4D] text-[#75A7FF] border border-[#263F63]">
              Immutable Append-Only Trail
            </span>
          </div>
          <p className="text-xs text-[#A9BAD4]">
            Zero-knowledge audit events recorded locally and in database. Passphrases, keys, and file contents are never logged.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#A9BAD4]" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-[#081426] border border-[#263F63] text-xs text-[#F8FAFC] focus:outline-none focus:border-[#3B82F6]"
          >
            <option value="all">All Event Types</option>
            <option value="LOCKER_UNLOCK_SUCCESS">Unlock Success</option>
            <option value="LOCKER_UNLOCK_FAILED">Unlock Failed</option>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="DOCUMENT_DOWNLOADED">Document Downloaded</option>
            <option value="DOCUMENT_DELETED">Document Deleted</option>
            <option value="PASSPHRASE_CHANGED">Passphrase Changed</option>
            <option value="RECOVERY_KEY_USED">Recovery Key Used</option>
            <option value="LOCKOUT_TRIGGERED">Lockout Triggered</option>
          </select>
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <Clock className="w-8 h-8 text-[#263F63] mx-auto" />
          <p className="text-sm font-semibold text-[#A9BAD4]">No security audit events recorded yet</p>
          <p className="text-xs text-[#7890B2]">Actions taken in the locker will be appended to this log.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#263F63] text-[#A9BAD4]">
                <th className="py-2.5 px-3 font-semibold">Event</th>
                <th className="py-2.5 px-3 font-semibold">Status</th>
                <th className="py-2.5 px-3 font-semibold">Context / Metadata</th>
                <th className="py-2.5 px-3 font-semibold text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#263F63]/50">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#162D4D]/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-[#081426] border border-[#263F63]">
                        {getEventIcon(log.event_type)}
                      </div>
                      <span className="font-medium text-[#F8FAFC]">
                        {formatEventName(log.event_type)}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        log.status === 'SUCCESS'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : log.status === 'BLOCKED'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {log.status === 'SUCCESS' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <AlertTriangle className="w-3 h-3" />
                      )}
                      <span>{log.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#A9BAD4] font-mono text-[11px] max-w-xs truncate">
                    {Object.keys(log.metadata || {}).length > 0
                      ? Object.entries(log.metadata)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')
                      : 'None'}
                  </td>
                  <td className="py-3 px-3 text-right text-[#A9BAD4] whitespace-nowrap font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
