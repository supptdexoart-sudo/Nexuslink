
import React, { useState, useEffect, useRef } from 'react';
import { Keyboard, Camera, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { vibrate } from '../services/soundService';

interface ScannerProps {
  onScanCode: (code: string) => void;
  isAIThinking?: boolean;
  isPaused?: boolean;
}

const Scanner: React.FC<ScannerProps> = ({ onScanCode, isAIThinking, isPaused }) => {
  const [cameraStatus, setCameraStatus] = useState<'unknown' | 'granted' | 'denied' | 'unsupported'>('unknown');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualId, setManualId] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!('BarcodeDetector' in window)) {
        setCameraStatus('unsupported');
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraStatus('granted');
        startDetection();
      }
    } catch (err) {
      setCameraStatus('denied');
    }
  };

  const startDetection = () => {
    if (!('BarcodeDetector' in window)) return;
    const detector = new (window as any).BarcodeDetector({ formats: ['qr_code', 'code_128', 'ean_13'] });
    
    const interval = setInterval(async () => {
      if (isPaused || isAIThinking || !videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          onScanCode(barcodes[0].rawValue);
          vibrate(50);
        }
      } catch (e) {}
    }, 500);
    return () => clearInterval(interval);
  };

  return (
    <div className="relative h-full w-full bg-black flex flex-col items-center justify-center p-6">
      <div className="absolute top-10 left-0 right-0 z-20 flex justify-center">
         <div className="bg-white/5 backdrop-blur px-4 py-2 border border-white/10 rounded-full flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${cameraStatus === 'granted' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                {isAIThinking ? 'AI_DEKÓDOVÁNÍ...' : 'OPTIKA_AKTIVNÍ'}
            </span>
         </div>
      </div>

      <div className="relative w-full aspect-square max-w-sm">
        <div className="absolute -inset-2 border-2 border-signal-cyan/20 rounded-3xl pointer-events-none" />
        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-signal-cyan rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-signal-cyan rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-signal-cyan rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-signal-cyan rounded-br-xl" />

        <div className="w-full h-full bg-zinc-900 rounded-2xl overflow-hidden relative shadow-2xl">
           {cameraStatus === 'granted' ? (
             <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover grayscale brightness-75 contrast-125" />
           ) : (
             <div className="w-full h-full flex flex-col items-center justify-center p-10 text-center gap-6">
               <Camera className="w-12 h-12 text-white/20" />
               <p className="text-xs text-white/40 uppercase font-bold tracking-widest">
                 {cameraStatus === 'unsupported' ? 'Prohlížeč nepodporuje Barcode API' : 'Kamera není autorizována'}
               </p>
               <button onClick={startCamera} className="button-primary py-3 px-8 text-xs">Aktivovat Senzor</button>
             </div>
           )}

           <AnimatePresence>
             {isAIThinking && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-signal-cyan/20 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
                  <Loader2 className="w-12 h-12 text-white animate-spin" />
                  <Sparkles className="w-6 h-6 text-white animate-pulse" />
                  <span className="text-xs font-black text-white uppercase tracking-[0.3em]">Analyzuji_Nexus_Data</span>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      <button onClick={() => setShowManualInput(true)} className="mt-12 flex items-center gap-3 text-white/40 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest">
         <Keyboard className="w-5 h-5" /> Manuální Identifikace
      </button>

      <AnimatePresence>
        {showManualInput && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-8">
            <div className="w-full max-w-xs space-y-6">
               <h3 className="text-xl font-black text-white uppercase text-center tracking-widest">Zadejte_ID</h3>
               <input 
                 type="text" 
                 autoFocus
                 value={manualId}
                 onChange={(e) => setManualId(e.target.value)}
                 className="w-full bg-white/5 border border-white/10 p-4 text-white text-center text-2xl font-mono uppercase rounded-xl outline-none focus:border-signal-cyan" 
               />
               <div className="flex gap-4">
                 <button onClick={() => setShowManualInput(false)} className="flex-1 py-4 text-xs font-bold text-white/40 uppercase">Zrušit</button>
                 <button onClick={() => { onScanCode(manualId); setShowManualInput(false); }} className="flex-1 button-primary py-4 text-xs">Potvrdit</button>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scanner;
