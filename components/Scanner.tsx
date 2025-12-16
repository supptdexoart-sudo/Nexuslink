
import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Keyboard, Search, Zap, UserPlus, ScanLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { playSound, vibrate } from '../services/soundService';

interface ScannerProps {
  onScanCode: (code: string) => void;
  inventoryCount: number; 
  scanMode?: 'item' | 'friend'; // Added scanMode
  isPaused?: boolean; // New prop to control scanning state from parent
}

const Scanner: React.FC<ScannerProps> = ({ onScanCode, inventoryCount, scanMode = 'item', isPaused = false }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [isAutoScanning, setIsAutoScanning] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  // LOGIC FIX: Refs for instant state tracking without re-renders
  const isPausedRef = useRef(isPaused);
  const isProcessingRef = useRef(isProcessing);
  
  // DEBOUNCE / COOLDOWN REFS
  const lastScannedCodeRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  // Sync Refs with Props/State
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  // Colors based on mode
  const borderColor = scanMode === 'friend' ? 'border-neon-purple' : 'border-neon-blue';
  const glowShadow = scanMode === 'friend' ? 'shadow-[0_0_30px_rgba(188,19,254,0.3)]' : 'shadow-[0_0_30px_rgba(0,243,255,0.2)]';

  useEffect(() => {
    const enableCamera = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 60 }
          },
        });
        handleStreamSuccess(stream);
      } catch (err) {
        console.warn("Rear camera not found, trying fallback...", err);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
            });
            handleStreamSuccess(stream);
        } catch (fallbackErr) {
            console.error("Failed to access camera:", fallbackErr);
            if ((fallbackErr as DOMException).name === "NotAllowedError") {
                setCameraError("Přístup ke kameře byl odepřen.");
            } else if ((fallbackErr as DOMException).name === "NotFoundError") {
                setCameraError("Nebyla nalezena žádná kamera.");
            } else {
                setCameraError("Nepodařilo se spustit kameru.");
            }
        }
      }
    };

    const handleStreamSuccess = (stream: MediaStream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
          startAutoScan();
        }
    };

    enableCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  const startAutoScan = () => {
    if (!('BarcodeDetector' in window)) {
        console.warn("BarcodeDetector not supported in this browser. Manual input required.");
        return;
    }

    setIsAutoScanning(true);

    // Expanded formats for better compatibility
    const barcodeDetector = new (window as any).BarcodeDetector({
        formats: [
            'qr_code', 
            'code_128', 
            'code_39', 
            'ean_13', 
            'ean_8', 
            'upc_a', 
            'upc_e', 
            'data_matrix', 
            'aztec', 
            'pdf417',
            'itf',
            'codabar'
        ]
    });

    scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) return;
        if (isProcessingRef.current || showManualInput || isPausedRef.current) return;

        try {
            const codes = await barcodeDetector.detect(videoRef.current);
            if (codes.length > 0) {
                const rawValue = codes[0].rawValue;
                handleDetectedCode(rawValue);
            }
        } catch (e) { }
    }, 150); // Slightly faster scan interval
  };

  const handleDetectedCode = (code: string) => {
      const now = Date.now();
      if (isProcessingRef.current || isPausedRef.current) return;
      if (now - lastScanTimeRef.current < 2000) return;
      if (code === lastScannedCodeRef.current && now - lastScanTimeRef.current < 5000) return;

      // --- VALID SCAN DETECTED ---
      isProcessingRef.current = true;
      lastScanTimeRef.current = now;
      lastScannedCodeRef.current = code;
      setIsProcessing(true);

      // AUDIO & HAPTIC FEEDBACK
      playSound('scan');
      vibrate([50, 50, 50]); // Triple buzz

      console.log(`Code Accepted: ${code}`);
      
      onScanCode(code);

      setTimeout(() => {
          setIsProcessing(false);
      }, 1500); 
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualId.trim()) return;
      playSound('click'); // UI Sound
      onScanCode(manualId.trim());
      setManualId("");
      setShowManualInput(false);
  };

  return (
    <div className="relative h-full flex flex-col bg-gradient-to-b from-neon-dark to-neon-surface">
      {/* Camera Viewport */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center">
            <AlertCircle className="w-12 h-12 mb-4" />
            <p className="font-display text-lg">{cameraError}</p>
          </div>
        ) : (
          <>
            {/* Viewfinder */}
            <div className={`
                relative z-10 w-72 h-72 sm:w-80 sm:h-80 overflow-hidden rounded-xl border-2 transition-all duration-300
                ${isProcessing ? 'border-neon-green shadow-[0_0_50px_rgba(10,255,10,0.4)]' : `${borderColor} ${glowShadow}`}
            `}>
               <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover"></video>
               <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none opacity-50"></div>
               
               {/* Corner Markers */}
               <div className={`absolute top-0 left-0 w-8 h-8 z-20 border-t-4 border-l-4 rounded-tl-sm ${scanMode === 'friend' ? 'border-neon-purple' : 'border-neon-blue'}`}></div>
               <div className={`absolute top-0 right-0 w-8 h-8 z-20 border-t-4 border-r-4 rounded-tr-sm ${scanMode === 'friend' ? 'border-neon-purple' : 'border-neon-blue'}`}></div>
               <div className={`absolute bottom-0 left-0 w-8 h-8 z-20 border-b-4 border-l-4 rounded-bl-sm ${scanMode === 'friend' ? 'border-neon-purple' : 'border-neon-blue'}`}></div>
               <div className={`absolute bottom-0 right-0 w-8 h-8 z-20 border-b-4 border-r-4 rounded-br-sm ${scanMode === 'friend' ? 'border-neon-purple' : 'border-neon-blue'}`}></div>

               {!isProcessing && !isPaused && (
                 <motion.div 
                   animate={{ top: ['10%', '90%', '10%'] }}
                   transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                   className={`absolute left-2 right-2 h-0.5 z-30 ${scanMode === 'friend' ? 'bg-neon-purple' : 'bg-red-500'} shadow-[0_0_15px_rgba(255,0,0,0.8)]`}
                 ></motion.div>
               )}
            </div>
            
            <div className="absolute top-8 left-0 right-0 text-center z-20 px-4">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="inline-flex items-center gap-2 bg-black/60 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm"
                  >
                    {isProcessing ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
                            <span className="text-xs font-mono text-neon-green font-bold tracking-widest">
                                {scanMode === 'friend' ? 'PŘÍTEL NALEZEN' : 'ZPRACOVÁNÍ DAT...'}
                            </span>
                        </>
                    ) : isPaused ? (
                        <>
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span className="text-xs font-mono text-yellow-500 font-bold tracking-widest">
                                SKEN POZASTAVEN
                            </span>
                        </>
                    ) : (
                        <>
                             {isAutoScanning ? (
                                <>
                                    <div className={`w-2 h-2 rounded-full animate-pulse ${scanMode === 'friend' ? 'bg-neon-purple' : 'bg-red-500'}`}></div>
                                    <span className={`text-xs font-mono font-bold tracking-widest ${scanMode === 'friend' ? 'text-neon-purple' : 'text-white/80'}`}>
                                        {scanMode === 'friend' ? 'SKENOVÁNÍ PŘÍTELE' : 'AUTO-SKEN AKTIVNÍ'}
                                    </span>
                                </>
                             ) : (
                                <span className="text-xs font-mono text-zinc-500 tracking-widest">AUTO-SKEN NEDOSTUPNÝ</span>
                             )}
                        </>
                    )}
                  </motion.div>
            </div>

            {/* Mode Icon Overlay */}
            <div className="absolute top-24 left-0 right-0 flex justify-center z-10 opacity-30 pointer-events-none">
                {scanMode === 'friend' ? (
                     <UserPlus className="w-48 h-48 text-neon-purple" />
                ) : (
                     <ScanLine className="w-48 h-48 text-neon-blue" />
                )}
            </div>

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px]">
                 <div className="text-neon-green font-display tracking-[0.2em] animate-pulse text-lg font-bold flex flex-col items-center gap-2">
                    <Zap className="w-8 h-8" />
                    {scanMode === 'friend' ? 'KONTAKT OVĚŘEN' : 'ID ROZPOZNÁNO'}
                 </div>
              </div>
            )}
          </>
        )}

        {/* Manual Input Toggle */}
        <button 
            onClick={() => { setShowManualInput(!showManualInput); playSound('click'); }}
            className="absolute bottom-6 right-6 z-40 p-4 bg-zinc-900/90 border border-zinc-700 rounded-full text-zinc-400 hover:text-white shadow-lg"
        >
            <Keyboard className="w-6 h-6" />
        </button>

        {showManualInput && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-6"
            >
                <motion.div 
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="w-full max-w-xs space-y-4"
                >
                    <h3 className="text-center font-display text-neon-blue tracking-widest">MANUÁLNÍ VSTUP</h3>
                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            placeholder={scanMode === 'friend' ? "EMAIL PŘÍTELE..." : "ZADEJTE ID KARTY..."}
                            className="flex-1 bg-zinc-900 border border-zinc-700 p-4 rounded text-white font-mono uppercase focus:border-neon-blue outline-none"
                            autoFocus
                        />
                        <button type="submit" className="bg-neon-blue text-black p-4 rounded font-bold hover:bg-white transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                    <button onClick={() => setShowManualInput(false)} className="w-full text-zinc-500 text-xs py-4 uppercase tracking-widest hover:text-zinc-300">Zrušit</button>
                </motion.div>
            </motion.div>
        )}

      </div>

      <div className="p-4 bg-zinc-950 border-t border-zinc-900 safe-area-bottom text-center">
        <p className={`text-[10px] font-mono mb-1 ${scanMode === 'friend' ? 'text-neon-purple' : 'text-zinc-500'}`}>
            {scanMode === 'friend' ? "NAMIŘTE KAMERU NA QR KÓD PŘÍTELE (V SYSTEM)" : "NAMIŘTE KAMERU NA QR/ČÁROVÝ KÓD"}
        </p>
        <p className="text-[9px] text-zinc-700 font-mono">
            {inventoryCount > 0 ? "DATABÁZE PŘIPOJENA" : "REŽIM OFFLINE"} • SYSTEM v0.6.3
        </p>
      </div>
    </div>
  );
};

export default Scanner;
