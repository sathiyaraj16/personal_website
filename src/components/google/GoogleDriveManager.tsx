import React, { useState, useEffect, useCallback } from 'react';
import {
  HardDrive,
  Folder,
  FileText,
  Table,
  Presentation,
  FileCode,
  Image as ImageIcon,
  Video,
  File,
  Search,
  ChevronRight,
  Download,
  ExternalLink,
  Eye,
  X,
  LayoutGrid,
  List as ListIcon,
  RefreshCw,
  Loader2,
  Star,
  AlertTriangle,
} from 'lucide-react';
import type { GoogleDriveFile, DriveFilterType } from '../../types/google';
import { googleDriveService } from '../../services/googleDriveService';
import { useGoogleAuth } from '../../context/GoogleAuthContext';
import { DriveFilePreviewModal } from './DriveFilePreviewModal';

interface BreadcrumbItem {
  id: string;
  name: string;
}

export const GoogleDriveManager: React.FC = () => {
  const { isConnected, getValidAccessToken } = useGoogleAuth();

  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Folder navigation & breadcrumbs
  const [currentFolder, setCurrentFolder] = useState<BreadcrumbItem>({
    id: 'root',
    name: 'My Drive',
  });
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<BreadcrumbItem[]>([
    { id: 'root', name: 'My Drive' },
  ]);

  // Filtering & view mode
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<DriveFilterType>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Selected file for inspection / preview modal
  const [selectedFile, setSelectedFile] = useState<GoogleDriveFile | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  // Fetch files when folder or filter changes
  const fetchFiles = useCallback(async () => {
    const token = await getValidAccessToken();
    if (!token) {
      setFiles([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await googleDriveService.listFiles(token, {
        folderId: searchQuery ? undefined : currentFolder.id,
        searchQuery: searchQuery || undefined,
        filterType: activeFilter,
        pageSize: 40,
      });

      if (res.error) {
        setError(res.error);
        setFiles([]);
      } else {
        setFiles(res.files);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching Google Drive items.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [getValidAccessToken, currentFolder.id, searchQuery, activeFilter]);

  useEffect(() => {
    if (isConnected) {
      fetchFiles();
    } else {
      setFiles([]);
      setError(null);
    }
  }, [isConnected, fetchFiles]);

  // Navigate into a folder
  const handleOpenFolder = (folder: GoogleDriveFile) => {
    const newBreadcrumb: BreadcrumbItem = { id: folder.id, name: folder.name };
    setCurrentFolder(newBreadcrumb);
    setBreadcrumbTrail((prev) => [...prev, newBreadcrumb]);
    setSearchQuery('');
  };

  // Click on a breadcrumb item to navigate back
  const handleBreadcrumbClick = (item: BreadcrumbItem, index: number) => {
    setCurrentFolder(item);
    setBreadcrumbTrail((prev) => prev.slice(0, index + 1));
    setSearchQuery('');
  };

  // Safe user-triggered file download
  const handleDownload = async (file: GoogleDriveFile) => {
    const token = await getValidAccessToken();
    if (!token) return;

    setDownloadingFileId(file.id);

    const res = await googleDriveService.downloadFile(token, file);
    setDownloadingFileId(null);

    if (!res.success && res.error) {
      setError(res.error);
    }
  };

  // Open file preview modal
  const handleInspectFile = (file: GoogleDriveFile) => {
    setSelectedFile(file);
  };

  // Helper for icon based on mimeType
  const renderFileIcon = (file: GoogleDriveFile) => {
    const cat = googleDriveService.getFileTypeCategory(file.mimeType);

    if (cat === 'folders') {
      return <Folder className="w-5 h-5 text-amber-400 flex-shrink-0" />;
    }
    if (cat === 'videos') {
      return <Video className="w-5 h-5 text-purple-400 flex-shrink-0" />;
    }
    if (cat === 'images') {
      return <ImageIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />;
    }
    if (cat === 'spreadsheets') {
      return <Table className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
    }
    if (cat === 'presentations') {
      return <Presentation className="w-5 h-5 text-amber-500 flex-shrink-0" />;
    }
    if (cat === 'documents') {
      return <FileText className="w-5 h-5 text-blue-400 flex-shrink-0" />;
    }
    if (cat === 'pdfs') {
      return <FileCode className="w-5 h-5 text-rose-400 flex-shrink-0" />;
    }
    return <File className="w-5 h-5 text-[#75A7FF] flex-shrink-0" />;
  };

  return (
    <div className="space-y-6">
      {/* Drive API Error Notification */}
      {error && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start justify-between gap-3 text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-amber-300">Google Drive API Message</p>
              <p className="text-xs text-amber-200/90 leading-relaxed">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="p-1 rounded-lg hover:bg-amber-500/20 text-amber-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Breadcrumbs Navigation Bar */}
      <div className="p-4 rounded-2xl bg-[#112541] border border-[#263F63] space-y-4">
        {/* Top: Breadcrumb Trail */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <nav aria-label="Folder Navigation" className="flex items-center gap-1.5 flex-wrap text-xs">
            {breadcrumbTrail.map((crumb, idx) => {
              const isLast = idx === breadcrumbTrail.length - 1;
              return (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-[#263F63]" />}
                  <button
                    type="button"
                    onClick={() => handleBreadcrumbClick(crumb, idx)}
                    disabled={isLast}
                    className={`font-semibold transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                      isLast
                        ? 'text-[#F8FAFC] bg-[#162D4D] border border-[#263F63] cursor-default'
                        : 'text-[#75A7FF] hover:text-[#F8FAFC] hover:bg-[#162D4D]/50 cursor-pointer'
                    }`}
                  >
                    {idx === 0 && <HardDrive className="w-3.5 h-3.5" />}
                    <span>{crumb.name}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </nav>

          {/* View Toggle & Refresh */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchFiles}
              disabled={!isConnected || loading}
              className="p-2 rounded-xl bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh directory"
            >
              <RefreshCw className={`w-4 h-4 text-[#75A7FF] ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex items-center p-1 rounded-xl bg-[#162D4D] border border-[#263F63]">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#A9BAD4] hover:text-[#F8FAFC]'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#3B82F6] text-white'
                    : 'text-[#A9BAD4] hover:text-[#F8FAFC]'
                }`}
                title="List View"
              >
                <ListIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom: Search Input & Filter Pills */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-[#263F63]/50">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#75A7FF] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files and folders in Google Drive..."
              className="w-full pl-10 pr-8 py-2 rounded-xl bg-[#162D4D] border border-[#263F63] text-xs text-[#F8FAFC] placeholder-[#7890B2] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A9BAD4] hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'folders', label: 'Folders' },
                { id: 'videos', label: 'Videos' },
                { id: 'documents', label: 'Docs' },
                { id: 'spreadsheets', label: 'Sheets' },
                { id: 'presentations', label: 'Slides' },
                { id: 'pdfs', label: 'PDFs' },
                { id: 'images', label: 'Images' },
              ] as const
            ).map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id)}
                className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                  activeFilter === filter.id
                    ? 'bg-[#3B82F6] text-white border-blue-400'
                    : 'bg-[#162D4D] text-[#A9BAD4] hover:text-[#F8FAFC] border-[#263F63]'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main File Listing */}
      {loading ? (
        // Loading Skeleton
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-2'
          }
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-2xl bg-[#112541] border border-[#263F63] animate-pulse h-28 flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#162D4D]" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 bg-[#162D4D] rounded w-3/4" />
                  <div className="h-2 bg-[#162D4D] rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-[#162D4D] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : !isConnected ? (
        // Not Connected Empty State
        <div className="p-12 text-center rounded-2xl bg-[#112541] border border-[#263F63] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mx-auto shadow-inner">
            <HardDrive className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#F8FAFC]">
              Google Drive Not Connected
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              Connect your authorized Google account above to browse directories, preview documents, and securely orchestrate files in Google Drive.
            </p>
          </div>
        </div>
      ) : files.length === 0 ? (
        // Empty Folder / No Results
        <div className="p-12 text-center rounded-2xl bg-[#112541] border border-[#263F63] space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#162D4D] border border-[#263F63] flex items-center justify-center text-[#75A7FF] mx-auto shadow-inner">
            <Folder className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-base font-bold text-[#F8FAFC]">
              {searchQuery ? 'No Files Found' : 'Folder is Empty'}
            </h3>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">
              {searchQuery
                ? `No items found matching "${searchQuery}". Clear your search term to see all files.`
                : 'There are no files or subfolders inside this location.'}
            </p>
          </div>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        // GRID VIEW
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files.map((file) => {
            const isFolder = file.mimeType === 'application/vnd.google-apps.folder';

            return (
              <div
                key={file.id}
                onClick={() => {
                  if (isFolder) {
                    handleOpenFolder(file);
                  } else {
                    handleInspectFile(file);
                  }
                }}
                className="group p-4 rounded-2xl bg-[#112541] hover:bg-[#162D4D] border border-[#263F63] hover:border-[#3B82F6] transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-md hover:shadow-blue-500/10"
              >
                {/* Top: Icon + Name */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="p-2.5 rounded-xl bg-[#162D4D] group-hover:bg-[#10223D] border border-[#263F63] transition-colors">
                      {renderFileIcon(file)}
                    </div>

                    {file.starred && (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-[#F8FAFC] group-hover:text-white line-clamp-2 leading-snug">
                      {file.name}
                    </h4>
                  </div>
                </div>

                {/* Bottom: Metadata & Actions */}
                <div className="mt-4 pt-3 border-t border-[#263F63]/60 flex items-center justify-between text-[11px] text-[#A9BAD4]">
                  <div className="flex items-center gap-2">
                    <span>{googleDriveService.formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{googleDriveService.formatDate(file.modifiedTime)}</span>
                  </div>

                  {!isFolder && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(file);
                      }}
                      disabled={downloadingFileId === file.id}
                      className="p-1 rounded-lg hover:bg-[#1B365B] text-[#75A7FF] hover:text-white transition-colors cursor-pointer"
                      title="Download file"
                    >
                      {downloadingFileId === file.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // LIST VIEW
        <div className="rounded-2xl bg-[#112541] border border-[#263F63] overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#162D4D] text-[#A9BAD4] font-semibold uppercase tracking-wider text-[10px] border-b border-[#263F63]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 hidden sm:table-cell">Owner</th>
                  <th className="py-3 px-4 hidden md:table-cell">Last Modified</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263F63]/50">
                {files.map((file) => {
                  const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                  const ownerName = file.owners?.[0]?.displayName || 'Me';

                  return (
                    <tr
                      key={file.id}
                      onClick={() => {
                        if (isFolder) {
                          handleOpenFolder(file);
                        } else {
                          handleInspectFile(file);
                        }
                      }}
                      className="hover:bg-[#162D4D]/70 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="p-1.5 rounded-lg bg-[#162D4D] border border-[#263F63]">
                            {renderFileIcon(file)}
                          </div>
                          <span className="font-semibold text-[#F8FAFC] group-hover:text-[#75A7FF] line-clamp-1">
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[#A9BAD4] hidden sm:table-cell">
                        {ownerName}
                      </td>
                      <td className="py-3 px-4 text-[#A9BAD4] hidden md:table-cell font-mono text-[11px]">
                        {googleDriveService.formatDate(file.modifiedTime)}
                      </td>
                      <td className="py-3 px-4 text-right text-[#A9BAD4] font-mono text-[11px]">
                        {googleDriveService.formatFileSize(file.size)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {!isFolder && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleInspectFile(file)}
                                className="p-1.5 rounded-lg hover:bg-[#1B365B] text-[#75A7FF] hover:text-white transition-colors"
                                title="Preview file"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownload(file)}
                                disabled={downloadingFileId === file.id}
                                className="p-1.5 rounded-lg hover:bg-[#1B365B] text-[#75A7FF] hover:text-white transition-colors disabled:opacity-50"
                                title="Download"
                              >
                                {downloadingFileId === file.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </>
                          )}
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg hover:bg-[#1B365B] text-[#A9BAD4] hover:text-white transition-colors"
                              title="Open in Google Drive"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Authenticated In-App File Preview Modal */}
      {selectedFile && (
        <DriveFilePreviewModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}
    </div>
  );
};
