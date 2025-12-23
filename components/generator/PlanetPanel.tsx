
import React from 'react';
import { GameEvent, PlanetLayer } from '../../types';
import { Globe, Plus, Trash2, Crosshair, Flag } from 'lucide-react';

interface PlanetPanelProps {
    event: GameEvent;
    onUpdate: (updates: Partial<GameEvent>) => void;
}

const PlanetPanel: React.FC<PlanetPanelProps> = ({ event, onUpdate }) => {

    const updatePlanetConfig = (field: string, value: any) => {
        onUpdate({
            planetConfig: {
                ...(event.planetConfig || {
                    realName: "Nová Planeta",
                    unknownName: "Neznámý Objekt",
                    planetType: 'HABITABLE',
                    scanCost: 10,
                    scanProgressPerAction: 20,
                    layers: [],
                    finalReward: { gold: 50, xp: 100 }
                }),
                [field]: value
            }
        });
    };

    const updateReward = (field: string, value: any) => {
        const currentReward = event.planetConfig?.finalReward || { gold: 0, xp: 0 };
        updatePlanetConfig('finalReward', { ...currentReward, [field]: value });
    };

    const addLayer = () => {
        const layers = [...(event.planetConfig?.layers || [])];
        const nextProgress = layers.length === 0 ? 33 : layers.length === 1 ? 66 : 100;
        layers.push({ requiredProgress: nextProgress, logText: "Nové log..." });
        updatePlanetConfig('layers', layers);
    };

    const updateLayer = (index: number, field: keyof PlanetLayer, value: any) => {
        const layers = [...(event.planetConfig?.layers || [])];
        layers[index] = { ...layers[index], [field]: value };
        updatePlanetConfig('layers', layers);
    };

    const removeLayer = (index: number) => {
        const layers = (event.planetConfig?.layers || []).filter((_, i) => i !== index);
        updatePlanetConfig('layers', layers);
    };

    return (
        <div className="bg-gradient-to-br from-indigo-950/40 to-black border border-indigo-500/50 rounded-xl p-5 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="flex items-center gap-3 mb-6 text-indigo-400 border-b border-indigo-900/50 pb-2">
                <Globe className="w-6 h-6" />
                <h3 className="font-display font-bold uppercase tracking-widest">Konfigurace Planety</h3>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="text-[8px] text-indigo-300 uppercase font-bold tracking-widest block mb-1">Tajné Jméno (Odhalení 100%)</label>
                    <input 
                        value={event.planetConfig?.realName || ''}
                        onChange={(e) => updatePlanetConfig('realName', e.target.value)}
                        placeholder="Např. Kepler-186f"
                        className="w-full bg-black border border-indigo-900 p-2 text-white font-mono text-sm focus:border-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="text-[8px] text-indigo-300 uppercase font-bold tracking-widest block mb-1">Krycí Jméno (Před skenováním)</label>
                    <input 
                        value={event.planetConfig?.unknownName || ''}
                        onChange={(e) => updatePlanetConfig('unknownName', e.target.value)}
                        placeholder="Např. Anomálie #832"
                        className="w-full bg-black border border-indigo-900 p-2 text-white font-mono text-sm focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
                <div>
                    <label className="text-[8px] text-indigo-300 uppercase font-bold block mb-1">Typ Planety</label>
                    <select 
                        value={event.planetConfig?.planetType || 'HABITABLE'}
                        onChange={(e) => updatePlanetConfig('planetType', e.target.value)}
                        className="w-full bg-black border border-indigo-900 p-2 text-white text-xs"
                    >
                        <option value="HABITABLE">Obyvatelná (Zelená)</option>
                        <option value="BARREN">Pustá (Šedá)</option>
                        <option value="ANOMALY">Anomálie (Fialová)</option>
                        <option value="COLONY">Kolonie (Oranžová)</option>
                    </select>
                </div>
                <div>
                    <label className="text-[8px] text-indigo-300 uppercase font-bold block mb-1">Cena Skenu (Palivo)</label>
                    <input 
                        type="number"
                        value={event.planetConfig?.scanCost || 10}
                        onChange={(e) => updatePlanetConfig('scanCost', parseInt(e.target.value))}
                        className="w-full bg-black border border-indigo-900 p-2 text-white text-xs text-center"
                    />
                </div>
                <div>
                    <label className="text-[8px] text-indigo-300 uppercase font-bold block mb-1">% za Sken</label>
                    <input 
                        type="number"
                        value={event.planetConfig?.scanProgressPerAction || 20}
                        onChange={(e) => updatePlanetConfig('scanProgressPerAction', parseInt(e.target.value))}
                        className="w-full bg-black border border-indigo-900 p-2 text-white text-xs text-center"
                    />
                </div>
            </div>

            {/* LAYERS */}
            <div className="mb-6 space-y-3">
                <div className="flex justify-between items-center border-b border-indigo-900/30 pb-1">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase flex items-center gap-2"><Crosshair className="w-3 h-3"/> Fáze Odhalování (Vrstvy)</span>
                    <button onClick={addLayer} className="text-[9px] bg-indigo-900/50 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-800 uppercase font-bold">+ Přidat Fázi</button>
                </div>
                
                {event.planetConfig?.layers.map((layer, idx) => (
                    <div key={idx} className="bg-black/40 border border-indigo-900/50 p-3 rounded flex gap-3 items-start">
                        <div className="w-16">
                            <label className="text-[8px] text-zinc-500 uppercase block">Kdy (%)</label>
                            <input 
                                type="number"
                                value={layer.requiredProgress}
                                onChange={(e) => updateLayer(idx, 'requiredProgress', parseInt(e.target.value))}
                                className="w-full bg-black border border-zinc-800 p-1 text-white text-xs text-center"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-[8px] text-zinc-500 uppercase block">Palubní Log (Příběh)</label>
                            <textarea 
                                value={layer.logText}
                                onChange={(e) => updateLayer(idx, 'logText', e.target.value)}
                                className="w-full bg-black border border-zinc-800 p-1 text-zinc-300 text-xs font-mono"
                                rows={2}
                            />
                        </div>
                        <button onClick={() => removeLayer(idx)} className="text-red-500 hover:text-red-400 mt-4"><Trash2 className="w-3 h-3"/></button>
                    </div>
                ))}
            </div>

            {/* REWARD */}
            <div className="bg-yellow-900/10 border border-yellow-700/30 p-3 rounded">
                <div className="flex items-center gap-2 mb-2 text-yellow-500">
                    <Flag className="w-4 h-4"/>
                    <span className="text-[10px] font-bold uppercase">Odměna za 100% průzkum</span>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-bold">Gold:</span>
                        <input 
                            type="number"
                            value={event.planetConfig?.finalReward?.gold || 0}
                            onChange={(e) => updateReward('gold', parseInt(e.target.value))}
                            className="w-16 bg-black border border-yellow-900/50 p-1 text-yellow-500 font-mono text-sm text-center"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 font-bold">XP:</span>
                        <input 
                            type="number"
                            value={event.planetConfig?.finalReward?.xp || 0}
                            onChange={(e) => updateReward('xp', parseInt(e.target.value))}
                            className="w-16 bg-black border border-yellow-900/50 p-1 text-purple-400 font-mono text-sm text-center"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlanetPanel;
