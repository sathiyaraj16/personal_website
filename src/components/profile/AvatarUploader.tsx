import React, { useState, useRef } from 'react';
import { Camera, Trash2, Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { profileService } from '../../services/profileService';

interface AvatarUploaderProps {
  userId: string;
  currentAvatarUrl: string | null;
  displayName: string;
  onAvatarChange: (newAvatarUrl: string | null) => void;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({
  userId,
  currentAvatarUrl,
  displayName,
  onAvatarChange,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentAvatarUrl);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'NX';

  const handleFileSelect = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Please select a JPG, PNG, WebP, or GIF image.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image file must be 5MB or smaller.');
      return;
    }

    // Instant local preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const result = await profileService.uploadAvatar(userId, file);
      if (result.error) {
        setErrorMessage(result.error.message);
      } else if (result.url) {
        setPreviewUrl(result.url);
        onAvatarChange(result.url);
        setSuccessMessage(
          result.fallback
            ? 'Avatar updated (preview mode).'
            : 'Avatar uploaded and saved successfully!'
        );
      }
    } catch {
      setErrorMessage('An unexpected error occurred while uploading avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onAvatarChange(null);
    setSuccessMessage('Avatar removed. Using default initials.');
    setErrorMessage(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Avatar Preview Box */}
        <div className="relative group">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#162D4D] border-2 border-[#263F63] p-1 shadow-md overflow-hidden flex items-center justify-center">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-[#3B82F6]/20 border border-[#3B82F6]/30 flex items-center justify-center text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#75A7FF]">
                {initials}
              </div>
            )}
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center backdrop-blur-xs">
              <Loader2 className="w-6 h-6 text-[#75A7FF] animate-spin" />
            </div>
          )}
        </div>

        {/* Upload & Drag Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 w-full p-4 rounded-xl border border-dashed transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDragOver
              ? 'border-[#75A7FF] bg-[#162D4D]/70'
              : 'border-[#263F63] bg-[#162D4D]/30 hover:bg-[#162D4D]/50'
          }`}
        >
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#F8FAFC] flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#75A7FF]" />
              Profile Photo
            </p>
            <p className="text-xs text-[#A9BAD4]">
              PNG, JPG, WebP or GIF. Maximum file size 5MB.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={onInputChange}
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-[#1B365B] hover:bg-[#264573] border border-[#263F63] text-xs font-semibold text-[#F8FAFC] flex items-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-[#75A7FF] animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5 text-[#75A7FF]" />
                  Choose File
                </>
              )}
            </button>

            {previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="px-3 py-2 rounded-xl bg-red-950/30 hover:bg-red-900/40 border border-red-800/40 text-xs font-medium text-red-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                title="Remove photo"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-950/40 border border-red-800/50 flex items-center gap-2.5 text-xs text-red-200 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-2.5 text-xs text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
};
