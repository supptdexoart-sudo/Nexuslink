
import React, { useState } from 'react';
import { User, Hash, ArrowRight, Gamepad2, Loader2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

interface GameSetupProps {
  initialNickname: string;
  onConfirmSetup: (nickname: string, roomId: string | 'create' | 'solo') => Promise<void>;
  isGuest: boolean;
}

const GameSetup: React.FC<GameSetupProps> = ({ initialNickname, onConfirmSetup }) => {
  const [step, setStep] = useState<'nickname' | 'action' | 'join'>('nickname');
  const [nickname, setNickname] = useState(initialNickname || '');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Skip nickname step if already set
  React.useEffect(() => {
    if (initialNickname) {
      setNickname(initialNickname);
      setStep('action');
    }
  }, [initialNickname]);

  const handleNicknameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length >= 3) {
      setStep('action');
    }
  };

  const handleAction = async (action: 'create' | 'join_mode' | 'solo') => {
    if (action === 'join_mode') {
      setStep('join');
      return;
    }
    
    setIsLoading(true);
    await onConfirmSetup(nickname, action);
    // If 'create' or 'solo' action finishes, parent will unmount this, so no need to stop loading visually
  };

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) return;
    setIsLoading(true);
    await onConfirmSetup(nickname, roomId.toUpperCase().trim());
    setIsLoading(false);
  };

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
                    <p className="text-zinc-500 text-sm mb-8">Zadejte svou herní přezdívku pro komunikaci s týmem.</p>
                    
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

            {/* --- STEP 2: ACTION CHOICE --- */}
            {step === 'action' && (
                <div className="flex flex-col gap-4">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-display font-black text-white uppercase tracking-wider">Herní LOBBY</h2>
                        <p className="text-neon-blue font-mono text-xs mt-2">VÍTEJTE, {nickname}</p>
                    </div>

                    <button 
                        onClick={() => handleAction('create')}
                        disabled={isLoading}
                        className="group relative overflow-hidden w-full p-6 bg-zinc-900 border border-zinc-700 hover:border-neon-blue rounded-2xl text-left transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        <Users className="w-8 h-8 text-neon-blue mb-2 relative z-10" />
                        <h3 className="text-xl font-bold text-white relative z-10">Založit Hru</h3>
                        <p className="text-xs text-zinc-500 mt-1 relative z-10">Vytvořit novou místnost pro vaši skupinu.</p>
                    </button>

                    <button 
                        onClick={() => handleAction('join_mode')}
                        disabled={isLoading}
                        className="group relative overflow-hidden w-full p-6 bg-zinc-900 border border-zinc-700 hover:border-neon-purple rounded-2xl text-left transition-all active:scale-[0.98]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-purple/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
                        <Hash className="w-8 h-8 text-neon-purple mb-2 relative z-10" />
                        <h3 className="text-xl font-bold text-white relative z-10">Připojit se</h3>
                        <p className="text-xs text-zinc-500 mt-1 relative z-10">Vstoupit do existující místnosti pomocí kódu.</p>
                    </button>

                    {/* Solo/Guest Option */}
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

            {/* --- STEP 3: JOIN INPUT --- */}
            {step === 'join' && (
                <div className="text-center">
                    <button onClick={() => setStep('action')} className="text-zinc-500 text-xs uppercase mb-6 hover:text-white">← Zpět</button>
                    
                    <h2 className="text-xl font-display font-bold text-white mb-6 uppercase">Zadejte Kód Místnosti</h2>
                    
                    <form onSubmit={handleJoinSubmit}>
                        <input 
                            type="text" 
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            placeholder="A1B2C"
                            className="w-full bg-black border border-zinc-700 p-6 rounded-xl text-white font-mono text-center text-3xl uppercase focus:border-neon-purple outline-none mb-6 tracking-[0.5em]"
                            maxLength={5}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || roomId.length < 1}
                            className="w-full py-4 bg-neon-purple hover:bg-fuchsia-600 text-white font-bold uppercase rounded-xl shadow-[0_0_20px_rgba(188,19,254,0.3)] flex items-center justify-center gap-2 transition-colors"
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
