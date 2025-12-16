import React, { useState, useEffect } from 'react';
import { GameEvent, GameEventType, Stat, PlayerClass } from '../types'; 
import { Plus, Minus, Save, QrCode, Download, Share2, X, RotateCcw, Trash2, Backpack, Moon, Users, Sun, MapPin, Swords } from 'lucide-react'; 
import MerchantPanel from './generator/MerchantPanel';
import DilemmaPanel from './generator/DilemmaPanel';
import CombatPanel from './generator/CombatPanel';

interface GeneratorProps {
  onSaveCard: (event: GameEvent) => void;
  userEmail: string;
  initialData?: GameEvent | null; // Data for editing
  onClearData?: () => void; // Callback to clear editing state
}

const initialEventState: GameEvent = {
  id: '',
  title: '',
  description: '',
  type: GameEventType.ITEM,
  rarity: 'Common',
  flavorText: '',
  stats: [],
  isShareable: true,
  isConsumable: false,
  canBeSaved: true, 
  price: 0,
  canSellToMerchant: false, // Default false
  // Default Merchant Config
  tradeConfig: {
      warriorDiscount: 10,
      clericDiscount: 45,
      mageDiscount: 25,
      rogueStealChance: 30
  },
  dilemmaScope: 'INDIVIDUAL',
  merchantItems: [],
  dilemmaOptions: [],
  bossPhases: [],
  timeVariant: { enabled: false, nightStats: [] },
  classVariants: {} // Init empty
};

// Admin email constant for validation
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';

const getQrColor = (type: GameEventType): string => {
    switch (type) {
        case GameEventType.BOSS: return '7f1d1d';
        case GameEventType.TRAP:
        case GameEventType.ENCOUNTER: return 'ef4444';
        case GameEventType.DILEMA: return 'bc13fe';
        case GameEventType.MERCHANT: return 'eab308';
        case GameEventType.LOCATION: return '10b981';
        case GameEventType.ITEM:
        default: return '000000';
    }
};

const Generator: React.FC<GeneratorProps> = ({ onSaveCard, userEmail, initialData, onClearData }) => {
  const [newEvent, setNewEvent] = useState<GameEvent>(initialEventState);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  // Edit Mode Logic
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [activeClassEdit, setActiveClassEdit] = useState<PlayerClass | null>(null);

  // Load initial data if provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setNewEvent({
          ...initialEventState, // Defaults
          ...initialData,       // Overrides
          dilemmaOptions: initialData.dilemmaOptions || [],
          dilemmaScope: initialData.dilemmaScope || 'INDIVIDUAL',
          merchantItems: initialData.merchantItems || [],
          canSellToMerchant: initialData.canSellToMerchant ?? false,
          // Ensure tradeConfig is merged correctly with fallbacks
          tradeConfig: {
              warriorDiscount: initialData.tradeConfig?.warriorDiscount ?? initialEventState.tradeConfig!.warriorDiscount,
              clericDiscount: initialData.tradeConfig?.clericDiscount ?? initialEventState.tradeConfig!.clericDiscount,
              mageDiscount: initialData.tradeConfig?.mageDiscount ?? initialEventState.tradeConfig!.mageDiscount,
              rogueStealChance: initialData.tradeConfig?.rogueStealChance ?? initialEventState.tradeConfig!.rogueStealChance
          },
          stats: initialData.stats || [],
          bossPhases: initialData.bossPhases || [],
          timeVariant: initialData.timeVariant || { enabled: false, nightStats: [] },
          classVariants: initialData.classVariants || {}
      });
      setIsEditingMode(true);
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) scrollContainer.scrollTop = 0;
    } else {
        setNewEvent(initialEventState);
        setIsEditingMode(false);
    }
  }, [initialData]);

  const handleReset = () => {
      setNewEvent(initialEventState);
      setIsEditingMode(false);
      if (onClearData) onClearData();
  };

  const updateEvent = (updates: Partial<GameEvent>) => {
      setNewEvent(prev => ({ ...prev, ...updates }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const { name, checked } = e.target;
     setNewEvent((prev) => ({ ...prev, [name]: checked }));
  };

  // --- STATS LOGIC ---
  const handleStatChange = (index: number, field: keyof Stat, value: string) => {
    const updatedStats: Stat[] = newEvent.stats ? [...newEvent.stats] : [];
    if (!updatedStats[index]) {
      updatedStats[index] = { label: '', value: '' }; 
    }
    updatedStats[index] = { ...(updatedStats[index] as Stat), [field]: value };
    setNewEvent((prev) => ({ ...prev, stats: updatedStats }));
  };

  const setSpecificStat = (label: string, value: string) => {
      setNewEvent(prev => {
          const currentStats = prev.stats ? [...prev.stats] : [];
          const filteredStats = currentStats.filter(s => s.label !== label);
          if (value && value !== '0') {
            filteredStats.unshift({ label, value });
          }
          return { ...prev, stats: filteredStats };
      });
  };

  const getSpecificStatValue = (label: string): string => {
      return newEvent.stats?.find(s => s.label === label)?.value.toString() || '';
  };

  const addStat = () => {
    setNewEvent((prev) => ({
      ...prev,
      stats: [...(prev.stats || []), { label: '', value: '' }],
    }));
  };

  const removeStat = (index: number) => {
    setNewEvent((prev) => ({
      ...prev,
      stats: (prev.stats || []).filter((_, i) => i !== index),
    }));
  };

  // --- CLASS VARIANT LOGIC ---
  const updateClassVariant = (field: string, value: any) => {
      if (!activeClassEdit) return;
      setNewEvent(prev => ({
          ...prev,
          classVariants: {
              ...prev.classVariants,
              [activeClassEdit]: {
                  ...(prev.classVariants?.[activeClassEdit] || {}),
                  [field]: value
              }
          }
      }));
  };

  const addClassStat = () => {
      if (!activeClassEdit) return;
      const currentStats = newEvent.classVariants?.[activeClassEdit]?.bonusStats || [];
      updateClassVariant('bonusStats', [...currentStats, { label: '', value: '' }]);
  };

  const updateClassStat = (index: number, field: keyof Stat, value: string) => {
      if (!activeClassEdit) return;
      const currentStats = [...(newEvent.classVariants?.[activeClassEdit]?.bonusStats || [])];
      if(currentStats[index]) currentStats[index] = { ...currentStats[index], [field]: value };
      updateClassVariant('bonusStats', currentStats);
  };

  const removeClassStat = (index: number) => {
      if (!activeClassEdit) return;
      const currentStats = (newEvent.classVariants?.[activeClassEdit]?.bonusStats || []).filter((_, i) => i !== index);
      updateClassVariant('bonusStats', currentStats);
  };

  const removeClassVariant = (pClass: PlayerClass) => {
      const updatedVariants = { ...newEvent.classVariants };
      delete updatedVariants[pClass];
      setNewEvent(prev => ({ ...prev, classVariants: updatedVariants }));
      if (activeClassEdit === pClass) setActiveClassEdit(null);
  };

  // --- NIGHT VARIANT HELPERS ---
  const toggleTimeVariant = (checked: boolean) => {
      setNewEvent(prev => ({
          ...prev,
          timeVariant: {
              ...prev.timeVariant,
              enabled: checked,
              nightTitle: prev.timeVariant?.nightTitle || prev.title + " (Noc)",
              nightDescription: prev.timeVariant?.nightDescription || prev.description,
              nightType: prev.timeVariant?.nightType || prev.type
          }
      }));
  };

  const updateTimeVariant = (field: string, value: any) => {
      setNewEvent(prev => ({
          ...prev,
          timeVariant: {
              ...prev.timeVariant,
              enabled: true,
              [field]: value
          }
      }));
  };

  const addNightStat = () => {
      const currentStats = newEvent.timeVariant?.nightStats || [];
      updateTimeVariant('nightStats', [...currentStats, { label: '', value: '' }]);
  };

  const updateNightStat = (index: number, field: keyof Stat, value: string) => {
      const currentStats = [...(newEvent.timeVariant?.nightStats || [])];
      if (currentStats[index]) {
          currentStats[index] = { ...currentStats[index], [field]: value };
      }
      updateTimeVariant('nightStats', currentStats);
  };

  const removeNightStat = (index: number) => {
       const currentStats = (newEvent.timeVariant?.nightStats || []).filter((_, i) => i !== index);
       updateTimeVariant('nightStats', currentStats);
  };

  // --- QR CODE GENERATION LOGIC ---
  const getQrUrl = (id: string, type: GameEventType) => {
      const color = getQrColor(type);
      return `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&color=${color}&bgcolor=ffffff&margin=20&data=${encodeURIComponent(id || 'NEXUS-LINK-PREVIEW')}`;
  };
  
  const currentQrUrl = getQrUrl(newEvent.id, newEvent.type);

  const downloadQrCode = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newEvent.id) {
        setFeedback({ message: 'Pro stažení QR kódu musíte zadat ID.', type: 'error' });
        return;
    }
    try {
        const response = await fetch(currentQrUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const safeTitle = newEvent.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled';
        link.download = `nexus-${newEvent.type}-${safeTitle}-${newEvent.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download failed', error);
        setFeedback({ message: 'Nepodařilo se stáhnout QR kód.', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userEmail) {
      setFeedback({ message: 'Pro vytvoření karty se musíte přihlásit.', type: 'error' });
      return;
    }
    if (!newEvent.id.trim() || !newEvent.title.trim() || !newEvent.description.trim()) {
      setFeedback({ message: 'ID, Název a Popis jsou povinné.', type: 'error' });
      return;
    }

    try {
      const eventToSave: GameEvent = { ...newEvent };

      if (!eventToSave.isConsumable) {
          eventToSave.canBeSaved = true;
      }

      if (userEmail === ADMIN_EMAIL) {
          eventToSave.qrCodeUrl = getQrUrl(newEvent.id, newEvent.type);
      }

      await onSaveCard(eventToSave);
      setFeedback({ message: `Karta "${newEvent.title}" byla úspěšně uložena!`, type: 'success' });
      
      if (!isEditingMode) {
          setNewEvent(initialEventState);
      } else {
          setTimeout(() => setFeedback({ message: '', type: null }), 3000);
      }
    } catch (error: any) {
      setFeedback({ message: `Chyba při ukládání: ${error.message || error}`, type: 'error' });
    }
  };

  const isMerchant = newEvent.type === GameEventType.MERCHANT;
  const isDilemma = newEvent.type === GameEventType.DILEMA;
  const isEncounter = newEvent.type === GameEventType.ENCOUNTER;
  const isTrap = newEvent.type === GameEventType.TRAP;
  const isBoss = newEvent.type === GameEventType.BOSS;
  const isLocation = newEvent.type === GameEventType.LOCATION;

  return (
    <div className="h-full overflow-y-auto p-6 pb-24 no-scrollbar">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-20">
        <div>
            <h1 className="text-3xl font-display font-bold">
                {isEditingMode ? 'Úprava' : 'Fabrikace'} <span className="text-neon-blue">Aktiva</span>
            </h1>
            {isEditingMode && <p className="text-[10px] text-zinc-500 font-mono">Režim úpravy existující karty</p>}
        </div>
        <div className="flex gap-2 items-center">
            {isEditingMode && (
                <button 
                    onClick={handleReset}
                    className="p-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-400 hover:text-white"
                    title="Zrušit úpravy / Resetovat"
                >
                    <RotateCcw className="w-6 h-6" />
                </button>
            )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {feedback.message && (
          <div className={`p-3 rounded-lg text-center font-bold ${
            feedback.type === 'success' ? 'bg-green-900/30 text-green-400 border border-green-700' :
            feedback.type === 'error' ? 'bg-red-900/30 text-red-400 border border-red-700' : ''
          }`}>
            {feedback.message}
          </div>
        )}

        {/* Basic Info (ID, Title, Desc) */}
        <div>
          <label htmlFor="id" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">ID Aktiva (Unikátní)</label>
          <div className="relative">
            <input
                type="text"
                id="id"
                name="id"
                value={newEvent.id}
                onChange={handleChange}
                placeholder="ITEM-001"
                className={`w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-mono uppercase focus:border-neon-blue outline-none ${isEditingMode ? 'opacity-70 cursor-not-allowed' : ''}`}
                required
                readOnly={isEditingMode}
            />
          </div>
        </div>

        {/* QR Code Section */}
        <div className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
            <div className="flex items-center gap-2 mb-4 text-neon-blue">
                <QrCode className="w-5 h-5" />
                <h3 className="text-sm font-bold font-display tracking-widest uppercase">Digitální Identifikátor (QR)</h3>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="bg-white p-2 rounded-lg shrink-0 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    <img src={currentQrUrl} alt="QR Code Preview" className="w-32 h-32 object-contain" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <p className="text-xs text-zinc-500 mb-3 font-mono leading-relaxed">
                        QR kód se generuje automaticky ve <span className="text-white font-bold">Vysoké Kvalitě (1000px)</span>.
                        <br/>
                        Barva odpovídá typu karty.
                    </p>
                    <button
                        onClick={downloadQrCode}
                        type="button"
                        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded border border-zinc-600 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 mx-auto sm:mx-0 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Stáhnout Tisková Data (PNG)
                    </button>
                </div>
            </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Název Aktiva</label>
          <input type="text" name="title" value={newEvent.title} onChange={handleChange} placeholder="Název..." className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-display focus:border-neon-blue outline-none" required />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Popis / Příběh</label>
          <textarea name="description" value={newEvent.description} onChange={handleChange} rows={4} placeholder="Popis..." className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white resize-y font-serif focus:border-neon-blue outline-none" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Typ Aktiva</label>
            <select name="type" value={newEvent.type} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-mono focus:border-neon-blue outline-none">
              {Object.values(GameEventType).map((type) => (<option key={type} value={type}>{type}</option>))}
            </select>
          </div>
          <div>
            <label htmlFor="rarity" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Vzácnost</label>
            <select name="rarity" value={newEvent.rarity} onChange={handleChange} className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-mono focus:border-neon-blue outline-none">
              {['Common', 'Rare', 'Epic', 'Legendary'].map((rarity) => (<option key={rarity} value={rarity}>{rarity}</option>))}
            </select>
          </div>
        </div>

        {/* --- MODULAR SECTIONS --- */}
        
        {isMerchant && <MerchantPanel event={newEvent} onUpdate={updateEvent} />}
        
        {isDilemma && <DilemmaPanel event={newEvent} onUpdate={updateEvent} />}
        
        {(isBoss || isEncounter || isTrap) && <CombatPanel event={newEvent} onUpdate={updateEvent} />}

        {/* --- LOCATION CONFIG --- */}
        {isLocation && (
             <div className="bg-gradient-to-br from-emerald-900/30 to-black border border-emerald-700 rounded-xl p-5 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                 <div className="flex items-center gap-3 mb-4 text-emerald-500 border-b border-emerald-900/50 pb-2">
                     <MapPin className="w-6 h-6" />
                     <h3 className="font-display font-bold uppercase tracking-widest">Parametry Lokace</h3>
                 </div>
                 
                 <div className="space-y-4">
                     <div>
                         <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Úroveň Nebezpečí</label>
                         <div className="flex gap-2">
                             {['BEZPEČNÁ', 'NEBEZPEČNÁ', 'SMRTÍCÍ'].map(lvl => (
                                 <button 
                                    key={lvl}
                                    type="button"
                                    onClick={() => setSpecificStat('NEBEZPEČÍ', lvl)}
                                    className={`flex-1 py-2 text-xs font-bold border rounded ${getSpecificStatValue('NEBEZPEČÍ') === lvl ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-zinc-900 text-zinc-500 border-zinc-700'}`}
                                 >
                                     {lvl}
                                 </button>
                             ))}
                         </div>
                     </div>
                     
                     <div>
                         <label className="text-xs font-bold text-zinc-500 uppercase block mb-1">Dostupná Akce</label>
                         <input 
                            placeholder="Např. PROHLEDAT, ODPOČÍVAT" 
                            value={getSpecificStatValue('AKCE')}
                            onChange={(e) => setSpecificStat('AKCE', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white font-mono uppercase"
                         />
                     </div>
                 </div>
             </div>
        )}

        {/* --- GLOBAL SETTINGS (CONSUMABLE / SHAREABLE) --- */}
        {!isMerchant && !isDilemma && !isEncounter && !isTrap && !isBoss && !isLocation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3 justify-center">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1"><Trash2 className="w-3 h-3 text-red-500"/> Jednorázové?</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" name="isConsumable" className="sr-only peer" checked={newEvent.isConsumable ?? false} onChange={handleCheckboxChange}/>
                            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                    {newEvent.isConsumable && (
                         <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 pt-2 border-t border-zinc-800">
                             <div><span className="text-xs font-bold text-white flex items-center gap-1"><Backpack className="w-3 h-3 text-neon-blue"/> Povolit Uložení?</span></div>
                             <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                                 <input type="checkbox" name="canBeSaved" className="sr-only peer" checked={newEvent.canBeSaved ?? true} onChange={handleCheckboxChange}/>
                                 <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-blue"></div>
                             </label>
                         </div>
                    )}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex items-center justify-between">
                    <div><h4 className="text-sm font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-neon-green" /> Povolit Sdílení</h4></div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isShareable" className="sr-only peer" checked={newEvent.isShareable ?? true} onChange={handleCheckboxChange}/>
                        <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                    </label>
                </div>
            </div>
        )}

        {/* --- GLOBAL STATS -> RENAMED TO "DEN" --- */}
        {!isDilemma && !isMerchant && !isEncounter && !isTrap && !isBoss && !isLocation && (
            <div className="space-y-4 border border-zinc-800 rounded-lg p-4 bg-orange-950/10">
                <div className="flex items-center gap-2 mb-2 border-b border-orange-500/20 pb-2">
                    <Sun className="w-6 h-6 text-orange-500" />
                    <div>
                        <h3 className="text-lg font-display font-bold text-orange-200 uppercase tracking-widest">DEN</h3>
                        <p className="text-[10px] text-orange-400/60">Základní statistiky a vlastnosti (Výchozí stav).</p>
                    </div>
                </div>
                {(newEvent.stats || []).map((stat, index) => (
                    <div key={index} className="flex items-center gap-2">
                    <input type="text" value={stat.label} onChange={(e) => handleStatChange(index, 'label', e.target.value)} placeholder="Popisek" className="flex-1 bg-black/50 border border-orange-500/30 p-2 rounded text-white text-xs uppercase font-mono outline-none"/>
                    <input type="text" value={stat.value} onChange={(e) => handleStatChange(index, 'value', e.target.value)} placeholder="Hodnota" className="flex-1 bg-black/50 border border-orange-500/30 p-2 rounded text-white text-xs font-mono outline-none"/>
                    <button type="button" onClick={() => removeStat(index)} className="p-2 bg-red-900/20 text-red-400 rounded-full hover:bg-red-900/40 transition-colors"><Minus className="w-4 h-4" /></button>
                    </div>
                ))}
                <button type="button" onClick={addStat} className="w-full flex items-center justify-center gap-2 py-2 bg-orange-900/30 hover:bg-orange-800/50 text-orange-300 rounded-lg font-bold text-sm transition-colors border border-orange-500/20"><Plus className="w-4 h-4" /> Přidat statistiku</button>
            </div>
        )}
        
        {/* Extra Stats for Encounter/Trap to handle edge cases or additional info */}
        {(isEncounter || isTrap || isBoss || isLocation) && (
             <div className="mt-4 border-t border-zinc-800 pt-4">
                 <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Dodatečné Vlastnosti</h4>
                 {(newEvent.stats || []).filter(s => !['HP', 'ATK', 'DEF', 'NEBEZPEČÍ', 'AKCE'].includes(s.label)).map((stat, index) => {
                     // Find real index to update correct item
                     const realIndex = newEvent.stats!.findIndex(s => s === stat);
                     return (
                        <div key={index} className="flex items-center gap-2 mb-2">
                            <input type="text" value={stat.label} onChange={(e) => handleStatChange(realIndex, 'label', e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 p-2 rounded text-white text-xs"/>
                            <input type="text" value={stat.value} onChange={(e) => handleStatChange(realIndex, 'value', e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 p-2 rounded text-white text-xs"/>
                            <button type="button" onClick={() => removeStat(realIndex)} className="text-red-500"><Minus className="w-4 h-4"/></button>
                        </div>
                     );
                 })}
                 <button type="button" onClick={addStat} className="text-xs text-neon-blue font-bold flex items-center gap-1">+ Přidat Speciální Vlastnost</button>
             </div>
        )}

        {/* --- DYNAMIC NIGHT TIME VARIANT SECTION -> RENAMED TO "NOC" --- */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/50 rounded-lg p-4 mt-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Moon className="w-6 h-6 text-indigo-400" />
                    <div>
                        <h4 className="text-lg font-display font-bold text-indigo-200 uppercase tracking-widest">NOC</h4>
                        <p className="text-[10px] text-indigo-300/60">Mutace statistik v nočním cyklu.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={newEvent.timeVariant?.enabled ?? false} onChange={(e) => toggleTimeVariant(e.target.checked)}/>
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                </label>
            </div>
            {newEvent.timeVariant?.enabled && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                    <div>
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Název (Noc)</label>
                        <input type="text" value={newEvent.timeVariant.nightTitle || ''} onChange={(e) => updateTimeVariant('nightTitle', e.target.value)} className="w-full bg-black/50 border border-indigo-500/30 p-2 rounded text-white text-sm focus:border-indigo-400 outline-none"/>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest">Popis (Noc)</label>
                        <textarea rows={2} value={newEvent.timeVariant.nightDescription || ''} onChange={(e) => updateTimeVariant('nightDescription', e.target.value)} className="w-full bg-black/50 border border-indigo-500/30 p-2 rounded text-zinc-300 text-xs focus:border-indigo-400 outline-none"/>
                    </div>
                    
                    {/* NIGHT STATS - OVERRIDES */}
                    <div className="mt-3 pt-3 border-t border-indigo-500/30">
                        <label className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Swords className="w-4 h-4"/> Noční Statistiky (Přepíší denní)
                        </label>
                        <p className="text-[10px] text-indigo-400/60 mb-3">
                            Zde definujte jiné HP, Útok nebo bonusy platné pouze v noci.
                        </p>

                        {(newEvent.timeVariant.nightStats || []).map((stat, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input 
                                    placeholder="Typ (HP/ATK)" 
                                    value={stat.label} 
                                    onChange={(e) => updateNightStat(idx, 'label', e.target.value)}
                                    className="w-1/3 bg-black/50 border border-indigo-500/30 p-2 rounded text-white text-xs uppercase"
                                />
                                <input 
                                    placeholder="Hodnota" 
                                    value={stat.value} 
                                    onChange={(e) => updateNightStat(idx, 'value', e.target.value)}
                                    className="flex-1 bg-black/50 border border-indigo-500/30 p-2 rounded text-white text-xs font-mono"
                                />
                                <button type="button" onClick={() => removeNightStat(idx)} className="text-red-400 hover:text-white bg-red-900/20 p-2 rounded"><X className="w-4 h-4"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={addNightStat} className="text-xs bg-indigo-900/40 hover:bg-indigo-800 text-indigo-200 px-3 py-2 rounded flex items-center gap-1 border border-indigo-500/30 transition-colors">+ Přidat Noční Stat</button>
                    </div>
                </div>
            )}
        </div>

        {/* --- CLASS SPECIFIC VARIANTS --- */}
        <div className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border border-orange-500/50 rounded-lg p-4 mt-6">
            <div className="flex items-center gap-2 mb-4 text-orange-400">
                <Users className="w-5 h-5" />
                <div>
                    <h4 className="text-sm font-bold text-orange-200 uppercase tracking-wide">Třídní Mutace</h4>
                    <p className="text-[10px] text-orange-300/60">Co vidí Válečník, Mág nebo Zloděj jinak?</p>
                </div>
            </div>

            {/* Tabs for Classes */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                {Object.values(PlayerClass).map((pClass) => (
                    <button
                        key={pClass}
                        type="button"
                        onClick={() => setActiveClassEdit(activeClassEdit === pClass ? null : pClass)}
                        className={`px-3 py-1 rounded text-xs font-bold uppercase whitespace-nowrap transition-colors border ${
                            activeClassEdit === pClass 
                            ? 'bg-orange-600 text-white border-orange-400' 
                            : newEvent.classVariants?.[pClass] ? 'bg-orange-900/40 text-orange-200 border-orange-800' : 'bg-zinc-900 text-zinc-500 border-zinc-700'
                        }`}
                    >
                        {pClass} {newEvent.classVariants?.[pClass] && '✓'}
                    </button>
                ))}
            </div>

            {activeClassEdit && (
                <div className="space-y-4 animate-in fade-in bg-black/30 p-4 rounded-lg border border-orange-500/30">
                    <div className="flex justify-between items-center">
                        <span className="text-orange-400 font-bold uppercase text-xs">Varianta pro: {activeClassEdit}</span>
                        <button type="button" onClick={() => removeClassVariant(activeClassEdit)} className="text-[10px] text-red-400 hover:text-red-300 uppercase">Smazat variantu</button>
                    </div>
                    
                    <div>
                        <label className="text-xs font-bold text-orange-300 uppercase tracking-widest">Alternativní Název</label>
                        <input
                            type="text"
                            placeholder={newEvent.title}
                            value={newEvent.classVariants?.[activeClassEdit]?.overrideTitle || ''}
                            onChange={(e) => updateClassVariant('overrideTitle', e.target.value)}
                            className="w-full bg-black/50 border border-orange-500/30 p-2 rounded text-white text-sm focus:border-orange-400 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-orange-300 uppercase tracking-widest">Alternativní Popis</label>
                        <textarea
                            rows={2}
                            placeholder={newEvent.description}
                            value={newEvent.classVariants?.[activeClassEdit]?.overrideDescription || ''}
                            onChange={(e) => updateClassVariant('overrideDescription', e.target.value)}
                            className="w-full bg-black/50 border border-orange-500/30 p-2 rounded text-zinc-300 text-xs focus:border-orange-400 outline-none"
                        />
                    </div>
                    
                    <div className="border-t border-orange-500/30 pt-3">
                        <label className="text-xs font-bold text-orange-300 uppercase tracking-widest mb-2 block">Statistiky (Přepíší základní)</label>
                        {(newEvent.classVariants?.[activeClassEdit]?.bonusStats || []).map((stat, idx) => (
                            <div key={idx} className="flex gap-2 mb-2">
                                <input 
                                    placeholder="INT" 
                                    value={stat.label} 
                                    onChange={(e) => updateClassStat(idx, 'label', e.target.value)}
                                    className="w-1/3 bg-black/50 border border-orange-500/30 p-1 rounded text-white text-xs"
                                />
                                <input 
                                    placeholder="+5" 
                                    value={stat.value} 
                                    onChange={(e) => updateClassStat(idx, 'value', e.target.value)}
                                    className="flex-1 bg-black/50 border border-orange-500/30 p-1 rounded text-white text-xs"
                                />
                                <button type="button" onClick={() => removeClassStat(idx)} className="text-red-400 hover:text-white"><X className="w-4 h-4"/></button>
                            </div>
                        ))}
                        <button type="button" onClick={addClassStat} className="text-xs text-orange-400 hover:text-white flex items-center gap-1">+ Přidat Stat</button>
                    </div>
                </div>
            )}
        </div>

        <button
          type="submit"
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-display font-bold text-sm tracking-widest uppercase shadow-lg transition-all ${
              isEditingMode 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                : 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] active:scale-[0.98]'
          }`}
        >
          <Save className="w-5 h-5" /> 
          {isEditingMode ? 'Uložit Změny' : 'Vytvořit Kartu'}
        </button>
      </form>
    </div>
  );
};

export default Generator;