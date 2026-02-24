import React from 'react';
import AddressSearch from '../components/AddressSearch';
import { Maximize } from 'lucide-react';

/**
 * Landing Page Component
 * Initial view with address search and map
 */
export default function LandingPage({ onLocationSelect, isLoadingSolar, selectedAddress }) {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-navy text-white">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517486430290-35657a918550?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center opacity-10 grayscale transform scale-105"></div>
            <div className="relative z-10 max-w-4xl px-4 text-center">
                <div className="inline-block px-3 py-1 mb-4 md:mb-6 text-[9px] md:text-[11px] font-bold tracking-[0.2em] text-brand-gold uppercase bg-white/5 rounded-full border border-white/10 backdrop-blur-sm font-mono">
                    The Modern Professional Craftsman
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-serif font-black leading-[0.9] tracking-tight mb-3 md:mb-6">
                    Satellite <span className="text-brand-gold italic">Roof</span> <br />Measurement
                </h1>
                <p className="text-sm md:text-base text-gray-300 mb-6 md:mb-10 max-w-2xl mx-auto leading-relaxed font-sans px-2">
                    Instantly measure roof area from high-resolution satellite imagery.
                </p>
                <div className="w-full max-w-xl mx-auto mb-12 md:mb-16 px-4">
                    <AddressSearch
                        onLocationSelect={onLocationSelect}
                        className="w-full relative z-20"
                    />
                    <div className="absolute -inset-1 bg-brand-gold/20 rounded-lg blur-2xl opacity-50"></div>
                </div>
            </div>
        </div>
    );
}
