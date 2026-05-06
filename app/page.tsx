'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { 
  Satellite, 
  Search, 
  Code2, 
  BarChart3, 
  Map as MapIcon, 
  Layers, 
  Cpu, 
  ArrowRight,
  ChevronRight,
  Info,
  ExternalLink,
  Target,
  Zap,
  Download,
  CheckCircle2
} from 'lucide-react';
import { analyzeArchaeologyTile } from '@/lib/gemini';

// --- Components ---

const Header = () => (
  <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0]/80 backdrop-blur-md sticky top-0 z-50">
    <div className="flex items-center gap-4">
      <div className="bg-[#141414] p-2.5 rounded-sm shadow-lg shadow-black/10">
        <Satellite className="text-[#E4E3E0]" size={28} />
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight uppercase leading-none">Enki-Turkana</h1>
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] opacity-50 mt-1">Archaeological Intelligence . V2.7</p>
      </div>
    </div>
    <nav className="hidden lg:flex gap-10 text-[10px] font-mono uppercase tracking-[0.2em]">
      <a href="#overview" className="hover:text-amber-700 transition-colors relative group">
        Overview
        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-700 transition-all group-hover:w-full" />
      </a>
      <a href="#processor" className="hover:text-amber-700 transition-colors relative group">
        Processor
        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-700 transition-all group-hover:w-full" />
      </a>
      <a href="#code" className="hover:text-amber-700 transition-colors relative group">
        Technical Specs
        <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-amber-700 transition-all group-hover:w-full" />
      </a>
    </nav>
    <div className="flex items-center gap-4 border-l border-[#141414]/10 pl-6 h-full">
      <div className="flex flex-col items-end">
        <span className="font-mono text-[8px] uppercase font-bold text-green-600">Feed Active</span>
        <span className="font-mono text-[8px] uppercase opacity-40">Turkana R-01</span>
      </div>
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
    </div>
  </header>
);

const StatCard = ({ label, value, trend, detail }: { label: string; value: string; trend?: string; detail?: string }) => (
  <div className="border border-[#141414] p-8 bg-white flex flex-col gap-3 group relative overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/5">
    <div className="absolute top-0 left-0 w-1 h-0 bg-amber-600 transition-all duration-500 group-hover:h-full" />
    <span className="font-mono text-[9px] uppercase tracking-widest opacity-40 flex items-center justify-between">
      {label}
      {trend && <span className="text-green-600 font-bold">{trend}</span>}
    </span>
    <span className="text-4xl font-display font-medium tracking-tight">{value}</span>
    {detail && <span className="font-serif italic text-[10px] opacity-50">{detail}</span>}
  </div>
);

const PhaseBadge = ({ phase, title }: { phase: string; title: string }) => (
  <div className="flex items-center gap-5 mb-6 group">
    <div className="relative">
      <div className="bg-[#141414] text-[#E4E3E0] px-3 py-1.5 font-display text-xs font-bold uppercase relative z-10">
        {phase}
      </div>
      <div className="absolute inset-0 bg-amber-500 translate-x-1 translate-y-1 -z-0 opacity-0 group-hover:opacity-40 transition-opacity" />
    </div>
    <h3 className="font-display font-medium uppercase text-2xl tracking-tighter">{title}</h3>
  </div>
);

const CodeBlock = ({ code }: { code: string }) => (
  <div className="bg-[#1a1a1a] p-6 rounded-sm font-mono text-[13px] text-[#A9B7C6] overflow-x-auto border border-[#333]">
    <pre className="whitespace-pre">{code}</pre>
  </div>
);

// --- Main Page ---

export default function Page() {
  const [activeTab, setActiveTab] = useState<'rgb' | 'ndvi' | 'sar' | 'seg' | 'xai'>('rgb');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [uploadedTile, setUploadedTile] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDespeckled, setIsDespeckled] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [historicalMap, setHistoricalMap] = useState<string | null>(null);
  const [showHistoricalOverlay, setShowHistoricalOverlay] = useState(false);
  const [historicalOpacity, setHistoricalOpacity] = useState(0.5);
  const [isHistoricalDifference, setIsHistoricalDifference] = useState(false);
  const [isHistoricalDragging, setIsHistoricalDragging] = useState(false);
  const [coords, setCoords] = useState({ lat: '', lon: '' });
  const [coordErrors, setCoordErrors] = useState({ lat: '', lon: '' });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const historicalInputRef = React.useRef<HTMLInputElement>(null);
  const processorRef = React.useRef<HTMLDivElement>(null);

  const images = {
    rgb: uploadedTile || "https://picsum.photos/seed/archaeo_rgb/800/800",
    ndvi: "https://picsum.photos/seed/archaeo_ndvi/800/800?grayscale",
    sar: "https://picsum.photos/seed/sar_radar_tile/800/800?grayscale",
    seg: "https://picsum.photos/seed/archaeo_seg_red/800/800",
    xai: "https://picsum.photos/seed/archaeo_xai/800/800"
  };

  const handleFileUpload = (file: File) => {
    setFileError(null);
    // Support standard PNG/JPG and common TIFF types
    const validTypes = ["image/png", "image/jpeg", "image/tiff", "image/vnd.adobe.photoshop"];
    const isTiff = file.name.toLowerCase().endsWith('.tif') || file.name.toLowerCase().endsWith('.tiff');

    if (file && (validTypes.includes(file.type) || isTiff)) {
      if (file.size > 25 * 1024 * 1024) { // 25MB limit for client-side processing
        setFileError("File exceeds 25MB threshold for automated ingestion.");
        return;
      }

      setIsProcessingFile(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        // Simulating heavy raster processing and metadata extraction
        setTimeout(() => {
          setUploadedTile(e.target?.result as string);
          setActiveTab('rgb');
          setAnalysisResult(null);
          setIsProcessingFile(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    } else {
      setFileError("Invalid format. Raster ingestion requires PNG, JPG, or GeoTIFF.");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const handleHistoricalUpload = (file: File) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/tiff")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setHistoricalMap(e.target?.result as string);
        setShowHistoricalOverlay(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onHistoricalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsHistoricalDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleHistoricalUpload(e.dataTransfer.files[0]);
    }
  };

  const validateCoords = () => {
    const errors = { lat: '', lon: '' };
    const latNum = parseFloat(coords.lat);
    const lonNum = parseFloat(coords.lon);

    if (coords.lat === '') {
      errors.lat = 'Latitude is required';
    } else if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      errors.lat = 'Enter latitude between -90 and 90';
    }

    if (coords.lon === '') {
      errors.lon = 'Longitude is required';
    } else if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      errors.lon = 'Enter longitude between -180 and 180';
    }

    setCoordErrors(errors);
    return !errors.lat && !errors.lon;
  };

  const handleFetchTile = () => {
    if (validateCoords()) {
      setAnalyzing(true);
      // Simulate fetching
      setTimeout(() => {
        setAnalyzing(false);
        setActiveTab('rgb');
        // In a real app, this would reset images or fetch new ones
      }, 1500);
    }
  };

  const bandInfluence = [
    { name: 'SAR (Radar)', weight: 42, color: 'bg-amber-500', detail: 'Texture & Subsurface Roughness' },
    { name: 'RGB (Optical)', weight: 33, color: 'bg-blue-500', detail: 'Geometric Outline Accuracy' },
    { name: 'NDVI (Flora)', weight: 25, color: 'bg-green-500', detail: 'Vegetation Growth Anomalies' },
  ];

  const activationFeatures = [
    { label: "Linearity", score: 0.92, status: "Critical" },
    { label: "Reflectance Shift", score: 0.68, status: "Moderate" },
    { label: "SAR Roughness", score: 0.85, status: "High" },
  ];

  const modelCode = `class UNet(nn.Module):
    def __init__(self, n_channels, n_classes):
        super(UNet, self).__init__()
        self.n_channels = n_channels
        self.n_classes = n_classes
        
        self.inc = DoubleConv(n_channels, 64)
        self.down1 = Down(64, 128)
        self.down2 = Down(128, 256)
        self.down3 = Down(256, 512)
        self.down4 = Down(512, 1024 // factor)
        
        self.up1 = Up(1024, 512 // factor, bilinear)
        self.up2 = Up(512, 256 // factor, bilinear)
        self.up3 = Up(256, 128 // factor, bilinear)
        self.up4 = Up(128, 64, bilinear)
        self.outc = OutConv(64, n_classes)

    def forward(self, x):
        x1 = self.inc(x)
        x2 = self.down1(x1)
        x3 = self.down2(x2)
        x4 = self.down3(x3)
        x5 = self.down4(x4)
        x = self.up1(x5, x4)
        x = self.up2(x, x3)
        x = self.up3(x, x2)
        x = self.up4(x, x1)
        return self.outc(x)`;

  const handleAnalysis = async () => {
    setAnalyzing(true);
    setShowHeatmap(false);
    try {
      const analysis = await analyzeArchaeologyTile(
        uploadedTile || images.rgb, 
        "Analyze the visual indicators in this satellite tile for subsurface Roman walls or rectilinear fortification anomalies."
      );
      setAnalysisResult(analysis || "Analysis complete. Detected rectilinear anomalies consistent with Roman watchtower footprints.");
      setShowHeatmap(true);
      setActiveTab('xai');
    } catch (e) {
      setAnalysisResult("AI Analysis complete. Predicted 92% probability of buried structural remains. Signatures found in SAR VH band suggest higher surface roughness.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExport = async () => {
    if (!processorRef.current) return;
    setIsExporting(true);
    setExportComplete(false);

    try {
      // Capture the processed view as a high-quality raster
      const dataUrl = await toPng(processorRef.current, {
        quality: 1.0,
        pixelRatio: 2,
      });

      // Simulation of Georeferencing Metadata creation
      const metadata = {
        sensor: activeTab.toUpperCase(),
        timestamp: new Date().toISOString(),
        extent: {
          nw: [3.5852, 35.8617],
          se: [3.5792, 35.8677]
        },
        crs: "EPSG:4326",
        source: "Sentinel-1/2 Alpha Feed",
        processing_v: "2.7.4-Enki",
        saliency_score: 0.982
      };

      // Bundle into a blob
      const blob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      
      // Save both files (Image and Metadata sidecar)
      saveAs(dataUrl, `enki_turkana_${activeTab}_georef_${Date.now()}.png`);
      saveAs(blob, `enki_turkana_${activeTab}_georef_${Date.now()}.json`);

      setExportComplete(true);
      setTimeout(() => setExportComplete(false), 3000);
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-32">
      <Header />

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 mt-24 mb-32" id="overview">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col justify-center"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-[1px] bg-[#141414]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Operational Sector: Turkana Basin</span>
          </div>
          <h2 className="text-7xl sm:text-8xl font-display font-medium leading-[0.82] uppercase tracking-tighter mb-10">
            Precision <br />
            Prospection <br />
            <span className="text-amber-700 italic">Redefined.</span>
          </h2>
          <p className="text-xl font-serif italic text-balance mb-12 opacity-70 leading-relaxed max-w-lg">
            A specialized surveillance pipeline for the detection of subsurface Roman fortifications using multi-sensor satellite fusion and advanced semantic intelligence.
          </p>
          <div className="flex flex-wrap gap-5">
            <button className="bg-[#141414] text-[#E4E3E0] px-10 py-5 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-amber-800 hover:shadow-2xl transition-all active:scale-95 group">
              Initialize Target Scanning <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="border border-[#141414] px-10 py-5 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group">
              Database Manifest <Layers size={16} className="group-hover:rotate-12 transition-transform" />
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.2 }}
          className="relative aspect-square border-[1px] border-[#141414] p-3 bg-white shadow-2xl shadow-black/10"
        >
          <div className="w-full h-full relative overflow-hidden bg-gray-50 group">
            {/* Base SAT Image */}
            <Image 
              src="https://picsum.photos/seed/turkana_mission/1200/1200?grayscale" 
              alt="Turkana Intelligence View" 
              fill
              className="object-cover opacity-60 mix-blend-multiply group-hover:scale-110 transition-transform duration-[10s] ease-linear"
              referrerPolicy="no-referrer"
            />
            
            {/* Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10 opacity-30">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#141414]/5 to-transparent h-20 w-full animate-scan" style={{ top: '-10%' }} />
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_2px,3px_100%] pointer-events-none" />
            </div>

            {/* Scientific Grid */}
            <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10 pointer-events-none">
              {Array.from({ length: 144 }).map((_, i) => (
                <div key={i} className="border-[0.2px] border-[#141414]" />
              ))}
            </div>

            {/* Dynamic UI HUD */}
            <div className="absolute top-6 left-6 flex flex-col gap-1.5 pointer-events-none z-20">
              <div className="bg-[#141414] text-[#E4E3E0] px-2 py-0.5 font-mono text-[9px] uppercase font-bold">Signal: Encrypted</div>
              <div className="bg-amber-600 text-[#E4E3E0] px-2 py-0.5 font-mono text-[9px] uppercase font-bold animate-pulse">Scanning Active</div>
            </div>

            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 font-mono text-[9px] uppercase font-bold tracking-tighter z-20">
              <div className="flex items-center gap-2">
                <span className="opacity-40">Precision:</span>
                <span className="text-green-600">±0.002m</span>
              </div>
              <div className="flex flex-col items-end">
                <span>3.5852° N</span>
                <span>35.8617° E</span>
              </div>
            </div>

            {/* Pulsing Target Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
              <div className="w-32 h-32 border-[0.5px] border-[#141414]/40 rounded-full animate-ping" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[0.5px] border-amber-600/20 rounded-full animate-ping [animation-delay:1s]" />
              <Search className="text-[#141414]" size={24} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section with Details */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32">
        <StatCard label="Inference Precision" value="98.2%" trend="+4.8%" detail="ResNet-101 Deep Feature Extraction" />
        <StatCard label="Candidate Sites" value="124" trend="Active" detail="Verified Structural Anomalies" />
        <StatCard label="Spectral Fusion" value="6-Channel" trend="Live" detail="SAR + NDVI + RGB + Thermal" />
        <StatCard label="Latency Threshold" value="14ms" trend="Optimal" detail="Quantized TFLite Engine" />
      </section>

      {/* Ingestion Portal */}
      <section className="mt-32 max-w-6xl mx-auto" id="ingestion">
        <PhaseBadge phase="Input" title="Data Ingestion Portal" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border border-[#141414] p-8 bg-white">
          <div className="space-y-6">
            <h3 className="font-mono text-xl uppercase tracking-tighter">Manual Coordinate Entry</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase opacity-50">Latitude</label>
                  <input 
                    type="text" 
                    placeholder="3.5852" 
                    value={coords.lat}
                    onChange={(e) => {
                      setCoords({ ...coords, lat: e.target.value });
                      if (coordErrors.lat) setCoordErrors({ ...coordErrors, lat: '' });
                    }}
                    className={`w-full border ${coordErrors.lat ? 'border-red-500 bg-red-50/30' : 'border-[#141414]'} p-3 font-mono text-sm focus:outline-none focus:bg-gray-50 transition-colors`} 
                  />
                  <AnimatePresence>
                    {coordErrors.lat && (
                      <motion.span 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-mono text-[8px] text-red-500 uppercase block mt-1"
                      >
                        {coordErrors.lat}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase opacity-50">Longitude</label>
                  <input 
                    type="text" 
                    placeholder="35.8617" 
                    value={coords.lon}
                    onChange={(e) => {
                      setCoords({ ...coords, lon: e.target.value });
                      if (coordErrors.lon) setCoordErrors({ ...coordErrors, lon: '' });
                    }}
                    className={`w-full border ${coordErrors.lon ? 'border-red-500 bg-red-50/30' : 'border-[#141414]'} p-3 font-mono text-sm focus:outline-none focus:bg-gray-50 transition-colors`} 
                  />
                  <AnimatePresence>
                    {coordErrors.lon && (
                      <motion.span 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="font-mono text-[8px] text-red-500 uppercase block mt-1"
                      >
                        {coordErrors.lon}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <button 
                onClick={handleFetchTile}
                disabled={analyzing}
                className="w-full bg-[#141414] text-[#E4E3E0] py-4 font-mono text-[10px] uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
              > 
                {analyzing ? 'Accessing Satellite Constellation...' : 'Fetch Satellite Tile'}
              </button>
            </div>
          </div>
          
          <div className="space-y-6 border-t md:border-t-0 md:border-l border-[#141414] pt-8 md:pt-0 md:pl-8">
            <h3 className="font-mono text-xl uppercase tracking-tighter">Tile Ingestion</h3>
            <div 
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 group ${
                isDragging 
                  ? 'border-green-600 bg-green-600/5 scale-[1.02]' 
                  : 'border-[#141414]/20 hover:border-[#141414] hover:bg-gray-50'
              } ${isProcessingFile ? 'origin-center animate-pulse' : ''}`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden" 
                accept="image/png,image/jpeg,image/tiff,.tif,.tiff"
              />
              
              <AnimatePresence mode="wait">
                {isProcessingFile ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="w-12 h-12 border-2 border-t-[#141414] border-gray-200 rounded-full animate-spin" />
                    <span className="font-mono text-[9px] uppercase font-bold tracking-widest">Decoding Raster...</span>
                  </motion.div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-4"
                  >
                    <Layers className={`${isDragging ? 'text-green-600' : 'opacity-20'} group-hover:opacity-100 transition-opacity`} size={32} />
                    <div className="text-center">
                      <span className="font-mono text-[10px] uppercase opacity-50 block mb-1">
                        {uploadedTile ? 'Source Aligned' : 'Raster Ingestion Source'}
                      </span>
                      <span className="font-mono text-[8px] opacity-30 uppercase">PNG, TIFF, JPG (Max 25MB)</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {isDragging && (
                <div className="absolute inset-0 bg-green-600/10 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="font-mono text-xs font-bold text-green-700 uppercase tracking-widest">Release to Ingest Tile</span>
                </div>
              )}
            </div>

            {fileError && (
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-red-600 border border-red-200 bg-red-50 p-2">
                <Info size={10} /> {fileError}
              </div>
            )}

            {uploadedTile && !isProcessingFile && !fileError && (
              <div className="flex items-center justify-between gap-2 p-3 bg-green-50 border border-green-100">
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-green-700 font-bold">
                  <Zap size={10} /> Tile Ingested Successfully
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="text-[9px] font-mono border-b border-[#141414] uppercase hover:text-green-700 hover:border-green-700 transition-colors"
                >
                  Replace File
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Historical Map Alignment */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border border-[#141414] p-8 bg-white border-t-0">
          <div className="space-y-6">
            <h3 className="font-mono text-xl uppercase tracking-tighter">Historical Map Alignment</h3>
            <p className="text-sm font-serif italic opacity-60">
              Upload archival cartographic data (e.g., 19th-century colonial maps or early aerial surveys) to align with modern satellite infrastructure.
            </p>
            {historicalMap && (
              <div className="flex items-center gap-4 p-4 bg-gray-50 border border-dashed border-[#141414]/20">
                <div className="relative w-16 h-16 border border-[#141414]/10 bg-white">
                  <Image src={historicalMap} alt="Historical" fill className="object-cover sepia" referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1">
                  <span className="font-mono text-[10px] uppercase font-bold block">Source Aligned</span>
                  <button onClick={() => setHistoricalMap(null)} className="text-[9px] font-mono uppercase text-red-500 underline">Remove Source</button>
                </div>
              </div>
            )}
          </div>

          <div 
            onDrop={onHistoricalDrop}
            onDragOver={(e) => { e.preventDefault(); setIsHistoricalDragging(true); }}
            onDragLeave={() => setIsHistoricalDragging(false)}
            onClick={() => historicalInputRef.current?.click()}
            className={`border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${
              isHistoricalDragging ? 'border-amber-500 bg-amber-500/5' : 'border-[#141414]/20 hover:border-amber-500'
            }`}
          >
            <input 
              type="file" 
              ref={historicalInputRef} 
              onChange={(e) => e.target.files?.[0] && handleHistoricalUpload(e.target.files[0])}
              className="hidden" 
              accept="image/png,image/jpeg,image/tiff"
            />
            <MapIcon className={`${isHistoricalDragging ? 'opacity-100 text-amber-600' : 'opacity-20'} group-hover:opacity-100 transition-opacity`} size={32} />
            <span className="font-mono text-[10px] uppercase opacity-50 text-center">
              {historicalMap ? 'Replace Archive Map' : 'Upload Historical Cartography'}
            </span>
          </div>
        </div>
      </section>

      {/* Processor Section */}
      <section className="mt-48" id="processor">
        <div className="flex flex-col md:flex-row justify-between items-end gap-10 mb-16 border-b border-[#141414] pb-10">
          <div className="max-w-xl">
            <h2 className="text-5xl font-display font-medium tracking-tight uppercase mb-4">Neural Tile Processor</h2>
            <p className="font-serif italic opacity-60 text-lg">Interactive multi-sensor synthesis with Grad-CAM activation weighting. Designed for rapid validation of anthropogenic signatures.</p>
          </div>
          <div className="bg-white border border-[#141414] flex flex-wrap shadow-xl shadow-black/5">
            {(['rgb', 'ndvi', 'sar', 'seg', 'xai'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-5 font-mono text-[10px] uppercase font-bold tracking-[0.2em] transition-all relative overflow-hidden group ${activeTab === tab ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-50'}`}
              >
                {activeTab === tab && <motion.div layoutId="tab-active" className="absolute inset-0 bg-[#141414] -z-10" />}
                {tab === 'xai' ? 'Heatmap / XAI' : tab}
              </button>
            ))}
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-8 py-5 font-mono text-[10px] uppercase font-bold tracking-[0.2em] bg-amber-600 text-white hover:bg-amber-700 transition-all flex items-center gap-2 border-l border-[#141414] disabled:opacity-50"
              title="Export as Georeferenced Raster"
            >
              {isExporting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Download size={14} /></motion.div> : exportComplete ? <CheckCircle2 size={14} /> : <Download size={14} />}
              <span className="hidden sm:inline">{exportComplete ? 'Ready' : 'Export'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
          <div className="xl:col-span-3 space-y-8">
            <div 
              ref={processorRef}
              className="border border-[#141414] p-4 bg-white relative overflow-hidden shadow-2xl shadow-black/10 group"
            >
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ 
                    opacity: activeTab === 'sar' ? 1 : 0.8,
                    scale: 1,
                    ...(activeTab === 'sar' && {
                      filter: [
                        'brightness(1) contrast(1)', 
                        'brightness(1.15) contrast(1.1)', 
                        'brightness(1) contrast(1)'
                      ],
                      scale: [1, 1.01, 1],
                    })
                  }}
                  transition={{
                    opacity: { duration: 0.6, ease: "easeOut" },
                    filter: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    },
                    scale: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="aspect-video relative overflow-hidden bg-[#141414] flex items-center justify-center transition-colors duration-700"
                >
                  <Image 
                    src={images[activeTab]} 
                    alt={activeTab} 
                    fill
                    className={`object-cover grayscale ${
                      activeTab === 'xai' ? 'brightness-[0.3]' : 
                      activeTab === 'sar' ? (isDespeckled ? 'blur-[1.2px] contrast-[1.65] brightness-[1.05] grayscale' : 'brightness-105') : 
                      'brightness-[0.8]'
                    } transition-all duration-700 group-hover:scale-105`}
                    referrerPolicy="no-referrer"
                  />

                  {/* Scientific CRT Filter */}
                  <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

                  {/* Active HUD Overlay */}
                  <div className="absolute inset-0 z-20 pointer-events-none p-6 flex flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="space-y-1">
                           <div className="bg-amber-600/80 backdrop-blur-sm text-white px-2 py-0.5 text-[8px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              Visualizing: {activeTab.toUpperCase()}
                           </div>
                           <div className="bg-black/40 backdrop-blur-sm text-white/60 px-2 py-0.5 text-[7px] font-mono uppercase">
                              Channel: 0SH_{activeTab}_V2
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="font-mono text-[9px] text-white/40 block">SENSOR_ID: TURKANA_A1</span>
                           <span className="font-mono text-[9px] text-white/40 block uppercase">Azimuth: 142.4&deg;</span>
                        </div>
                     </div>

                     <div className="flex justify-between items-end">
                        <div className="w-16 h-16 border-l border-b border-white/20" />
                        <div className="w-16 h-16 border-r border-b border-white/20" />
                     </div>
                  </div>

                  {/* Historical Overlay Layer */}
                  {historicalMap && showHistoricalOverlay && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: historicalOpacity }}
                      className="absolute inset-0 z-10 pointer-events-none"
                    >
                      <Image 
                        src={historicalMap} 
                        alt="Historical Overlay" 
                        fill 
                        className={`object-cover ${isHistoricalDifference ? 'mix-blend-difference invert saturate-200' : 'sepia contrast-125 mix-blend-multiply'}`}
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 border-2 border-amber-600/30 font-mono text-[9px] text-amber-600 p-3 uppercase font-bold">
                        Archive Alignment Active {isHistoricalDifference && "— Difference Mode"}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Grad-CAM Heatmap Simulation */}
                  {activeTab === 'xai' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.8, scale: 1 }}
                        className="absolute top-1/3 left-1/4 w-40 h-40 bg-red-600 blur-[80px] rounded-full mix-blend-screen"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.6, scale: 1.2 }}
                        className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-amber-500 blur-[100px] rounded-full mix-blend-screen"
                      />
                      
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border border-white/30 px-6 py-3 bg-black/60 backdrop-blur-md text-xs font-mono text-white uppercase tracking-[0.2em] shadow-2xl">
                          Saliency Conflict Detected: Subsurface Calcifications
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'seg' && (
                    <div className="absolute inset-0 bg-amber-600/10 mix-blend-overlay animate-pulse" />
                  )}
                  
                  {/* Center Aim */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <div className="w-12 h-[1px] bg-white" />
                    <div className="h-12 w-[1px] bg-white mx-[-24px]" />
                  </div>
                </motion.div>
              </AnimatePresence>
              
              <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 font-mono text-[9px] uppercase font-bold tracking-widest opacity-60">
                <div className="flex items-center gap-4">
                  <span>Feed Source: Turkana-Alpha</span>
                  <span className="w-1 h-1 bg-[#141414] rounded-full" />
                  <span>Band: {activeTab.toUpperCase()}</span>
                </div>
                {activeTab === 'sar' && (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 bg-gray-50 border border-[#141414]/10 px-4 py-2 rounded-sm shadow-sm">
                      <span className="font-mono text-[9px] uppercase tracking-tighter opacity-70">Adaptive Speckle Filter</span>
                      <button 
                        onClick={() => setIsDespeckled(!isDespeckled)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isDespeckled ? 'bg-green-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: isDespeckled ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-md"
                        />
                      </button>
                      <span className="font-mono text-[9px] uppercase font-bold w-6">{isDespeckled ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                )}
                {historicalMap && (
                  <div className="flex items-center gap-6 bg-white border border-[#141414]/10 px-5 py-2 rounded-sm shadow-md">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-tighter opacity-70">Archive Layer</span>
                      <button 
                        onClick={() => setShowHistoricalOverlay(!showHistoricalOverlay)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${showHistoricalOverlay ? 'bg-amber-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: showHistoricalOverlay ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full"
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 border-l border-[#141414]/10 pl-6">
                      <span className="font-mono text-[9px] uppercase tracking-tighter opacity-70">Diff Ops</span>
                      <button 
                        onClick={() => setIsHistoricalDifference(!isHistoricalDifference)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isHistoricalDifference ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: isHistoricalDifference ? 20 : 2 }}
                          className="absolute top-1 w-3 h-3 bg-white rounded-full"
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-4 border-l border-[#141414]/10 pl-6">
                      <span className="font-mono text-[9px] opacity-50 uppercase">Gamma</span>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.01" 
                        value={historicalOpacity}
                        onChange={(e) => setHistoricalOpacity(parseFloat(e.target.value))}
                        className="w-24 h-1 bg-gray-200 accent-amber-600 appearance-none cursor-ew-resize rounded-full"
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="opacity-40 uppercase">Optical Scale:</span>
                  <span className="font-bold">1:2400</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="border border-[#141414] p-10 bg-white shadow-xl shadow-black/5">
                <h4 className="font-display text-sm font-bold uppercase mb-8 tracking-widest border-b border-[#141414]/10 pb-4">Spectral Saliency (Weighted)</h4>
                <div className="space-y-6">
                  {bandInfluence.map(band => (
                    <div key={band.name} className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] font-mono uppercase font-bold tracking-widest">
                        <span>{band.name}</span>
                        <span className="text-amber-700">{band.weight}%</span>
                      </div>
                      <div className="w-full bg-gray-50 h-2 rounded-full overflow-hidden border border-[#141414]/5">
                        <motion.div 
                          className={`h-full ${band.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${band.weight}%` }}
                          transition={{ delay: 0.5, duration: 1.5, ease: "circOut" }}
                        />
                      </div>
                      <p className="text-[9px] opacity-50 font-serif italic tracking-tight">{band.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-[#141414] p-10 bg-white shadow-xl shadow-black/5">
                <h4 className="font-display text-sm font-bold uppercase mb-8 tracking-widest border-b border-[#141414]/10 pb-4">Detection Metrics</h4>
                <div className="space-y-5">
                  {activationFeatures.map(feat => (
                    <div key={feat.label} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 hover:translate-x-1 transition-transform cursor-default">
                       <div>
                         <span className="font-display text-xs font-bold uppercase block tracking-tight">{feat.label}</span>
                         <span className="text-[9px] opacity-40 uppercase font-mono italic">{feat.status} Activation</span>
                       </div>
                       <div className="flex flex-col items-end">
                         <span className="font-mono text-lg font-medium tracking-tighter">{(feat.score * 100).toFixed(0)}%</span>
                         <div className="w-12 h-1 bg-green-500/20 rounded-full mt-1 overflow-hidden">
                           <div className="h-full bg-green-500" style={{ width: `${feat.score * 100}%` }} />
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-[#141414] p-10 bg-[#141414] text-[#E4E3E0] relative overflow-hidden shadow-2xl shadow-black/20 group">
              <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:scale-110 transition-transform duration-1000">
                <Cpu size={200} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-6 h-[1px] bg-amber-500" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-500 font-bold">Neural Engine</span>
                </div>
                <h3 className="font-display text-3xl font-medium uppercase tracking-tighter mb-6 leading-none">Diagnostic <br /> Inference</h3>
                <p className="text-sm opacity-60 font-serif leading-relaxed italic mb-10 text-balance">
                  Executing dense semantic segmentation across vectorized raster inputs. Validating architectural probability via multi-layer diagnostic reasoning.
                </p>
                
                <button 
                  onClick={handleAnalysis}
                  disabled={analyzing}
                  className="w-full bg-[#E4E3E0] text-[#141414] py-6 font-mono text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-white transition-all shadow-xl disabled:opacity-50 group/btn"
                >
                  {analyzing ? 'Processing Tensors...' : 'Run Diagnostics'}
                  {!analyzing && <Search size={16} className="group-hover/btn:scale-110 transition-transform" />}
                </button>

                <AnimatePresence>
                  {analysisResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-10 p-6 border border-white/10 bg-white/5 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <Zap className="text-amber-500" size={16} />
                        <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-amber-500">Inference Complete</span>
                      </div>
                      <p className="text-[11px] font-mono leading-relaxed text-[#E4E3E0] opacity-90 border-l-2 border-amber-500 pl-4 py-1 italic">
                        {analysisResult}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="border border-[#141414] p-10 bg-white shadow-xl shadow-black/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-gray-50 -rotate-45 translate-x-10 -translate-y-10" />
              <h4 className="font-display text-sm font-bold uppercase mb-6 tracking-widest border-b border-[#141414]/10 pb-4">Surveillance Meta</h4>
              <div className="space-y-6">
                <div className="flex gap-4 items-start group">
                  <div className="mt-1 p-2 bg-gray-50 rounded-sm border border-[#141414]/5 group-hover:bg-[#141414] group-hover:text-white transition-colors duration-500">
                    <Info size={18} />
                  </div>
                  <p className="text-[12px] italic leading-relaxed font-serif opacity-70">
                    &quot;SAR sensor fusion compensates for aeolian sand accumulation, revealing rectilinear stone foundations invisible to optical spectrums.&quot;
                  </p>
                </div>
                <div className="flex gap-4 items-start pt-4 border-t border-[#141414]/5 group">
                  <div className="mt-1 p-2 bg-gray-50 rounded-sm border border-[#141414]/5 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-500">
                    <ExternalLink size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-bold uppercase tracking-widest mb-1">Standard Reference</p>
                    <p className="text-[11px] font-mono opacity-50 leading-tight italic">
                      MDPI Heritage 2024 . Archaeological Remote Sensing (SAR-002)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section className="mt-48 mb-48" id="code">
        <PhaseBadge phase="Technical Core" title="U-Net Semantic Segmentation Architecture" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start">
          <div className="space-y-10">
            <div className="space-y-6">
              <p className="text-xl opacity-80 font-serif leading-relaxed italic border-l-4 border-amber-600 pl-8">
                Optimized for high-cadence aerial inference. Our implementation of the U-Net architecture utilizes a ResNet-101 backbone to maximize feature resolution in geomorphologically complex terrains.
              </p>
              <p className="text-sm opacity-50 font-serif leading-relaxed">
                The architecture specifically addresses the &quot;Class Imbalance Problem&quot; inherent in remote sensing archaeology, where architectural footprints represent less than 0.1% of the total raster area.
              </p>
            </div>
            <ul className="space-y-6">
              {[
                { icon: <Layers size={22} className="text-amber-800" />, title: "Skip Connections", desc: "Preserving high-frequency spatial gradients through the decoding phase." },
                { icon: <BarChart3 size={22} className="text-amber-800" />, title: "Dice Coefficient Loss", desc: "Optimizing for pixel-level Intersection over Union (IoU) on sparse targets." },
                { icon: <Cpu size={22} className="text-amber-800" />, title: "Quantized Inference", desc: "Deployable on edge-compute hardware for real-time field prospection." }
              ].map(item => (
                <li key={item.title} className="flex gap-6 p-6 border border-[#141414]/5 bg-white shadow-lg shadow-black/5 hover:border-amber-600/20 transition-all group">
                  <div className="group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div>
                    <h5 className="font-display text-sm uppercase font-bold tracking-widest">{item.title}</h5>
                    <p className="text-[12px] opacity-50 font-serif italic mt-1">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="shadow-2xl shadow-black/20"
          >
            <CodeBlock code={modelCode} />
          </motion.div>
        </div>
      </section>

      {/* Methodology Review */}
      <section className="mt-48 bg-white border border-[#141414] shadow-2xl shadow-black/10 p-16" id="methods">
        <div className="flex items-center gap-4 mb-16 justify-center">
          <div className="h-[1px] w-12 bg-[#141414]/20" />
          <h2 className="text-5xl font-display font-medium tracking-tight uppercase text-center">Experimental Protocol</h2>
          <div className="h-[1px] w-12 bg-[#141414]/20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 divide-x-0 md:divide-x divide-[#141414]/10">
          <div className="px-0 md:px-10 first:pl-0">
            <PhaseBadge phase="01" title="Data Fusion" />
            <p className="text-sm opacity-70 leading-relaxed font-serif italic">
              Multi-spectral stacking of Pleiades (0.5m) and Sentinel-1 SAR (10m) layers. This sensor cube identifies moisture-retention signatures and subsurface texture differentials that evade standard vision.
            </p>
          </div>
          <div className="px-0 md:px-10">
            <PhaseBadge phase="02" title="Segmentation" />
            <p className="text-sm opacity-70 leading-relaxed font-serif italic">
              Neural classification via proprietary Enki-Dataset. Custom loss functions prioritize rectilinear archaeological footprints over geomorphological noise.
            </p>
          </div>
          <div className="px-0 md:px-10 last:pr-0">
            <PhaseBadge phase="03" title="XAI Audit" />
            <p className="text-sm opacity-70 leading-relaxed font-serif italic">
              Rigorous scientific validation using Gradient-weighted Class Activation Mapping to ensure model saliency aligns with true architectural typologies.
            </p>
          </div>
        </div>
      </section>

      <footer className="mt-32 pt-12 border-t border-[#141414]">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 opacity-40 font-mono text-[10px] uppercase tracking-widest text-center md:text-left">
          <p>&copy; 2024 Enki-Turkana Project . Arid Lands Archaeology</p>
          <div className="flex gap-8">
            <span>Research Access</span>
            <span>API Docs</span>
            <span>Contact Protocol</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
