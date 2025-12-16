
import React from 'react';
import { GameEvent, DilemmaOption } from '../../types';
import { Split, User, Globe, X } from 'lucide-react';

interface DilemmaPanelProps {
    event: GameEvent;
    onUpdate: (updates: Partial<GameEvent>) => void;
}

const DilemmaPanel: React.FC<DilemmaPanelProps> = ({ event, onUpdate }) => {

    const addDilemmaOption = () => {
        const newOption: DilemmaOption = {
            label: `Volba ${(event.dilemmaOptions?.length || 0) + 1}`,
            consequenceText: '',
            physicalInstruction: '',
            effectType: 'none',
            effectValue: 0
        };
        onUpdate({
            dilemmaOptions: [...(event.dilemmaOptions || []), newOption]
        });
    };

    const updateDilemmaOption = (index: number, field: keyof DilemmaOption, value: any) => {
        const updatedOptions = [...(event.dilemmaOptions || [])];
        updatedOptions[index] = { ...updatedOptions[index], [field]: value };
        onUpdate({ dilemmaOptions: updatedOptions });
    };

    const removeDilemmaOption = (index: number) => {
        onUpdate({
            dilemmaOptions: (event.dilemmaOptions || []).filter((_, i) => i !== index)
        });
    };

    return (
        <div className="bg-gradient-to-br from-purple-900/30 to-black border border-purple-700 rounded-xl p-5 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <div className="flex items-center gap-3 mb-4 text-neon-purple border-b border-purple-900/50 pb-2">
                <Split className="w-6 h-6" />
                <h3 className="font-display font-bold uppercase tracking-widest">Možnosti Volby</h3>
            </div>

            {/* DILEMMA SCOPE SELECTOR */}
            <div className="mb-6 p-3 bg-black/40 rounded border border-purple-500/30 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Dosah Dilematu</span>
                    <span className="text-[10px] text-zinc-500">Kdo má toto dilema řešit?</span>
                </div>
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-700">
                    <button
                        type="button"
                        onClick={() => onUpdate({ dilemmaScope: 'INDIVIDUAL' })}
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2 transition-all ${event.dilemmaScope === 'INDIVIDUAL' ? 'bg-purple-600 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <User className="w-3 h-3" /> Jen Hráč
                    </button>
                    <button
                        type="button"
                        onClick={() => onUpdate({ dilemmaScope: 'GLOBAL' })}
                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase flex items-center gap-2 transition-all ${event.dilemmaScope === 'GLOBAL' ? 'bg-purple-600 text-white shadow' : 'text-zinc-500 hover:text-white'}`}
                    >
                        <Globe className="w-3 h-3" /> Všichni
                    </button>
                </div>
            </div>

            {event.dilemmaOptions?.map((opt, idx) => (
                <div key={idx} className="mb-4 bg-black/40 p-3 rounded border border-purple-500/30">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-purple-400">Volba #{idx + 1}</span>
                        <button type="button" onClick={() => removeDilemmaOption(idx)} className="text-red-500"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="space-y-2">
                        <input
                            placeholder="Text tlačítka (např. Zaútočit)"
                            value={opt.label}
                            onChange={(e) => updateDilemmaOption(idx, 'label', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-sm"
                        />
                        <textarea
                            placeholder="Příběhový následek (Co se stane v aplikaci?)"
                            value={opt.consequenceText}
                            onChange={(e) => updateDilemmaOption(idx, 'consequenceText', e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-700 rounded p-2 text-zinc-300 text-xs"
                            rows={2}
                        />
                        <textarea
                            placeholder="Instrukce pro deskovou hru (Co se stane na stole?)"
                            value={opt.physicalInstruction || ''}
                            onChange={(e) => updateDilemmaOption(idx, 'physicalInstruction', e.target.value)}
                            className="w-full bg-yellow-900/10 border border-yellow-700/50 rounded p-2 text-yellow-500 text-xs font-mono"
                            rows={2}
                        />
                        <div className="flex gap-2">
                            <select
                                value={opt.effectType}
                                onChange={(e) => updateDilemmaOption(idx, 'effectType', e.target.value)}
                                className="bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs"
                            >
                                <option value="none">Žádný efekt</option>
                                <option value="hp">Změna HP</option>
                                <option value="gold">Změna Kreditů</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Hodnota (-10, 50)"
                                value={opt.effectValue}
                                onChange={(e) => updateDilemmaOption(idx, 'effectValue', parseInt(e.target.value))}
                                className="flex-1 bg-zinc-900 border border-zinc-700 rounded p-2 text-white text-xs font-mono"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <button type="button" onClick={addDilemmaOption} className="w-full py-2 bg-purple-900/40 border border-purple-500/50 text-purple-300 rounded font-bold uppercase text-xs hover:bg-purple-900/60 transition-colors">
                + Přidat Volbu
            </button>
        </div>
    );
};

export default DilemmaPanel;
