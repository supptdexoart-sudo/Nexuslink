
import React from 'react';
import { GameEvent } from '../../types';
import { Satellite, Wind, Shield, Battery, Radio } from 'lucide-react';

interface SpaceStationPanelProps {
    event: GameEvent;
    onUpdate: (updates: Partial<GameEvent>) => void;
}

const SpaceStationPanel: React.FC<SpaceStationPanelProps> = ({ event, onUpdate }) => {

    const updateConfig = (field: string, value: any) => {
        onUpdate({
            stationConfig: {
                ...(event.stationConfig || { 
                    o2RefillPrice: 10, 
                    armorRepairPrice: 50, 
                    energyRechargePrice: 25,
                    welcomeMessage: "Vítejte na palubě."
                }),
                [field]: value
            }
        });
    };

    return (
        <div className="space-y-4 bg-arc-panel p-5 border border-cyan-500/30 text-white shadow-[0_0_20px_rgba(34,211,238,0.1)]">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 border-b border-cyan-500/20 pb-2">
                <Satellite className="w-5 h-5"/>
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest">Konfigurace Stanice:</h3>
            </div>
            
            <div>
                <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest flex items-center gap-1 mb-1"><Radio className="w-3 h-3"/> Uvítací Zpráva:</label>
                <input 
                    type="text" 
                    value={event.stationConfig?.welcomeMessage ?? "Vítejte na palubě."} 
                    onChange={(e) => updateConfig('welcomeMessage', e.target.value)} 
                    className="w-full bg-black border border-cyan-500/30 p-2 text-white text-xs font-mono" 
                    placeholder="Systémy online..."
                />
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest flex items-center gap-1 mb-1"><Wind className="w-3 h-3 text-cyan-200"/> O2 Refill (Gold)</label>
                    <input 
                        type="number" 
                        value={event.stationConfig?.o2RefillPrice ?? 10} 
                        onChange={(e) => updateConfig('o2RefillPrice', parseInt(e.target.value))} 
                        className="w-full bg-black border border-cyan-500/30 p-2 text-white font-mono text-sm text-center" 
                    />
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest flex items-center gap-1 mb-1"><Shield className="w-3 h-3 text-slate-300"/> Repair (Gold)</label>
                    <input 
                        type="number" 
                        value={event.stationConfig?.armorRepairPrice ?? 50} 
                        onChange={(e) => updateConfig('armorRepairPrice', parseInt(e.target.value))} 
                        className="w-full bg-black border border-cyan-500/30 p-2 text-white font-mono text-sm text-center" 
                    />
                </div>
                <div>
                    <label className="text-[8px] text-zinc-300 uppercase font-bold tracking-widest flex items-center gap-1 mb-1"><Battery className="w-3 h-3 text-green-400"/> Energy (Gold)</label>
                    <input 
                        type="number" 
                        value={event.stationConfig?.energyRechargePrice ?? 25} 
                        onChange={(e) => updateConfig('energyRechargePrice', parseInt(e.target.value))} 
                        className="w-full bg-black border border-cyan-500/30 p-2 text-white font-mono text-sm text-center" 
                    />
                </div>
            </div>
        </div>
    );
};

export default SpaceStationPanel;