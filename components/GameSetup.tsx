
import React, { useState } from 'react';
import { User, Hash, ArrowRight, Gamepad2, Loader2, Users, Sword, Wand2, Footprints, Cross, Shield, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PlayerClass } from '../types';

interface GameSetupProps {
  initialNickname: string;
  onConfirmSetup: (nickname: string, playerClass: PlayerClass, roomId: string | 'create' | 'solo', password?: string) => Promise<void>;
  isGuest: boolean;
}

const GameSetup: React.FC<GameSetupProps> = ({ initialNickname, onConfirmSetup }) => {
  const [step, setStep] = useState<'nickname' | 'class' | 'action' | 'join'>('nickname');
  const [nickname, setNickname] = useState(initialNickname || '');
  const [selectedClass, setSelectedClass] = useState<PlayerClass | null>(null);
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Password State
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);

  // Skip nickname step if already set, but ensure class is selected
  React.useEffect(() => {
    if (initialNickname) {
      setNickname(initialNickname);
      setStep('class');
    }
  }, [initialNickname]);

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length >= 3) {
      setStep('class');
    }
  };

  const handleClassSelect = (pClass: PlayerClass) => {
      setSelectedClass(pClass);
      setTimeout(() => setStep('action'), 300); // Small delay for visual feedback
  };

  const handleAction = async (action: 'create' | 'join_mode' | 'solo') => {
    if (!selectedClass) return;
    
    if (action === 'join_mode') {
      setPassword(''); // Reset password field for join
      setError(null);
      setStep('join');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
        // If creating a private room, pass the password
        const pass = (action === 'create' && isPrivateRoom) ? password : undefined;
        await onConfirmSetup(nickname, selectedClass, action, pass);
    } catch (e: any) {
        setIsLoading(false);
        // Usually create doesn't throw visible errors here as it falls back to local
    }
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !selectedClass) return;
    
    setIsLoading(true);
    setError(null);
    try {
        await onConfirmSetup(nickname, selectedClass, roomId.toUpperCase().trim(), password || undefined);
    } catch (err: any) {
        console.error("Join failed:", err);
        setError(err.message || "Nepodařilo se připojit. Zkontrolujte ID místnosti.");
        setIsLoading(false);
    }
  };

  const classes = [
      { id: PlayerClass.WARRIOR, icon: <Sword className="w-6 h-6"/>, desc: "Mistr boje zblízka. Vysoká odolnost.", color: "text-red-500", border: "border-red-500" },
      { id: PlayerClass.MAGE, icon: <Wand2 className="w-6 h-6"/>, desc: "Vidí magické aury a skryté zprávy.", color: "text-blue-400", border: "border-blue-400" },
      { id: PlayerClass.ROGUE, icon: <Footprints className="w-6 h-6"/>, desc: "Najde loot tam, kde ostatní vidí stín.", color: "text-green-500", border: "border-green-500" },
      { id: PlayerClass.CLERIC, icon: <Cross className="w-6 h-6"/>, desc: "Léčitel a ochránce před temnotou.", color: "text-yellow-500", border: "border-yellow-500" },
  ];

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 pointer-events-none">
             <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-neon-blue/5 to-transparent"></div>
             <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-neon-purple/5 to-transparent"></div>
        </div>

        <motion.div 
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm relative z-10"
        >
            {/* --- STEP 1: NICKNAME --- */}
            {step === 'nickname' && (
                <div className="text-center">
                    <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-zinc-700 shadow-xl">
                        <User className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-2xl font-display font-bold text-white mb-2 uppercase">Identifikace</h2>
                    <p className="text-zinc-500 text-sm mb-8">Zadejte svou herní přezdívku.</p>
                    
                    <form onSubmit={handleNicknameSubmit}>
                        <input 
                            type="text" 
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Přezdívka..."
                            className="w-full bg-zinc-900 border border-zinc-700 p-4 rounded-xl text-white font-display text-center text-lg focus:border-neon-blue outline-none mb-4"
                            maxLength={12}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={nickname.length < 3}
                            className="w-full py-4 bg-white text-black font-bold uppercase rounded-xl disabled:opacity-50 hover:bg-zinc-200 transition-colors"
                        >
                            Pokračovat
                        </button>
                    </form>
                </div>
            )}

            {/* --- STEP 2: CLASS SELECTION --- */}
            {step === 'class' && (
                <div className="flex flex-col h-full">
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-display font-bold text-white mb-1 uppercase">Zvolte Třídu</h2>
                        <p className="text-zinc-500 text-xs">Vaše role ovlivní,?? něco..něco DOPLNIT!!</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[60vh] pr-1">
                        {classes.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => handleClassSelect(c.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${selectedClass === c.id ? `bg-zinc-900 ${c.border}` : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                            >
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className={`p-3 rounded-lg bg-zinc-900 ${c.color} border border-white/5`}>
                                        {c.icon}
                                    </div>
                                    <div>
                                        <h3 className={`font-display font-bold uppercase ${c.color}`}>{c.id}</h3>
                                        <p className="text-[10px] text-zinc-400 leading-tight mt-1">{c.desc}</p>
                                    </div>
                                </div>
                                {selectedClass === c.id && (
                                    <motion.div layoutId="class-highlight" className={`absolute inset-0 opacity-10 ${c.color.replace('text-', 'bg-')}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* --- STEP 3: ACTION CHOICE --- */}
            {step === 'action' && (
                <div className="flex flex-col gap-4">
                    <div className="text-center mb-6">
                        <button onClick={() => setStep('class')} className="text-xs text-zinc-500 uppercase tracking-widest hover:text-white mb-2">Změnit Třídu</button>
                        <h2 className="text-3xl font-display font-black text-white uppercase tracking-wider">LOBBY</h2>
                        <div className="flex justify-center items-center gap-2 mt-2">
                            <span className="text-white font-bold">{nickname}</span>
                            <span className="text-zinc-600">•</span>
                            <span className={`text-xs px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-neon-blue uppercase font-bold`}>{selectedClass}</span>
                        </div>
                    </div>

                    {/* CREATE ROOM CARD */}
                    <div className="p-6 bg-zinc-900 border border-zinc-700 hover:border-neon-blue rounded-2xl transition-all">
                        <div onClick={() => !isPrivateRoom && handleAction('create')} className={`cursor-pointer ${isPrivateRoom ? '' : 'flex flex-col'}`}>
                            <div className="flex items-center gap-4 mb-2">
                                <Users className="w-8 h-8 text-neon-blue" />
                                <div>
                                    <h3 className="text-xl font-bold text-white">Založit Hru</h3>
                                    <p className="text-xs text-zinc-500">Nová místnost pro skupinu.</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Private Room Toggle & Password */}
                        <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-zinc-400 flex items-center gap-2"><Lock className="w-3 h-3"/> Soukromá místnost</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={isPrivateRoom} onChange={(e) => {setIsPrivateRoom(e.target.checked); if(!e.target.checked) setPassword('');}}/>
                                    <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-blue"></div>
                                </label>
                            </div>
                            
                            {isPrivateRoom && (
                                <div className="animate-in slide-in-from-top-2">
                                    <input 
                                        type="text" 
                                        placeholder="Nastavit heslo..."
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-black border border-zinc-700 p-2 rounded text-white text-sm outline-none focus:border-neon-blue"
                                    />
                                </div>
                            )}

                            {isPrivateRoom && (
                                <button 
                                    onClick={() => handleAction('create')}
                                    disabled={isLoading || (isPrivateRoom && password.length < 3)}
                                    className="w-full py-2 bg-neon-blue text-black font-bold uppercase rounded text-xs mt-2 disabled:opacity-50"
                                >
                                    Vytvořit soukromou hru
                                </button>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleAction('join_mode')}
                        disabled={isLoading}
                        className="group relative overflow-hidden w-full p-6 bg-zinc-900 border border-zinc-700 hover:border-neon-purple rounded-2xl text-left transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        <Hash className="w-8 h-8 text-neon-purple mb-2 relative z-10" />
                        <h3 className="text-xl font-bold text-white relative z-10">Připojit se</h3>
                        <p className="text-xs text-zinc-500 mt-1 relative z-10">Vstoupit do existující místnosti.</p>
                    </button>

                    <div className="mt-4 flex items-center gap-4">
                         <div className="h-px bg-zinc-800 flex-1"></div>
                         <span className="text-[10px] text-zinc-600 uppercase">Nebo</span>
                         <div className="h-px bg-zinc-800 flex-1"></div>
                    </div>

                    <button 
                        onClick={() => handleAction('solo')}
                        className="w-full py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors"
                    >
                        <Gamepad2 className="w-4 h-4" /> Hrát Sólo (Offline)
                    </button>
                </div>
            )}

            {/* --- STEP 4: JOIN INPUT --- */}
            {step === 'join' && (
                <div className="text-center">
                    <button onClick={() => setStep('action')} className="text-zinc-500 text-xs uppercase mb-6 hover:text-white">← Zpět</button>
                    
                    <h2 className="text-xl font-display font-bold text-white mb-6 uppercase">Připojení k Místnosti</h2>
                    
                    {error && (
                        <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-xs text-center mb-4 font-bold animate-pulse flex items-center justify-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleJoinSubmit} className="space-y-4">
                        <div>
                            <input 
                                type="text" 
                                value={roomId}
                                onChange={(e) => {
                                    setRoomId(e.target.value);
                                    if(error) setError(null);
                                }}
                                placeholder="A1B2C"
                                className="w-full bg-black border border-zinc-700 p-6 rounded-xl text-white font-mono text-center text-3xl uppercase focus:border-neon-purple outline-none tracking-[0.5em]"
                                maxLength={5}
                                autoFocus
                            />
                            <p className="text-[10px] text-zinc-600 mt-2 uppercase tracking-wider">Kód místnosti</p>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Lock className="h-4 w-4 text-zinc-600" />
                            </div>
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Heslo místnosti (volitelné)"
                                className="w-full bg-zinc-900 border border-zinc-700 p-3 pl-10 pr-10 rounded-xl text-white outline-none focus:border-neon-purple"
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading || roomId.length < 1}
                            className="w-full py-4 bg-neon-purple hover:bg-fuchsia-600 text-white font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(188,19,254,0.3)] flex items-center justify-center gap-2 transition-colors mt-6"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : "Vstoupit do Hry"} <ArrowRight className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}

        </motion.div>
    </div>
  );
};

export default GameSetup;
