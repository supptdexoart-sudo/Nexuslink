
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Users, Radio, Gavel, X, RefreshCw, Zap, Heart, Database, Send, Sun, Moon } from 'lucide-react';
import * as apiService from '../services/apiService';
import { playSound, vibrate } from '../services/soundService';

interface AdminDashboardProps {
    onClose: () => void;
    currentRoomId?: string;
    onToggleDayNight?: () => void;
    isNight?: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose, currentRoomId, onToggleDayNight, isNight }) => {
    const [activeTab, setActiveTab] = useState<'players' | 'global' | 'db'>('players');
    const [players, setPlayers] = useState<{name: string, hp: number, email?: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const [broadcastMsg, setBroadcastMsg] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

    useEffect(() => {
        if (currentRoomId) fetchPlayers();
    }, [currentRoomId]);

    const fetchPlayers = async () => {
        if (!currentRoomId) return;
        setLoading(true);
        try {
            const status = await apiService.getRoomStatus(currentRoomId);
            setPlayers(status.members || []);
        } catch (e) {
            console.error("Failed to fetch admin data");
        } finally {
            setLoading(false);
        }
    };

    const handlePlayerAction = async (targetName: string, action: 'damage' | 'heal' | 'kick', value: number = 0) => {
        if (!currentRoomId) return;
        playSound(action === 'damage' ? 'error' : 'success');
        vibrate(50);
        try {
            await apiService.adminAction(currentRoomId, targetName, action, action === 'damage' ? -value : value);
            setTimeout(fetchPlayers, 500); // Refresh data
        } catch (e) {
            playSound('error');
        }
    };

    const handleBroadcast = async () => {
        if (!currentRoomId || !broadcastMsg.trim()) return;
        playSound('message');
        try {
            await apiService.adminAction(currentRoomId, 'ALL', 'broadcast', broadcastMsg.toUpperCase());
            setBroadcastMsg('');
        } catch (e) {
            playSound('error');
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[200] bg-black font-mono text-green-500 flex flex-col"
        >
            {/* HEADER */}
            <div className="p-4 border-b border-green-500/30 flex justify-between items-center bg-green-950/10">
                <div className="flex items-center gap-3">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-widest">Nexus_Command</h2>
                        <p className="text-[10px] text-green-500/60 uppercase">Admin Authority: GRANTED</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 border border-green-500/30 rounded hover:bg-green-500/20 text-green-500">
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* TABS */}
            <div className="flex border-b border-green-500/30">
                <button onClick={() => setActiveTab('players')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex justify-center gap-2 ${activeTab === 'players' ? 'bg-green-500/20 text-white' : 'text-green-500/60'}`}><Users className="w-4 h-4" /> Jednotky</button>
                <button onClick={() => setActiveTab('global')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex justify-center gap-2 ${activeTab === 'global' ? 'bg-green-500/20 text-white' : 'text-green-500/60'}`}><Radio className="w-4 h-4" /> Operace</button>
                <button onClick={() => setActiveTab('db')} className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex justify-center gap-2 ${activeTab === 'db' ? 'bg-green-500/20 text-white' : 'text-green-500/60'}`}><Database className="w-4 h-4" /> Archiv</button>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto p-4 relative">
                <div className="absolute inset-0 pointer-events-none opacity-5 bg-[repeating-linear-gradient(0deg,transparent,transparent_1px,#00ff00_1px,#00ff00_2px)]"></div>
                
                {activeTab === 'players' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-xs uppercase tracking-widest text-green-500/60">Aktivní v sektoru: {players.length}</span>
                            <button onClick={fetchPlayers} className="p-2 bg-green-500/10 rounded hover:bg-green-500/30"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></button>
                        </div>
                        {players.map((p, idx) => (
                            <div key={idx} className={`border ${selectedPlayer === p.name ? 'border-green-500 bg-green-500/10' : 'border-green-500/30 bg-black'} p-4 rounded-lg transition-all`}>
                                <div className="flex justify-between items-center mb-3 cursor-pointer" onClick={() => setSelectedPlayer(selectedPlayer === p.name ? null : p.name)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="font-bold text-white text-lg">{p.name}</span>
                                    </div>
                                    <span className={`font-mono font-bold ${p.hp < 30 ? 'text-red-500' : 'text-green-500'}`}>{p.hp} HP</span>
                                </div>
                                {selectedPlayer === p.name && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="grid grid-cols-2 gap-2 pt-2 border-t border-green-500/20">
                                        <button onClick={() => handlePlayerAction(p.name, 'damage', 10)} className="py-3 bg-red-900/20 border border-red-500/50 text-red-500 font-bold uppercase text-[10px] rounded flex items-center justify-center gap-2 hover:bg-red-900/40"><Zap className="w-4 h-4" /> Smite (-10)</button>
                                        <button onClick={() => handlePlayerAction(p.name, 'heal', 20)} className="py-3 bg-blue-900/20 border border-blue-500/50 text-blue-400 font-bold uppercase text-[10px] rounded flex items-center justify-center gap-2 hover:bg-blue-900/40"><Heart className="w-4 h-4" /> Heal (+20)</button>
                                        <button onClick={() => handlePlayerAction(p.name, 'kick')} className="col-span-2 py-3 bg-zinc-900 border border-zinc-700 text-zinc-500 font-bold uppercase text-[10px] rounded flex items-center justify-center gap-2 hover:bg-red-950 hover:text-red-500 hover:border-red-500"><Gavel className="w-4 h-4" /> Vyhodit ze sektoru</button>
                                    </motion.div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'global' && (
                    <div className="space-y-8">
                        <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Radio className="w-4 h-4"/> Emergency Broadcast</h3>
                            <textarea value={broadcastMsg} onChange={(e) => setBroadcastMsg(e.target.value)} className="w-full bg-black border border-green-500/30 p-3 text-green-500 font-mono text-sm mb-3 outline-none focus:border-green-500 h-24" placeholder="Zadejte systémovou zprávu..." />
                            <button onClick={handleBroadcast} className="w-full py-3 bg-green-600 text-black font-black uppercase text-xs tracking-widest rounded hover:bg-green-500 flex items-center justify-center gap-2"><Send className="w-4 h-4" /> Odeslat Varování</button>
                        </div>
                        <div className="bg-green-500/5 border border-green-500/20 p-4 rounded-xl">
                            <h3 className="text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Sun className="w-4 h-4"/> Kontrola Prostředí</h3>
                            <button onClick={onToggleDayNight} className="w-full py-4 border border-green-500/30 bg-black hover:bg-green-500/10 text-green-500 font-bold uppercase text-xs flex items-center justify-center gap-3 rounded transition-all">{isNight ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-blue-400" />}{isNight ? 'Vynutit: DENNÍ REŽIM' : 'Vynutit: NOČNÍ REŽIM'}</button>
                        </div>
                    </div>
                )}

                {activeTab === 'db' && (
                    <div className="flex flex-col items-center justify-center h-full gap-6">
                        <Database className="w-16 h-16 text-green-500/30" />
                        <p className="text-xs text-green-500/60 text-center max-w-xs">Zde můžete stáhnout kompletní JSON zálohu všech předmětů v databázi pro archivaci.</p>
                        <button onClick={() => apiService.downloadBackup()} className="px-8 py-4 border-2 border-green-500 text-green-500 font-black uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all rounded">STÁHNOUT ZÁLOHU</button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AdminDashboard;
