
import React, { useState, useEffect } from 'react';
import { GameEvent, GameEventType, Stat, DilemmaOption } from '../types'; 
import { Plus, Minus, Save, QrCode, Download, Share2, Coins, ShoppingBag, Package, X, RotateCcw, Split, Trash2, Backpack, Lock, Unlock } from 'lucide-react'; 
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
  canBeSaved: true, // Default true for normal items
  price: 0,
  merchantItems: [],
  dilemmaOptions: []
};

// Admin email constant for validation
const ADMIN_EMAIL = 'zbynekbal97@gmail.com';

const getQrColor = (type: GameEventType): string => {
    switch (type) {
        case GameEventType.TRAP:
        case GameEventType.ENCOUNTER:
            return 'ef4444'; // Red-500
        case GameEventType.DILEMA:
            return 'bc13fe'; // Neon Purple
        case GameEventType.MERCHANT:
            return 'eab308'; // Yellow-500
        case GameEventType.LOCATION:
            return '10b981'; // Emerald-500
        case GameEventType.ITEM:
        default:
            return '000000'; // Black
    }
};

const Generator: React.FC<GeneratorProps> = ({ onSaveCard, userEmail, initialData, onClearData }) => {
  const [newEvent, setNewEvent] = useState<GameEvent>(initialEventState);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  // Merchant Inventory State
  const [merchantInputId, setMerchantInputId] = useState('');
  const [merchantInputStock, setMerchantInputStock] = useState<number>(1);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // SAFETY LOCK STATE
  const [isSafetyLocked, setIsSafetyLocked] = useState(true);

  // Load initial data if provided (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setNewEvent({
          ...initialEventState, // Defaults
          ...initialData,       // Overrides
          dilemmaOptions: initialData.dilemmaOptions || [],
          merchantItems: initialData.merchantItems || [],
          stats: initialData.stats || []
      });
      setIsEditingMode(true);
      // Auto-unlock when editing existing item
      setIsSafetyLocked(true); 
      const scrollContainer = document.querySelector('.overflow-y-auto');
      if (scrollContainer) scrollContainer.scrollTop = 0;
    } else {
        setNewEvent(initialEventState);
        setIsEditingMode(false);
    }
  }, [initialData]);

  const toggleSafetyLock = () => {
      if (isSafetyLocked) {
          if(confirm("Opravdu chcete odemknout zápis do databáze?")) {
              setIsSafetyLocked(false);
              playSound('open');
          }
      } else {
          setIsSafetyLocked(true);
          playSound('click');
      }
  };

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
    if (isSafetyLocked) {
        setFeedback({ message: 'Pro uložení musíte odemknout bezpečnostní zámek (ikona zámku nahoře).', type: 'error' });
        playSound('error');
        return;
    }

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

      // Ensure consistency: If not consumable, save toggle implies true (always savable)
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

  return (
    <div className="h-full overflow-y-auto p-6 pb-24 no-scrollbar">
      {/* HEADER & SAFETY LOCK */}
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4 sticky top-0 bg-zinc-950/95 backdrop-blur z-20">
        <div>
            <h1 className="text-3xl font-display font-bold">
                {isEditingMode ? 'Úprava' : 'Fabrikace'} <span className="text-neon-blue">Aktiva</span>
            </h1>
            {isEditingMode && <p className="text-[10px] text-zinc-500 font-mono">Režim úpravy existující karty</p>}
        </div>
        <div className="flex gap-2 items-center">
            {/* SAFETY LOCK BUTTON */}
            <button
                onClick={toggleSafetyLock}
                className={`p-2 rounded-lg border transition-all duration-300 ${
                    isSafetyLocked 
                        ? 'bg-red-900/20 border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                        : 'bg-green-900/20 border-green-500 text-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)]'
                }`}
                title={isSafetyLocked ? "Zápis uzamčen" : "Zápis povolen - OPATRNĚ!"}
            >
                {isSafetyLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
            </button>

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

        {/* Basic Info */}
        <div>
          <label htmlFor="id" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">ID Aktiva (Unikátní)</label>
          <div className="relative">
            <input
                type="text"
                id="id"
                name="id"
                value={newEvent.id}
                onChange={handleChange}
                placeholder={isMerchant ? "SHOP-001" : isDilemma ? "DILEMA-01" : "ITEM-001"}
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
          <input
            type="text"
            id="title"
            name="title"
            value={newEvent.title}
            onChange={handleChange}
            placeholder="Název..."
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-display focus:border-neon-blue outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Popis / Příběh</label>
          <textarea
            id="description"
            name="description"
            value={newEvent.description}
            onChange={handleChange}
            rows={4}
            placeholder="Popis..."
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white resize-y font-serif focus:border-neon-blue outline-none"
            required
          />
        </div>

        {/* Type, Rarity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Typ Aktiva</label>
            <select
              id="type"
              name="type"
              value={newEvent.type}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-mono focus:border-neon-blue outline-none"
            >
              {Object.values(GameEventType).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="rarity" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Vzácnost</label>
            <select
              id="rarity"
              name="rarity"
              value={newEvent.rarity}
              onChange={handleChange}
              className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-mono focus:border-neon-blue outline-none"
            >
              {['Common', 'Rare', 'Epic', 'Legendary'].map((rarity) => (
                <option key={rarity} value={rarity}>
                  {rarity}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* PRICE & CONSUMABLE INPUT (For items only) */}
        {!isMerchant && !isDilemma && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <Coins className="w-3 h-3" /> Cena (Kredity)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={newEvent.price || 0}
                    onChange={handleChange}
                    placeholder="0"
                    className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-yellow-500 font-mono font-bold focus:border-yellow-500 outline-none"
                  />
                </div>
                
                {/* CONSUMABLE LOGIC CONTAINER */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-3 rounded-lg flex flex-col gap-3">
                    {/* 1. Toggle Consumable */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white flex items-center gap-1"><Trash2 className="w-3 h-3 text-red-500"/> Jednorázové?</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="isConsumable"
                                className="sr-only peer"
                                checked={newEvent.isConsumable ?? false}
                                onChange={handleCheckboxChange}
                            />
                            <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>

                    {/* 2. Toggle Can Be Saved (Only if Consumable is checked) */}
                    {newEvent.isConsumable && (
                         <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2 pt-2 border-t border-zinc-800">
                             <div>
                                <span className="text-xs font-bold text-white flex items-center gap-1"><Backpack className="w-3 h-3 text-neon-blue"/> Povolit Uložení?</span>
                                <p className="text-[9px] text-zinc-500 mt-0.5">Pokud zapnuto, hráč může kartu uložit do batohu a použít později. Pokud vypnuto, musí ji použít ihned po naskenování.</p>
                             </div>
                             <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-2">
                                 <input 
                                     type="checkbox" 
                                     name="canBeSaved"
                                     className="sr-only peer"
                                     checked={newEvent.canBeSaved ?? true}
                                     onChange={handleCheckboxChange}
                                 />
                                 <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-blue"></div>
                             </label>
                         </div>
                    )}
                </div>
            </div>
        )}

        {/* Shareability Toggle */}
        {!isDilemma && (
            <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-lg flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Share2 className="w-4 h-4 text-neon-green" /> Povolit Sdílení
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-1">Umožňuje hráčům tuto kartu směňovat nebo darovat.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        type="checkbox" 
                        name="isShareable"
                        className="sr-only peer"
                        checked={newEvent.isShareable ?? true}
                        onChange={handleCheckboxChange}
                    />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-green"></div>
                </label>
            </div>
        )}

        {/* CONDITIONAL SECTIONS BASED ON TYPE */}
        {isDilemma ? (
            <div className="space-y-4 border border-neon-purple/30 bg-neon-purple/5 rounded-lg p-4 relative">
                {/* ... Dilemma Form Logic (Unchanged) ... */}
                <div className="flex items-center gap-2 text-neon-purple mb-2">
                    <Split className="w-5 h-5" />
                    <h3 className="text-lg font-display font-bold">Volby Dilematu</h3>
                </div>
                {(newEvent.dilemmaOptions || []).map((option, index) => (
                    <div key={index} className="bg-black/40 border border-zinc-700 rounded-lg p-3 space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white uppercase bg-zinc-800 px-2 py-1 rounded">Možnost {index + 1}</span>
                            <button type="button" onClick={() => removeDilemmaOption(index)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4"/></button>
                        </div>
                        <input 
                            type="text"
                            placeholder="Text na tlačítku"
                            value={option.label}
                            onChange={(e) => updateDilemmaOption(index, 'label', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-white text-sm"
                        />
                        <textarea 
                            placeholder="Výsledek příběhu"
                            value={option.consequenceText}
                            onChange={(e) => updateDilemmaOption(index, 'consequenceText', e.target.value)}
                            rows={2}
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-zinc-300 text-xs font-serif"
                        />
                        <input 
                            type="text"
                            placeholder="Instrukce"
                            value={option.physicalInstruction}
                            onChange={(e) => updateDilemmaOption(index, 'physicalInstruction', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 p-2 rounded text-yellow-500 font-bold text-xs"
                        />
                        <div className="flex gap-2">
                             <select 
                                value={option.effectType}
                                onChange={(e) => updateDilemmaOption(index, 'effectType', e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 p-2 rounded text-white text-xs"
                            >
                                <option value="none">Bez efektu</option>
                                <option value="hp">HP</option>
                                <option value="gold">Kredity</option>
                            </select>
                            <input 
                                type="number"
                                placeholder="0"
                                value={option.effectValue}
                                onChange={(e) => updateDilemmaOption(index, 'effectValue', parseInt(e.target.value))}
                                className="w-20 bg-zinc-900 border border-zinc-700 p-2 rounded text-white text-xs font-mono"
                            />
                        </div>
                    </div>
                ))}
                <button
                    type="button"
                    onClick={addDilemmaOption}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-neon-purple rounded border border-zinc-700 text-xs font-bold uppercase"
                >
                    + Přidat Možnost
                </button>
            </div>
        ) : isMerchant ? (
             <div className="space-y-4 border border-zinc-800 rounded-lg p-4 bg-zinc-900/50">
                <h3 className="text-lg font-display font-bold text-white mb-2 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-neon-purple" /> Sklad Obchodníka
                </h3>
                {/* Merchant Logic (Unchanged) */}
                 <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {(newEvent.merchantItems || []).map((entry, index) => (
                        <div key={index} className="flex items-center gap-2 bg-zinc-800 border border-zinc-700 p-2 rounded">
                            <div className="flex-1 text-white font-mono text-sm truncate">{entry.id}</div>
                            <div className="flex items-center gap-1 bg-black px-2 py-1 rounded border border-zinc-700">
                                <Package className="w-3 h-3 text-zinc-400" />
                                <input 
                                    type="number"
                                    min="0"
                                    value={entry.stock}
                                    onChange={(e) => updateMerchantItemStock(index, parseInt(e.target.value))}
                                    className="w-10 bg-transparent text-white font-bold text-center text-xs outline-none"
                                />
                            </div>
                            <button type="button" onClick={() => removeMerchantItem(index)} className="p-1.5 bg-red-900/20 text-red-400 rounded"><X className="w-4 h-4" /></button>
                        </div>
                    ))}
                    <div className="flex gap-2 pt-2 border-t border-zinc-800">
                        <input type="text" value={merchantInputId} onChange={(e) => setMerchantInputId(e.target.value)} placeholder="ID" className="flex-1 bg-black border border-zinc-700 p-2 rounded text-white text-sm" />
                        <input type="number" value={merchantInputStock} onChange={(e) => setMerchantInputStock(parseInt(e.target.value))} min="1" className="w-16 bg-black border border-zinc-700 p-2 rounded text-white text-sm" />
                        <button type="button" onClick={addMerchantItem} className="px-3 bg-zinc-800 text-neon-blue rounded"><Plus className="w-5 h-5" /></button>
                    </div>
                </div>
             </div>
        ) : (
            <div className="space-y-4 border border-zinc-800 rounded-lg p-4">
            <h3 className="text-lg font-display font-bold text-white mb-2">Statistiky Aktiva</h3>
            {(newEvent.stats || []).map((stat, index) => (
                <div key={index} className="flex items-center gap-2">
                <input
                    type="text"
                    value={stat.label}
                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                    placeholder="Popisek (DMG, HP)"
                    className="flex-1 bg-zinc-800 border border-zinc-700 p-2 rounded text-white text-xs uppercase font-mono outline-none"
                />
                <input
                    type="text"
                    value={stat.value}
                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                    placeholder="Hodnota (20, 100)"
                    className="flex-1 bg-zinc-800 border border-zinc-700 p-2 rounded text-white text-xs font-mono outline-none"
                />
                <button
                    type="button"
                    onClick={() => removeStat(index)}
                    className="p-2 bg-red-900/20 text-red-400 rounded-full hover:bg-red-900/40 transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                </div>
            ))}
            <button
                type="button"
                onClick={addStat}
                className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-neon-blue rounded-lg font-bold text-sm transition-colors"
            >
                <Plus className="w-4 h-4" /> Přidat statistiku
            </button>
            </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSafetyLocked}
          className={`w-full flex items-center justify-center gap-2 py-4 rounded-lg font-display font-bold text-sm tracking-widest uppercase shadow-lg transition-all ${
              isSafetyLocked 
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
              : isEditingMode 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                : 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] active:scale-[0.98]'
          }`}
        >
          {isSafetyLocked ? <Lock className="w-5 h-5" /> : <Save className="w-5 h-5" />} 
          {isSafetyLocked ? 'Zápis Uzamčen' : (isEditingMode ? 'Uložit Změny' : 'Vytvořit Kartu')}
        </button>
      </form>
    </div>
  );
};

export default Generator;
