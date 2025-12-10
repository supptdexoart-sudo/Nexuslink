
import React from 'react'; // Removed useEffect, useRef
import { GameEvent, GameEventType } from '../types';
import { MapPin, Skull, Zap, Box, Star, X, Save, RefreshCw, Trash2 } from 'lucide-react'; // Removed Shield, Check

interface EventCardProps {
  event: GameEvent;
  onClose: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  isSaved?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClose, onSave, onDelete, isSaved }) => {
  // Light theme colors
  const getColors = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-amber-50 border-amber-400 text-amber-900';
      case 'Epic': return 'bg-fuchsia-50 border-fuchsia-400 text-fuchsia-900';
      default: return 'bg-zinc-50 border-zinc-300 text-zinc-900';
    }
  };

  const getBadgeStyle = (rarity: string) => {
    switch (rarity) {
      case 'Legendary': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Epic': return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
      case 'Rare': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-zinc-200 text-zinc-600 border-zinc-300';
    }
  };

  const getIcon = () => {
    switch (event.type) {
      case GameEventType.ITEM: return <Box className="w-6 h-6" />;
      case GameEventType.ENCOUNTER: return <Skull className="w-6 h-6" />;
      case GameEventType.LOCATION: return <MapPin className="w-6 h-6" />;
      case GameEventType.TRAP: return <Zap className="w-6 h-6" />;
      default: return <Star className="w-6 h-6" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Tap outside to close */}
      <div className="absolute inset-0" onClick={onClose}></div>

      {/* Card Container - White Paper Look */}
      <div className={`
        relative w-full max-w-md bg-white border-t-4 sm:border-4 sm:rounded-2xl overflow-hidden shadow-2xl
        transform transition-all duration-500 animate-in slide-in-from-bottom-10
        flex flex-col max-h-[90vh]
        ${event.rarity === 'Legendary' ? 'border-amber-400' : 
          event.rarity === 'Epic' ? 'border-fuchsia-400' : 
          event.rarity === 'Rare' ? 'border-blue-400' : 'border-zinc-800'}
      `}>
        
        {/* Paper texture overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] mix-blend-multiply z-0"></div>

        {/* Header */}
        <div className={`p-6 relative z-10 shrink-0 border-b border-zinc-100 ${getColors(event.rarity)} bg-opacity-30`}>
           {/* Close Button */}
           <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-full transition-colors border border-black/5 text-black/60 hover:text-black">
             <X className="w-5 h-5" />
           </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl border border-black/5 bg-white text-black shadow-sm`}>
              {getIcon()}
            </div>
            <div>
              <span className="block text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Identified Asset
              </span>
              <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${getBadgeStyle(event.rarity)}`}>
                {event.rarity}
              </span>
            </div>
          </div>

          <h2 className="text-3xl font-display font-black text-black mb-1 leading-none tracking-tight uppercase">
            {event.title}
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 pb-6 overflow-y-auto relative z-10 no-scrollbar bg-white">
          
          {/* Main Description */}
          <div className="py-6 border-b border-dashed border-zinc-200">
            <p className="text-zinc-800 text-lg leading-relaxed font-serif font-medium">
              {event.description}
            </p>
          </div>

          {/* Stats Grid */}
          {event.stats && event.stats.length > 0 && (
            <div className="grid grid-cols-3 gap-2 my-6">
              {event.stats.map((stat, idx) => (
                <div key={idx} className="bg-zinc-50 p-2 rounded border border-zinc-200 flex flex-col items-center justify-center relative overflow-hidden group shadow-sm">
                  <span className="text-zinc-400 text-[9px] uppercase font-bold tracking-widest mb-1">{stat.label}</span>
                  <span className="text-black font-display font-bold text-xl">{stat.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Flavor Text */}
          {event.flavorText && (
            <div className="mb-8 relative pl-4 border-l-2 border-zinc-300">
              <p className="italic text-zinc-500 text-sm font-serif">
                "{event.flavorText}"
              </p>
            </div>
          )}

          {/* Digital Signature / ID Footer */}
          <div className="mt-4 pt-4 border-t-2 border-black flex flex-col items-center opacity-90">
            <span className="text-[9px] text-zinc-400 uppercase tracking-[0.3em] mb-2">OFFICIAL REGISTRY ID</span>
            <span className="font-mono text-black text-lg px-2 py-1 bg-zinc-100 rounded">#{event.id}</span>
          </div>

          {/* Actions Bar */}
          <div className="mt-8 flex gap-2">
             <button 
                onClick={onClose}
                className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-display font-bold text-sm uppercase tracking-[0.1em] hover:bg-zinc-200 transition-colors rounded-sm border border-zinc-200"
              >
                Close
              </button>
              
              {isSaved && onDelete && (
                <button 
                  onClick={onDelete}
                  className="w-16 py-4 bg-rose-50 text-rose-600 border border-rose-200 font-display font-bold text-sm hover:bg-rose-100 transition-colors rounded-sm flex items-center justify-center"
                  title="Scrap Asset"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}

              {onSave && (
                 <button 
                  onClick={onSave}
                  className={`flex-[2] py-4 font-display font-bold text-sm uppercase tracking-[0.1em] transition-colors rounded-sm flex items-center justify-center gap-2 shadow-lg ${
                    isSaved 
                      ? "bg-green-50 border border-green-200 text-green-800 hover:bg-green-100" 
                      : "bg-black text-white hover:bg-zinc-800"
                  }`}
                >
                  {isSaved ? <RefreshCw className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isSaved ? "Update" : "Save"}
                </button>
              )}
              
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventCard;