
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    // Simulate network delay for realism
    setTimeout(() => {
      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="h-screen w-screen bg-zinc-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-neon-blue/10 rounded-full blur-[100px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-neon-purple/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      </div>

      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-10">
           <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 border-2 border-neon-blue rounded-2xl mb-6 shadow-[0_0_30px_rgba(0,243,255,0.3)] relative">
              <Cpu className="w-10 h-10 text-neon-blue animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-neon-green rounded-full border border-zinc-900"></div>
           </div>
           <h1 className="text-4xl font-display font-black text-white tracking-wider mb-2">NEXUS<span className="text-neon-blue">LINK</span></h1>
           <p className="text-zinc-500 font-mono text-xs tracking-[0.3em] uppercase">Secure Terminal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Identity (Email)</label>
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
                placeholder="agent@nexus.corp"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">Passcode</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-zinc-600 group-focus-within:text-neon-purple transition-colors" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-4 bg-zinc-900/80 border border-zinc-800 rounded-lg text-white placeholder-zinc-600 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all font-mono"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`
              w-full flex items-center justify-center gap-2 py-4 mt-6 rounded-lg font-display font-bold text-sm tracking-widest uppercase transition-all
              ${isLoading 
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                : 'bg-gradient-to-r from-neon-blue to-neon-purple text-white shadow-[0_0_20px_rgba(188,19,254,0.4)] hover:shadow-[0_0_30px_rgba(188,19,254,0.6)] active:scale-[0.98]'
              }
            `}
          >
            {isLoading ? (
              <>INITIALIZING...</>
            ) : (
              <>
                Authenticate <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <div className="flex justify-center gap-4 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Encrypted</span>
                <span>•</span>
                <span>v2.4.0 Stable</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
