
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, Cpu, AlertTriangle, Check, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import * as apiService from '../services/apiService';
import ServerLoader from './ServerLoader'; // Import ServerLoader

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const ADMIN_EMAIL = 'zbynekbal97@gmail.com';

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isConnecting, setIsConnecting] = useState(false); // State for full screen loader
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = email.toLowerCase().trim() === ADMIN_EMAIL;

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
        setError("Zadejte platnou emailovou adresu.");
        return;
    }
    
    // Admin Validation
    if (isAdmin && !password.trim()) {
        setError("Admin účet vyžaduje bezpečnostní klíč.");
        return;
    }

    setError(null);
    setShowConsentModal(true);
  };

  const handleConsentAndLogin = async () => {
    // 1. Close modal immediately
    setShowConsentModal(false);
    // 2. Show full screen loader immediately
    setIsConnecting(true);
    setError(null);

    try {
        // Call the backend API with optional password
        await apiService.loginUser(email, password);
        // Small artificial delay to let the user enjoy the cool animation for a split second
        await new Promise(resolve => setTimeout(resolve, 800));
        onLogin(email);
    } catch (err: any) {
        console.error(err);
        // Stop loader and show error
        setIsConnecting(false);
        if (err.message && err.message.includes('401')) {
             setError("Chybné heslo pro Admin účet.");
        } else {
             setError("Nepodařilo se připojit k serveru. Ověřte připojení.");
        }
    }
  };

  const handleGuestLogin = () => {
      onLogin('guest');
  };

  // If connecting, override the entire screen with the ServerLoader style
  if (isConnecting) {
      return (
          <ServerLoader 
            onConnected={() => {}} // Logic is handled inside handleConsentAndLogin, this is visual only here
            onSwitchToOffline={() => { 
                setIsConnecting(false); 
                setError("Připojení selhalo. Zkuste offline režim."); 
            }} 
          />
      );
  }

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-neon-purple/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
           <motion.div 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
             className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border-2 border-neon-blue rounded-2xl mb-6 shadow-[0_0_30px_rgba(0,243,255,0.3)] relative"
           >
              <Cpu className="w-10 h-10 text-neon-blue animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full border border-zinc-900"></div>
           </motion.div>
           <h1 className="text-4xl font-display font-black text-white tracking-wider mb-2">NEXUS DESKOVÁ HRA</h1>
           <p className="text-zinc-500 font-mono text-xs tracking-[0.3em] uppercase">Real-time synchronizace</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="space-y-4">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-1"
          >
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Identita: (Email)</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-zinc-600 group-focus-within:text-neon-blue transition-colors" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-4 bg-zinc-900/80 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-neon-blue focus:ring-1 focus:ring-neon-blue transition-all font-mono"
                placeholder="vas@email.cz"
                disabled={isConnecting}
              />
            </div>
          </motion.div>

          <motion.div 
             initial={{ x: -20, opacity: 0 }}
             animate={{ x: 0, opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="space-y-1"
          >
            <label className={`text-xs font-bold uppercase tracking-widest pl-1 transition-colors ${isAdmin ? 'text-neon-purple' : 'text-zinc-500'}`}>
                {isAdmin ? 'ADMIN ACCESS KEY (POVINNÉ)' : 'HESLO (VOLITELNÉ)'}
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className={`h-5 w-5 transition-colors ${isAdmin ? 'text-neon-purple' : 'text-zinc-600 group-focus-within:text-neon-purple'}`} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-3 py-4 bg-zinc-900/80 border rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:ring-1 transition-all font-mono ${isAdmin ? 'border-neon-purple focus:border-neon-purple focus:ring-neon-purple' : 'border-zinc-800 focus:border-neon-purple focus:ring-neon-purple'}`}
                placeholder={isAdmin ? "Vložte klíč..." : "••••••••"}
                disabled={isConnecting}
              />
            </div>
          </motion.div>
            
          {error && (
              <div className="p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-xs text-center animate-pulse">
                  {error}
              </div>
          )}

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            type="submit"
            disabled={isConnecting}
            className={`
              w-full flex items-center justify-center gap-2 py-4 mt-6 rounded-lg font-display font-bold text-sm tracking-widest uppercase transition-all
              ${isConnecting 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : isAdmin 
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.4)]'
                    : 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] active:scale-[0.98]'
              }
            `}
          >
             {isAdmin ? 'OVĚŘIT A VSTOUPIT' : 'PŘIPOJIT'} <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative flex py-5 items-center"
        >
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-4 text-zinc-600 text-[10px] font-mono uppercase">Nebo</span>
            <div className="flex-grow border-t border-zinc-800"></div>
        </motion.div>

        <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            onClick={handleGuestLogin}
            disabled={isConnecting}
            className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-2"
        >
            <WifiOff className="w-4 h-4" /> Hrát Offline (Host)
        </motion.button>

        <div className="mt-8 text-center">
            <div className="flex justify-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" />Server Secured</span>
                <span>•</span>
                <span>v0.6.1</span>
            </div>
        </div>
      </motion.div>

      {/* CONSENT MODAL */}
      <AnimatePresence>
      {showConsentModal && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 border-2 border-neon-blue/30 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,243,255,0.1)]"
            >
                <div className="bg-black p-4 border-b border-zinc-800 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-neon-blue" />
                    <h3 className="font-display font-bold text-white tracking-wider">SOUHLAS S PODMÍNKAMI</h3>
                </div>
                
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-sm text-zinc-400 leading-relaxed">
                    <p className="text-white font-bold">Informace o zpracování osobních údajů</p>
                    <p>
                        Kliknutím na tlačítko "Souhlasím a Připojit" potvrzujete, že jste se seznámili s podmínkami užívání aplikace Nexus Companion.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                        <li>
                            Vaše emailová adresa (<span className="text-neon-blue font-mono">{email}</span>) bude uložena v zabezpečené databázi na našem backend serveru.
                        </li>
                        <li>
                            Email slouží výhradně k identifikaci vašeho herního inventáře, statistik a pro obnovení účtu.
                        </li>
                        <li>
                            Údaje nejsou poskytovány třetím stranám a slouží pouze pro běh hry.
                        </li>
                        {isAdmin && (
                            <li className="text-neon-purple font-bold">
                                Upozornění: Přihlašujete se jako ADMINISTRÁTOR. Jakákoliv manipulace s databází je logována.
                            </li>
                        )}
                    </ul>
                </div>

                <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-col gap-3">
                    <button 
                        onClick={handleConsentAndLogin}
                        className="w-full py-3 bg-neon-blue hover:bg-cyan-400 text-black font-bold uppercase rounded-lg flex items-center justify-center gap-2 transition-colors active:scale-95"
                    >
                        <Check className="w-5 h-5" />
                        Souhlasím a Připojit
                    </button>
                    <button 
                        onClick={() => { setShowConsentModal(false); }}
                        className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-bold uppercase rounded-lg transition-colors"
                    >
                        Odmítnout
                    </button>
                </div>
            </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
};

export default LoginScreen;
