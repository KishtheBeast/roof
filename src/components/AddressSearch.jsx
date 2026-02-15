import React, { useState, useEffect } from 'react';
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
        if (!window.google || !window.google.maps.places) return;
        setLoading(true);
        try {
            const { AutocompleteSuggestion } = await window.google.maps.importLibrary("places");

            const request = {
                input: query,
                includedRegionCodes: ['us'],
            };

            const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

            if (suggestions && suggestions.length > 0) {
                setResults(suggestions);
                setShowDropdown(true);
            } else {
                setResults([]);
                setShowDropdown(false);
            }
            setLoading(false);
        } catch (error) {
            console.error('Search error:', error);
            setLoading(false);
        }
    };

    const handleSelect = async (item) => {
        setQuery(item.placePrediction.text.text);
        setShowDropdown(false);

        try {
            const { Place } = await window.google.maps.importLibrary("places");
            const place = new Place({
                id: item.placePrediction.placeId,
            });

            await place.fetchFields({ fields: ['location'] });

            if (place.location) {
                onLocationSelect({
                    lat: place.location.lat(),
                    lon: place.location.lng()
                });
            }
        } catch (error) {
            console.error('Error fetching place details:', error);
        }
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
                                key={item.placePrediction.placeId}
                                onClick={() => handleSelect(item)}
                                className="px-5 py-4 hover:bg-brand-gold/5 cursor-pointer flex items-start gap-4 transition-all hover:pl-7"
                            >
                                <MapPin className="w-4 h-4 text-brand-gold mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                                <div className="text-brand-navy/80 leading-snug uppercase tracking-tight">
                                    {item.placePrediction.text.text}
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
