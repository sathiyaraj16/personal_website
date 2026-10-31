import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// Configure pdfjs worker using Vite URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface DrivePdfViewerProps {
  blob: Blob;
  blobUrl: string;
  fileName: string;
}

export const DrivePdfViewer: React.FC<DrivePdfViewerProps> = ({ blob, blobUrl, fileName }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [pageInput, setPageInput] = useState<string>('1');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);

  // Keep track of active rendering task to avoid overlapping cancels
  const renderTaskRef = useRef<any>(null);

  // Load PDF Document when blob changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    setRenderError(null);
    setCurrentPage(1);
    setPageInput('1');

    const loadDocument = async () => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        if (isCancelled) return;

        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setIsLoading(false);
      } catch (err) {
        if (isCancelled) return;
        setRenderError(
          err instanceof Error ? err.message : 'Failed to parse PDF document structure.'
        );
        setIsLoading(false);
      }
    };

    loadDocument();

    return () => {
      isCancelled = true;
    };
  }, [blob]);

  // Render specific page onto Canvas
  const renderPage = useCallback(
    async (pageNumber: number, currentScale: number) => {
      if (!pdfDoc || !canvasRef.current) return;

      // Cancel ongoing render if any
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // Task already finished or cancelled
        }
        renderTaskRef.current = null;
      }

      setIsRendering(true);

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: currentScale });

        // Set dimensions for high-DPI displays
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        setIsRendering(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('PDF page render error:', err);
          setIsRendering(false);
        }
      }
    },
    [pdfDoc]
  );

  // Trigger render when page or scale updates
  useEffect(() => {
    if (pdfDoc && !isLoading) {
      renderPage(currentPage, scale);
    }
  }, [pdfDoc, currentPage, scale, isLoading, renderPage]);

  // Page Navigation Handlers
  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prev = currentPage - 1;
      setCurrentPage(prev);
      setPageInput(prev.toString());
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const next = currentPage + 1;
      setCurrentPage(next);
      setPageInput(next.toString());
    }
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
      setCurrentPage(parsed);
    } else {
      setPageInput(currentPage.toString());
    }
  };

  // Zoom Handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleZoomReset = () => {
    setScale(1.0);
  };

  const handleFitToWidth = () => {
    if (!containerRef.current || !pdfDoc) return;
    pdfDoc.getPage(currentPage).then((page) => {
      const unscaledViewport = page.getViewport({ scale: 1.0 });
      const containerWidth = containerRef.current?.clientWidth || 800;
      // Leave 60px padding for scrollbars and margins
      const targetScale = Math.max(0.5, Math.min(2.5, (containerWidth - 64) / unscaledViewport.width));
      setScale(targetScale);
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#081426] text-[#F8FAFC] select-none">
      {/* Top PDF Controls Toolbar */}
      <div className="h-12 bg-[#112541] border-b border-[#263F63] px-3 sm:px-4 flex items-center justify-between gap-2 z-10 flex-shrink-0">
        {/* Page Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="p-1.5 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1 text-xs text-[#A9BAD4]">
            <span>Page</span>
            <input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={() => {
                const parsed = parseInt(pageInput, 10);
                if (!isNaN(parsed) && parsed >= 1 && parsed <= numPages) {
                  setCurrentPage(parsed);
                } else {
                  setPageInput(currentPage.toString());
                }
              }}
              disabled={isLoading}
              className="w-10 h-7 rounded bg-[#081426] border border-[#263F63] text-center font-mono font-semibold text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
            />
            <span className="font-mono text-[#7890B2]">of {numPages}</span>
          </form>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading}
            className="p-1.5 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & Viewport Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.5 || isLoading}
            className="p-1.5 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors disabled:opacity-40 cursor-pointer"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleZoomReset}
            className="px-2 py-1 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-xs font-mono font-semibold text-[#75A7FF] border border-[#263F63] min-w-[54px] text-center transition-colors cursor-pointer"
            title="Reset Zoom to 100%"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 3.0 || isLoading}
            className="p-1.5 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors disabled:opacity-40 cursor-pointer"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-[#263F63] mx-1 hidden sm:block" />

          {/* Fit to Width */}
          <button
            type="button"
            onClick={handleFitToWidth}
            disabled={isLoading}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#162D4D] hover:bg-[#1B365B] text-xs font-medium text-[#A9BAD4] hover:text-[#F8FAFC] border border-[#263F63] transition-colors cursor-pointer"
            title="Fit to Width"
          >
            <Maximize2 className="w-3.5 h-3.5 text-[#75A7FF]" />
            <span>Fit Width</span>
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center relative min-h-[350px] bg-[#081426] select-text"
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#081426]/90 z-20">
            <Loader2 className="w-8 h-8 text-[#3B82F6] animate-spin" />
            <p className="text-xs font-semibold text-[#A9BAD4]">
              Rendering PDF pages...
            </p>
          </div>
        )}

        {/* Render Error */}
        {renderError ? (
          <div className="m-auto max-w-md p-6 rounded-2xl bg-[#112541] border border-red-500/30 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
            <h4 className="text-sm font-bold text-[#F8FAFC]">PDF Rendering Failed</h4>
            <p className="text-xs text-[#A9BAD4] leading-relaxed">{renderError}</p>
            <div className="pt-2 flex justify-center gap-2">
              <a
                href={blobUrl}
                download={fileName}
                className="px-4 py-2 rounded-xl bg-[#3B82F6] hover:bg-blue-600 text-white text-xs font-semibold"
              >
                Download PDF File
              </a>
            </div>
          </div>
        ) : (
          <div className="relative inline-block transition-all duration-150">
            {/* The HTML5 Canvas for Render */}
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-2xl bg-white border border-[#263F63] mx-auto block"
            />

            {/* Subtle re-render overlay spinner when switching pages or zoom */}
            {isRendering && !isLoading && (
              <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white">
                <Loader2 className="w-4 h-4 animate-spin text-[#75A7FF]" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
