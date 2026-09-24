import { RefObject, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist';

// PDF.js is large, so it's only downloaded the first time a PDF is opened
let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null;
function loadPdfjs() {
  pdfjsPromise ??= Promise.all([import('pdfjs-dist'), import('pdfjs-dist/build/pdf.worker.min.mjs?url')]).then(
    ([lib, worker]) => {
      lib.GlobalWorkerOptions.workerSrc = worker.default;
      return lib;
    },
  );
  return pdfjsPromise;
}

export interface PdfPosition {
  /** Page mostly on screen right now. */
  page: number;
  /** Furthest page the student has actually looked at. */
  furthest: number;
  total: number;
}

interface PdfViewerProps {
  blob: Blob;
  /** The scrolling element the pages sit in. */
  scrollRoot: RefObject<HTMLDivElement | null>;
  /** Saved reading progress (0-100); the viewer opens on the matching page. */
  startProgress: number;
  onPosition: (position: PdfPosition) => void;
  onError: () => void;
}

interface PageSize {
  w: number;
  h: number;
}

/**
 * Renders a PDF page by page so reading progress can be tracked automatically:
 * a page counts as read once most of it (or most of the screen) has shown it.
 */
export function PdfViewer({ blob, scrollRoot, startProgress, onPosition, onError }: PdfViewerProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [sizes, setSizes] = useState<PageSize[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onPosition, onError });
  callbacks.current = { onPosition, onError };

  // Load the document and every page's size (so the scroll height is right before pages render)
  useEffect(() => {
    let cancelled = false;
    let doc: PDFDocumentProxy | null = null;
    setPdf(null);
    setSizes([]);
    (async () => {
      try {
        const lib = await loadPdfjs();
        doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        const pageSizes: PageSize[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const viewport = (await doc.getPage(i)).getViewport({ scale: 1 });
          pageSizes.push({ w: viewport.width, h: viewport.height });
        }
        if (cancelled) return;
        setSizes(pageSizes);
        setPdf(doc);
      } catch {
        if (!cancelled) callbacks.current.onError();
      }
    })();
    return () => {
      cancelled = true;
      doc?.destroy();
    };
  }, [blob]);

  // Track which pages are on screen
  useEffect(() => {
    const root = scrollRoot.current;
    const container = containerRef.current;
    if (!pdf || !root || !container) return;

    const total = sizes.length;
    const visibleHeight = new Map<number, number>();
    let furthest = 0;
    let lastReported = '';

    const report = () => {
      let page = 0;
      let best = 0;
      for (const [p, h] of visibleHeight) {
        if (h > best) {
          best = h;
          page = p;
        }
      }
      if (!page) return;
      const key = `${page}:${furthest}`;
      if (key === lastReported) return;
      lastReported = key;
      callbacks.current.onPosition({ page, furthest, total });
    };

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          const page = Number((entry.target as HTMLElement).dataset.page);
          const shown = entry.isIntersecting ? entry.intersectionRect.height : 0;
          visibleHeight.set(page, shown);
          const rootHeight = entry.rootBounds?.height ?? root.clientHeight;
          // Seen = 60% of the page is visible, or it fills half the screen (tall pages on small screens)
          if (entry.isIntersecting && (entry.intersectionRatio >= 0.6 || shown >= rootHeight * 0.5)) {
            furthest = Math.max(furthest, page);
          }
        }
        report();
      },
      { root, threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    container.querySelectorAll('[data-page]').forEach(el => observer.observe(el));

    // Resume where the student stopped. The last page read goes at the bottom of the screen,
    // so reopening doesn't reveal (and count) pages that haven't been read yet.
    const start = Math.min(Math.max(1, Math.round((startProgress / 100) * total)), total);
    if (start > 1) container.querySelector(`[data-page="${start}"]`)?.scrollIntoView({ block: 'end' });

    return () => observer.disconnect();
    // startProgress is only used when the document first opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdf, sizes, scrollRoot]);

  if (!pdf) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto max-w-4xl space-y-4 px-3 py-5 sm:px-6 sm:py-8">
      {sizes.map((size, i) => (
        <PdfPage key={i} pdf={pdf} pageNumber={i + 1} size={size} scrollRoot={scrollRoot} />
      ))}
    </div>
  );
}

interface PdfPageProps {
  pdf: PDFDocumentProxy;
  pageNumber: number;
  size: PageSize;
  scrollRoot: RefObject<HTMLDivElement | null>;
}

/** One page; it is only drawn when it comes near the screen, to keep long PDFs fast. */
function PdfPage({ pdf, pageNumber, size, scrollRoot }: PdfPageProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [near, setNear] = useState(false);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          observer.disconnect();
        }
      },
      { root: scrollRoot.current, rootMargin: '1000px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [scrollRoot]);

  useEffect(() => {
    if (!near) return;
    let task: RenderTask | null = null;
    let cancelled = false;
    pdf
      .getPage(pageNumber)
      .then(page => {
        const holder = holderRef.current;
        const canvas = canvasRef.current;
        if (cancelled || !holder || !canvas) return;
        const scale = (holder.clientWidth / size.w) * Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        task = page.render({ canvas, viewport });
        return task.promise.then(() => !cancelled && setDrawn(true));
      })
      .catch(() => {
        /* cancelled or unreadable page: leave the placeholder */
      });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [near, pdf, pageNumber, size.w]);

  return (
    <div
      ref={holderRef}
      data-page={pageNumber}
      className="relative w-full overflow-hidden rounded-md bg-white shadow-md ring-1 ring-slate-200 dark:ring-slate-800"
      style={{ aspectRatio: `${size.w} / ${size.h}` }}
    >
      <canvas ref={canvasRef} className="block h-full w-full" aria-label={`Page ${pageNumber}`} />
      {!drawn && (
        <div className="absolute inset-0 flex items-center justify-center text-slate-300">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
      <span className="absolute right-2 bottom-2 rounded bg-slate-900/60 px-1.5 py-0.5 text-[11px] font-semibold text-white">
        {pageNumber}
      </span>
    </div>
  );
}
