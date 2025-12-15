import React, { useState, useEffect } from 'react';
import { GameEvent, GameEventType, Stat, DilemmaOption, BossPhase, PlayerClass } from '../types'; 
import { Plus, Minus, Save, QrCode, Download, Share2, Coins, ShoppingBag, Package, X, RotateCcw, Split, Trash2, Backpack, Skull, Shield, Sword, Heart, Crown, Zap, Clock, Activity, Sun, Moon, Wand2, Footprints, Cross, Users } from 'lucide-react'; 
import { playSound } from '../services/soundService';

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

  // Merchant Inventory State
  const [merchantInputId, setMerchantInputId] = useState('');
  const [merchantInputStock, setMerchantInputStock] = useState<number>(1);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Class Variant Editing State
  const [activeClassEdit, setActiveClassEdit] = useState<PlayerClass | null>(null);

  // Load initial data if provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setNewEvent({
          ...initialEventState, // Defaults
          ...initialData,       // Overrides
          dilemmaOptions: initialData.dilemmaOptions || [],
          merchantItems: initialData.merchantItems || [],
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
      setMerchantInputId('');
      setMerchantInputStock(1);
      if (onClearData) onClearData();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const { name, checked } = e.target;
     setNewEvent((prev) => ({ ...prev, [name]: checked }));
  };

  const handleStatChange = (index: number, field: keyof Stat, value: string) => {
    const updatedStats: Stat[] = newEvent.stats ? [...newEvent.stats] : [];
    if (!updatedStats[index]) {
      updatedStats[index] = { label: '', value: '' }; 
    }
    updatedStats[index] = { ...(updatedStats[index] as Stat), [field]: value };
    setNewEvent((prev) => ({ ...prev, stats: updatedStats }));
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
      setNewEvent(prev => ({
          ...prev,
          timeVariant: {
              ...prev.timeVariant,
              enabled: true,
              nightStats: [...(prev.timeVariant?.nightStats || []), { label: '', value: '' }]
          }
      }));
  };

  const updateNightStat = (index: number, field: keyof Stat, value: string) => {
      setNewEvent(prev => {
          const stats = [...(prev.timeVariant?.nightStats || [])];
          if(stats[index]) stats[index] = { ...stats[index], [field]: value };
          return {
              ...prev,
              timeVariant: { ...prev.timeVariant, enabled: true, nightStats: stats }
          };
      });
  };

  const removeNightStat = (index: number) => {
      setNewEvent(prev => ({
          ...prev,
          timeVariant: {
              ...prev.timeVariant,
              enabled: true,
              nightStats: (prev.timeVariant?.nightStats || []).filter((_, i) => i !== index)
          }
      }));
  };


  // --- ENCOUNTER/BOSS STATS HELPER ---
  const updateCombatStat = (label: 'HP' | 'DEF' | 'ATK', value: string) => {
      setNewEvent(prev => {
          const currentStats = [...(prev.stats || [])];
          const filteredStats = currentStats.filter(s => s.label.toUpperCase() !== label);
          filteredStats.push({ label, value });
          return { ...prev, stats: filteredStats };
      });
  };

  const getCombatStatValue = (label: 'HP' | 'DEF' | 'ATK'): string => {
      const stat = newEvent.stats?.find(s => s.label.toUpperCase() === label);
      return stat ? String(stat.value) : '';
  };

  // --- MERCHANT INVENTORY LOGIC ---
  const addMerchantItem = () => {
      if(!merchantInputId.trim()) return;
      setNewEvent(prev => ({
          ...prev,
          merchantItems: [...(prev.merchantItems || []), { 
              id: merchantInputId.trim(), 
              stock: Math.max(1, merchantInputStock) 
          }]
      }));
      setMerchantInputId('');
      setMerchantInputStock(1);
  };

  const removeMerchantItem = (index: number) => {
      setNewEvent(prev => ({
          ...prev,
          merchantItems: (prev.merchantItems || []).filter((_, i) => i !== index)
      }));
  };

  const updateMerchantItemStock = (index: number, newStock: number) => {
      setNewEvent(prev => {
          const items = [...(prev.merchantItems || [])];
          if (items[index]) {
              items[index] = { ...items[index], stock: Math.max(0, newStock) };
          }
          return { ...prev, merchantItems: items };
      });
  };

  // --- DILEMMA LOGIC ---
  const addDilemmaOption = () => {
      setNewEvent(prev => ({
          ...prev,
          dilemmaOptions: [...(prev.dilemmaOptions || []), {
              label: '',
              consequenceText: '',
              physicalInstruction: '',
              effectType: 'none',
              effectValue: 0
          }]
      }));
  };

  const removeDilemmaOption = (index: number) => {
      setNewEvent(prev => ({
          ...prev,
          dilemmaOptions: (prev.dilemmaOptions || []).filter((_, i) => i !== index)
      }));
  };

  const updateDilemmaOption = (index: number, field: keyof DilemmaOption, value: any) => {
      setNewEvent(prev => {
          const opts = [...(prev.dilemmaOptions || [])];
          if(opts[index]) {
              opts[index] = { ...opts[index], [field]: value };
          }
          return { ...prev, dilemmaOptions: opts };
      });
  };

  // --- BOSS PHASES LOGIC ---
  const addBossPhase = () => {
      setNewEvent(prev => ({
          ...prev,
          bossPhases: [...(prev.bossPhases || []), {
              triggerType: 'TURN',
              triggerValue: 1,
              name: '',
              description: '',
              damageBonus: 0
          }]
      }));
  };

  const removeBossPhase = (index: number) => {
      setNewEvent(prev => ({
          ...prev,
          bossPhases: (prev.bossPhases || []).filter((_, i) => i !== index)
      }));
  };

  const updateBossPhase = (index: number, field: keyof BossPhase, value: any) => {
      setNewEvent(prev => {
          const phases = [...(prev.bossPhases || [])];
          if(phases[index]) {
              phases[index] = { ...phases[index], [field]: value };
          }
          return { ...prev, bossPhases: phases };
      });
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
  const isBoss = newEvent.type === GameEventType.BOSS;

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

        {/* --- DYNAMIC NIGHT TIME VARIANT SECTION --- */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 border border-indigo-500/50 rounded-lg p-4 mt-6">
            {/* ... (Existing Night Time UI) ... */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Moon className="w-5 h-5 text-indigo-400" />
                    <div>
                        <h4 className="text-sm font-bold text-indigo-200 uppercase tracking-wide">Dynamická Mutace (Den/Noc)</h4>
                        <p className="text-[10px] text-indigo-300/60">Pokud je aktivní, karta se v noci změní.</p>
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
                    {/* ... stats ... */}
                </div>
            )}
        </div>

        {/* --- CLASS SPECIFIC VARIANTS (NEW) --- */}
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

        {/* ... (Rest of the form - Price, Consumable, Shareable, Dilemma, etc.) ... */}
        {/* Keeping existing conditional blocks for Price/Consumable, Dilemma, Merchant, Boss */}
        {!isMerchant && !isDilemma && !isEncounter && !isBoss && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Coins className="w-3 h-3" /> Cena (Kredity)
                  </label>
                  <input type="number" name="price" value={newEvent.price || 0} onChange={handleChange} placeholder="0" className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-yellow-500 font-mono font-bold focus:border-yellow-500 outline-none"/>
                </div>
                
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3">
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
            </div>
        )}

        {/* ... (Shareable Toggle) ... */}
        {!isDilemma && !isEncounter && !isBoss && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
                <div><h4 className="text-sm font-bold text-white flex items-center gap-2"><Share2 className="w-4 h-4 text-neon-green" /> Povolit Sdílení</h4></div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="isShareable" className="sr-only peer" checked={newEvent.isShareable ?? true} onChange={handleCheckboxChange}/>
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                </label>
            </div>
        )}

        {/* ... (Existing conditional renders for Dilemma, Merchant, Boss, Encounter, Stats) ... */}
        {/* Just keeping the generic stats block here as a fallback/standard */}
        {!isDilemma && !isMerchant && !isBoss && !isEncounter && (
            <div className="space-y-4 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-lg font-display font-bold text-white mb-2">Statistiky Aktiva</h3>
            {(newEvent.stats || []).map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                <input type="text" value={stat.label} onChange={(e) => handleStatChange(index, 'label', e.target.value)} placeholder="Popisek" className="flex-1 bg-zinc-800 border border-zinc-700 p-2 rounded text-white text-xs uppercase font-mono outline-none"/>
                <input type="text" value={stat.value} onChange={(e) => handleStatChange(index, 'value', e.target.value)} placeholder="Hodnota" className="flex-1 bg-zinc-800 border border-zinc-700 p-2 rounded text-white text-xs font-mono outline-none"/>
                <button type="button" onClick={() => removeStat(index)} className="p-2 bg-red-900/20 text-red-400 rounded-full hover:bg-red-900/40 transition-colors"><Minus className="w-4 h-4" /></button>
                </div>
            ))}
            <button type="button" onClick={addStat} className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-neon-blue rounded-lg font-bold text-sm transition-colors"><Plus className="w-4 h-4" /> Přidat statistiku</button>
            </div>
        )}

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