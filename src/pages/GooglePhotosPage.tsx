import React from 'react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { GoogleConnectionBanner } from '../components/google/GoogleConnectionBanner';
import { GooglePhotosViewer } from '../components/google/GooglePhotosViewer';

export const GooglePhotosPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#112541] border border-[#263F63] flex items-center justify-center text-[#75A7FF] shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold font-['Plus_Jakarta_Sans',sans-serif] text-[#F8FAFC] tracking-tight">
                Google Photos
              </h2>
              <p className="text-xs text-[#A9BAD4]">
                Enterprise media asset browser and Google Photos Picker gallery
              </p>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#112541] border border-[#263F63] text-xs font-mono text-[#75A7FF]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Picker API v1</span>
          </span>
        </div>
      </div>

      {/* Reusable Google Account Connection Component */}
      <GoogleConnectionBanner requiredService="photos" />

      {/* Main Google Photos Gallery Viewer */}
      <GooglePhotosViewer />
    </div>
  );
};
