
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle, Gift, MessageSquare, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'error' | 'gift' | 'message';

export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  data: ToastData;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ data, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto close after 4 seconds

    return () => clearTimeout(timer);
  }, [data, onClose]);

  const getStyles = () => {
    switch (data.type) {
      case 'success':
        return {
          bg: 'bg-zinc-900/95 border-l-4 border-l-green-500',
          icon: <CheckCircle className="w-5 h-5 text-green-500" />,
          title: 'ÚSPĚCH'
        };
      case 'error':
        return {
          bg: 'bg-zinc-900/95 border-l-4 border-l-red-500',
          icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
          title: 'CHYBA'
        };
      case 'gift':
        return {
          bg: 'bg-zinc-900/95 border-l-4 border-l-neon-purple shadow-[0_4px_20px_rgba(188,19,254,0.3)]',
          icon: <Gift className="w-6 h-6 text-neon-purple animate-bounce" />,
          title: 'PŘÍCHOZÍ ZÁSILKA'
        };
      case 'message':
        return {
          bg: 'bg-zinc-900/95 border-l-4 border-l-neon-blue',
          icon: <MessageSquare className="w-5 h-5 text-neon-blue" />,
          title: 'NOVÁ ZPRÁVA'
        };
      default:
        return {
          bg: 'bg-zinc-900/95 border-l-4 border-l-zinc-500',
          icon: <Bell className="w-5 h-5 text-zinc-500" />,
          title: 'INFO'
        };
    }
  };

  const style = getStyles();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className={`fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto rounded-lg shadow-2xl backdrop-blur-md border border-white/10 overflow-hidden ${style.bg}`}
      onClick={onClose} // Close on click
    >
      <div className="p-4 flex items-start gap-3 relative">
         <div className="shrink-0 pt-0.5">
             {style.icon}
         </div>
         <div className="flex-1 min-w-0">
             <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5 font-display">
                 {style.title}
             </h4>
             <p className="text-sm font-medium text-white leading-tight break-words">
                 {data.message}
             </p>
         </div>
         <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="shrink-0 text-zinc-500 hover:text-white">
             <X className="w-4 h-4" />
         </button>
         
         {/* Progress bar animation */}
         <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 4, ease: "linear" }}
            className={`absolute bottom-0 left-0 h-0.5 ${data.type === 'gift' ? 'bg-neon-purple' : data.type === 'message' ? 'bg-neon-blue' : 'bg-white/20'}`}
         />
      </div>
    </motion.div>
  );
};

export default Toast;
