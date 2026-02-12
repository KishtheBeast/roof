import React from 'react';

export default function MeasurementDisplay({ areaSqFt }) {
    // Pitch multipliers
    const pitches = [
        { label: 'Flat (0-1/12)', value: 1.00 },
        { label: 'Low Slope (2-4/12)', value: 1.05 },
        { label: 'Medium Slope (5-8/12)', value: 1.12 },
        { label: 'Steep Slope (9-12/12)', value: 1.25 },
        { label: 'Extra Steep (12+/12)', value: 1.40 },
    ];

    const [multiplier, setMultiplier] = React.useState(1.00);
    const [wasteFactor, setWasteFactor] = React.useState(10); // Default 10%

    if (areaSqFt === null || areaSqFt === 0) return null;

    const pitchAdjustedArea = areaSqFt * multiplier;
    const finalArea = pitchAdjustedArea * (1 + wasteFactor / 100);

    return (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md px-8 py-6 rounded-xl shadow-2xl border border-gray-200 min-w-[320px]">
            <div className="text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider font-bold mb-2">Estimated Roof Area</p>

                <div className="flex items-baseline justify-center gap-2 mb-6">
                    <span className="text-5xl font-extrabold text-blue-600 tracking-tight">{Math.round(finalArea).toLocaleString()}</span>
                    <span className="text-xl text-gray-600 font-medium">sq ft</span>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="pitch-select" className="text-xs text-gray-500 font-bold uppercase tracking-wide">Roof Pitch</label>
                            <span className="text-xs font-mono text-gray-400">Multiplier: {multiplier}x</span>
                        </div>
                        <select
                            id="pitch-select"
                            value={multiplier}
                            onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 outline-none transition-colors hover:bg-gray-100"
                        >
                            {pitches.map((p) => (
                                <option key={p.label} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center px-1">
                            <label htmlFor="waste-slider" className="text-xs text-gray-500 font-bold uppercase tracking-wide">Waste Factor</label>
                            <span className="text-xs font-mono text-blue-600 font-bold">{wasteFactor}%</span>
                        </div>
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
                        <div className="flex justify-between text-[10px] text-gray-400 px-1">
                            <span>0%</span>
                            <span>10% (Std)</span>
                            <span>20%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
