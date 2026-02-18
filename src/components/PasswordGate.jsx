import React, { useState, useEffect } from 'react';
import { Lock, Shield, ArrowRight } from 'lucide-react';

const PasswordGate = ({ children }) => {
    const [password, setPassword] = useState('');
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [error, setError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'roof2024'; // Fallback for local testing

    useEffect(() => {
        // Check if already authorized
        const authorized = localStorage.getItem('solar_vision_authorized');
        if (authorized === 'true') {
            setIsAuthorized(true);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (password === APP_PASSWORD) {
            localStorage.setItem('solar_vision_authorized', 'true');
            setIsAuthorized(true);
            setError(false);
        } else {
            setError(true);
            setPassword('');
        }
    };

    if (isLoading) return <div className="h-screen w-screen bg-brand-navy" />;

    if (isAuthorized) {
        return children;
    }

    return (
        <div className="h-screen w-screen relative flex items-center justify-center bg-brand-navy overflow-hidden">
            {/* Immersive Background */}
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486430290-35657a918550?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 grayscale scale-105"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-navy via-brand-navy/90 to-brand-navy/40"></div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-md p-10 mx-4">
                <div className="flex flex-col items-center mb-10 text-center">
                    <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center border border-brand-gold/30 mb-6 shadow-[0_0_30px_rgba(251,191,36,0.1)]">
                        <Lock className="w-8 h-8 text-brand-gold" />
                    </div>
                    <div className="inline-block px-4 py-1.5 mb-4 text-[10px] font-bold tracking-[0.4em] text-brand-gold uppercase bg-white/5 rounded-full border border-white/10 font-mono">
                        Secure Pro-Mode Access
                    </div>
                    <h1 className="text-4xl font-serif font-black text-white leading-tight">
                        Solar Vision <span className="text-brand-gold italic">Studio</span>
                    </h1>
                    <p className="mt-4 text-gray-400 text-sm leading-relaxed">
                        Authorized personnel only. Please enter the studio access code to proceed.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative group">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Access Password"
                            autoFocus
                            className={`w-full bg-white/5 border ${error ? 'border-red-500/50' : 'border-white/10 group-hover:border-white/20'} rounded-2xl px-6 py-4 text-white placeholder-white/20 outline-none transition-all duration-300 backdrop-blur-xl focus:bg-white/10 focus:border-brand-gold/50`}
                        />
                        {error && (
                            <p className="absolute -bottom-6 left-2 text-[10px] uppercase tracking-widest font-black text-red-400 animate-pulse">
                                Incorrect Access Code
                            </p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-brand-gold text-brand-navy font-black text-[12px] tracking-[0.2em] uppercase py-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 mt-8 group"
                    >
                        Enter Studio
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>

                <div className="mt-12 pt-8 border-t border-white/5 text-center">
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                        <Shield className="w-3 h-3" />
                        End-to-End Encrypted Geometry Engine
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordGate;
