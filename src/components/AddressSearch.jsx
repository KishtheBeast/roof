import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, MapPin } from 'lucide-react';

export default function AddressSearch({ onLocationSelect, className = "absolute top-4 left-4 z-[1000] w-full max-w-md font-sans" }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.length > 2) {
                searchAddress();
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const searchAddress = async () => {
        setLoading(true);
        try {
            // Restrict to NY, NJ, CT using viewbox and bounded params
            // Viewbox: [left, top, right, bottom] -> [lon, lat, lon, lat]
            // Approx for NY/NJ/CT: -80, 45, -71, 39
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    format: 'json',
                    addressdetails: 1,
                    limit: 5,
                    viewbox: '-79.76,45.01,-71.78,38.93',
                    bounded: 1
                }
            });
            setResults(response.data);
            setShowDropdown(true);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(item.display_name);
        setShowDropdown(false);
        onLocationSelect({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon)
        });
    };

    return (
        <div className={className}>
            <div className="relative group">
                <input
                    type="text"
                    placeholder="Search address..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl shadow-2xl border border-brand-navy/5 focus:outline-none focus:ring-2 focus:ring-brand-gold bg-white/90 backdrop-blur-xl text-brand-navy font-bold placeholder:text-brand-navy/30 transition-all group-hover:bg-white"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brand-gold w-5 h-5 transition-transform group-focus-within:scale-110" strokeWidth={3} />
                {loading && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-brand-gold border-b-transparent"></div>
                    </div>
                )}

                {/* Dropdown Results */}
                {showDropdown && results.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(26,26,46,0.2)] border border-brand-navy/5 max-h-80 overflow-y-auto divide-y divide-brand-navy/5 overflow-hidden font-mono text-[11px] font-bold">
                        {results.map((item) => (
                            <li
                                key={item.place_id}
                                onClick={() => handleSelect(item)}
                                className="px-5 py-4 hover:bg-brand-gold/5 cursor-pointer flex items-start gap-4 transition-all hover:pl-7"
                            >
                                <MapPin className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                                <div className="text-brand-navy/80 leading-snug uppercase tracking-tight">
                                    {item.display_name}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* No Results Message */}
                {showDropdown && query.length > 2 && !loading && results.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-brand-navy/5 p-6 text-center text-brand-navy/40 text-xs font-mono font-bold uppercase tracking-widest">
                        Zero matches found in Service Area
                    </div>
                )}
            </div>
        </div>
    );
}
