import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  FileArchive,
  EyeOff,
  Grid,
  Upload,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  Check,
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SwipeableTabContainer } from '../../components/SwipeableTabContainer';

export const ImageToolsScreen: React.FC = () => {
  const { showToast, requestConfirmation } = useApp();
  const [activeSubTab, setActiveSubTab] = useState<'convert' | 'compress' | 'blur' | 'collage'>('convert');

  // --- 1. FORMAT CONVERTER STATE ---
  const [convertImage, setConvertImage] = useState<string | null>(null);
  const [convertFileName, setConvertFileName] = useState('image');
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [convertQuality, setConvertQuality] = useState(0.85);
  const convertInputRef = useRef<HTMLInputElement>(null);

  // --- 2. COMPRESSOR STATE ---
  const [compressImage, setCompressImage] = useState<string | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [compressedFileSize, setCompressedFileSize] = useState<number>(0);
  const [compressedDataUrl, setCompressedDataUrl] = useState<string | null>(null);
  const [qualityLevel, setQualityLevel] = useState(0.6);
  const [scalePercent, setScalePercent] = useState(80);
  const compressInputRef = useRef<HTMLInputElement>(null);

  // --- 3. BLUR TOOL STATE ---
  const [blurImage, setBlurImage] = useState<string | null>(null);
  const [blurRadius, setBlurRadius] = useState(8);
  const blurInputRef = useRef<HTMLInputElement>(null);
  const blurCanvasRef = useRef<HTMLCanvasElement>(null);

  // --- 4. COLLAGE STATE ---
  const [collageImages, setCollageImages] = useState<string[]>([]);
  const [collageLayout, setCollageLayout] = useState<
    'auto' | '2x2' | '3x2' | '3x3' | '4x4' | '5x5' | '6x6' | '8x8' | '10x10' | '2x1' | '1x2' | '3x1'
  >('auto');
  const [collageGap, setCollageGap] = useState(8);
  const [collageBg, setCollageBg] = useState('#000000');
  const [collageDataUrl, setCollageDataUrl] = useState<string | null>(null);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const collageInputRef = useRef<HTMLInputElement>(null);
  const collageCanvasRef = useRef<HTMLCanvasElement>(null);

  // Helper format file size
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 KB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  // 1. Format converter upload
  const handleConvertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setConvertFileName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setConvertImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDownloadConverted = () => {
    if (!convertImage) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const ext = targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp';
      const dataUrl = canvas.toDataURL(targetFormat, convertQuality);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${convertFileName}-converted.${ext}`;
      a.click();
      showToast(`Downloaded as ${ext.toUpperCase()}`);
    };
    img.src = convertImage;
  };

  // 2. Compressor handler
  const handleCompressUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOriginalFileSize(file.size);
    const reader = new FileReader();
    reader.onload = () => {
      setCompressImage(reader.result as string);
      processCompression(reader.result as string, qualityLevel, scalePercent);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const processCompression = (src: string, quality: number, scale: number) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const factor = scale / 100;
      canvas.width = Math.round(img.width * factor);
      canvas.height = Math.round(img.height * factor);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      setCompressedDataUrl(dataUrl);

      // Estimate compressed bytes from dataUrl
      const head = 'data:image/jpeg;base64,';
      const b64 = dataUrl.substring(head.length);
      const bytes = Math.round((b64.length * 3) / 4);
      setCompressedFileSize(bytes);
    };
    img.src = src;
  };

  useEffect(() => {
    if (compressImage) {
      processCompression(compressImage, qualityLevel, scalePercent);
    }
  }, [qualityLevel, scalePercent]);

  const handleDownloadCompressed = () => {
    if (!compressedDataUrl) return;
    const a = document.createElement('a');
    a.href = compressedDataUrl;
    a.download = `axon-compressed.jpg`;
    a.click();
    showToast('Compressed image downloaded');
  };

  // 3. Blur Tool handlers
  const handleBlurUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBlurImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!blurImage || !blurCanvasRef.current) return;
    const canvas = blurCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = Math.min(600, img.width);
      canvas.height = Math.round(img.height * (canvas.width / img.width));
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `blur(${blurRadius}px)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    };
    img.src = blurImage;
  }, [blurImage, blurRadius]);

  const handleDownloadBlurred = () => {
    if (!blurCanvasRef.current) return;
    const dataUrl = blurCanvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `axon-blurred.png`;
    a.click();
    showToast('Blurred image downloaded');
  };

  // 4. Collage handler
  const handleCollageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    let loadedCount = 0;
    const loadedUrls: string[] = [];

    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadedUrls.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === fileList.length) {
          setCollageImages((prev) => {
            const combined = [...prev, ...loadedUrls].slice(0, 100);
            return combined;
          });
          showToast(`Added ${fileList.length} image${fileList.length > 1 ? 's' : ''} to collage (up to 100)`);
        }
      };
      reader.onerror = () => {
        loadedCount++;
        if (loadedCount === fileList.length && loadedUrls.length > 0) {
          setCollageImages((prev) => [...prev, ...loadedUrls].slice(0, 100));
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const removeCollageImage = (indexToRemove: number) => {
    setCollageImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const renderCollageOnCanvas = () => {
    if (!collageCanvasRef.current || collageImages.length === 0) return;
    const canvas = collageCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-resolution canvas for crisp export and zoom (2400x2400)
    const width = 2400;
    const height = 2400;
    canvas.width = width;
    canvas.height = height;

    // Calculate slots
    let cols = 2;
    let rows = 2;
    const count = collageImages.length;

    if (collageLayout === 'auto') {
      if (count <= 1) {
        cols = 1; rows = 1;
      } else if (count === 2) {
        cols = 2; rows = 1;
      } else if (count === 3) {
        cols = 3; rows = 1;
      } else if (count <= 4) {
        cols = 2; rows = 2;
      } else if (count <= 6) {
        cols = 3; rows = 2;
      } else if (count <= 9) {
        cols = 3; rows = 3;
      } else if (count <= 12) {
        cols = 4; rows = 3;
      } else if (count <= 16) {
        cols = 4; rows = 4;
      } else if (count <= 25) {
        cols = 5; rows = 5;
      } else if (count <= 36) {
        cols = 6; rows = 6;
      } else if (count <= 49) {
        cols = 7; rows = 7;
      } else if (count <= 64) {
        cols = 8; rows = 8;
      } else if (count <= 81) {
        cols = 9; rows = 9;
      } else {
        cols = 10; rows = 10;
      }
    } else if (collageLayout === '2x1') {
      cols = 2; rows = 1;
    } else if (collageLayout === '1x2') {
      cols = 1; rows = 2;
    } else if (collageLayout === '3x1') {
      cols = 3; rows = 1;
    } else if (collageLayout === '2x2') {
      cols = 2; rows = 2;
    } else if (collageLayout === '3x2') {
      cols = 3; rows = 2;
    } else if (collageLayout === '3x3') {
      cols = 3; rows = 3;
    } else if (collageLayout === '4x4') {
      cols = 4; rows = 4;
    } else if (collageLayout === '5x5') {
      cols = 5; rows = 5;
    } else if (collageLayout === '6x6') {
      cols = 6; rows = 6;
    } else if (collageLayout === '8x8') {
      cols = 8; rows = 8;
    } else if (collageLayout === '10x10') {
      cols = 10; rows = 10;
    }

    const scaledGap = collageGap * 2;
    const cellW = (width - scaledGap * (cols + 1)) / cols;
    const cellH = (height - scaledGap * (rows + 1)) / rows;

    const totalSlots = cols * rows;
    const imagesToDraw = collageImages.slice(0, totalSlots);

    // Preload all images asynchronously to ensure crisp, complete rendering
    const loadPromises = imagesToDraw.map((src, idx) => {
      return new Promise<{ img: HTMLImageElement; idx: number }>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve({ img, idx });
        img.onerror = () => resolve({ img, idx });
        img.src = src;
      });
    });

    Promise.all(loadPromises).then((loaded) => {
      if (!collageCanvasRef.current) return;
      const c = collageCanvasRef.current;
      const cCtx = c.getContext('2d');
      if (!cCtx) return;

      cCtx.imageSmoothingEnabled = true;
      cCtx.imageSmoothingQuality = 'high';

      cCtx.fillStyle = collageBg;
      cCtx.fillRect(0, 0, width, height);

      loaded.forEach(({ img, idx }) => {
        if (!img.naturalWidth || !img.naturalHeight) return;
        const r = Math.floor(idx / cols);
        const col = idx % cols;
        const x = scaledGap + col * (cellW + scaledGap);
        const y = scaledGap + r * (cellH + scaledGap);

        cCtx.save();
        cCtx.beginPath();
        cCtx.rect(x, y, cellW, cellH);
        cCtx.clip();

        // High quality aspect-fill
        const scale = Math.max(cellW / img.naturalWidth, cellH / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        const ox = x + (cellW - w) / 2;
        const oy = y + (cellH - h) / 2;

        cCtx.drawImage(img, ox, oy, w, h);
        cCtx.restore();
      });

      // Cache data URL once for glitch-free zoom and download
      try {
        const url = c.toDataURL('image/png', 1.0);
        setCollageDataUrl(url);
      } catch (err) {
        console.warn('Canvas export warning', err);
      }
    });
  };

  useEffect(() => {
    renderCollageOnCanvas();
  }, [collageImages, collageLayout, collageGap, collageBg]);

  const handleDownloadCollage = () => {
    const url = collageDataUrl || collageCanvasRef.current?.toDataURL('image/png');
    if (!url || collageImages.length === 0) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `axon-collage.png`;
    a.click();
    showToast('Collage grid downloaded');
  };

  return (
    <div
      id="image-tools-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
          {[
            { id: 'convert', label: 'Convert', icon: ImageIcon },
            { id: 'compress', label: 'Compress', icon: FileArchive },
            { id: 'blur', label: 'Blur', icon: EyeOff },
            { id: 'collage', label: 'Collage', icon: Grid },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                  isActive
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 mb-0.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Swipeable Tabs Container for Convert / Compress / Blur / Collage */}
        <SwipeableTabContainer<'convert' | 'compress' | 'blur' | 'collage'>
          tabs={['convert', 'compress', 'blur', 'collage']}
          activeTab={activeSubTab}
          onTabChange={setActiveSubTab}
        >
          <div>
            {/* --- SUBTAB 1: FORMAT CONVERTER --- */}
            {activeSubTab === 'convert' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Image Format Converter</h3>
              <p className="text-xs text-neutral-400">
                Transform between PNG, JPEG, and modern WEBP offline
              </p>
            </div>

            <input
              ref={convertInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleConvertUpload}
            />

            {!convertImage ? (
              <button
                type="button"
                onClick={() => convertInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950/60 active:scale-[0.99] transition-all"
              >
                <Upload className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-white">Select Image to Convert</span>
                <span className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG, WEBP, GIF, SVG</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                  <img src={convertImage} alt="Preview" className="max-h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setConvertImage(null);
                      if (convertInputRef.current) convertInputRef.current.value = '';
                      showToast('Image removed');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Target Format Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs text-neutral-400 font-medium">Export Format</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'image/jpeg', label: 'JPG' },
                      { id: 'image/png', label: 'PNG' },
                      { id: 'image/webp', label: 'WEBP' },
                    ].map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setTargetFormat(f.id as any)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                          targetFormat === f.id
                            ? 'bg-neutral-800 border-white text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality Slider if JPEG or WEBP */}
                {targetFormat !== 'image/png' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Quality</span>
                      <span>{Math.round(convertQuality * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="1.0"
                      step="0.05"
                      value={convertQuality}
                      onChange={(e) => setConvertQuality(parseFloat(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleDownloadConverted}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Converted File</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- SUBTAB 2: COMPRESSOR --- */}
        {activeSubTab === 'compress' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Image Compressor</h3>
              <p className="text-xs text-neutral-400">
                Optimize file size for lower memory usage and storage saving
              </p>
            </div>

            <input
              ref={compressInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCompressUpload}
            />

            {!compressImage ? (
              <button
                type="button"
                onClick={() => compressInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950/60 active:scale-[0.99] transition-all"
              >
                <FileArchive className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-white">Choose Image to Compress</span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Calculates byte savings instantly</span>
              </button>
            ) : (
              <div className="space-y-3">
                {/* Size stats comparison */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setCompressImage(null);
                      setCompressedDataUrl(null);
                      if (compressInputRef.current) compressInputRef.current.value = '';
                    }}
                    title="Remove selected image"
                    className="absolute -top-2 -right-2 p-1.5 rounded-full bg-neutral-800 hover:bg-red-600 text-white z-10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
                    <div>
                      <p className="text-[10px] uppercase text-neutral-500">Original</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5">
                        {formatBytes(originalFileSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-neutral-500">Compressed</p>
                      <p className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                        {formatBytes(compressedFileSize)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-neutral-500">Saved</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5">
                        {originalFileSize > 0 && compressedFileSize > 0
                          ? `${Math.max(
                              0,
                              Math.round(
                                ((originalFileSize - compressedFileSize) / originalFileSize) * 100
                              )
                            )}%`
                          : '0%'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quality & Scale sliders */}
                <div className="space-y-2 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Compression Quality</span>
                      <span className="font-mono">{Math.round(qualityLevel * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={qualityLevel}
                      onChange={(e) => setQualityLevel(parseFloat(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>Dimension Scale</span>
                      <span className="font-mono">{scalePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="100"
                      step="10"
                      value={scalePercent}
                      onChange={(e) => setScalePercent(parseInt(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadCompressed}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Compressed Image</span>
                </button>

                {/* MANDATORY SPECIFIED PLACEHOLDER: "leave a visible placeholder note/button for 'revert to original,' non-functional for now, that a future part will wire up" */}
                <div
                  id="compressor-revert-placeholder"
                  className="p-3 rounded-xl border border-dashed border-neutral-700 bg-neutral-950/60 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-neutral-300">Revert to Original</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                        Coming in Later Part
                      </span>
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Reserved for full archive mode vs. space-saver mode revert logic.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="px-2.5 py-1 rounded-lg bg-neutral-800/40 text-neutral-500 text-xs font-medium cursor-not-allowed border border-neutral-700/50"
                  >
                    Revert
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SUBTAB 3: BLUR TOOL --- */}
        {activeSubTab === 'blur' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Image Blur Tool</h3>
              <p className="text-xs text-neutral-400">
                Apply gaussian-style blur effects for backgrounds or privacy
              </p>
            </div>

            <input
              ref={blurInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBlurUpload}
            />

            {!blurImage ? (
              <button
                type="button"
                onClick={() => blurInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950/60 active:scale-[0.99] transition-all"
              >
                <EyeOff className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-white">Select Image to Blur</span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Adjustable blur radius slider</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center p-2">
                  <canvas ref={blurCanvasRef} className="max-w-full max-h-56 rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setBlurImage(null);
                      if (blurInputRef.current) blurInputRef.current.value = '';
                      showToast('Image removed');
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white"
                    title="Remove image"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Blur Radius</span>
                    <span className="font-mono">{blurRadius}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="35"
                    value={blurRadius}
                    onChange={(e) => setBlurRadius(parseInt(e.target.value))}
                    className="w-full accent-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDownloadBlurred}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Blurred Image</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- SUBTAB 4: COLLAGE GRID --- */}
        {activeSubTab === 'collage' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Collage Grid Maker</h3>
              <p className="text-xs text-neutral-400">
                Combine up to 100 images into ultra-high-resolution custom collage grids
              </p>
            </div>

            <input
              ref={collageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleCollageUpload}
            />

            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                Images loaded: {collageImages.length} / 100
              </span>
              <button
                type="button"
                onClick={() => collageInputRef.current?.click()}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Add Photos</span>
              </button>
            </div>

            {/* Thumbnail Manager Tray with individual delete */}
            {collageImages.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span>Curate Photos ({collageImages.length})</span>
                  <button
                    type="button"
                    onClick={() => setCollageImages([])}
                    className="text-neutral-500 hover:text-red-400 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                  {collageImages.map((imgSrc, idx) => (
                    <div
                      key={idx}
                      className="relative w-14 h-14 rounded-lg bg-neutral-950 border border-neutral-800 shrink-0 overflow-hidden group"
                    >
                      <img
                        src={imgSrc}
                        alt={`Thumb ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeCollageImage(idx)}
                        title="Remove this photo"
                        className="absolute top-0.5 right-0.5 p-1 rounded-full bg-black/80 hover:bg-red-600 text-white transition-colors"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collageImages.length > 0 ? (
              <div className="space-y-3">
                {/* Collage Preview Canvas & Zoom trigger */}
                <div className="relative rounded-xl bg-neutral-950 border border-neutral-800 p-2 flex items-center justify-center">
                  <canvas
                    ref={collageCanvasRef}
                    className="max-w-full max-h-64 rounded-lg object-contain shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsZoomModalOpen(true);
                    }}
                    title="Inspect High-Quality Zoom"
                    className="absolute top-3 right-3 px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-white text-xs font-medium flex items-center gap-1.5 border border-neutral-700 shadow-lg backdrop-blur-sm active:scale-95 transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Zoom & Pan</span>
                  </button>
                </div>

                {/* Layout Switcher */}
                <div className="space-y-1">
                  <label className="text-[11px] uppercase text-neutral-400 font-semibold">
                    Grid Layout
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'auto', label: 'Auto' },
                      { id: '2x2', label: '2 × 2' },
                      { id: '3x2', label: '3 × 2' },
                      { id: '3x3', label: '3 × 3' },
                      { id: '4x4', label: '4 × 4' },
                      { id: '5x5', label: '5 × 5' },
                      { id: '6x6', label: '6 × 6' },
                      { id: '8x8', label: '8 × 8' },
                      { id: '10x10', label: '10 × 10' },
                    ].map((l) => (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => setCollageLayout(l.id as any)}
                        className={`py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          collageLayout === l.id
                            ? 'bg-neutral-800 border-white text-white font-semibold'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gap & Background Controls */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-neutral-400">
                      <span>Grid Gap</span>
                      <span>{collageGap}px</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="24"
                      value={collageGap}
                      onChange={(e) => setCollageGap(parseInt(e.target.value))}
                      className="w-full accent-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-neutral-400 block">Canvas Border</label>
                    <div className="flex gap-2">
                      {[
                        { color: '#000000', label: 'Black' },
                        { color: '#262626', label: 'Gray' },
                        { color: '#ffffff', label: 'White' },
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() => setCollageBg(c.color)}
                          className={`flex-1 py-1 rounded-lg text-[10px] font-medium border ${
                            collageBg === c.color ? 'border-white text-white' : 'border-neutral-800 text-neutral-400'
                          }`}
                          style={{ backgroundColor: c.color === '#ffffff' ? '#ffffff' : '#171717', color: c.color === '#ffffff' ? '#000' : '#fff' }}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCollageImages([])}
                    className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-white border border-neutral-800"
                  >
                    Clear Images
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCollage}
                    className="flex-2 py-2 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Collage</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => collageInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950/60 active:scale-[0.99] transition-all"
              >
                <Grid className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-white">Add Up to 100 Photos</span>
                <span className="text-[10px] text-neutral-500 mt-0.5">Generates clean grid layout automatically</span>
              </button>
            )}
          </div>
        )}
          </div>
        </SwipeableTabContainer>
      </div>

      {/* Interactive High-Quality Zoom Modal */}
      {isZoomModalOpen && (
        <CollageZoomInspector
          imageUrl={collageDataUrl || collageCanvasRef.current?.toDataURL('image/png') || null}
          onClose={() => setIsZoomModalOpen(false)}
          onDownload={handleDownloadCollage}
        />
      )}
    </div>
  );
};

interface CollageZoomInspectorProps {
  imageUrl: string | null;
  onClose: () => void;
  onDownload: () => void;
}

const CollageZoomInspector: React.FC<CollageZoomInspectorProps> = ({
  imageUrl,
  onClose,
  onDownload,
}) => {
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const startPointerRef = useRef({ x: 0, y: 0 });
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);

  // Multi-touch gestures: Pinch-to-zoom & Pan with bounds protection
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartDistRef.current = dist;
      pinchStartScaleRef.current = scale;
      isDraggingRef.current = false;
    } else if (e.touches.length === 1) {
      const now = Date.now();
      // Double tap toggle between 1x and 2.5x
      if (now - lastTapRef.current < 300) {
        if (scale > 1.2) {
          setScale(1);
          setPan({ x: 0, y: 0 });
        } else {
          setScale(2.5);
        }
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      isDraggingRef.current = true;
      startPointerRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startPanRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      if (e.cancelable) e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / pinchStartDistRef.current;
      const newScale = Math.min(8, Math.max(0.75, +(pinchStartScaleRef.current * ratio).toFixed(2)));
      setScale(newScale);
    } else if (e.touches.length === 1 && isDraggingRef.current) {
      const dx = e.touches[0].clientX - startPointerRef.current.x;
      const dy = e.touches[0].clientY - startPointerRef.current.y;
      setPan({
        x: startPanRef.current.x + dx,
        y: startPanRef.current.y + dy,
      });
    }
  };

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null;
    isDraggingRef.current = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY * -0.002;
    setScale((prev) => Math.min(8, Math.max(0.75, +(prev + delta).toFixed(2))));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    startPanRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - startPointerRef.current.x;
    const dy = e.clientY - startPointerRef.current.y;
    setPan({
      x: startPanRef.current.x + dx,
      y: startPanRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      id="collage-zoom-modal"
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-3 sm:p-4 select-none touch-none"
    >
      {/* Header controls */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">Collage Inspector</span>
          <span className="text-xs text-neutral-400 font-mono">
            {Math.round(scale * 100)}% • 2400×2400
          </span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.75, +(s - 0.35).toFixed(2)))}
            title="Zoom Out"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95 transition-all"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setScale(1);
              setPan({ x: 0, y: 0 });
            }}
            title="Reset to 100%"
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 hover:text-white font-mono active:scale-95 transition-all"
          >
            100%
          </button>
          <button
            type="button"
            onClick={() => setScale((s) => Math.min(8, +(s + 0.35).toFixed(2)))}
            title="Zoom In"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95 transition-all"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onDownload}
            title="Download Full Resolution"
            className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-neutral-900 hover:bg-red-900/50 border border-neutral-800 text-neutral-300 hover:text-white active:scale-95 transition-all ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Touch / mouse viewport */}
      <div
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="flex-1 w-full h-full overflow-hidden relative flex items-center justify-center cursor-grab active:cursor-grabbing"
      >
        {imageUrl ? (
          <div
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transition: isDraggingRef.current || pinchStartDistRef.current !== null ? 'none' : 'transform 0.1s ease-out',
              willChange: 'transform',
            }}
            className="origin-center select-none pointer-events-none"
          >
            <img
              src={imageUrl}
              alt="High-Res Collage Inspection"
              draggable={false}
              className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl border border-neutral-800 pointer-events-none"
            />
          </div>
        ) : (
          <div className="text-neutral-500 text-xs">Rendering high-res collage...</div>
        )}

        <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
          <div className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-neutral-800 text-[11px] text-neutral-400 shadow-lg">
            Pinch to zoom • Drag to pan • Double-tap to reset
          </div>
        </div>
      </div>
    </div>
  );
};
