
import React from 'react';
import { GameEvent } from '../../types';
import { Coins } from 'lucide-react';

interface EnemyLootPanelProps {
    event: GameEvent;
    onUpdate: (updates: Partial<GameEvent>) => void;
}

const EnemyLootPanel: React.FC<EnemyLootPanelProps> = ({ event, onUpdate }) => {

    const updateLoot = (field: string, value: number) => {
        onUpdate({
            enemyLoot: {
                ...(event.enemyLoot || { goldReward: 20, xpReward: 10, dropItemChance: 0 }),
                [field]: value
            }
        });
    };

    return (
        <div className="mt-4 bg-arc-panel p-5 border border-arc-yellow/20 text-white">
            <h4 className="text-[10px] font-bold text-arc-yellow uppercase tracking-widest mb-4 flex items-center gap-2"><Coins className="w-4 h-4"/> Odměna_po_boji:</h4>
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase">Zlato</label>
                    <input 
                        type="number" 
                        value={event.enemyLoot?.goldReward ?? 0} 
                        onChange={(e) => updateLoot('goldReward', parseInt(e.target.value))} 
                        className="w-full bg-black border border-arc-border p-2 text-white text-xs text-center font-mono" 
                    />
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase">Exp_Data</label>
                    <input 
                        type="number" 
                        value={event.enemyLoot?.xpReward ?? 0} 
                        onChange={(e) => updateLoot('xpReward', parseInt(e.target.value))} 
                        className="w-full bg-black border border-arc-border p-2 text-white text-xs text-center font-mono" 
                    />
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase">Drop_%</label>
                    <input 
                        type="number" 
                        value={event.enemyLoot?.dropItemChance ?? 0} 
                        onChange={(e) => updateLoot('dropItemChance', parseInt(e.target.value))} 
                        className="w-full bg-black border border-arc-border p-2 text-white text-xs text-center font-mono" 
                    />
                </div>
            </div>
        </div>
    );
};

export default EnemyLootPanel;
