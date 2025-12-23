
import React from 'react';
import { GameEvent, PlayerClass } from '../../types';
import { Zap } from 'lucide-react';

interface TrapPanelProps {
    event: GameEvent;
    onUpdate: (updates: Partial<GameEvent>) => void;
}

const TrapPanel: React.FC<TrapPanelProps> = ({ event, onUpdate }) => {
    
    const updateTrapConfig = (field: string, value: any) => {
        onUpdate({
            trapConfig: {
                ...(event.trapConfig || { 
                    difficulty: 10, 
                    damage: 20, 
                    disarmClass: PlayerClass.ROGUE, 
                    successMessage: "Past zneškodněna.", 
                    failMessage: "Past sklapla!" 
                }),
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-4 bg-arc-panel p-5 border border-arc-red/30 text-white">
            <div className="flex items-center gap-2 mb-2 text-arc-red border-b border-arc-red/20 pb-2">
                <Zap className="w-5 h-5"/>
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest">Nástraha_konfigurace:</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest">Kolik musí hodit hráč kostkou??</label>
                    <input 
                        type="number" 
                        value={event.trapConfig?.difficulty ?? 10} 
                        onChange={(e) => updateTrapConfig('difficulty', parseInt(e.target.value))} 
                        className="w-full bg-black border border-arc-red/40 p-3 text-white font-mono text-sm" 
                    />
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest">DMG po prohře:</label>
                    <input 
                        type="number" 
                        value={event.trapConfig?.damage ?? 20} 
                        onChange={(e) => updateTrapConfig('damage', parseInt(e.target.value))} 
                        className="w-full bg-black border border-arc-red/40 p-3 text-arc-red font-mono text-sm" 
                    />
                </div>
            </div>
            <div>
                <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest">Pro jakou postavu ??</label>
                <select 
                    value={event.trapConfig?.disarmClass ?? 'ANY'} 
                    onChange={(e) => updateTrapConfig('disarmClass', e.target.value)} 
                    className="w-full bg-black border border-arc-border p-3 text-white text-xs font-mono uppercase focus:ring-1 focus:ring-arc-yellow outline-none"
                >
                    <option value="ANY" className="bg-arc-panel text-white">UNSPECIFIED</option>
                    {Object.values(PlayerClass).map(c => <option key={c} value={c} className="bg-arc-panel text-white">{c}</option>)}
                </select>
            </div>
        </div>
    );
};

export default TrapPanel;
