import React, { useState, useEffect, useRef } from 'react';
import { Scan, AlertCircle, Keyboard, Search } from 'lucide-react';
// Removed GameEvent import
// import { GameEvent } from '../types'; 

interface ScannerProps {
  onScanCode: (code: string) => void;
  // inventory is no longer directly used for smart simulation within scanner
  // It's just a count for display, if desired.
  inventoryCount: number; 
}

const Scanner: React.FC<ScannerProps> = ({ onScanCode, inventoryCount }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const enableCamera = async () => {
      setCameraError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error playing video stream:", e));
        }
      } catch (err) {
        console.error("Failed to access camera:", err);
        if ((err as DOMException).name === "NotAllowedError") {
          setCameraError("Přístup ke kameře byl odepřen.");
        } else {
          setCameraError("Nepodařilo se získat přístup ke kameře.");
        }
      }
    };

    enableCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleSimulatedScan = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    // Simulate scanning delay
    setTimeout(() => {
      // Generate random codes for simulation
      const codes = ["WPN-01", "TRAP-ALPHA", "LOC-OUTPOST", "ARTIFACT-99", "DATA-KEY-GAMMA"];
      const randomCode = codes[Math.floor(Math.random() * codes.length)];
      
      console.log(`Simulated Scan Code: ${randomCode}`);
      onScanCode(randomCode);
      setIsProcessing(false);
    }, 1500);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualId.trim()) return;
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
            <div className="relative z-10 w-80 h-40 overflow-hidden rounded-md border-2 border-neon-blue/50 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
               <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover"></video>
               <div className="absolute inset-0 z-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] pointer-events-none opacity-50"></div>
               
               {/* UI Elements */}
               <div className="absolute top-0 left-0 w-8 h-8 z-20 border-t-2 border-l-2 border-neon-blue/80 rounded-tl-sm shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
               <div className="absolute top-0 right-0 w-8 h-8 z-20 border-t-2 border-r-2 border-neon-blue/80 rounded-tr-sm shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
               <div className="absolute bottom-0 left-0 w-8 h-8 z-20 border-b-2 border-l-2 border-neon-blue/80 rounded-bl-sm shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
               <div className="absolute bottom-0 right-0 w-8 h-8 z-20 border-b-2 border-r-2 border-neon-blue/80 rounded-br-sm shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>

               {!isProcessing && (
                 <div className="absolute left-2 right-2 h-0.5 z-30 bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.8)] animate-[scan_1.5s_ease-in-out_infinite] top-1/2 -translate-y-1/2">
                    <div className="absolute inset-0 bg-neon-blue blur-[2px]"></div>
                 </div>
               )}
            </div>
            
            <div className="absolute top-1/4 -translate-y-1/2 left-0 right-0 text-center z-20">
                  <span className="text-xs font-mono text-white/70 bg-black/50 px-2 py-1 rounded border border-white/10">
                    BARCODE READER ACTIVE
                  </span>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                 <div className="flex items-end gap-1 mb-4 h-12">
                    <div className="w-2 bg-neon-blue animate-[pulse_0.5s_ease-in-out_infinite] h-4"></div>
                    <div className="w-2 bg-neon-blue animate-[pulse_0.5s_ease-in-out_0.1s_infinite] h-8"></div>
                    <div className="w-2 bg-neon-blue animate-[pulse_0.5s_ease-in-out_0.2s_infinite] h-12"></div>
                    <div className="w-2 bg-neon-blue animate-[pulse_0.5s_ease-in-out_0.3s_infinite] h-6"></div>
                 </div>
                <p className="text-neon-blue font-display tracking-[0.2em] animate-pulse text-sm">DECRYPTING SIGNAL...</p>
              </div>
            )}
          </>
        )}

        {/* Manual Input Toggle */}
        <button 
            onClick={() => setShowManualInput(!showManualInput)}
            className="absolute bottom-4 right-4 z-40 p-3 bg-zinc-900/80 border border-zinc-700 rounded-full text-zinc-400 hover:text-white"
        >
            <Keyboard className="w-5 h-5" />
        </button>

        {showManualInput && (
            <div className="absolute inset-0 z-30 bg-black/90 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="w-full max-w-xs space-y-4">
                    <h3 className="text-center font-display text-neon-blue tracking-widest">MANUAL OVERRIDE</h3>
                    <form onSubmit={handleManualSubmit} className="flex gap-2">
                        <input 
                            type="text" 
                            value={manualId}
                            onChange={(e) => setManualId(e.target.value)}
                            placeholder="ENTER ID..."
                            className="flex-1 bg-zinc-900 border border-zinc-700 p-3 rounded text-white font-mono uppercase focus:border-neon-blue outline-none"
                            autoFocus
                        />
                        <button type="submit" className="bg-neon-blue text-black p-3 rounded font-bold hover:bg-white transition-colors">
                            <Search className="w-5 h-5" />
                        </button>
                    </form>
                    <button onClick={() => setShowManualInput(false)} className="w-full text-zinc-500 text-xs py-2">CANCEL</button>
                </div>
            </div>
        )}

      </div>

      {/* Manual Trigger */}
      <div className="p-6 bg-zinc-950 border-t border-zinc-900 safe-area-bottom">
        <button
          onClick={handleSimulatedScan}
          disabled={isProcessing}
          className="w-full relative overflow-hidden group py-5 bg-zinc-900 border border-zinc-800 rounded-xl active:scale-[0.98] transition-all"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <div className="flex items-center justify-center gap-3">
                <Scan className={`w-6 h-6 ${isProcessing ? 'text-zinc-500' : 'text-neon-blue'}`} />
                <span className={`font-display font-bold tracking-wider ${isProcessing ? 'text-zinc-500' : 'text-white'}`}>
                    {isProcessing ? "PROCESSING..." : "ACTIVATE SCANNER"}
                </span>
            </div>
        </button>
        <p className="text-center text-[10px] text-zinc-600 mt-2 font-mono">
            {inventoryCount > 0 ? "LINKED TO DATABASE" : "NO DATABASE CONNECTION"}
        </p>
      </div>
    </div>
  );
};

export default Scanner;