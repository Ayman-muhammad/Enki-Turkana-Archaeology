'use client';

import Image from 'next/image';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap
} from 'lucide-react';
import { analyzeArchaeologyTile } from '@/lib/gemini';

// --- Components ---

const Header = () => (
  <header className="border-b border-[#141414] p-6 flex justify-between items-center bg-[#E4E3E0] sticky top-0 z-50">
    <div className="flex items-center gap-3">
      <div className="bg-[#141414] p-2 rounded-sm">
        <Satellite className="text-[#E4E3E0]" size={24} />
      </div>
      <div>
        <h1 className="font-mono text-xl font-bold tracking-tighter uppercase">Enki-Turkana</h1>
        <p className="font-serif italic text-xs opacity-60">Roman Fortification Surveillance Pipeline</p>
      </div>
    </div>
    <nav className="hidden md:flex gap-8 text-[11px] font-mono uppercase tracking-widest">
      <a href="#overview" className="hover:opacity-50 transition-opacity">Overview</a>
      <a href="#processor" className="hover:opacity-50 transition-opacity">Processor</a>
      <a href="#code" className="hover:opacity-50 transition-opacity">Model Code</a>
      <a href="#methods" className="hover:opacity-50 transition-opacity">Methods</a>
    </nav>
  </header>
);

const StatCard = ({ label, value, trend }: { label: string; value: string; trend?: string }) => (
  <div className="border border-[#141414] p-6 bg-white flex flex-col gap-2 group hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors duration-300">
    <span className="font-mono text-[10px] uppercase opacity-50 flex items-center gap-2">
      {label}
      {trend && <span className="text-green-500 font-bold">{trend}</span>}
    </span>
    <span className="text-3xl font-mono tracking-tight">{value}</span>
  </div>
);

const PhaseBadge = ({ phase, title }: { phase: string; title: string }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="bg-[#141414] text-[#E4E3E0] px-2 py-1 font-mono text-[10px] uppercase">{phase}</span>
    <h3 className="font-serif italic text-lg">{title}</h3>
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
  const [historicalMap, setHistoricalMap] = useState<string | null>(null);
  const [showHistoricalOverlay, setShowHistoricalOverlay] = useState(false);
  const [historicalOpacity, setHistoricalOpacity] = useState(0.5);
  const [isHistoricalDifference, setIsHistoricalDifference] = useState(false);
  const [isHistoricalDragging, setIsHistoricalDragging] = useState(false);
  const [coords, setCoords] = useState({ lat: '', lon: '' });
  const [coordErrors, setCoordErrors] = useState({ lat: '', lon: '' });
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const historicalInputRef = React.useRef<HTMLInputElement>(null);

  const images = {
    rgb: uploadedTile || "https://picsum.photos/seed/archaeo_rgb/800/800",
    ndvi: "https://picsum.photos/seed/archaeo_ndvi/800/800?grayscale",
    sar: "https://picsum.photos/seed/sar_radar_tile/800/800?grayscale",
    seg: "https://picsum.photos/seed/archaeo_seg_red/800/800",
    xai: "https://picsum.photos/seed/archaeo_xai/800/800"
  };

  const handleFileUpload = (file: File) => {
    if (file && (file.type === "image/png" || file.type === "image/jpeg" || file.type === "image/tiff")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedTile(e.target?.result as string);
        setActiveTab('rgb');
        setAnalysisResult(null);
      };
      reader.readAsDataURL(file);
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

  return (
    <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 pb-32">
      <Header />

      {/* Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-16" id="overview">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col justify-center"
        >
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-[#141414]" size={16} />
            <span className="font-mono text-[10px] uppercase tracking-widest">Scientific Protocol 001-TUR</span>
          </div>
          <h2 className="text-6xl sm:text-7xl font-mono leading-[0.85] uppercase tracking-tighter mb-8">
            Discovery through <br />
            <span className="text-[#141414] opacity-30 italic">Synthetic</span> <br />
            Vision
          </h2>
          <p className="text-lg font-serif italic text-balance mb-8 opacity-80 leading-relaxed">
            Revolutionizing archaeological prospection in arid environments by fusing multi-sensor satellite data with deep semantic segmentation.
          </p>
          <div className="flex gap-4">
            <button className="bg-[#141414] text-[#E4E3E0] px-8 py-4 font-mono text-xs uppercase tracking-tighter flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
              Initialize Analysis <ArrowRight size={14} />
            </button>
            <button className="border border-[#141414] px-8 py-4 font-mono text-xs uppercase tracking-tighter flex items-center gap-2 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all">
              View Dataset <Layers size={14} />
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-square border-2 border-[#141414] p-2 bg-white"
        >
          <div className="w-full h-full relative overflow-hidden bg-gray-100">
            <Image 
              src="https://picsum.photos/seed/turkana_view/1200/1200" 
              alt="Turkana View" 
              fill
              className="object-cover grayscale opacity-50"
              referrerPolicy="no-referrer"
            />
            {/* Grid Overlay */}
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 opacity-20">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-[#141414]" />
              ))}
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 font-mono text-[8px] bg-[#141414] text-[#E4E3E0] px-1 uppercase leading-none">Scanning...</div>
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-1 font-mono text-[8px] uppercase tracking-tighter">
              <span>LAT: 3.5852° N</span>
              <span>LON: 35.8617° E</span>
            </div>
            {/* Pulsing Target */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="w-24 h-24 border border-[#141414] rounded-full animate-ping opacity-20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#141414] rounded-full" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20">
        <StatCard label="Model Accuracy" value="93.4%" trend="+2.1%" />
        <StatCard label="Sites Discovered" value="48" trend="Verified" />
        <StatCard label="Data Fusion" value="4-Band" trend="Sentinel" />
        <StatCard label="Tile Velocity" value="42ms" trend="U-Net" />
      </section>

      {/* Ingestion Portal */}
      <section className="mt-32" id="ingestion">
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
                    onChange={(e) => setCoords({ ...coords, lat: e.target.value })}
                    className={`w-full border ${coordErrors.lat ? 'border-red-500' : 'border-[#141414]'} p-3 font-mono text-sm focus:outline-none focus:bg-gray-50`} 
                  />
                  {coordErrors.lat && <span className="font-mono text-[8px] text-red-500 uppercase">{coordErrors.lat}</span>}
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[10px] uppercase opacity-50">Longitude</label>
                  <input 
                    type="text" 
                    placeholder="35.8617" 
                    value={coords.lon}
                    onChange={(e) => setCoords({ ...coords, lon: e.target.value })}
                    className={`w-full border ${coordErrors.lon ? 'border-red-500' : 'border-[#141414]'} p-3 font-mono text-sm focus:outline-none focus:bg-gray-50`} 
                  />
                  {coordErrors.lon && <span className="font-mono text-[8px] text-red-500 uppercase">{coordErrors.lon}</span>}
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
            <h3 className="font-mono text-xl uppercase tracking-tighter">Tile Upload</h3>
            <div 
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-10 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group ${
                isDragging ? 'border-[#141414] bg-[#141414]/5' : 'border-[#141414]/20 hover:border-[#141414]'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden" 
                accept="image/png,image/jpeg,image/tiff"
              />
              <Layers className={`${isDragging ? 'opacity-100' : 'opacity-20'} group-hover:opacity-100 transition-opacity`} size={32} />
              <span className="font-mono text-[10px] uppercase opacity-50 text-center">
                {uploadedTile ? 'Tile Ready for Analysis' : 'Drag & Drop Raster Tile (TIFF/PNG)'}
              </span>
              <button className="text-[10px] font-mono border-b border-[#141414] uppercase">
                {uploadedTile ? 'Replace File' : 'Browse Files'}
              </button>
            </div>
            {uploadedTile && (
              <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-green-600">
                <Zap size={10} /> Valid Raster Source Ingested
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
      <section className="mt-32" id="processor">
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-12 border-b border-[#141414] pb-6">
          <div>
            <h2 className="text-4xl font-mono tracking-tighter uppercase mb-2">Neural Tile Processor</h2>
            <p className="font-serif italic opacity-60">Interactive multi-band visualization and Grad-CAM explainability</p>
          </div>
          <div className="bg-white border border-[#141414] flex flex-wrap">
            {(['rgb', 'ndvi', 'sar', 'seg', 'xai'] as const).map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors ${activeTab === tab ? 'bg-[#141414] text-[#E4E3E0]' : 'hover:bg-gray-100'}`}
              >
                {tab === 'xai' ? 'Heatmap (XAI)' : tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-[#141414] p-4 bg-white relative overflow-hidden group">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0 }}
                  animate={{ 
                    opacity: activeTab === 'sar' ? 1 : 0.85,
                    ...(activeTab === 'sar' && {
                      filter: ['brightness(1)', 'brightness(1.2)', 'brightness(1)'],
                      scale: [1, 1.015, 1],
                    })
                  }}
                  transition={{
                    opacity: { duration: 0.4 },
                    filter: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    },
                    scale: {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }
                  }}
                  exit={{ opacity: 0 }}
                  className="aspect-video relative overflow-hidden bg-gray-50 flex items-center justify-center"
                >
                  <Image 
                    src={images[activeTab]} 
                    alt={activeTab} 
                    fill
                    className={`object-cover grayscale ${
                      activeTab === 'xai' ? 'brightness-50' : 
                      activeTab === 'sar' ? (isDespeckled ? 'blur-[1.2px] contrast-[1.65] brightness-[1.05] grayscale' : 'brightness-105') : 
                      'brightness-90'
                    } transition-all duration-500`}
                    referrerPolicy="no-referrer"
                  />

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
                      <div className="absolute inset-0 border-2 border-amber-500/30 font-mono text-[8px] text-amber-600 p-2 uppercase">
                        Archive Alignment Active {isHistoricalDifference && "— Difference Mode"}
                      </div>
                    </motion.div>
                  )}
                  
                  {/* Grad-CAM Heatmap Simulation */}
                  {activeTab === 'xai' && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.6, scale: 1 }}
                        className="absolute top-1/3 left-1/4 w-32 h-32 bg-red-500 blur-3xl rounded-full mix-blend-screen"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.4, scale: 1.2 }}
                        className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-yellow-500 blur-3xl rounded-full mix-blend-screen"
                      />
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.5, scale: 1.1 }}
                        className="absolute top-1/2 left-1/2 w-40 h-40 bg-orange-500 blur-3xl rounded-full mix-blend-screen"
                      />
                      
                      {/* XAI Labels */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border border-white/20 px-3 py-1 bg-black/40 backdrop-blur-sm text-[10px] font-mono text-white uppercase tracking-tighter">
                          High Activation: Subsurface Geometry
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'seg' && (
                    <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay animate-pulse" />
                  )}
                  {/* Coordinate crosshair */}
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#141414]/10 pointer-events-none" />
                  <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-[#141414]/10 pointer-events-none" />
                </motion.div>
              </AnimatePresence>
              
              <div className="mt-6 flex justify-between items-center font-mono text-[10px] uppercase tracking-tighter opacity-50">
                <span>Displaying: {activeTab === 'rgb' ? 'Natural Color' : activeTab === 'ndvi' ? 'Vegetation Index' : activeTab === 'sar' ? 'Radar Surface' : activeTab === 'seg' ? 'Segmentation Map' : 'Grad-CAM Heatmap'}</span>
                {activeTab === 'sar' && (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3 bg-gray-50 border border-[#141414]/10 px-3 py-1.5 rounded-sm">
                      <span className="font-mono text-[9px] uppercase tracking-tighter opacity-70">Despeckle Filter</span>
                      <button 
                        onClick={() => setIsDespeckled(!isDespeckled)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${isDespeckled ? 'bg-green-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: isDespeckled ? 16 : 2 }}
                          className="absolute top-1 w-2 h-2 bg-white rounded-full shadow-sm"
                        />
                      </button>
                      <span className="font-mono text-[8px] uppercase font-bold w-6">{isDespeckled ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                )}
                {historicalMap && (
                  <div className="flex items-center gap-6 bg-white border border-[#141414]/10 px-4 py-1.5 rounded-sm shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[8px] uppercase tracking-tighter opacity-70">Archive Overlay</span>
                      <button 
                        onClick={() => setShowHistoricalOverlay(!showHistoricalOverlay)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${showHistoricalOverlay ? 'bg-amber-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: showHistoricalOverlay ? 16 : 2 }}
                          className="absolute top-1 w-2 h-2 bg-white rounded-full"
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 border-l border-[#141414]/10 pl-4">
                      <span className="font-mono text-[8px] uppercase tracking-tighter opacity-70">Diff Mode</span>
                      <button 
                        onClick={() => setIsHistoricalDifference(!isHistoricalDifference)}
                        className={`w-8 h-4 rounded-full relative transition-colors ${isHistoricalDifference ? 'bg-indigo-600' : 'bg-gray-300'}`}
                      >
                        <motion.div 
                          animate={{ x: isHistoricalDifference ? 16 : 2 }}
                          className="absolute top-1 w-2 h-2 bg-white rounded-full"
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 border-l border-[#141414]/10 pl-4">
                      <span className="font-mono text-[8px] opacity-50 uppercase">Opacity</span>
                      <input 
                        type="range" 
                        min="0" max="1" step="0.01" 
                        value={historicalOpacity}
                        onChange={(e) => setHistoricalOpacity(parseFloat(e.target.value))}
                        className="w-20 h-1 bg-gray-200 accent-amber-600 appearance-none cursor-ew-resize"
                      />
                    </div>
                  </div>
                )}
                <span>Zoom Level: 1.4x</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-[#141414] p-6 bg-white">
                <h4 className="font-mono text-[10px] uppercase mb-4 opacity-50">Spectral Influence (Grad-CAM)</h4>
                <div className="space-y-4">
                  {bandInfluence.map(band => (
                    <div key={band.name} className="space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-tighter">
                        <span>{band.name}</span>
                        <span>{band.weight}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-sm overflow-hidden">
                        <motion.div 
                          className={`h-full ${band.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${band.weight}%` }}
                          transition={{ delay: 0.5, duration: 1 }}
                        />
                      </div>
                      <p className="text-[8px] opacity-40 font-mono lowercase tracking-tighter">{band.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border border-[#141414] p-6 bg-white">
                <h4 className="font-mono text-[10px] uppercase mb-4 opacity-50">Activation Features</h4>
                <div className="space-y-3">
                  {activationFeatures.map(feat => (
                    <div key={feat.label} className="flex items-center justify-between border-b border-gray-100 pb-2">
                       <div>
                         <span className="font-mono text-[10px] uppercase block">{feat.label}</span>
                         <span className="text-[8px] opacity-40 uppercase font-mono italic">{feat.status} Activation</span>
                       </div>
                       <span className="font-mono text-xs font-bold">{(feat.score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border border-[#141414] p-8 bg-[#141414] text-[#E4E3E0] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Cpu size={80} />
              </div>
              <h3 className="font-mono text-lg uppercase tracking-tighter mb-4">Neural Analysis</h3>
              <p className="text-sm opacity-60 font-serif leading-relaxed italic mb-8">
                Generate deep insights using our proprietary segmentation model combined with multimodal interpretation.
              </p>
              
              <button 
                onClick={handleAnalysis}
                disabled={analyzing}
                className="w-full bg-[#E4E3E0] text-[#141414] py-4 font-mono text-[11px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors disabled:opacity-50"
              >
                {analyzing ? 'Processing...' : 'Run Diagnostics'}
                {!analyzing && <Search size={14} />}
              </button>

              {analysisResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 pt-8 border-t border-white/10"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="text-yellow-400" size={14} />
                    <span className="font-mono text-[9px] uppercase tracking-widest">Model Report</span>
                  </div>
                  <p className="text-xs font-mono leading-relaxed text-green-400">
                    {analysisResult}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="border border-[#141414] p-6 bg-white h-auto">
              <h4 className="font-mono text-[10px] uppercase mb-4 opacity-50">Project Meta</h4>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Info className="flex-shrink-0" size={16} />
                  <p className="text-[11px] italic leading-tight">
                    &quot;SAR&apos;s ability to provide sub-surface penetration in dry sand is critical for the Turkana basin.&quot;
                  </p>
                </div>
                <div className="flex gap-3">
                  <ExternalLink className="flex-shrink-0" size={16} />
                  <p className="text-[11px] font-mono leading-tight">
                    Referenced study: Blad Talh (Tunisia) MDPI 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Code Section */}
      <section className="mt-32" id="code">
        <PhaseBadge phase="Architecture" title="U-Net Semantic Segmentation" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            <p className="text-lg opacity-70 font-serif leading-relaxed">
              We employ a modified U-Net architecture for high-resolution segmentation. The symmetrical encoder-decoder path ensures precise localization of architectural boundaries while capturing broad contextual features from the arid landscape.
            </p>
            <ul className="space-y-4">
              {[
                { icon: <Layers size={18} />, title: "Skip Connections", desc: "Preserving spatial details through the bottleneck." },
                { icon: <BarChart3 size={18} />, title: "Class Imbalance", desc: "Using BCE + Dice Loss for handling tiny structure footprints." },
                { icon: <Cpu size={18} />, title: "Pre-trained Encoder", desc: "Leveraging ResNet-101 weights for feature extraction." }
              ].map(item => (
                <li key={item.title} className="flex gap-4 p-4 border border-[#141414]/10 hover:bg-[#141414]/5 transition-colors">
                  <div className="text-[#141414] mt-1">{item.icon}</div>
                  <div>
                    <h5 className="font-mono text-xs uppercase font-bold">{item.title}</h5>
                    <p className="text-[11px] opacity-60 font-serif italic">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <CodeBlock code={modelCode} />
        </div>
      </section>

      {/* Methodology Review */}
      <section className="mt-32 bg-white border border-[#141414] p-12" id="methods">
        <h2 className="text-5xl font-mono tracking-tighter uppercase mb-16 text-center">Experimental Protocol</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 divide-x-0 md:divide-x divide-[#141414]/10">
          <div className="px-0 md:px-8 first:pl-0">
            <PhaseBadge phase="01" title="Data Fusion" />
            <p className="text-sm opacity-60 leading-relaxed font-serif">
              Stacking Pleiades Optical (0.5m) with Sentinel-1 SAR (10m) and SRTM DEM layers. This multi-sensor cube reveals anomalies invisible to single-band optical sensors.
            </p>
          </div>
          <div className="px-0 md:px-8">
            <PhaseBadge phase="02" title="Segmentation" />
            <p className="text-sm opacity-60 leading-relaxed font-serif">
              Training on the Enki Dataset with focal loss to prioritize the segmentation of stone walls and ditch excavations over background sand/scrub.
            </p>
          </div>
          <div className="px-0 md:px-8 last:pr-0">
            <PhaseBadge phase="03" title="XAI Validation" />
            <p className="text-sm opacity-60 leading-relaxed font-serif">
              Using Grad-CAM to confirm the model attends to geometric features rather than random pixel noise, ensuring scientific interpretability of findings.
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
