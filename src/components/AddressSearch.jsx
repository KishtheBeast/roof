import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, MapPin } from 'lucide-react';

export default function AddressSearch({ onLocationSelect }) {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (query.length > 2) {
                performSearch(query);
            } else {
                setResults([]);
                setShowDropdown(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    const performSearch = async (searchQuery) => {
        setLoading(true);
        try {
            // Valid states
            const allowedStates = ['New York', 'New Jersey', 'Connecticut'];

            // Fetch results with address details
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: searchQuery,
                    format: 'json',
                    addressdetails: 1,
                    countrycodes: 'us',
                    limit: 10
                }
            });

            // Filter for allowed states (Normalize to check properly)
            const filtered = response.data.filter(item => {
                const state = item.address?.state;
                return state && allowedStates.some(allowed => state.includes(allowed));
            });

            setResults(filtered);
            setShowDropdown(true);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(item.display_name);
        setShowDropdown(false);
        setResults([]);

        onLocationSelect({
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            displayName: item.display_name
        });
    };

    return (
        <div className="absolute top-4 left-4 z-[1000] w-full max-w-md font-sans">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Enter address (NY, NJ, CT only)..."
                    className="w-full pl-10 pr-4 py-3 rounded-lg shadow-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/95 backdrop-blur-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Dropdown Results */}
                {showDropdown && results.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto divide-y divide-gray-100">
                        {results.map((item) => (
                            <li
                                key={item.place_id}
                                onClick={() => handleSelect(item)}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-start gap-3 transition-colors"
                            >
                                <MapPin className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                <div className="text-sm text-gray-700 leading-snug">
                                    {item.display_name}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                {/* No Results Message */}
                {showDropdown && query.length > 2 && !loading && results.length === 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 p-4 text-center text-gray-500 text-sm">
                        No addresses found in NY, NJ, or CT.
                    </div>
                )}
            </div>
        </div>
    );
}
