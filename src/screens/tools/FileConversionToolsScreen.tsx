import React, { useState, useRef } from 'react';
import {
  FileText,
  FileCode,
  Upload,
  Download,
  Copy,
  Check,
  RotateCcw,
  ArrowRightLeft,
  Sparkles,
  Trash2,
  FileUp,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useApp } from '../../context/AppContext';
import { SwipeableTabContainer } from '../../components/SwipeableTabContainer';

export const FileConversionToolsScreen: React.FC = () => {
  const { showToast, requestConfirmation } = useApp();
  const [activeTab, setActiveTab] = useState<'png2pdf' | 'pdf2txt' | 'csvjson' | 'txt2pdf'>('png2pdf');

  // --- 1. PNG TO PDF STATE ---
  const [imgForPdf, setImgForPdf] = useState<string | null>(null);
  const [imgFileName, setImgFileName] = useState('image');
  const [pdfOrientation, setPdfOrientation] = useState<'p' | 'l'>('p');
  const [pdfMargin, setPdfMargin] = useState<number>(20);
  const pngInputRef = useRef<HTMLInputElement>(null);

  // --- 2. PDF TO TEXT STATE ---
  const [extractedText, setExtractedText] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // --- 3. CSV <-> JSON STATE ---
  const [csvJsonMode, setCsvJsonMode] = useState<'csv2json' | 'json2csv'>('csv2json');
  const [inputCode, setInputCode] = useState<string>(
    'id,title,status,priority\n1,Setup AXON,completed,high\n2,Tools Menu,completed,urgent\n3,Future Automations,pending,medium'
  );
  const [convertedCode, setConvertedCode] = useState<string>('');
  const [conversionError, setConversionError] = useState<string | null>(null);

  // --- 4. TXT TO PDF STATE ---
  const [txtContent, setTxtContent] = useState<string>(
    'AXON Workspace Document\n\nGenerated with AXON offline file utilities.\nDesigned for low memory footprint on mobile devices.\n\nKey Attributes:\n• Full client-side offline execution\n• Zero cloud dependency\n• Safe export and restore'
  );
  const [pdfTitle, setPdfTitle] = useState('Document');

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. PNG to PDF Handler
  const handlePngUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFileName(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setImgForPdf(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleGeneratePdfFromImage = () => {
    if (!imgForPdf) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Create jsPDF instance
      const doc = new jsPDF({
        orientation: pdfOrientation,
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const availW = pageWidth - pdfMargin * 2;
      const availH = pageHeight - pdfMargin * 2;

      // Scale to fit page
      const scale = Math.min(availW / img.width, availH / img.height, 1);
      const renderW = img.width * scale;
      const renderH = img.height * scale;

      const posX = pdfMargin + (availW - renderW) / 2;
      const posY = pdfMargin + (availH - renderH) / 2;

      doc.addImage(imgForPdf, 'PNG', posX, posY, renderW, renderH);
      doc.save(`${imgFileName}.pdf`);
      showToast('PDF generated and downloaded');
    };
    img.src = imgForPdf;
  };

  // 2. PDF to Text (Client-side offline extraction)
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    setIsExtracting(true);

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      // Fast offline string decoder
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const rawText = decoder.decode(bytes);

      // Extract text within Tj / TJ operators or bracket strings in PDF streams
      const textMatches: string[] = [];

      // Regex matching (string) Tj or [(string) ...] TJ
      const tjRegex = /\(([^)]+)\)\s*Tj/g;
      let match;
      while ((match = tjRegex.exec(rawText)) !== null) {
        if (match[1] && match[1].trim()) {
          // Unescape octal / escapes
          const cleaned = match[1]
            .replace(/\\n/g, '\n')
            .replace(/\\r/g, '\r')
            .replace(/\\t/g, '\t')
            .replace(/\\([0-7]{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
          textMatches.push(cleaned);
        }
      }

      // If no Tj blocks found, scan for /BT ... /ET text blocks or raw readable chunks
      if (textMatches.length === 0) {
        const btRegex = /BT([\s\S]*?)ET/g;
        let btMatch;
        while ((btMatch = btRegex.exec(rawText)) !== null) {
          const inner = btMatch[1];
          const innerTj = /\(([^)]+)\)/g;
          let im;
          while ((im = innerTj.exec(inner)) !== null) {
            textMatches.push(im[1]);
          }
        }
      }

      let extracted = textMatches.join(' ').replace(/\s+/g, ' ').trim();

      if (!extracted) {
        // Fallback: extract continuous ASCII blocks from streams
        const cleanAscii = rawText
          .replace(/[^\x20-\x7E\n\r\t]/g, ' ')
          .replace(/obj[\s\S]*?endobj/g, '')
          .replace(/xref[\s\S]*?%%EOF/g, '')
          .replace(/stream[\s\S]*?endstream/g, '')
          .split('\n')
          .filter((line) => line.trim().length > 3 && !line.startsWith('/'))
          .join('\n')
          .trim();
        extracted = cleanAscii || 'No selectable plain text streams found in this PDF.';
      }

      setExtractedText(extracted);
      showToast('Text extracted from PDF');
    } catch (err) {
      setExtractedText('Failed to parse PDF format.');
      showToast('Error reading PDF');
    } finally {
      setIsExtracting(false);
      e.target.value = '';
    }
  };

  const handleDownloadExtractedTxt = () => {
    if (!extractedText) return;
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${pdfFileName ? pdfFileName.replace(/\.[^/.]+$/, '') : 'extracted'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded text file');
  };

  const handleClearExtracted = () => {
    if (!extractedText) return;
    requestConfirmation({
      title: 'Clear Extracted Text',
      message: 'Are you sure you want to delete this text?',
      confirmLabel: 'Clear',
      danger: true,
      onConfirm: () => {
        setExtractedText('');
        showToast('Extracted text cleared');
      },
    });
  };

  // 3. CSV <-> JSON Converter
  const convertCsvToJson = (csv: string) => {
    try {
      const lines = csv.trim().split(/\r\n|\r|\n/).filter(Boolean);
      if (lines.length < 2) {
        setConversionError('Please provide at least a header line and one data row.');
        setConvertedCode('');
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
      const rows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          const val = values[i] ?? '';
          // Type coercion for numbers / booleans
          if (val === 'true') obj[h] = true;
          else if (val === 'false') obj[h] = false;
          else if (!isNaN(Number(val)) && val !== '') obj[h] = Number(val);
          else obj[h] = val;
        });
        return obj;
      });

      setConversionError(null);
      setConvertedCode(JSON.stringify(rows, null, 2));
      showToast('Converted CSV to JSON');
    } catch (err) {
      setConversionError('Failed to parse CSV.');
      setConvertedCode('');
    }
  };

  const convertJsonToCsv = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      if (arr.length === 0) {
        setConversionError('JSON array is empty.');
        return;
      }
      const keys = Array.from(new Set(arr.flatMap((item) => Object.keys(item))));
      const headerRow = keys.join(',');
      const dataRows = arr.map((item) =>
        keys
          .map((k) => {
            const val = item[k] ?? '';
            return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val);
          })
          .join(',')
      );

      setConversionError(null);
      setConvertedCode([headerRow, ...dataRows].join('\n'));
      showToast('Converted JSON to CSV');
    } catch (err) {
      setConversionError('Invalid JSON format.');
      setConvertedCode('');
    }
  };

  // 4. TXT to PDF Handler
  const handleGenerateTxtPdf = () => {
    if (!txtContent) return;
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    const maxWidth = pageWidth - margin * 2;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text(pdfTitle || 'AXON Document', margin, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated on ${new Date().toLocaleDateString()} • AXON Mobile Workspace`, margin, 68);

    // Divider rule
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 78, pageWidth - margin, 78);

    // Body
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);

    const splitText = doc.splitTextToSize(txtContent, maxWidth);
    doc.text(splitText, margin, 100);

    doc.save(`${pdfTitle.toLowerCase().replace(/\s+/g, '-') || 'document'}.pdf`);
    showToast('PDF exported successfully');
  };

  return (
    <div
      id="file-conversion-tools-screen"
      className="flex-1 min-h-0 overflow-y-auto bg-black text-white p-4 select-none"
    >
      <div className="max-w-md mx-auto space-y-4">
        {/* Navigation Sub-Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-neutral-900/90 p-1 rounded-2xl border border-neutral-800">
          {[
            { id: 'png2pdf', label: 'PNG to PDF' },
            { id: 'pdf2txt', label: 'PDF to Text' },
            { id: 'csvjson', label: 'CSV ⇄ JSON' },
            { id: 'txt2pdf', label: 'TXT to PDF' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-1.5 rounded-xl text-[11px] font-medium transition-all text-center ${
                  isActive
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Swipeable Tabs Container */}
        <SwipeableTabContainer<'png2pdf' | 'pdf2txt' | 'csvjson' | 'txt2pdf'>
          tabs={['png2pdf', 'pdf2txt', 'csvjson', 'txt2pdf']}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        >
          <div>
            {/* --- 1. PNG TO PDF --- */}
            {activeTab === 'png2pdf' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">PNG to PDF Converter</h3>
              <p className="text-xs text-neutral-400">
                Package images into a print-ready standard PDF document
              </p>
            </div>

            <input
              ref={pngInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePngUpload}
            />

            {!imgForPdf ? (
              <button
                type="button"
                onClick={() => pngInputRef.current?.click()}
                className="w-full py-8 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950/60 active:scale-[0.99] transition-all"
              >
                <FileUp className="w-6 h-6 text-neutral-400 mb-2" />
                <span className="text-xs font-semibold text-white">Select Image for PDF</span>
                <span className="text-[10px] text-neutral-500 mt-0.5">PNG, JPG, or WEBP supported</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden flex items-center justify-center">
                  <img src={imgForPdf} alt="Preview" className="max-h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setImgForPdf(null);
                      if (pngInputRef.current) pngInputRef.current.value = '';
                      showToast('Image removed');
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-black/80 hover:bg-red-950/80 border border-neutral-700 hover:border-red-600 text-white text-xs flex items-center gap-1.5 transition-colors"
                    title="Remove selected image"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Remove</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-neutral-400 font-semibold">
                      Orientation
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setPdfOrientation('p')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-medium border ${
                          pdfOrientation === 'p'
                            ? 'bg-neutral-800 border-white text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        Portrait
                      </button>
                      <button
                        type="button"
                        onClick={() => setPdfOrientation('l')}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-medium border ${
                          pdfOrientation === 'l'
                            ? 'bg-neutral-800 border-white text-white'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                        }`}
                      >
                        Landscape
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] uppercase text-neutral-400 font-semibold">
                      Margins
                    </label>
                    <div className="flex gap-1">
                      {[
                        { val: 0, label: 'Zero' },
                        { val: 20, label: 'Normal' },
                        { val: 40, label: 'Wide' },
                      ].map((m) => (
                        <button
                          key={m.val}
                          type="button"
                          onClick={() => setPdfMargin(m.val)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium border ${
                            pdfMargin === m.val
                              ? 'bg-neutral-800 border-white text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePdfFromImage}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 2. PDF TO TEXT --- */}
        {activeTab === 'pdf2txt' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">PDF to Text Extractor</h3>
              <p className="text-xs text-neutral-400">
                Extract readable text streams from PDF files locally
              </p>
            </div>

            <input
              ref={pdfInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handlePdfUpload}
            />

            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="w-full py-6 border-2 border-dashed border-neutral-700 hover:border-neutral-500 rounded-2xl flex flex-col items-center justify-center bg-neutral-950/60 active:scale-[0.99] transition-all"
            >
              <FileText className="w-6 h-6 text-neutral-400 mb-2" />
              <span className="text-xs font-semibold text-white">Select PDF to Extract</span>
              <span className="text-[10px] text-neutral-500 mt-0.5">Offline parsing • zero upload</span>
            </button>

            {isExtracting && (
              <div className="text-center py-4 text-xs text-neutral-400">
                Processing PDF stream...
              </div>
            )}

            {extractedText && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-xs text-neutral-400 pb-1 border-b border-neutral-800">
                  <span>Extracted Text ({extractedText.length} characters)</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(extractedText, 'extracted-pdf')}
                      className="hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'extracted-pdf' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>Copy</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleClearExtracted}
                      className="hover:text-red-400 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <textarea
                  readOnly
                  value={extractedText}
                  rows={6}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none resize-none font-mono leading-relaxed select-text"
                />

                <button
                  type="button"
                  onClick={handleDownloadExtractedTxt}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Extracted Text (.txt)</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- 3. CSV <-> JSON --- */}
        {activeTab === 'csvjson' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">CSV ⇄ JSON Converter</h3>
              <p className="text-xs text-neutral-400">
                Bidirectional structured data formatting and transformation
              </p>
            </div>

            <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setCsvJsonMode('csv2json');
                  setInputCode('id,name,role\n101,Alex,Designer\n102,Jordan,Developer');
                  setConvertedCode('');
                  setConversionError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  csvJsonMode === 'csv2json' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                CSV → JSON
              </button>
              <button
                type="button"
                onClick={() => {
                  setCsvJsonMode('json2csv');
                  setInputCode('[\n  {"id": 101, "name": "Alex", "role": "Designer"},\n  {"id": 102, "name": "Jordan", "role": "Developer"}\n]');
                  setConvertedCode('');
                  setConversionError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  csvJsonMode === 'json2csv' ? 'bg-neutral-800 text-white' : 'text-neutral-400'
                }`}
              >
                JSON → CSV
              </button>
            </div>

            {/* Input textarea */}
            <div className="space-y-1">
              <label className="text-xs text-neutral-400 font-medium">
                {csvJsonMode === 'csv2json' ? 'Input CSV' : 'Input JSON'}
              </label>
              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                rows={4}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none select-text"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (csvJsonMode === 'csv2json') convertCsvToJson(inputCode);
                else convertJsonToCsv(inputCode);
              }}
              className="w-full py-2 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Convert Now</span>
            </button>

            {conversionError && (
              <p className="text-xs text-red-400 bg-red-950/40 p-2 rounded-xl border border-red-800/60">
                {conversionError}
              </p>
            )}

            {/* Output code */}
            {convertedCode && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Output Result</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(convertedCode, 'csvjson-output')}
                    className="hover:text-white flex items-center gap-1"
                  >
                    {copiedKey === 'csvjson-output' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>Copy</span>
                  </button>
                </div>
                <pre className="w-full max-h-48 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-200 select-text">
                  {convertedCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* --- 4. TXT TO PDF --- */}
        {activeTab === 'txt2pdf' && (
          <div className="rounded-2xl bg-neutral-900/90 border border-neutral-800 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Text to PDF Document</h3>
              <p className="text-xs text-neutral-400">
                Convert notes or text content into a formatted PDF file
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-400 font-medium">Document Title</label>
              <input
                type="text"
                value={pdfTitle}
                onChange={(e) => setPdfTitle(e.target.value)}
                placeholder="Document Title..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-neutral-400 font-medium">Text Body</label>
              <textarea
                value={txtContent}
                onChange={(e) => setTxtContent(e.target.value)}
                rows={6}
                placeholder="Type or paste document content..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-neutral-600 resize-none font-sans leading-relaxed select-text"
              />
            </div>

            <button
              type="button"
              onClick={handleGenerateTxtPdf}
              className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF File</span>
            </button>
          </div>
        )}
          </div>
        </SwipeableTabContainer>
      </div>
    </div>
  );
};
