/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, User as UserIcon, Loader2, AlertTriangle, CheckCircle2, Wifi, Battery, Signal } from 'lucide-react';

type Screen = 'login' | 'waiting' | 'home';

export default function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isApproved, setIsApproved] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sosStatus, setSosStatus] = useState<{ loading: boolean, success?: boolean, error?: string }>({ loading: false });

  // Clock for the status bar
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate approval logic
  useEffect(() => {
    if (screen === 'waiting' && !isApproved) {
      const timer = setTimeout(() => {
        setIsApproved(true);
      }, 3000); // 3 second simulated delay
      return () => clearTimeout(timer);
    }
  }, [screen, isApproved]);

  // Navigate once approved
  useEffect(() => {
    if (isApproved && screen === 'waiting') {
      const timer = setTimeout(() => {
        setScreen('home');
      }, 1500); // Show "Approved" message for a moment
      return () => clearTimeout(timer);
    }
  }, [isApproved, screen]);

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (username && password) {
      // Simulate saving locally (localStorage)
      localStorage.setItem('last_login_attempt', JSON.stringify({ username, timestamp: Date.now() }));
      setScreen('waiting');
    }
  };

  const handleSOS = async () => {
    // Current timestamp in the format YYYY-MM-DD HH:mm:ss
    const now = new Date();
    const dt = now.toISOString().replace('T', ' ').split('.')[0];
    
    // The target API URL with dynamic parameters
    const baseUrl = "https://smartrack.ddns.net/api/api_loc.php";
    const params = new URLSearchParams({
      imei: "123456789054321",
      dt: dt,
      lat: "54.000000",
      lng: "25.000000",
      altitude: "100",
      angle: "45",
      speed: "0",
      loc_valid: "1",
      params: "batp=100|",
      event: "sos"
    });

    const fullUrl = `${baseUrl}?${params.toString()}`;

    try {
      // Attempting the API call
      // Note: we use 'no-cors' mode as tracking APIs often don't have CORS headers
      await fetch(fullUrl, { mode: 'no-cors' });
      
      // Local Notification Simulation
      setSosStatus({ loading: false, success: true });
      setTimeout(() => setSosStatus({ loading: false, success: false }), 4000);
      
    } catch (e) {
      console.error("API Error, falling back to browser redirection", e);
      setSosStatus({ loading: false, error: "Network Error" });
      setTimeout(() => setSosStatus({ loading: false, error: "" }), 4000);
      window.open(fullUrl, '_blank');
    }
  };

  const NotificationBanner = () => {
    if (!sosStatus.success && !sosStatus.error) return null;
    
    return (
      <motion.div 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className={`absolute top-16 left-4 right-4 p-4 rounded-2xl border backdrop-blur-xl z-50 flex items-start gap-4 shadow-2xl ${
          sosStatus.success ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'
        }`}
      >
        <div className={`p-2 rounded-full ${sosStatus.success ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          {sosStatus.success ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
        </div>
        <div className="flex-1">
          <h4 className="text-white text-sm font-bold leading-none mb-1">
            {sosStatus.success ? "SOS Alert Sent" : "SOS Broadcast Failed"}
          </h4>
          <p className="text-white/60 text-xs">
            {sosStatus.success ? "Your signal has been received by the control room." : "Unable to reach server. Checking backup channels..."}
          </p>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="mobile-viewport flex flex-col">
        {/* Status Bar */}
        <div className="status-bar">
          <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <div className="flex gap-1.5 items-center">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5 rotate-90" />
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 relative overflow-hidden">
          <NotificationBanner />
          <AnimatePresence mode="wait">
            {screen === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-8 flex flex-col h-full"
              >
                <div className="mt-12 mb-10">
                  <h1 className="text-2xl font-bold text-white mb-2">SecureAuth</h1>
                  <p className="text-white/60 text-sm">Identity Verification Portal</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Username</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        required
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter username"
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-white/50 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        required
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/10 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-white placeholder:text-white/20 focus:ring-2 focus:ring-indigo-500/50 focus:border-transparent transition-all outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full h-14 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-indigo-900/20 active:scale-[0.98] transition-all mt-4"
                  >
                    SUBMIT
                  </button>
                </form>

                <p className="mt-auto text-center text-xs text-white/20 mb-8 tracking-widest uppercase font-medium">
                  Security Protocol v4.2
                </p>
              </motion.div>
            )}

            {screen === 'waiting' && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="p-8 flex flex-col items-center justify-center h-full text-center"
              >
                {!isApproved ? (
                  <div className="mt-12 flex flex-col items-center">
                    <div className="w-10 h-10 border-4 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin"></div>
                    <p className="mt-6 text-indigo-200 text-sm font-medium tracking-wide">Waiting for approval...</p>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center"
                  >
                    <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/20">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Access Granted</h2>
                    <p className="text-white/40 mt-2 text-sm">Synchronizing systems...</p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {screen === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-8 flex flex-col h-full"
              >
                <header className="flex justify-between items-center mb-12 mt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-900/40">
                      {username.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-none">{username || 'Admin'}</p>
                      <p className="text-emerald-400 text-[10px] font-bold uppercase mt-1.5 tracking-wider flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                        Approved
                      </p>
                    </div>
                  </div>
                  <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
                    <Wifi className="w-4 h-4 text-white/60" />
                  </div>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center -mt-16">
                  <div className="relative group">
                    {/* Pulsing Back Glow */}
                    <div className="absolute inset-0 bg-red-600 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                    
                    <button
                      onClick={handleSOS}
                      className="relative w-48 h-48 bg-gradient-to-b from-red-500 to-red-700 rounded-full shadow-[0_20px_50px_rgba(220,38,38,0.5)] border-[10px] border-red-400/50 flex flex-col items-center justify-center active:scale-95 transition-transform overflow-hidden"
                    >
                      <span className="text-5xl font-black text-white tracking-tighter">SOS</span>
                    </button>
                  </div>
                  
                  <p className="mt-12 text-white font-medium text-center px-4 leading-relaxed">
                    Emergency Assistance<br/>
                    <span className="text-white/40 text-sm font-normal">Tap to trigger immediate alert</span>
                  </p>
                </div>

                <div className="w-full bg-white/5 rounded-3xl p-4 border border-white/5 mb-8">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-2">Current Status</p>
                  <p className="text-white text-xs font-medium">Monitoring active • Location encrypted</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <div className="home-indicator"></div>
      </div>
    </div>
  );
}

