import React, { useState } from 'react';
import { GameEvent, GameEventType, Stat } from '../types'; // Added Stat import
import { Plus, Minus, SquarePen, Save } from 'lucide-react'; // Removed X

interface GeneratorProps {
  onSaveCard: (event: GameEvent) => void;
  userEmail: string; // To ensure context for saving
}

const initialEventState: GameEvent = {
  id: '',
  title: '',
  description: '',
  type: GameEventType.ITEM,
  rarity: 'Common',
  flavorText: '',
  stats: [],
};

const Generator: React.FC<GeneratorProps> = ({ onSaveCard, userEmail }) => {
  const [newEvent, setNewEvent] = useState<GameEvent>(initialEventState);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvent((prev) => ({ ...prev, [name]: value }));
  };

  // Corrected type for field parameter using Stat interface
  const handleStatChange = (index: number, field: keyof Stat, value: string) => {
    const updatedStats: Stat[] = newEvent.stats ? [...newEvent.stats] : [];
    // Ensure the stat object exists before trying to update its properties
    if (!updatedStats[index]) {
      updatedStats[index] = { label: '', value: '' }; // Initialize if undefined
    }
    // Update the specific field of the stat object
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
      await onSaveCard(newEvent); // This will handle both save and update
      setFeedback({ message: `Karta "${newEvent.title}" byla úspěšně uložena!`, type: 'success' });
      setNewEvent(initialEventState); // Reset form
    } catch (error: any) {
      let displayMessage = `Při ukládání karty došlo k chybě.`;
      if (error instanceof Error) {
        displayMessage = `Chyba při ukládání karty: ${error.message}`;
      } else if (typeof error === 'string') {
        displayMessage = `Chyba při ukládání karty: ${error}`;
      }
      
      // Specifically target "Failed to fetch" which is a network issue
      if (String(error).includes('Failed to fetch')) {
        displayMessage = `Chyba připojení: Nepodařilo se připojit k backend serveru. Zkontrolujte, zda je server spuštěný a síťové připojení.`;
      }

      setFeedback({ message: displayMessage, type: 'error' });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 pb-24 no-scrollbar">
      <div className="flex items-center justify-between mb-6 border-b border-zinc-800 pb-4">
        <h1 className="text-3xl font-display font-bold">Fabrikace <span className="text-neon-blue">Aktiva</span></h1>
        <SquarePen className="w-8 h-8 text-neon-blue" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Feedback message */}
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
          <input
            type="text"
            id="id"
            name="id"
            value={newEvent.id}
            onChange={handleChange}
            placeholder="Napr: WPN-001, ITEM-ALPHA"
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-mono uppercase focus:border-neon-blue outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Název Aktiva</label>
          <input
            type="text"
            id="title"
            name="title"
            value={newEvent.title}
            onChange={handleChange}
            placeholder="Napr: Experimentální Puška"
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white font-display focus:border-neon-blue outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Popis Aktiva</label>
          <textarea
            id="description"
            name="description"
            value={newEvent.description}
            onChange={handleChange}
            rows={4}
            placeholder="Podrobný popis funkce a vzhledu aktiva..."
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white resize-y font-serif focus:border-neon-blue outline-none"
            required
          />
        </div>

        {/* Type and Rarity */}
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
                  {type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}
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

        {/* Flavor Text */}
        <div>
          <label htmlFor="flavorText" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Flavour Text (Volitelné)</label>
          <textarea
            id="flavorText"
            name="flavorText"
            value={newEvent.flavorText}
            onChange={handleChange}
            rows={2}
            placeholder="Krátký citát nebo doplňkový text..."
            className="w-full bg-zinc-900 border border-zinc-700 p-3 rounded-lg text-white resize-y italic text-sm font-serif focus:border-neon-blue outline-none"
          />
        </div>

        {/* Stats */}
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
               <input
                type="text"
                value={stat.icon || ''}
                onChange={(e) => handleStatChange(index, 'icon', e.target.value)}
                placeholder="Ikona (volitelné)"
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

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-neon-blue to-neon-purple text-white rounded-lg font-display font-bold text-sm tracking-widest uppercase shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] active:scale-[0.98] transition-all"
        >
          <Save className="w-5 h-5" /> Vytvořit Kartu
        </button>
      </form>
    </div>
  );
};

export default Generator;