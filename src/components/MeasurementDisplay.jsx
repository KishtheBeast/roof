import React from 'react';

export default function MeasurementDisplay({ areaSqFt }) {
    // Pitch multipliers
    // Pitch multipliers (Intuitive for non-technical users)
    const pitches = [
        { label: 'Flat Roof (Walking Surface)', value: 1.00 },
        { label: 'Low Slope (Slight Incline)', value: 1.05 },
        { label: 'Standard House (Typical)', value: 1.12 },
        { label: 'Steep (Difficult to Walk)', value: 1.25 },
        { label: 'Very Steep (Professional Only)', value: 1.40 },
    ];

    const [multiplier, setMultiplier] = React.useState(1.12); // Default to Standard House (Normal residential)
    const [wasteFactor, setWasteFactor] = React.useState(10); // Default 10%

    if (areaSqFt === null || areaSqFt === 0) return null;

    const pitchAdjustedArea = areaSqFt * multiplier;
    const finalArea = pitchAdjustedArea * (1 + wasteFactor / 100);

    return (
        <div className="w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-6 z-[1000]">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">

                {/* Total Area Display */}
                <div className="text-center md:text-left">
                    <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Estimated Roof Area</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-extrabold text-blue-600 tracking-tight">{Math.round(finalArea).toLocaleString()}</span>
                        <span className="text-xl text-gray-600 font-medium">sq ft</span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-8 w-full md:w-auto">
                    {/* Pitch Control */}
                    {/* Pitch Control */}
                    <div className="flex flex-col gap-2 min-w-[240px]">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="pitch-select" className="text-xs text-gray-500 font-bold uppercase tracking-wide">Roof Steepness (Pitch)</label>
                            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Slope Factor: x{multiplier}</span>
                        </div>
                        <select
                            id="pitch-select"
                            value={multiplier}
                            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors hover:bg-gray-100 font-medium"
                        >
                            {pitches.map((p) => (
                                <option key={p.label} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-gray-400 px-1 italic">
                            *Standard House is recommended for most residential homes.
                        </p>
                    </div>

                    {/* Waste Factor Control */}
                    <div className="flex flex-col gap-1 min-w-[240px]">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="waste-slider" className="text-xs text-gray-500 font-bold uppercase tracking-wide">Extra Material (Cut & Waste)</label>
                            <span className="text-xs font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{wasteFactor}%</span>
                        </div>
                        <div className="relative pt-1">
                            <input
                                id="waste-slider"
                                type="range"
                                min="0"
                                max="20"
                                step="1"
                                value={wasteFactor}
                                onChange={(e) => setWasteFactor(parseInt(e.target.value))}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                            <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1 font-medium">
                                <span className="text-left w-1/3 text-gray-400">Simple<br />(0%)</span>
                                <span className="text-center w-1/3 text-blue-500">Standard<br />(10%)</span>
                                <span className="text-right w-1/3 text-gray-400">Complex<br />(20%)</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-4 italic leading-tight">
                            *Accounts for overlapping shingles and cutting around edges.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
